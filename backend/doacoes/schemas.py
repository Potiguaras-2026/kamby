from datetime import date, datetime, time
from typing import Literal
from uuid import UUID

from ninja import Field, ModelSchema, Schema

from bancos.schemas import BancoSaida
from doacoes import selectors
from doacoes.models import Coleta, SolicitacaoKit

ProximaAcao = Literal[
    "responder_triagem",
    "aguardar_analise",
    "contatar_banco",
    "pedir_kit",
    "aguardar_kit",
    "agendar_coleta",
]


class KitSaida(ModelSchema):
    status_rotulo: str
    horario_rotulo: str

    class Meta:
        model = SolicitacaoKit
        fields = ["id", "quantidade_frascos", "status", "criado_em", "data_entrega"]

    @staticmethod
    def resolve_status_rotulo(obj):
        return obj.get_status_display()

    @staticmethod
    def resolve_horario_rotulo(obj):
        return obj.horario_rotulo


class KitEntrada(Schema):
    quantidade_frascos: int = Field(ge=1, le=10)
    data: date
    horario_id: UUID


class EtapaSaida(Schema):
    codigo: str
    rotulo: str
    detalhe: str
    data: datetime | None
    estado: Literal["feita", "atual", "pendente"]


class ColetaSaida(ModelSchema):
    status_rotulo: str
    horario_rotulo: str
    banco_nome: str = Field(alias="banco.nome")
    etapas: list[EtapaSaida]

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

    @staticmethod
    def resolve_etapas(obj):
        return selectors.etapas(obj)


class ColetaEntrada(Schema):
    data: date
    horario_id: UUID
    quantidade_frascos: int = Field(ge=1, le=20)
    # Pede um kit novo para a equipe entregar na mesma visita.
    com_kit: bool = False


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


class AvisoSaida(Schema):
    tipo: str
    titulo: str
    corpo: str
    coleta: ColetaSaida


class InicioSaida(Schema):
    coletas_andamento: list[ColetaSaida]
    aviso: AvisoSaida | None
    doadora: DoadoraResumo
    proxima_acao: ProximaAcao
    kit_aberto: KitSaida | None
    impacto: ImpactoSaida
    historico: list[MesSaida]
    banco: BancoSaida
    demo: bool
