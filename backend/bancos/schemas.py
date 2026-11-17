from ninja import ModelSchema

from bancos.models import BancoDeLeite, Maternidade


class BancoSaida(ModelSchema):
    class Meta:
        model = BancoDeLeite
        fields = ["id", "nome", "telefone", "endereco", "cidade"]


class MaternidadeSaida(ModelSchema):
    class Meta:
        model = Maternidade
        fields = ["id", "nome", "cidade"]
