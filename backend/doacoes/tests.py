from datetime import date, timedelta

from django.test import TestCase
from django.utils import timezone

from bancos.models import BancoDeLeite
from contas import services as contas
from contas.models import Doadora, Usuario
from contas.triagem import CODIGOS
from core.erros import ErroDominio
from doacoes import selectors, services
from doacoes.models import Coleta, SolicitacaoKit

SENHA = "frasco-azul-2026"


def proximo_dia_util() -> date:
    return services.dias_disponiveis(timezone.localdate())[0]


class Base(TestCase):
    def setUp(self):
        self.banco = BancoDeLeite.objects.create(nome="BLH", telefone="84", endereco="R", cidade="Natal")
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
        )
        self.doadora = Doadora.objects.get(usuario__telefone="84999990000")
        self.equipe = Usuario.objects.create_user("84900000000", SENHA, nome_completo="Equipe")

    def aprovar(self):
        triagem = contas.enviar_triagem(self.doadora, {c: True for c in CODIGOS})
        contas.avaliar_triagem(triagem, apta=True, avaliada_por=self.equipe)
        self.doadora.refresh_from_db()

    def entregar_kit(self):
        kit = services.pedir_kit(self.doadora, 4)
        services.mudar_status_kit(kit, SolicitacaoKit.Status.EM_PREPARO)
        services.mudar_status_kit(kit, SolicitacaoKit.Status.ENTREGUE)

    def acao(self):
        return selectors.inicio(self.doadora)["proxima_acao"]


class FluxoDaDoadoraTest(Base):
    def test_proxima_acao_acompanha_o_fluxo_completo(self):
        self.assertEqual(self.acao(), "responder_triagem")
        triagem = contas.enviar_triagem(self.doadora, {c: True for c in CODIGOS})
        self.assertEqual(self.acao(), "aguardar_analise")
        contas.avaliar_triagem(triagem, apta=True, avaliada_por=self.equipe)
        self.doadora.refresh_from_db()
        self.assertEqual(self.acao(), "pedir_kit")
        kit = services.pedir_kit(self.doadora, 4)
        self.assertEqual(self.acao(), "aguardar_kit")
        services.mudar_status_kit(kit, SolicitacaoKit.Status.EM_PREPARO)
        services.mudar_status_kit(kit, SolicitacaoKit.Status.ENTREGUE)
        self.assertEqual(self.acao(), "agendar_coleta")
        coleta = services.agendar_coleta(self.doadora, data=proximo_dia_util(), janela="manha", quantidade_frascos=3)
        self.assertEqual(self.acao(), "acompanhar_coleta")
        for status in [Coleta.Status.CONFIRMADA, Coleta.Status.A_CAMINHO]:
            services.mudar_status_coleta(coleta, status)
        services.mudar_status_coleta(coleta, Coleta.Status.COLETADA, volume_ml=1200)
        self.assertEqual(self.acao(), "agendar_coleta")
        self.assertEqual(selectors.impacto(self.doadora), {"volume_total_ml": 1200, "recem_nascidos_dia": 12, "coletas": 1})

    def test_inapta_vai_para_contato_com_banco(self):
        triagem = contas.enviar_triagem(self.doadora, {c: False for c in CODIGOS})
        contas.avaliar_triagem(triagem, apta=False, avaliada_por=self.equipe)
        self.doadora.refresh_from_db()
        self.assertEqual(self.acao(), "contatar_banco")


class RegrasTest(Base):
    def test_nao_agenda_sem_aprovacao_ou_sem_kit(self):
        with self.assertRaisesMessage(ErroDominio, "aprovar"):
            services.agendar_coleta(self.doadora, data=proximo_dia_util(), janela="manha", quantidade_frascos=1)
        self.aprovar()
        with self.assertRaisesMessage(ErroDominio, "frascos"):
            services.agendar_coleta(self.doadora, data=proximo_dia_util(), janela="manha", quantidade_frascos=1)

    def test_uma_coleta_ativa_por_vez(self):
        self.aprovar()
        self.entregar_kit()
        services.agendar_coleta(self.doadora, data=proximo_dia_util(), janela="manha", quantidade_frascos=1)
        with self.assertRaises(ErroDominio) as erro:
            services.agendar_coleta(self.doadora, data=proximo_dia_util(), janela="tarde", quantidade_frascos=1)
        self.assertEqual(erro.exception.codigo, "conflito")

    def test_data_fora_da_janela_e_recusada(self):
        self.aprovar()
        self.entregar_kit()
        for data in [timezone.localdate(), timezone.localdate() + timedelta(days=30)]:
            with self.assertRaises(ErroDominio) as erro:
                services.agendar_coleta(self.doadora, data=data, janela="manha", quantidade_frascos=1)
            self.assertEqual(erro.exception.codigo, "validacao")

    def test_transicao_invalida_e_coletada_exige_volume(self):
        self.aprovar()
        self.entregar_kit()
        coleta = services.agendar_coleta(self.doadora, data=proximo_dia_util(), janela="manha", quantidade_frascos=1)
        with self.assertRaises(ErroDominio):
            services.mudar_status_coleta(coleta, Coleta.Status.COLETADA, volume_ml=500)
        services.mudar_status_coleta(coleta, Coleta.Status.CONFIRMADA)
        services.mudar_status_coleta(coleta, Coleta.Status.A_CAMINHO)
        with self.assertRaisesMessage(ErroDominio, "volume"):
            services.mudar_status_coleta(coleta, Coleta.Status.COLETADA)

    def test_telefone_duplicado(self):
        with self.assertRaises(ErroDominio) as erro:
            contas.cadastrar_doadora(
                senha=SENHA, telefone="84999990000", nome_completo="Outra", banco_id=self.banco.id, consentimento=True
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
        self.assertEqual(r.json()["proxima_acao"], "responder_triagem")
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
