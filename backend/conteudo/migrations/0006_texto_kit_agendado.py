from django.db import migrations


def atualizar(apps, schema_editor):
    # O kit agora tem dia e horário escolhidos pela doadora: o banco não "avisa" mais a data.
    apps.get_model("conteudo", "Texto").objects.filter(chave="kit.resumo").update(
        corpo="O banco de leite prepara seus frascos e a equipe entrega no dia e horário que você escolheu."
    )


class Migration(migrations.Migration):
    dependencies = [("conteudo", "0005_textos_demo")]
    operations = [migrations.RunPython(atualizar, migrations.RunPython.noop)]
