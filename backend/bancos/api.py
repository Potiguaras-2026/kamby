from ninja import Router

from bancos.models import BancoDeLeite
from bancos.schemas import BancoSaida

router = Router(tags=["bancos"])


@router.get("", response=list[BancoSaida], auth=None)
def listar_bancos(request):
    return BancoDeLeite.objects.filter(ativo=True)
