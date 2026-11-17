from django.db import migrations

# Lista inicial de Natal e região. A equipe do banco confere, corrige e completa no admin.
MATERNIDADES = [
    ("Maternidade Escola Januário Cicco", "Natal"),
    ("Hospital e Maternidade Leide Morais", "Natal"),
    ("Maternidade Araken Irerê Pinto", "Natal"),
    ("Hospital Dr. José Pedro Bezerra (Santa Catarina)", "Natal"),
    ("Unidade Mista de Felipe Camarão", "Natal"),
    ("Hospital Promater", "Natal"),
    ("Hospital Antônio Prudente", "Natal"),
    ("Hospital Rio Grande", "Natal"),
    ("Maternidade Divino Amor", "Parnamirim"),
]


def criar(apps, schema_editor):
    Maternidade = apps.get_model("bancos", "Maternidade")
    for ordem, (nome, cidade) in enumerate(MATERNIDADES):
        Maternidade.objects.get_or_create(nome=nome, defaults={"cidade": cidade, "ordem": ordem})


class Migration(migrations.Migration):
    dependencies = [("bancos", "0003_maternidades")]
    operations = [migrations.RunPython(criar, migrations.RunPython.noop)]
