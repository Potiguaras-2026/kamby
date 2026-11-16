from ninja import ModelSchema

from bancos.models import BancoDeLeite


class BancoSaida(ModelSchema):
    class Meta:
        model = BancoDeLeite
        fields = ["id", "nome", "telefone", "endereco", "cidade"]
