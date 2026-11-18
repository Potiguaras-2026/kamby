from datetime import date, time, timedelta

from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils import timezone

from bancos.models import BancoDeLeite, HorarioColeta
from contas import services as contas
from contas.api import tokens
from contas.models import Doadora, Endereco, PerguntaSaude, Usuario
from core.erros import ErroDominio
from doacoes import selectors, services
from doacoes.models import Coleta, SolicitacaoKit

SENHA = "frasco-azul-2026"


def respostas(valor=True) -> dict[str, bool]:
    return {c: valor for c in PerguntaSaude.objects.filter(ativa=True).values_list("codigo", flat=True)}


def dados_mae() -> dict:
    return {"amamentando": True, "bebe_prematuro": False, "respostas": respostas()}


def proximo_dia_util() -> date:
    return services.dias_disponiveis(timezone.localdate())[0]


@override_settings(KAMBY_DEMO=False)
class Base(TestCase):
    def setUp(self):
        cache.clear()  # o limite de logins por minuto não pode vazar de um teste para outro
        self.banco = BancoDeLeite.objects.create(nome="BLH", telefone="84", endereco="R", cidade="Natal")
        self.horario = HorarioColeta.objects.create(banco=self.banco, inicio=time(9, 30), fim=time(11))
        contas.cadastrar_doadora(
            senha=SENHA,
            telefone="(84) 99999-0000",
            nome_completo="Ana Souza",
            banco_id=self.banco.id,
            consentimento=True,
            data_nascimento=date(1999, 3, 10),
            data_parto=date(2026, 10, 20),
            cep="59012-300",
            logradouro="Rua X",
            numero="10",
            bairro="Petrópolis",
            cidade="Natal",
            uf="RN",
            **dados_mae(),
        )
        self.doadora = Doadora.objects.get(usuario__telefone="84999990000")
        self.equipe = Usuario.objects.create_user("84900000000", SENHA, nome_completo="Equipe")

    def aprovar(self):
        contas.avaliar_triagem(self.doadora.triagens.get(), apta=True, avaliada_por=self.equipe)
        self.doadora.refresh_from_db()

    def entregar_kit(self):
        kit = services.pedir_kit(self.doadora, 4, data=proximo_dia_util(), horario_id=self.horario.id)
        services.mudar_status_kit(kit, SolicitacaoKit.Status.EM_PREPARO)
        services.mudar_status_kit(kit, SolicitacaoKit.Status.ENTREGUE)

    def acao(self):
        return selectors.inicio(self.doadora)["proxima_acao"]


class FluxoDaDoadoraTest(Base):
    def test_proxima_acao_acompanha_o_fluxo_completo(self):
        self.assertEqual(self.acao(), "aguardar_analise")
        contas.avaliar_triagem(self.doadora.triagens.get(), apta=True, avaliada_por=self.equipe)
        self.doadora.refresh_from_db()
        self.assertEqual(self.acao(), "pedir_kit")
        kit = services.pedir_kit(self.doadora, 4, data=proximo_dia_util(), horario_id=self.horario.id)
        self.assertEqual(self.acao(), "aguardar_kit")
        services.mudar_status_kit(kit, SolicitacaoKit.Status.EM_PREPARO)
        services.mudar_status_kit(kit, SolicitacaoKit.Status.ENTREGUE)
        self.assertEqual(self.acao(), "agendar_coleta")
        coleta = services.agendar_coleta(self.doadora, data=proximo_dia_util(), horario_id=self.horario.id, quantidade_frascos=3)
        # Com coleta marcada, a doadora ainda pode pedir outra.
        self.assertEqual(self.acao(), "agendar_coleta")
        for status in [Coleta.Status.CONFIRMADA, Coleta.Status.A_CAMINHO]:
            services.mudar_status_coleta(coleta, status)
        services.mudar_status_coleta(coleta, Coleta.Status.COLETADA, volume_ml=1200)
        self.assertEqual(self.acao(), "agendar_coleta")
        self.assertEqual(selectors.impacto(self.doadora), {"volume_total_ml": 1200, "recem_nascidos_dia": 12, "coletas": 1})

    def test_inapta_vai_para_contato_com_banco(self):
        contas.avaliar_triagem(self.doadora.triagens.get(), apta=False, avaliada_por=self.equipe)
        self.doadora.refresh_from_db()
        self.assertEqual(self.acao(), "contatar_banco")


