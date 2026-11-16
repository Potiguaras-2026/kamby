from datetime import time

from django.db import migrations, models

# Coletas criadas antes dos horários por banco: manhã e tarde viram faixas fixas.
FAIXAS = {"manha": (time(8), time(12)), "tarde": (time(13), time(17))}


def janela_para_horario(apps, schema_editor):
    Coleta = apps.get_model("doacoes", "Coleta")
    for coleta in Coleta.objects.all():
        coleta.horario_inicio, coleta.horario_fim = FAIXAS[coleta.janela]
        coleta.save(update_fields=["horario_inicio", "horario_fim"])


class Migration(migrations.Migration):
    dependencies = [("doacoes", "0001_initial")]

    operations = [
        migrations.AddField("coleta", "horario_inicio", models.TimeField("início do horário", null=True)),
        migrations.AddField("coleta", "horario_fim", models.TimeField("fim do horário", null=True)),
        migrations.RunPython(janela_para_horario, migrations.RunPython.noop),
        migrations.AlterField("coleta", "horario_inicio", models.TimeField("início do horário")),
        migrations.AlterField("coleta", "horario_fim", models.TimeField("fim do horário")),
        migrations.RemoveField("coleta", "janela"),
    ]
