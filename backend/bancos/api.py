from ninja import Router

from bancos.models import BancoDeLeite, Maternidade
from bancos.schemas import BancoSaida, MaternidadeSaida

router = Router(tags=["bancos"])


@router.get("", response=list[BancoSaida], auth=None)
def listar_bancos(request):
    return BancoDeLeite.objects.filter(ativo=True)


@router.get("/maternidades", response=list[MaternidadeSaida], auth=None)
def listar_maternidades(request):
    return Maternidade.objects.filter(ativa=True)
