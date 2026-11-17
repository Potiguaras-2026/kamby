from django.db import migrations

# Perguntas do protótipo no Figma. shortcut: rascunho; validar com as enfermeiras do banco de leite antes de uso real.
PERGUNTAS = [
    ("boa_saude", "Você está se sentindo bem de saúde?", "Pense em como está hoje. Se algo preocupa você, o banco de leite pode orientar.", "nao", "Se quiser, escreva o que está sentindo"),
    ("medicamento", "Você usa algum medicamento?", "Inclua remédios que usa de vez em quando. O banco de leite vai avaliar com você.", "sim", "Quais medicamentos você usa?"),
    ("alcool", "Você consome bebida alcoólica?", "Pode responder com sinceridade. Essa informação ajuda o banco a orientar você.", "", ""),
    ("fuma", "Você fuma ou usa cigarro eletrônico?", "Sua resposta será acolhida com respeito e sem julgamentos.", "", ""),
    ("substancias", "Você usa alguma substância ilícita?", "Esse cuidado ajuda a proteger você e os bebês que recebem o leite.", "", ""),
    ("exames_prenatal", "Você fez os exames do pré-natal?", "O banco de leite pode pedir seus exames para uma avaliação cuidadosa.", "", ""),
]


def criar(apps, schema_editor):
    PerguntaSaude = apps.get_model("contas", "PerguntaSaude")
    for ordem, (codigo, texto, ajuda, detalhe_se, detalhe_rotulo) in enumerate(PERGUNTAS):
        PerguntaSaude.objects.get_or_create(
            codigo=codigo,
            defaults={"texto": texto, "ajuda": ajuda, "detalhe_se": detalhe_se, "detalhe_rotulo": detalhe_rotulo, "ordem": ordem},
        )


class Migration(migrations.Migration):
    dependencies = [("contas", "0003_cadastro_v2")]
    operations = [migrations.RunPython(criar, migrations.RunPython.noop)]
