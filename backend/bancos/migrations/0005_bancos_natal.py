from datetime import time

from django.db import migrations

# Bancos de leite humano de Natal com coleta domiciliar, segundo a Rede Brasileira de Bancos de Leite Humano
# (rblh.fiocruz.br, consultado em 2026-11). Postos de coleta ficam de fora: só recebem leite, não buscam em casa.
BANCOS = [
    {
        "nome": "Banco de Leite Humano da Maternidade Escola Januário Cicco",
        "telefone": "8433425800",
        "endereco": "Av. Nilo Peçanha, 259, Petrópolis, CEP 59012-300",
    },
    {
        "nome": "Banco de Leite Humano do Hospital Dr. José Pedro Bezerra",
        "telefone": "8432327728",
        "endereco": "Rua Araquari, s/n, Conj. Santa Catarina, Potengi, CEP 59110-390",
    },
    {
        "nome": "Banco de Leite Humano do Hospital Central Coronel Pedro Germano",
        "telefone": "8432323664",
        "endereco": "Av. Prudente de Morais, 887, Tirol, CEP 59020-505",
    },
]

# A rBLH não publica faixas da coleta em casa: estas são um ponto de partida que cada banco ajusta no admin.
HORARIOS = [(time(8), time(10)), (time(10), time(12)), (time(13), time(15)), (time(15), time(17))]

DEMO = "Banco de Leite Humano (demonstração)"


def criar(apps, schema_editor):
    BancoDeLeite = apps.get_model("bancos", "BancoDeLeite")
    HorarioColeta = apps.get_model("bancos", "HorarioColeta")
    # O banco fictício do seed vira o da Januário Cicco: doadoras e coletas de teste continuam ligadas a ele.
    BancoDeLeite.objects.filter(nome=DEMO).update(**BANCOS[0], cidade="Natal")
    for dados in BANCOS:
        banco, criado = BancoDeLeite.objects.get_or_create(nome=dados["nome"], defaults={**dados, "cidade": "Natal"})
        if criado:
            for inicio, fim in HORARIOS:
                HorarioColeta.objects.create(banco=banco, inicio=inicio, fim=fim)


class Migration(migrations.Migration):
    dependencies = [("bancos", "0004_maternidades_natal")]
    operations = [migrations.RunPython(criar, migrations.RunPython.noop)]
