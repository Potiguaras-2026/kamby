from datetime import date

from django.test import TestCase

from bancos.models import BancoDeLeite
from contas.models import Doadora, PerguntaSaude
from conteudo.models import Dica, Texto


class ConteudoTest(TestCase):
    def test_conteudo_inicial_e_editavel_sem_login(self):
        textos = self.client.get("/api/v1/conteudo/textos").json()
        self.assertIn("inicio.pedir_kit", textos)
        Texto.objects.filter(chave="inicio.pedir_kit").update(corpo="Novo texto")
        self.assertEqual(self.client.get("/api/v1/conteudo/textos").json()["inicio.pedir_kit"]["corpo"], "Novo texto")

        Dica.objects.filter(slug="destino").update(publicada=False)
        slugs = [d["slug"] for d in self.client.get("/api/v1/conteudo/dicas").json()]
        self.assertNotIn("destino", slugs)
        self.assertEqual(self.client.get("/api/v1/conteudo/dicas/destino").status_code, 404)
        guia = self.client.get("/api/v1/conteudo/guias/passo-a-passo").json()
        self.assertEqual(len(guia["passos"]), 6)


class CadastroTest(TestCase):
    def setUp(self):
        self.banco = BancoDeLeite.objects.create(nome="BLH", telefone="84", endereco="R", cidade="Natal")
        self.perguntas = self.client.get("/api/v1/triagem/perguntas").json()

    def dados(self, **extra):
        return {
            "nome_completo": "Ana Souza",
            "telefone": "(84) 99999-0000",
            "email": "Ana@Exemplo.com",
            "senha": "frasco-azul-2026",
            "data_nascimento": "1999-03-10",
            "data_parto": "2026-10-20",
            "amamentando": True,
            "bebe_prematuro": False,
            "maternidade": "Maternidade Escola",
            "banco_id": str(self.banco.id),
            "cep": "59012-300",
            "logradouro": "Rua X",
            "numero": "10",
            "bairro": "Petrópolis",
            "cidade": "Natal",
            "uf": "RN",
            "consentimento": True,
            "respostas": {p["codigo"]: True for p in self.perguntas},
            "detalhes": {"medicamento": "Vitamina D", "inexistente": "ignorado"},
            **extra,
        }

    def cadastrar(self, **extra):
        return self.client.post("/api/v1/auth/cadastro", self.dados(**extra), content_type="application/json")

    def test_cadastro_completo_ja_vai_para_analise(self):
        self.assertEqual(len(self.perguntas), PerguntaSaude.objects.filter(ativa=True).count())
        r = self.cadastrar()
        self.assertEqual(r.status_code, 201, r.json())
        doadora = Doadora.objects.get()
        self.assertEqual(doadora.status, Doadora.Status.EM_ANALISE)
        self.assertEqual(doadora.usuario.email, "ana@exemplo.com")
        self.assertEqual((doadora.amamentando, doadora.maternidade), (True, "Maternidade Escola"))
        self.assertEqual(doadora.triagens.get().detalhes, {"medicamento": "Vitamina D"})

    def test_respostas_incompletas_nao_criam_conta(self):
        r = self.cadastrar(respostas={"boa_saude": True})
        self.assertEqual(r.status_code, 422)
        self.assertIn("respostas", r.json()["campos"])
        self.assertFalse(Doadora.objects.exists())

    def test_email_invalido(self):
        r = self.cadastrar(email="ana@")
        self.assertEqual((r.status_code, list(r.json()["campos"])), (422, ["email"]))

    def test_pergunta_desativada_sai_do_cadastro(self):
        PerguntaSaude.objects.filter(codigo="alcool").update(ativa=False)
        respostas = {p["codigo"]: True for p in self.perguntas if p["codigo"] != "alcool"}
        self.assertEqual(self.cadastrar(respostas=respostas).status_code, 201)
