from django.db import models
from django.db.models import F, Q

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


class HorarioColeta(ModeloBase):
    """Faixa de horário em que a equipe busca o leite. Cada banco cadastra as suas no admin."""

    banco = models.ForeignKey(BancoDeLeite, on_delete=models.CASCADE, related_name="horarios")
    inicio = models.TimeField("início")
    fim = models.TimeField()
    ativo = models.BooleanField(default=True, help_text="Desmarque para parar de oferecer este horário.")

    class Meta:
        verbose_name = "horário de coleta"
        verbose_name_plural = "horários de coleta"
        ordering = ["inicio"]
        constraints = [
            models.CheckConstraint(condition=Q(fim__gt=F("inicio")), name="horario_fim_depois_do_inicio"),
            models.UniqueConstraint(fields=["banco", "inicio", "fim"], name="horario_unico_por_banco"),
        ]

    @property
    def rotulo(self) -> str:
        return rotulo_horario(self.inicio, self.fim)

    def __str__(self):
        return self.rotulo


def rotulo_horario(inicio, fim) -> str:
    return f"{inicio:%Hh%M} - {fim:%Hh%M}"
