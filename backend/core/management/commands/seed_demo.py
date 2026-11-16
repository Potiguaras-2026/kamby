import os
from datetime import date, timedelta

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from bancos.models import BancoDeLeite
from contas.models import Doadora, Usuario
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

        if not Usuario.objects.filter(telefone="84900000000").exists():
            Usuario.objects.create_superuser(
                "84900000000", senha, nome_completo="Equipe Demonstração", papel="equipe_banco", banco=banco
            )

        endereco = {
            "data_nascimento": date(1996, 5, 4),
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
                data_parto=timezone.localdate() - timedelta(days=60),
                consentimento_em=timezone.now(),
                **endereco,
            )
            SolicitacaoKit.objects.create(doadora=maria, quantidade_frascos=6, status=SolicitacaoKit.Status.ENTREGUE)
            for dias, volume in [(30, 900), (15, 900)]:
                Coleta.objects.create(
                    doadora=maria,
                    banco=banco,
                    data=timezone.localdate() - timedelta(days=dias),
                    janela=Coleta.Janela.MANHA,
                    quantidade_frascos=3,
                    status=Coleta.Status.COLETADA,
                    volume_ml=volume,
                    coletada_em=timezone.now() - timedelta(days=dias),
                )

        self.stdout.write("Pronto. Equipe: 84900000000. Doadora apta: 84911111111. Senha: SEED_SENHA.")
