from datetime import date
from uuid import UUID

from django.utils import timezone
from ninja import Router
from ninja.pagination import PageNumberPagination, paginate

from contas.selectors import doadora_do_usuario
from doacoes import selectors, services
from doacoes.schemas import CancelamentoEntrada, ColetaEntrada, ColetaSaida, InicioSaida, KitEntrada, KitSaida

router = Router(tags=["doacoes"])


@router.get("/inicio", response=InicioSaida)
def inicio(request):
    return selectors.inicio(doadora_do_usuario(request.auth))


@router.get("/kits", response=list[KitSaida])
@paginate(PageNumberPagination)
def listar_kits(request):
    return selectors.kits_da_doadora(doadora_do_usuario(request.auth))


@router.post("/kits", response={201: KitSaida})
def pedir_kit(request, dados: KitEntrada):
    return 201, services.pedir_kit(doadora_do_usuario(request.auth), dados.quantidade_frascos)


@router.get("/coletas/dias-disponiveis", response=list[date])
def dias_disponiveis(request):
    return services.dias_disponiveis(timezone.localdate())


@router.get("/coletas", response=list[ColetaSaida])
@paginate(PageNumberPagination)
def listar_coletas(request):
    return selectors.coletas_da_doadora(doadora_do_usuario(request.auth))


@router.post("/coletas", response={201: ColetaSaida})
def agendar_coleta(request, dados: ColetaEntrada):
    return 201, services.agendar_coleta(doadora_do_usuario(request.auth), **dados.dict())


@router.get("/coletas/{coleta_id}", response=ColetaSaida)
def detalhar_coleta(request, coleta_id: UUID):
    return selectors.coleta_da_doadora(doadora_do_usuario(request.auth), coleta_id)


@router.post("/coletas/{coleta_id}/cancelar", response=ColetaSaida)
def cancelar_coleta(request, coleta_id: UUID, dados: CancelamentoEntrada):
    coleta = selectors.coleta_da_doadora(doadora_do_usuario(request.auth), coleta_id)
    return services.cancelar_coleta(coleta, dados.motivo)
