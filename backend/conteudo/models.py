from django.db import models

from core.models import ModeloBase

# shortcut: escolha entre imagens que já vêm no app, sem upload; trocar por upload quando houver servidor de mídia.
IMAGENS = [
    ("", "Sem imagem"),
    ("maeBebe", "Mãe com bebê"),
    ("maos", "Mãos lavadas"),
    ("congelador", "Congelador"),
    ("frascos", "Frascos"),
    ("retirada", "Retirada do leite"),
    ("bancoFrascos", "Frascos no banco"),
    ("uti", "UTI neonatal"),
    ("kitGrupo", "Kit de coleta"),
    ("poteLeite", "Pote com leite"),
]


class Texto(ModeloBase):
    """Texto solto de uma tela do app. O app procura pela chave; mudar aqui muda no app sem novo build."""

    chave = models.CharField(max_length=80, unique=True, help_text="Ex.: cadastro.consentimento. Não mude: o app procura por ela.")
    titulo = models.CharField("título", max_length=150, blank=True)
    corpo = models.TextField(blank=True, help_text="Linha em branco separa parágrafos.")

    class Meta:
        ordering = ["chave"]

    def __str__(self):
        return self.chave


class Dica(ModeloBase):
    class Secao(models.TextChoices):
        RAPIDAS = "rapidas", "Dicas rápidas"
        LEIA = "leia", "Leia também"

    slug = models.SlugField(unique=True)
    titulo = models.CharField("título", max_length=120)
    resumo = models.CharField(max_length=160)
    paragrafos = models.TextField("parágrafos", help_text="Um parágrafo por linha.")
    imagem = models.CharField(max_length=30, choices=IMAGENS, blank=True)
    secao = models.CharField("seção", max_length=10, choices=Secao.choices, default=Secao.RAPIDAS)
    ordem = models.PositiveSmallIntegerField(default=0)
    publicada = models.BooleanField(default=True)

    class Meta:
        ordering = ["ordem", "titulo"]

    def __str__(self):
        return self.titulo


class Guia(ModeloBase):
    class Tom(models.TextChoices):
        ROSA = "rosa", "Rosa"
        TURQUESA = "turquesa", "Turquesa"
        AZUL = "azul", "Azul"

    slug = models.SlugField(unique=True)
    titulo = models.CharField("título", max_length=120)
    resumo = models.CharField(max_length=160, blank=True)
    tom = models.CharField(max_length=10, choices=Tom.choices, default=Tom.ROSA)
    imagem = models.CharField(max_length=30, choices=IMAGENS, blank=True)
    passos = models.TextField(help_text="Um passo por linha.")
    destaque = models.BooleanField(default=False, help_text="Aparece em 'Em destaque' na aba Dicas.")
    ordem = models.PositiveSmallIntegerField(default=0)
    publicada = models.BooleanField(default=True)

    class Meta:
        ordering = ["ordem", "titulo"]

    def __str__(self):
        return self.titulo
