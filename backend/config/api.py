from django.http import Http404
from ninja import NinjaAPI
from ninja.errors import HttpError, ValidationError
from ninja_jwt.authentication import JWTAuth

from bancos.api import router as bancos_router
from contas.api import router_auth, router_doadora
from conteudo.api import router as conteudo_router
from core.erros import ErroDominio
from doacoes.api import router as doacoes_router

api = NinjaAPI(title="Kamby API", version="1", auth=JWTAuth())

api.add_router("/auth", router_auth)
api.add_router("/bancos", bancos_router)
api.add_router("/conteudo", conteudo_router)
api.add_router("/", router_doadora)
api.add_router("/", doacoes_router)

CODIGO_POR_STATUS = {
    401: ("nao_autenticado", "Sua sessão expirou. Entre de novo."),
    403: ("sem_permissao", "Você não tem acesso a isso."),
    404: ("nao_encontrado", "Não encontramos o que você procurou."),
    429: ("limite_excedido", "Muitas tentativas. Espere um minuto e tente de novo."),
}


def erro(request, status: int, codigo: str, mensagem: str, campos: dict | None = None):
    return api.create_response(
        request, {"codigo": codigo, "mensagem": mensagem, "campos": campos or {}}, status=status
    )


@api.exception_handler(ErroDominio)
def erro_dominio(request, exc: ErroDominio):
    return erro(request, exc.status, exc.codigo, exc.mensagem, exc.campos)


@api.exception_handler(ValidationError)
def erro_validacao(request, exc: ValidationError):
    campos: dict[str, list[str]] = {}
    for e in exc.errors:
        campo = str(e["loc"][-1]) if e.get("loc") else "geral"
        campos.setdefault(campo, []).append(e.get("msg", "Valor inválido."))
    return erro(request, 422, "validacao", "Confira os campos destacados.", campos)


@api.exception_handler(Http404)
def erro_404(request, exc):
    return erro(request, 404, *CODIGO_POR_STATUS[404])


@api.exception_handler(HttpError)
def erro_http(request, exc: HttpError):
    codigo, mensagem = CODIGO_POR_STATUS.get(exc.status_code, ("erro", "Algo deu errado. Tente de novo."))
    return erro(request, exc.status_code, codigo, mensagem)
