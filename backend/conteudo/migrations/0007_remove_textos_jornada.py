from django.db import migrations

# A jornada virou 4 etapas por coleta, com rótulos fixos no código. Só "jornada.final" continua em uso.
SEM_USO = [
    "em_analise", "aprovada", "kit_solicitado", "kit_entregue", "coleta_agendada",
    "a_caminho", "coletada", "entregue_banco", "processada",
]


def remover(apps, schema_editor):
    apps.get_model("conteudo", "Texto").objects.filter(chave__in=[f"jornada.{c}" for c in SEM_USO]).delete()


class Migration(migrations.Migration):
    dependencies = [("conteudo", "0006_texto_kit_agendado")]
    operations = [migrations.RunPython(remover, migrations.RunPython.noop)]