class RegrasTest(Base):
    def test_nao_agenda_sem_aprovacao_ou_sem_kit(self):
        with self.assertRaisesMessage(ErroDominio, "aprovar"):
            services.agendar_coleta(self.doadora, data=proximo_dia_util(), horario_id=self.horario.id, quantidade_frascos=1)
        self.aprovar()
        with self.assertRaisesMessage(ErroDominio, "frascos"):
            services.agendar_coleta(self.doadora, data=proximo_dia_util(), horario_id=self.horario.id, quantidade_frascos=1)

    def test_varias_coletas_ativas_ao_mesmo_tempo(self):
        self.aprovar()
        self.entregar_kit()
        dias = services.dias_disponiveis(timezone.localdate())
        primeira = services.agendar_coleta(self.doadora, data=dias[0], horario_id=self.horario.id, quantidade_frascos=1, com_kit=True)
        segunda = services.agendar_coleta(self.doadora, data=dias[1], horario_id=self.horario.id, quantidade_frascos=1, com_kit=True)
        self.assertEqual(list(selectors.coletas_andamento(self.doadora)), [primeira, segunda])
        self.assertEqual(selectors.kits_da_doadora(self.doadora).filter(status__in=SolicitacaoKit.ABERTOS).count(), 2)

    def test_data_fora_da_janela_e_recusada(self):
        self.aprovar()
        self.entregar_kit()
        for data in [timezone.localdate(), timezone.localdate() + timedelta(days=30)]:
            with self.assertRaises(ErroDominio) as erro:
                services.agendar_coleta(self.doadora, data=data, horario_id=self.horario.id, quantidade_frascos=1)
            self.assertEqual(erro.exception.codigo, "validacao")

    def test_horario_precisa_ser_ativo_e_do_banco_da_doadora(self):
        self.aprovar()
        self.entregar_kit()
        outro = BancoDeLeite.objects.create(nome="Outro", telefone="84", endereco="R", cidade="Natal")
        alheio = HorarioColeta.objects.create(banco=outro, inicio=time(8), fim=time(9))
        inativo = HorarioColeta.objects.create(banco=self.banco, inicio=time(15), fim=time(16), ativo=False)
        for horario in [alheio, inativo]:
            with self.assertRaises(ErroDominio) as erro:
                services.agendar_coleta(self.doadora, data=proximo_dia_util(), horario_id=horario.id, quantidade_frascos=1)
            self.assertIn("horario_id", erro.exception.campos)
        coleta = services.agendar_coleta(self.doadora, data=proximo_dia_util(), horario_id=self.horario.id, quantidade_frascos=1)
        self.assertEqual(coleta.horario_rotulo, "09h30 - 11h00")

    def test_historico_soma_por_mes_e_preenche_meses_vazios(self):
        criar = lambda data, volume, status=Coleta.Status.COLETADA: Coleta.objects.create(
            doadora=self.doadora, banco=self.banco, data=data, horario_inicio=time(8), horario_fim=time(9), quantidade_frascos=1, status=status, volume_ml=volume
        )
        criar(date(2026, 1, 5), 300)
        criar(date(2026, 1, 20), 200)
        criar(date(2026, 3, 2), 999, Coleta.Status.CANCELADA)
        criar(date(2025, 6, 1), 700)  # fora da janela de 6 meses
        historico = selectors.historico(self.doadora, date(2026, 3, 15))
        self.assertEqual([m["mes"] for m in historico][:2], [date(2025, 10, 1), date(2025, 11, 1)])
        self.assertEqual([m["volume_ml"] for m in historico], [0, 0, 0, 500, 0, 0])

    def test_transicao_invalida_e_coletada_exige_volume(self):
        self.aprovar()
        self.entregar_kit()
        coleta = services.agendar_coleta(self.doadora, data=proximo_dia_util(), horario_id=self.horario.id, quantidade_frascos=1)
        with self.assertRaises(ErroDominio):
            services.mudar_status_coleta(coleta, Coleta.Status.COLETADA, volume_ml=500)
        services.mudar_status_coleta(coleta, Coleta.Status.CONFIRMADA)
        services.mudar_status_coleta(coleta, Coleta.Status.A_CAMINHO)
        with self.assertRaisesMessage(ErroDominio, "volume"):
            services.mudar_status_coleta(coleta, Coleta.Status.COLETADA)

    def test_telefone_duplicado(self):
        with self.assertRaises(ErroDominio) as erro:
            contas.cadastrar_doadora(
                senha=SENHA, telefone="84999990000", nome_completo="Outra", banco_id=self.banco.id, consentimento=True, respostas={}
            )
        self.assertEqual(erro.exception.codigo, "conflito")


