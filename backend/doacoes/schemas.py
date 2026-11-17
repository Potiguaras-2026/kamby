from datetime import date, datetime, time
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
    horario_rotulo: str

    class Meta:
        model = Coleta
        fields = [
            "id", "data", "horario_inicio", "horario_fim", "endereco", "quantidade_frascos", "status", "volume_ml",
            "motivo_cancelamento", "criado_em", "coletada_em", "entregue_banco_em", "processada_em", "ajuste",
        ]

    @staticmethod
    def resolve_status_rotulo(obj):
        return obj.get_status_display()

    @staticmethod
    def resolve_horario_rotulo(obj):
        return obj.horario_rotulo


class ColetaEntrada(Schema):
    data: date
    horario_id: UUID
    quantidade_frascos: int = Field(ge=1, le=20)


class HorarioSaida(Schema):
    id: UUID
    inicio: time
    fim: time
    rotulo: str


class CancelamentoEntrada(Schema):
    motivo: str = Field("", max_length=200)


class ImpactoSaida(Schema):
    volume_total_ml: int
    recem_nascidos_dia: int
    coletas: int


class MesSaida(Schema):
    mes: date
    volume_ml: int


class DoadoraResumo(Schema):
    id: UUID
    nome_completo: str = Field(alias="usuario.nome_completo")
    status: str
    status_rotulo: str

    @staticmethod
    def resolve_status_rotulo(obj):
        return obj.get_status_display()


class EtapaSaida(Schema):
    codigo: str
    rotulo: str
    detalhe: str
    data: datetime | None
    estado: Literal["feita", "atual", "pendente"]


class AvisoSaida(Schema):
    tipo: str
    titulo: str
    corpo: str
    coleta: ColetaSaida


class InicioSaida(Schema):
    jornada: list[EtapaSaida]
    aviso: AvisoSaida | None
    ultima_coleta: ColetaSaida | None
    doadora: DoadoraResumo
    proxima_acao: ProximaAcao
    coleta_ativa: ColetaSaida | None
    kit_aberto: KitSaida | None
    impacto: ImpactoSaida
    historico: list[MesSaida]
    banco: BancoSaida
