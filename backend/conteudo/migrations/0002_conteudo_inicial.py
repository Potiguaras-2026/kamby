from django.db import migrations

# Rascunho com orientações gerais da Rede Brasileira de Bancos de Leite Humano; a equipe do banco revisa no admin.
TEXTOS = {
    "inicio.responder_triagem": ("", "Responda algumas perguntas de saúde para começar. Leva 2 minutos."),
    "inicio.aguardar_analise": ("", "Recebemos seu cadastro. O banco de leite responde em até 2 dias úteis."),
    "inicio.contatar_banco": ("", "Pelas suas respostas, a doação não é indicada agora. Fale com o banco de leite se tiver dúvidas."),
    "inicio.pedir_kit": ("", "Você já pode doar. Peça o kit e a equipe leva até você."),
    "inicio.aguardar_kit": ("", "Seu pedido de kit está em andamento."),
    "inicio.agendar_coleta": ("", "Quando os frascos estiverem cheios, agende a coleta."),
    "inicio.acompanhar_coleta": ("", "Sua coleta está agendada."),
    "inicio.destaque": ("", "Seu leite leva cuidado e esperança para quem mais precisa"),
    "sobre.1": (
        "Tecnologia que conecta amor e vida",
        "O Kamby foi criado para facilitar a doação de leite materno, conectando mães doadoras a bebês que precisam, "
        "de forma simples, segura e acolhedora.",
    ),
    "sobre.2": (
        "Quem somos",
        "Somos a equipe Potiguaras, estudantes do curso de Informática para Internet do IFRN, Campus Natal Central. "
        "Unimos tecnologia e impacto social para transformar realidades.\n\n"
        "Equipe: Amanda Lara, Caio Henrique, Clara Teodósio, Ermesson Andrade, Lucas Cássio e Heitor de França.\n\n"
        "Natal, RN. Orientador: Leonardo Minora.",
    ),
    "sobre.3": (
        "Equipe Potiguaras",
        "Nosso nome homenageia os povos indígenas Potiguaras, originários do litoral potiguar: suas raízes, sua cultura "
        "e a força de um povo que cuida, protege e compartilha.",
    ),
    "sobre.4": (
        "Sobre o Kamby",
        "Acreditamos que doar leite materno é um gesto simples e poderoso, capaz de salvar vidas, principalmente de bebês prematuros.\n\n"
        "O nome Kamby vem do tupi-guarani e significa leite, líquido do seio: nutrir, acolher e transformar realidades com pequenos gestos.",
    ),
    "sobre.contatos": (
        "Contatos",
        "ifrn_potiguaras | https://instagram.com/ifrn_potiguaras\n"
        "Potiguaras | https://www.youtube.com/results?search_query=Potiguaras+IFRN\n"
        "ifrn.potiguaras@gmail.com | mailto:ifrn.potiguaras@gmail.com",
    ),
}

DICAS = [
    ("higiene", "Higiene correta", "Mãos e utensílios sempre limpos", "maos", "rapidas", [
        "Antes de cada retirada, prenda o cabelo e cubra com a touca do kit.",
        "Lave as mãos e os braços até o cotovelo com água e sabão, e seque com toalha limpa ou papel.",
        "Evite conversar durante a retirada, ou use uma máscara. Isso protege o leite.",
    ]),
    ("armazenamento", "Armazenamento seguro", "Congele o leite logo depois", "congelador", "rapidas", [
        "Feche bem o frasco e coloque no congelador assim que terminar.",
        "Você pode completar o mesmo frasco nos dias seguintes, sempre deixando dois dedos livres até a tampa.",
        "O leite congelado pode ficar até 15 dias no congelador até a coleta.",
    ]),
    ("frascos", "Frascos adequados", "Prefira vidro esterilizado", "frascos", "rapidas", [
        "Use os frascos de vidro esterilizados que vêm no kit. Eles foram preparados pelo banco de leite.",
        "Escreva na etiqueta seu nome e a data da primeira retirada.",
        "Se precisar de mais frascos, peça um novo kit pelo app.",
    ]),
    ("destino", "Para onde vai o seu leite", "Bebês prematuros na UTI neonatal", "uti", "leia", [
        "No banco de leite, o leite doado passa por análise e pasteurização.",
        "Depois vai para bebês prematuros ou de baixo peso internados em UTIs neonatais, que ainda não podem mamar no peito.",
        "Cada frasco faz diferença no crescimento desses bebês.",
    ]),
]

GUIAS = [
    ("passo-a-passo", "Passo a passo da doação", "O passo a passo, do preparo até guardar no congelador.", "rosa", "retirada", True, [
        "Prenda o cabelo, cubra com a touca e lave bem as mãos e os braços até o cotovelo.",
        "Use o frasco de vidro esterilizado do kit. Escreva na etiqueta seu nome e a data da primeira retirada.",
        "Massageie as mamas com a ponta dos dedos, em movimentos circulares.",
        "Despreze os primeiros jatos e retire o leite com as mãos, direto no frasco.",
        "Feche bem e guarde no congelador. Você pode completar o mesmo frasco nos próximos dias, deixando dois dedos livres até a tampa.",
        "Com os frascos prontos, agende a coleta pelo app. O leite congelado pode ficar até 15 dias no congelador.",
    ]),
    ("quem-pode", "Quem pode ser doadora?", "", "turquesa", "", False, [
        "Está amamentando e tem mais leite do que o seu bebê precisa.",
        "Está com boa saúde e com os exames do pré-natal sem alteração.",
        "Não fuma e não consome bebida alcoólica ou outras drogas.",
        "Não toma remédios que impedem a doação. Na dúvida, o banco de leite orienta.",
    ]),
    ("como-ser", "Como ser doadora?", "", "azul", "", False, [
        "Faça seu cadastro no Kamby.",
        "Responda às perguntas de saúde.",
        "O banco de leite analisa e avisa pelo app.",
        "Peça seu kit com os frascos esterilizados.",
        "Retire o leite em casa e agende a coleta.",
    ]),
]


def criar(apps, schema_editor):
    Texto, Dica, Guia = (apps.get_model("conteudo", m) for m in ("Texto", "Dica", "Guia"))
    for chave, (titulo, corpo) in TEXTOS.items():
        Texto.objects.get_or_create(chave=chave, defaults={"titulo": titulo, "corpo": corpo})
    for ordem, (slug, titulo, resumo, imagem, secao, paragrafos) in enumerate(DICAS):
        Dica.objects.get_or_create(
            slug=slug,
            defaults={"titulo": titulo, "resumo": resumo, "imagem": imagem, "secao": secao, "paragrafos": "\n".join(paragrafos), "ordem": ordem},
        )
    for ordem, (slug, titulo, resumo, tom, imagem, destaque, passos) in enumerate(GUIAS):
        Guia.objects.get_or_create(
            slug=slug,
            defaults={
                "titulo": titulo, "resumo": resumo, "tom": tom, "imagem": imagem,
                "destaque": destaque, "passos": "\n".join(passos), "ordem": ordem,
            },
        )


class Migration(migrations.Migration):
    dependencies = [("conteudo", "0001_conteudo")]
    operations = [migrations.RunPython(criar, migrations.RunPython.noop)]