class ApiTest(Base):
    def test_entrar_e_ver_inicio(self):
        r = self.client.post(
            "/api/v1/auth/entrar", {"telefone": "84 99999-0000", "senha": SENHA}, content_type="application/json"
        )
        self.assertEqual(r.status_code, 200)
        r = self.client.get("/api/v1/inicio", HTTP_AUTHORIZATION=f"Bearer {r.json()['access']}")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["proxima_acao"], "aguardar_analise")
        self.assertEqual(r.json()["doadora"]["nome_completo"], "Ana Souza")

    def test_erros_seguem_o_contrato(self):
        r = self.client.post("/api/v1/auth/entrar", {"telefone": "1", "senha": "x"}, content_type="application/json")
        self.assertEqual(r.status_code, 401)
        self.assertEqual(set(r.json()), {"codigo", "mensagem", "campos"})
        r = self.client.get("/api/v1/inicio", HTTP_AUTHORIZATION="Bearer invalido")
        self.assertEqual((r.status_code, r.json()["codigo"]), (401, "nao_autenticado"))
        r = self.client.post("/api/v1/auth/entrar", {}, content_type="application/json")
        self.assertEqual((r.status_code, r.json()["codigo"]), (422, "validacao"))
        self.assertIn("telefone", r.json()["campos"])


class EnderecosTest(Base):
    dados = {"cep": "59020-000", "logradouro": "Av. Y", "numero": "5", "bairro": "Tirol", "cidade": "Natal", "uf": "rn"}

    def test_primeiro_ativo_e_troca_de_ativo(self):
        casa = self.doadora.enderecos.get()
        self.assertTrue(casa.ativo)
        trabalho = contas.criar_endereco(self.doadora, apelido="Trabalho", **self.dados)
        self.assertFalse(trabalho.ativo)
        self.assertEqual((trabalho.cep, trabalho.uf), ("59020000", "RN"))
        contas.ativar_endereco(trabalho)
        self.assertEqual(list(self.doadora.enderecos.filter(ativo=True)), [trabalho])

    def test_excluir_ativo_promove_outro_e_ultimo_nao_sai(self):
        casa = self.doadora.enderecos.get()
        trabalho = contas.criar_endereco(self.doadora, apelido="Trabalho", **self.dados)
        contas.excluir_endereco(casa)
        trabalho.refresh_from_db()
        self.assertTrue(trabalho.ativo)
        with self.assertRaises(ErroDominio):
            contas.excluir_endereco(trabalho)

    def test_coleta_guarda_endereco_do_agendamento(self):
        self.aprovar()
        self.entregar_kit()
        coleta = services.agendar_coleta(self.doadora, data=proximo_dia_util(), horario_id=self.horario.id, quantidade_frascos=1)
        self.assertIn("Rua X, 10", coleta.endereco)
        contas.ativar_endereco(contas.criar_endereco(self.doadora, apelido="Trabalho", **self.dados))
        coleta.refresh_from_db()
        self.assertIn("Rua X, 10", coleta.endereco)

    def test_api_nao_mostra_endereco_de_outra_doadora(self):
        r = self.client.post("/api/v1/auth/entrar", {"telefone": "84999990000", "senha": SENHA}, content_type="application/json")
        auth = {"HTTP_AUTHORIZATION": f"Bearer {r.json()['access']}"}
        outra = contas.cadastrar_doadora(
            senha=SENHA, telefone="84988887777", nome_completo="Outra", banco_id=self.banco.id, consentimento=True,
            data_nascimento=date(1990, 1, 1), data_parto=date(2026, 9, 1), **self.dados, **dados_mae(),
        )
        alheio = Endereco.objects.get(doadora__usuario=outra)
        r = self.client.delete(f"/api/v1/enderecos/{alheio.id}", **auth)
        self.assertEqual(r.status_code, 404)
        self.assertEqual(len(self.client.get("/api/v1/enderecos", **auth).json()), 1)


