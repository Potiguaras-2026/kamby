from datetime import date
from typing import Literal
from uuid import UUID

from ninja import Field, ModelSchema, Schema

from bancos.schemas import BancoSaida
from doacoes.models import Coleta, SolicitacaoKit

ProximaAcao = Literal[
    "responder_triagem",
    "aguardar_analise",
    "contatar_banco",
    "pedir_kit",
    "aguardar_kit",
    "agendar_coleta",
    "acompanhar_coleta",
]


class KitSaida(ModelSchema):
    status_rotulo: str

    class Meta:
        model = SolicitacaoKit
        fields = ["id", "quantidade_frascos", "status", "criado_em"]

    @staticmethod
    def resolve_status_rotulo(obj):
        return obj.get_status_display()


class KitEntrada(Schema):
    quantidade_frascos: int = Field(ge=1, le=10)


class ColetaSaida(ModelSchema):
    status_rotulo: str
    janela_rotulo: str

    class Meta:
        model = Coleta
        fields = ["id", "data", "janela", "quantidade_frascos", "status", "volume_ml", "motivo_cancelamento", "criado_em"]

    @staticmethod
    def resolve_status_rotulo(obj):
        return obj.get_status_display()

    @staticmethod
    def resolve_janela_rotulo(obj):
        return obj.get_janela_display()


class ColetaEntrada(Schema):
    data: date
    janela: Literal["manha", "tarde"]
    quantidade_frascos: int = Field(ge=1, le=20)


class CancelamentoEntrada(Schema):
    motivo: str = Field("", max_length=200)


class ImpactoSaida(Schema):
    volume_total_ml: int
    recem_nascidos_dia: int
    coletas: int


class DoadoraResumo(Schema):
    id: UUID
    nome_completo: str = Field(alias="usuario.nome_completo")
    status: str
    status_rotulo: str

    @staticmethod
    def resolve_status_rotulo(obj):
        return obj.get_status_display()


class InicioSaida(Schema):
    doadora: DoadoraResumo
    proxima_acao: ProximaAcao
    coleta_ativa: ColetaSaida | None
    kit_aberto: KitSaida | None
    impacto: ImpactoSaida
    banco: BancoSaida
