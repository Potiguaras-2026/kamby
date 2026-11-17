from django.db import migrations

# Textos da jornada da doação e das exceções, a partir do protótipo no Figma. A equipe do banco ajusta no admin.
TEXTOS = {
    "jornada.em_analise": ("Cadastro em análise", "O banco de leite está lendo suas respostas."),
    "jornada.aprovada": ("Cadastro aprovado", "Você já pode doar."),
    "jornada.kit_solicitado": ("Kit solicitado", "Frascos de vidro, touca e etiquetas."),
    "jornada.kit_entregue": ("Kit entregue", "Os frascos chegaram na sua casa."),
    "jornada.coleta_agendada": ("Coleta agendada", "A equipe passa no dia e horário marcados."),
    "jornada.a_caminho": ("Equipe a caminho", "Deixe os frascos prontos no congelador."),
    "jornada.coletada": ("Leite coletado", "Seu leite está indo para o banco de leite."),
    "jornada.entregue_banco": ("Entregue ao banco", "Seu leite chegou ao banco de leite."),
    "jornada.processada": ("Processado", "Pasteurizado e pronto para os bebês."),
    "jornada.final": (
        "Seu leite chegou ao banco de leite",
        "Cada gota doada nutre recém-nascidos que lutam pela vida. Muito obrigada por cuidar deles com tanta generosidade.",
    ),
    "aviso.ausente": (
        "Não encontramos ninguém em casa",
        "Tudo bem, imprevistos acontecem. Seu leite pode ficar no congelador por até 15 dias desde a primeira retirada.\n\n"
        "Escolha um novo dia para a equipe voltar.",
    ),
    "aviso.ajuste.fora_do_padrao": (
        "Ajuste no seu frasco",
        "Para evitar contaminação na pasteurização, usamos só frascos de vidro com tampa plástica de rosca, fervidos por 15 minutos. "
        "Se precisar, peça frascos prontos pelo app.\n\n"
        "Você fez um ótimo trabalho. Esse leite não pôde ser pasteurizado, mas você continua sendo uma doadora muito importante.",
    ),
    "aviso.ajuste.quantidade_insuficiente": (
        "Ajuste na quantidade",
        "Desta vez o volume foi pequeno para o processamento. Você pode completar o mesmo frasco nos próximos dias, "
        "sempre no congelador, e agendar quando estiver mais cheio.\n\n"
        "Cada gota conta, e o banco de leite agradece seu cuidado.",
    ),
    "kit.resumo": ("Pedido recebido!", "O banco de leite prepara seus frascos e avisa quando a equipe for entregar."),
}


def criar(apps, schema_editor):
    Texto = apps.get_model("conteudo", "Texto")
    for chave, (titulo, corpo) in TEXTOS.items():
        Texto.objects.get_or_create(chave=chave, defaults={"titulo": titulo, "corpo": corpo})


class Migration(migrations.Migration):
    dependencies = [("conteudo", "0003_textos_cadastro")]
    operations = [migrations.RunPython(criar, migrations.RunPython.noop)]