class EtapasTest(Base):
    def coleta_a_caminho(self):
        self.aprovar()
        self.entregar_kit()
        coleta = services.agendar_coleta(self.doadora, data=proximo_dia_util(), horario_id=self.horario.id, quantidade_frascos=2)
        for status in [Coleta.Status.CONFIRMADA, Coleta.Status.A_CAMINHO]:
            services.mudar_status_coleta(coleta, status)
        return coleta

    def atual(self, coleta):
        return next((e["codigo"] for e in selectors.etapas(coleta) if e["estado"] == "atual"), "fim")

    def test_quatro_etapas_ate_o_banco(self):
        coleta = self.coleta_a_caminho()
        pedido = services.agendar_coleta(self.doadora, data=proximo_dia_util(), horario_id=self.horario.id, quantidade_frascos=1)
        self.assertEqual(self.atual(pedido), "pedido_feito")
        self.assertEqual(self.atual(coleta), "rota_iniciada")
        services.mudar_status_coleta(coleta, Coleta.Status.COLETADA, volume_ml=300)
        self.assertEqual(self.atual(coleta), "entregue")
        services.cancelar_coleta(pedido)
        self.assertEqual(list(selectors.coletas_andamento(self.doadora)), [coleta])
        services.registrar_entrega_banco(coleta)
        self.assertEqual(self.atual(coleta), "fim")
        self.assertEqual(list(selectors.coletas_andamento(self.doadora)), [])

    def test_ninguem_em_casa_avisa_e_sai_do_andamento(self):
        coleta = self.coleta_a_caminho()
        services.mudar_status_coleta(coleta, Coleta.Status.AUSENTE)
        inicio = selectors.inicio(self.doadora)
        self.assertEqual(inicio["aviso"]["tipo"], "ausente")
        self.assertTrue(inicio["aviso"]["titulo"])
        self.assertEqual(inicio["coletas_andamento"], [])
        services.agendar_coleta(self.doadora, data=proximo_dia_util(), horario_id=self.horario.id, quantidade_frascos=2)
        self.assertIsNone(selectors.inicio(self.doadora)["aviso"])

    def test_ajuste_e_entrega_respeitam_a_ordem(self):
        coleta = self.coleta_a_caminho()
        with self.assertRaises(ErroDominio):
            services.marcar_ajuste(coleta, Coleta.Ajuste.FORA_DO_PADRAO)
        with self.assertRaises(ErroDominio):
            services.registrar_entrega_banco(coleta)
        services.mudar_status_coleta(coleta, Coleta.Status.COLETADA, volume_ml=100)
        with self.assertRaises(ErroDominio):
            services.registrar_processamento(coleta)
        services.marcar_ajuste(coleta, Coleta.Ajuste.QUANTIDADE_INSUFICIENTE)
        self.assertEqual(selectors.inicio(self.doadora)["aviso"]["tipo"], "ajuste.quantidade_insuficiente")


class DemoTest(Base):
    def test_simulacao_leva_a_coleta_ate_o_banco_e_entrega_o_kit(self):
        self.aprovar()
        coleta = services.agendar_coleta(self.doadora, data=proximo_dia_util(), horario_id=self.horario.id, quantidade_frascos=2, com_kit=True)
        atuais = []
        for _ in range(3):
            services.simular_proxima_etapa(coleta)
            atuais.append(next((e["codigo"] for e in selectors.etapas(coleta) if e["estado"] == "atual"), "fim"))
        self.assertEqual(atuais, ["rota_iniciada", "entregue", "fim"])
        self.assertEqual(coleta.volume_ml, 360)
        self.assertIsNone(selectors.kit_aberto(self.doadora))
        with self.assertRaises(ErroDominio):
            services.simular_proxima_etapa(coleta)

    def test_rota_so_existe_no_modo_demo(self):
        self.aprovar()
        self.entregar_kit()
        coleta = services.agendar_coleta(self.doadora, data=proximo_dia_util(), horario_id=self.horario.id, quantidade_frascos=1)
        token = self.client.post("/api/v1/auth/entrar", {"telefone": "84999990000", "senha": SENHA}, content_type="application/json").json()["access"]
        auth = {"HTTP_AUTHORIZATION": f"Bearer {token}"}
        url = f"/api/v1/demo/coletas/{coleta.id}/avancar"
        self.assertEqual(self.client.post(url, **auth).status_code, 404)
        with override_settings(KAMBY_DEMO=True):
            resposta = self.client.post(url, **auth)
        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(resposta.json()["status"], "a_caminho")
        self.assertEqual(resposta.json()["banco_nome"], "BLH")


