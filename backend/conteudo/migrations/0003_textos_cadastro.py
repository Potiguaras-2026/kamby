from django.db import migrations

# Textos do cadastro no protótipo do Figma. A equipe do banco ajusta no admin.
TEXTOS = {
    "cadastro.conta": ("Sua conta", "Vamos começar com você."),
    "cadastro.mae_bebe": ("Você e seu bebê", "Cada história de amamentação é única."),
    "cadastro.aviso_leite": (
        "Doar não faz faltar leite para o seu bebê",
        "Quanto mais o peito é estimulado, mais leite ele produz. O banco de leite orienta você em cada etapa.",
    ),
    "cadastro.saude": ("Sua saúde importa", "Suas respostas ajudam o banco de leite a cuidar de você e dos bebês."),
    "cadastro.criterios": ("", "Critérios sujeitos à avaliação do banco de leite."),
    "cadastro.endereco": ("Onde você mora?", "Assim a equipe do banco encontra você no dia da coleta."),
    "cadastro.consentimento": (
        "Seus dados, seu cuidado",
        "Um cuidado com sua privacidade\n"
        "Seus dados pessoais e de saúde são usados para avaliar a doação, entrar em contato e organizar o atendimento.\n\n"
        "Quem pode ver?\n"
        "A equipe do banco de leite. A equipe que busca o leite recebe só o necessário: nome, telefone e endereço, sem suas respostas de saúde.\n\n"
        "Você decide\n"
        "Pela LGPD, você pode pedir ao banco de leite para ver, corrigir ou apagar seus dados, ou retirar esta autorização.",
    ),
    "cadastro.consentimento_aceite": ("", "Li e concordo com o uso dos meus dados, inclusive os de saúde, para esse cuidado."),
    "cadastro.enviado": (
        "Cadastro enviado!",
        "Obrigada por dar esse primeiro passo. O banco de leite vai analisar seus dados e avisa você por aqui.",
    ),
}


def criar(apps, schema_editor):
    Texto = apps.get_model("conteudo", "Texto")
    for chave, (titulo, corpo) in TEXTOS.items():
        Texto.objects.get_or_create(chave=chave, defaults={"titulo": titulo, "corpo": corpo})


class Migration(migrations.Migration):
    dependencies = [("conteudo", "0002_conteudo_inicial")]
    operations = [migrations.RunPython(criar, migrations.RunPython.noop)]
