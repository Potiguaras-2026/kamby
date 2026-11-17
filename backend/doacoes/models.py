from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Q

from bancos.models import rotulo_horario
from core.models import ModeloBase


class SolicitacaoKit(ModeloBase):
    class Status(models.TextChoices):
        SOLICITADO = "solicitado", "Pedido recebido"
        EM_PREPARO = "em_preparo", "Frascos em preparo"
        ENTREGUE = "entregue", "Frascos entregues"
        CANCELADO = "cancelado", "Cancelado"

    ABERTOS = [Status.SOLICITADO, Status.EM_PREPARO]

    doadora = models.ForeignKey("contas.Doadora", on_delete=models.CASCADE, related_name="kits")
    quantidade_frascos = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(10)])
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SOLICITADO)

    class Meta:
        verbose_name = "solicitação de kit"
        verbose_name_plural = "solicitações de kit"
        ordering = ["-criado_em"]
        constraints = [
            models.UniqueConstraint(fields=["doadora"], condition=Q(status__in=["solicitado", "em_preparo"]), name="um_kit_aberto_por_doadora")
        ]


class Coleta(ModeloBase):
    class Status(models.TextChoices):
        AGENDADA = "agendada", "Agendada"
        CONFIRMADA = "confirmada", "Confirmada pelo banco"
        A_CAMINHO = "a_caminho", "Equipe a caminho"
        COLETADA = "coletada", "Coletada"
        AUSENTE = "ausente", "Ninguém em casa"
        CANCELADA = "cancelada", "Cancelada"

    class Ajuste(models.TextChoices):
        FORA_DO_PADRAO = "fora_do_padrao", "Frasco fora do padrão"
        QUANTIDADE_INSUFICIENTE = "quantidade_insuficiente", "Quantidade insuficiente"

    ATIVAS = [Status.AGENDADA, Status.CONFIRMADA, Status.A_CAMINHO]

    doadora = models.ForeignKey("contas.Doadora", on_delete=models.CASCADE, related_name="coletas")
    # Cópia do banco da doadora no agendamento: a coleta continua no banco que a aceitou.
    banco = models.ForeignKey("bancos.BancoDeLeite", on_delete=models.PROTECT, related_name="coletas")
    data = models.DateField()
    # Cópia do horário escolhido: a coleta não muda se o banco editar ou desativar o horário depois.
    horario_inicio = models.TimeField("início do horário")
    horario_fim = models.TimeField("fim do horário")
    # Cópia em texto: trocar ou excluir o endereço depois não muda onde a equipe vai.
    endereco = models.TextField("endereço da coleta", blank=True, default="")
    quantidade_frascos = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(20)])
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AGENDADA)
    volume_ml = models.PositiveIntegerField(null=True, blank=True)
    motivo_cancelamento = models.CharField(max_length=200, blank=True)
    coletada_em = models.DateTimeField(null=True, blank=True)
    entregue_banco_em = models.DateTimeField("entregue ao banco em", null=True, blank=True)
    processada_em = models.DateTimeField("processada em", null=True, blank=True, help_text="Pasteurização e controle de qualidade.")
    ajuste = models.CharField(
        max_length=30, choices=Ajuste.choices, blank=True, help_text="Problema com o leite coletado, mostrado à doadora com orientação."
    )

    class Meta:
        ordering = ["-criado_em"]
        constraints = [
            models.UniqueConstraint(fields=["doadora"], condition=Q(status__in=["agendada", "confirmada", "a_caminho"]), name="uma_coleta_ativa_por_doadora")
        ]
        indexes = [
            models.Index(fields=["banco", "data", "status"]),
            models.Index(fields=["doadora", "-criado_em"]),
        ]

    def __str__(self):
        return f"{self.doadora} em {self.data:%d/%m} ({self.horario_rotulo})"

    @property
    def horario_rotulo(self) -> str:
        return rotulo_horario(self.horario_inicio, self.horario_fim)
