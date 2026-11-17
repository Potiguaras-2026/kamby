from django.db import migrations

# Textos novos do cadastro curto, do contato por WhatsApp e do Sobre. A equipe do banco ajusta no admin.
NOVOS = {
    "cadastro.aprovado": (
        "Cadastro aprovado!",
        "Que alegria ter você com a gente. Você já pode pedir seu kit de frascos.",
    ),
    "cadastro.dica_conta": (
        "Leva só 3 minutinhos",
        "São 4 etapas rápidas. Seus dados ficam guardados com cuidado.",
    ),
    "cadastro.dica_saude": (
        "Sem resposta certa ou errada",
        "Muitos remédios são compatíveis com a doação. A equipe do banco avalia cada caso com carinho.",
    ),
    "cadastro.dica_endereco": (
        "A gente vai até você",
        "A equipe do banco busca o leite na sua casa. Você não precisa sair.",
    ),
    "contato.whatsapp": ("", "Olá! Sou doadora pelo Kamby e queria tirar uma dúvida."),
}

ATUALIZAR = {
    "cadastro.aviso_leite": (
        "Doar não faz faltar leite!",
        "Quanto mais o peito é estimulado, mais leite ele produz. Seu bebê continua com tudo o que precisa.",
    ),
    "sobre.contatos": (
        "Contatos",
        "Site | https://potiguaras.org\n"
        "Instagram | https://instagram.com/ifrn_potiguaras\n"
        "YouTube | https://www.youtube.com/results?search_query=Potiguaras+IFRN\n"
        "E-mail | mailto:ifrn.potiguaras@gmail.com",
    ),
}


def criar(apps, schema_editor):
    Texto = apps.get_model("conteudo", "Texto")
    for chave, (titulo, corpo) in NOVOS.items():
        Texto.objects.get_or_create(chave=chave, defaults={"titulo": titulo, "corpo": corpo})
    for chave, (titulo, corpo) in ATUALIZAR.items():
        Texto.objects.update_or_create(chave=chave, defaults={"titulo": titulo, "corpo": corpo})


class Migration(migrations.Migration):
    dependencies = [("conteudo", "0004_textos_jornada")]
    operations = [migrations.RunPython(criar, migrations.RunPython.noop)]
