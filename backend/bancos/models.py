from django.db import models

from core.models import ModeloBase


class BancoDeLeite(ModeloBase):
    nome = models.CharField(max_length=150)
    telefone = models.CharField(max_length=15)
    endereco = models.CharField(max_length=200)
    cidade = models.CharField(max_length=80)
    ativo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "banco de leite"
        verbose_name_plural = "bancos de leite"
        ordering = ["nome"]

    def __str__(self):
        return self.nome
