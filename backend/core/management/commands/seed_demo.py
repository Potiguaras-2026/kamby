import os
from datetime import date, time, timedelta

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from bancos.models import BancoDeLeite, HorarioColeta
from contas.models import Doadora, PerguntaSaude, Triagem, Usuario
from contas.services import criar_endereco
from doacoes.models import Coleta, SolicitacaoKit


class Command(BaseCommand):
    help = "Cria dados fictícios para demonstração. Idempotente."

    @transaction.atomic
    def handle(self, *args, **opts):
        senha = os.environ.get("SEED_SENHA")
        if not senha:
            raise CommandError("Defina SEED_SENHA no .env")

        banco, _ = BancoDeLeite.objects.get_or_create(
            nome="Banco de Leite Humano (demonstração)",
            defaults={"telefone": "8400000000", "endereco": "Rua Exemplo, 100, Petrópolis", "cidade": "Natal"},
        )

        if not banco.horarios.exists():
            for inicio, fim in [(time(8), time(9, 30)), (time(9, 30), time(11)), (time(13, 30), time(15)), (time(15), time(16, 30))]:
                HorarioColeta.objects.create(banco=banco, inicio=inicio, fim=fim)

        if not Usuario.objects.filter(telefone="84900000000").exists():
            Usuario.objects.create_superuser(
                "84900000000", senha, nome_completo="Equipe Demonstração", papel="equipe_banco", banco=banco
            )

        endereco = {
            "cep": "59012300",
            "logradouro": "Rua Exemplo",
            "numero": "200",
            "bairro": "Petrópolis",
            "cidade": "Natal",
            "uf": "RN",
        }
        if not Usuario.objects.filter(telefone="84911111111").exists():
            usuario = Usuario.objects.create_user("84911111111", senha, nome_completo="Maria Exemplo")
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

        maria = Doadora.objects.get(usuario__telefone="84911111111")
        if maria.enderecos.count() < 2:
            criar_endereco(
                maria, apelido="Trabalho", cep="59020000", logradouro="Avenida Exemplo", numero="1500",
                complemento="Sala 4", bairro="Tirol", cidade="Natal", uf="RN",
            )

        # A coleta mais recente da Maria já passou por todo o caminho até o processamento.
        ultima = maria.coletas.filter(status=Coleta.Status.COLETADA, coletada_em__isnull=False).order_by("-data").first()
        if ultima and not ultima.entregue_banco_em:
            Coleta.objects.filter(pk=ultima.pk).update(
                criado_em=ultima.coletada_em - timedelta(days=3),
                entregue_banco_em=ultima.coletada_em + timedelta(hours=3),
                processada_em=ultima.coletada_em + timedelta(days=1),
            )

        # Uma doadora fictícia em cada momento da jornada, para demonstrar as telas.
        respostas = {c: True for c in PerguntaSaude.objects.filter(ativa=True).values_list("codigo", flat=True)}
        for telefone, nome, momento in [
            ("84922222222", "Bruna Exemplo", "em_analise"),
            ("84933333333", "Carla Exemplo", "a_caminho"),
            ("84944444444", "Dora Exemplo", "ausente"),
            ("84955555555", "Elisa Exemplo", "ajuste"),
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
                Coleta.objects.create(**coleta, data=hoje, status=Coleta.Status.A_CAMINHO, endereco="Rua Exemplo, 200, Petrópolis, Natal-RN")
            elif momento == "ausente":
                Coleta.objects.create(**coleta, data=hoje - timedelta(days=1), status=Coleta.Status.AUSENTE)
            else:
                Coleta.objects.create(
                    **coleta, data=hoje - timedelta(days=2), status=Coleta.Status.COLETADA, volume_ml=200,
                    coletada_em=timezone.now() - timedelta(days=2), ajuste=Coleta.Ajuste.FORA_DO_PADRAO,
                )

        self.stdout.write(
            "Pronto. Equipe: 84900000000. Doadoras: 84911111111 (doando), 84922222222 (em análise), "
            "84933333333 (equipe a caminho), 84944444444 (ninguém em casa), 84955555555 (ajuste no frasco). Senha: SEED_SENHA."
        )
