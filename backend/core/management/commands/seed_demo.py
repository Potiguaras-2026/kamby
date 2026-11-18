import os
from datetime import date, time, timedelta

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from bancos.models import BancoDeLeite
from contas.models import Doadora, PerguntaSaude, Triagem, Usuario
from contas.services import DOADORA_DEMO, criar_endereco
from doacoes.models import Coleta, SolicitacaoKit


EMAIL_EQUIPE = "equipe@example.com"


class Command(BaseCommand):
    help = "Cria dados fictícios para demonstração. Idempotente."

    @transaction.atomic
    def handle(self, *args, **opts):
        senha = os.environ.get("SEED_SENHA")
        if not senha:
            raise CommandError("Defina SEED_SENHA no .env")

        # Os bancos reais de Natal vêm da migração bancos.0005; as doadoras fictícias doam para a Januário Cicco.
        banco = BancoDeLeite.objects.get(nome="Banco de Leite Humano da Maternidade Escola Januário Cicco")

        if not Usuario.objects.filter(telefone="84900000000").exists():
            Usuario.objects.create_superuser(
                "84900000000", senha, nome_completo="Equipe do Banco de Leite", papel="equipe_banco", banco=banco,
                email=EMAIL_EQUIPE,
            )
        # O admin entra por e-mail; contas criadas antes disso ainda não têm um.
        Usuario.objects.filter(telefone="84900000000", email="").update(email=EMAIL_EQUIPE)

        endereco = {
            "cep": "59012300",
            "logradouro": "Rua Seridó",
            "numero": "200",
            "bairro": "Petrópolis",
            "cidade": "Natal",
            "uf": "RN",
        }
        if not Usuario.objects.filter(telefone=DOADORA_DEMO).exists():
            usuario = Usuario.objects.create_user(DOADORA_DEMO, senha, nome_completo="Maria Fernandes")
            maria = Doadora.objects.create(
                usuario=usuario,
                banco=banco,
                status=Doadora.Status.APTA,
                data_parto=timezone.localdate() - timedelta(days=200),
                consentimento_em=timezone.now(),
                data_nascimento=date(1996, 5, 4),
            )
            criar_endereco(maria, apelido="Casa", **endereco)
            # criado_em é auto_now_add; update ajusta "doadora desde" ao histórico fictício.
            Doadora.objects.filter(pk=maria.pk).update(criado_em=timezone.now() - timedelta(days=180))
            SolicitacaoKit.objects.create(doadora=maria, quantidade_frascos=6, status=SolicitacaoKit.Status.ENTREGUE)
            # Seis meses de histórico para o gráfico da tela Início.
            for dias, volume in [(165, 600), (135, 900), (105, 1200), (75, 800), (45, 1500), (15, 1100)]:
                Coleta.objects.create(
                    doadora=maria,
                    banco=banco,
                    data=timezone.localdate() - timedelta(days=dias),
                    horario_inicio=time(9, 30),
                    horario_fim=time(11),
                    quantidade_frascos=3,
                    status=Coleta.Status.COLETADA,
                    volume_ml=volume,
                    coletada_em=timezone.now() - timedelta(days=dias),
                )

        maria = Doadora.objects.get(usuario__telefone=DOADORA_DEMO)
        if maria.enderecos.count() < 2:
            criar_endereco(
                maria, apelido="Trabalho", cep="59020000", logradouro="Avenida Hermes da Fonseca", numero="1500",
                complemento="Sala 4", bairro="Tirol", cidade="Natal", uf="RN",
            )

        # O histórico da Maria já passou por todo o caminho até o banco; sem isso, cada coleta antiga fica "em andamento".
        maria.coletas.filter(status=Coleta.Status.COLETADA, coletada_em__isnull=False, entregue_banco_em__isnull=True).update(
            criado_em=F("coletada_em") - timedelta(days=3),
            entregue_banco_em=F("coletada_em") + timedelta(hours=3),
            processada_em=F("coletada_em") + timedelta(days=1),
        )

        # Uma doadora fictícia em cada momento da jornada, para demonstrar as telas.
        respostas = {c: True for c in PerguntaSaude.objects.filter(ativa=True).values_list("codigo", flat=True)}
        for telefone, nome, momento in [
            ("84922222222", "Bruna Alves", "em_analise"),
            ("84933333333", "Carla Souza", "a_caminho"),
            ("84944444444", "Dora Lima", "ausente"),
            ("84955555555", "Elisa Costa", "ajuste"),
        ]:
            if Usuario.objects.filter(telefone=telefone).exists():
                continue
            usuario = Usuario.objects.create_user(telefone, senha, nome_completo=nome)
            doadora = Doadora.objects.create(
                usuario=usuario,
                banco=banco,
                status=Doadora.Status.EM_ANALISE if momento == "em_analise" else Doadora.Status.APTA,
                data_parto=timezone.localdate() - timedelta(days=60),
                consentimento_em=timezone.now(),
                data_nascimento=date(1995, 8, 20),
                amamentando=True,
                bebe_prematuro=False,
            )
            criar_endereco(doadora, apelido="Casa", referencia="Portão azul", **endereco)
            Triagem.objects.create(
                doadora=doadora,
                respostas=respostas,
                resultado=Triagem.Resultado.PENDENTE if momento == "em_analise" else Triagem.Resultado.APTA,
            )
            if momento == "em_analise":
                continue
            SolicitacaoKit.objects.create(doadora=doadora, quantidade_frascos=4, status=SolicitacaoKit.Status.ENTREGUE)
            hoje = timezone.localdate()
            coleta = {"doadora": doadora, "banco": banco, "horario_inicio": time(9, 30), "horario_fim": time(11), "quantidade_frascos": 3}
            if momento == "a_caminho":
                Coleta.objects.create(**coleta, data=hoje, status=Coleta.Status.A_CAMINHO, endereco="Rua Seridó, 200, Petrópolis, Natal-RN")
            elif momento == "ausente":
                Coleta.objects.create(**coleta, data=hoje - timedelta(days=1), status=Coleta.Status.AUSENTE)
            else:
                Coleta.objects.create(
                    **coleta, data=hoje - timedelta(days=2), status=Coleta.Status.COLETADA, volume_ml=200,
                    coletada_em=timezone.now() - timedelta(days=2), ajuste=Coleta.Ajuste.FORA_DO_PADRAO,
                )

        self.stdout.write(
            f"Pronto. Admin: {EMAIL_EQUIPE}. Doadoras: 84911111111 (doando), 84922222222 (em análise), "
            "84933333333 (equipe a caminho), 84944444444 (ninguém em casa), 84955555555 (ajuste no frasco). Senha: SEED_SENHA."
        )
