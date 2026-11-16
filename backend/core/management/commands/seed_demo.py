import os
from datetime import date, time, timedelta

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from bancos.models import BancoDeLeite, HorarioColeta
from contas.models import Doadora, Usuario
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

        self.stdout.write("Pronto. Equipe: 84900000000. Doadora apta: 84911111111. Senha: SEED_SENHA.")