class KitAgendadoTest(Base):
    def setUp(self):
        super().setUp()
        self.aprovar()

    def test_kit_guarda_dia_e_horario_e_recusa_dia_fora_da_janela(self):
        with self.assertRaises(ErroDominio):
            services.pedir_kit(self.doadora, 2, data=timezone.localdate(), horario_id=self.horario.id)
        kit = services.pedir_kit(self.doadora, 2, data=proximo_dia_util(), horario_id=self.horario.id)
        self.assertEqual((kit.data_entrega, kit.horario_rotulo), (proximo_dia_util(), "09h30 - 11h00"))

    def test_coleta_com_kit_cria_os_dois_no_mesmo_dia(self):
        self.entregar_kit()
        coleta = services.agendar_coleta(self.doadora, data=proximo_dia_util(), horario_id=self.horario.id, quantidade_frascos=12, com_kit=True)
        kit = selectors.kit_aberto(self.doadora)
        self.assertEqual((kit.data_entrega, kit.horario_inicio, kit.quantidade_frascos), (coleta.data, coleta.horario_inicio, 10))

    def test_primeira_coleta_pode_levar_o_kit_junto(self):
        with self.assertRaises(ErroDominio):
            services.agendar_coleta(self.doadora, data=proximo_dia_util(), horario_id=self.horario.id, quantidade_frascos=2)
        services.agendar_coleta(self.doadora, data=proximo_dia_util(), horario_id=self.horario.id, quantidade_frascos=2, com_kit=True)
        self.assertEqual(selectors.kit_aberto(self.doadora).data_entrega, proximo_dia_util())

    def test_kit_a_caminho_libera_agendar_sem_kit_novo(self):
        services.pedir_kit(self.doadora, 2, data=proximo_dia_util(), horario_id=self.horario.id)
        services.agendar_coleta(self.doadora, data=proximo_dia_util(), horario_id=self.horario.id, quantidade_frascos=2)
        self.assertEqual(selectors.inicio(self.doadora)["coletas_andamento"][0].quantidade_frascos, 2)


class ContaTest(Base):
    def entrar(self):
        return {"HTTP_AUTHORIZATION": f"Bearer {tokens(self.doadora.usuario)['access']}"}

    def test_edita_dados_da_mae_e_do_bebe(self):
        outro = BancoDeLeite.objects.create(nome="Outro", telefone="84", endereco="R", cidade="Natal")
        dados = {
            "nome_completo": "Ana Souza Lima", "data_nascimento": "1999-03-11", "data_parto": "2026-10-21",
            "amamentando": False, "bebe_prematuro": True, "maternidade": "Maternidade Escola Januário Cicco", "banco_id": str(outro.id),
        }
        r = self.client.put("/api/v1/eu", dados, content_type="application/json", **self.entrar())
        self.assertEqual(r.status_code, 200)
        self.assertEqual((r.json()["nome_completo"], r.json()["banco"]["nome"], r.json()["bebe_prematuro"]), ("Ana Souza Lima", "Outro", True))
        outro.ativo = False
        outro.save()
        r = self.client.put("/api/v1/eu", dados, content_type="application/json", **self.entrar())
        self.assertIn("banco_id", r.json()["campos"])

    def test_excluir_conta_pede_a_senha_e_apaga_tudo(self):
        self.aprovar()
        self.entregar_kit()
        services.agendar_coleta(self.doadora, data=proximo_dia_util(), horario_id=self.horario.id, quantidade_frascos=1)
        auth = self.entrar()
        r = self.client.post("/api/v1/eu/excluir", {"senha": "errada"}, content_type="application/json", **auth)
        self.assertEqual(r.status_code, 422)
        r = self.client.post("/api/v1/eu/excluir", {"senha": SENHA}, content_type="application/json", **auth)
        self.assertEqual(r.status_code, 204)
        self.assertFalse(Usuario.objects.filter(telefone="84999990000").exists())
        self.assertFalse(Coleta.objects.exists())
        self.assertFalse(SolicitacaoKit.objects.exists())

    def test_cancelar_kit_so_em_aberto_e_so_o_proprio(self):
        self.aprovar()
        kit = services.pedir_kit(self.doadora, 2, data=proximo_dia_util(), horario_id=self.horario.id)
        auth = self.entrar()
        r = self.client.post(f"/api/v1/kits/{kit.id}/cancelar", **auth)
        self.assertEqual((r.status_code, r.json()["status"]), (200, "cancelado"))
        r = self.client.post(f"/api/v1/kits/{kit.id}/cancelar", **auth)
        self.assertEqual(r.status_code, 409)
        outra = contas.cadastrar_doadora(
            senha=SENHA, telefone="84988887777", nome_completo="Outra", banco_id=self.banco.id, consentimento=True,
            data_nascimento=date(1990, 1, 1), data_parto=date(2026, 9, 1), **EnderecosTest.dados, **dados_mae(),
        )
        contas.avaliar_triagem(outra.doadora.triagens.get(), apta=True, avaliada_por=self.equipe)
        alheio = services.pedir_kit(outra.doadora, 1, data=proximo_dia_util(), horario_id=self.horario.id)
        self.assertEqual(self.client.get(f"/api/v1/kits/{alheio.id}", **auth).status_code, 404)
