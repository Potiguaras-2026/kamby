from datetime import date, datetime
from uuid import UUID

from ninja import Field, ModelSchema, Schema

from bancos.schemas import BancoSaida
from contas.models import Endereco


class CadastroEntrada(Schema):
    nome_completo: str = Field(min_length=3, max_length=150)
    telefone: str = Field(max_length=20)
    senha: str = Field(max_length=128)
    data_nascimento: date
    data_parto: date
    banco_id: UUID
    cep: str = Field(max_length=9)
    logradouro: str = Field(max_length=150)
    numero: str = Field(max_length=10)
    complemento: str = Field("", max_length=60)
    bairro: str = Field(max_length=80)
    cidade: str = Field(max_length=80)
    uf: str = Field(min_length=2, max_length=2)
    referencia: str = Field("", max_length=150)
    consentimento: bool


class EntrarEntrada(Schema):
    telefone: str = Field(max_length=20)
    senha: str = Field(max_length=128)


class RenovarEntrada(Schema):
    refresh: str


class TokensSaida(Schema):
    access: str
    refresh: str


class AccessSaida(Schema):
    access: str


class EnderecoEntrada(Schema):
    apelido: str = Field("Casa", max_length=40)
    cep: str = Field(max_length=9)
    logradouro: str = Field(min_length=1, max_length=150)
    numero: str = Field(min_length=1, max_length=10)
    complemento: str = Field("", max_length=60)
    bairro: str = Field(min_length=1, max_length=80)
    cidade: str = Field(min_length=1, max_length=80)
    uf: str = Field(min_length=2, max_length=2)
    referencia: str = Field("", max_length=150)


class EnderecoSaida(ModelSchema):
    class Meta:
        model = Endereco
        fields = ["id", "apelido", "cep", "logradouro", "numero", "complemento", "bairro", "cidade", "uf", "referencia", "ativo"]


class DoadoraSaida(Schema):
    id: UUID
    nome_completo: str = Field(alias="usuario.nome_completo")
    telefone: str = Field(alias="usuario.telefone")
    status: str
    status_rotulo: str
    data_parto: date
    endereco_ativo: EnderecoSaida | None
    banco: BancoSaida
    criado_em: datetime

    @staticmethod
    def resolve_status_rotulo(obj):
        return obj.get_status_display()

    @staticmethod
    def resolve_endereco_ativo(obj):
        return obj.enderecos.filter(ativo=True).first()


class PerguntaSaida(Schema):
    codigo: str
    texto: str


class TriagemEntrada(Schema):
    respostas: dict[str, bool]
