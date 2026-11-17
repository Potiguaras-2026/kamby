from datetime import date, time, timedelta

from django.test import TestCase
from django.utils import timezone

from bancos.models import BancoDeLeite, HorarioColeta
from contas import services as contas
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


class Base(TestCase):
    def setUp(self):
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
        kit = services.pedir_kit(self.doadora, 4)
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
        kit = services.pedir_kit(self.doadora, 4)
        self.assertEqual(self.acao(), "aguardar_kit")
        services.mudar_status_kit(kit, SolicitacaoKit.Status.EM_PREPARO)
        services.mudar_status_kit(kit, SolicitacaoKit.Status.ENTREGUE)
        self.assertEqual(self.acao(), "agendar_coleta")
        coleta = services.agendar_coleta(self.doadora, data=proximo_dia_util(), horario_id=self.horario.id, quantidade_frascos=3)
        self.assertEqual(self.acao(), "acompanhar_coleta")
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

    def test_uma_coleta_ativa_por_vez(self):
        self.aprovar()
        self.entregar_kit()
        services.agendar_coleta(self.doadora, data=proximo_dia_util(), horario_id=self.horario.id, quantidade_frascos=1)
        with self.assertRaises(ErroDominio) as erro:
            services.agendar_coleta(self.doadora, data=proximo_dia_util(), horario_id=self.horario.id, quantidade_frascos=1)
        self.assertEqual(erro.exception.codigo, "conflito")

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
