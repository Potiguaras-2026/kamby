from django.contrib.auth import authenticate
from ninja import Router
from ninja.throttling import AnonRateThrottle
from ninja_jwt.exceptions import TokenError
from ninja_jwt.tokens import RefreshToken

from contas import services
from contas.schemas import (
    AccessSaida,
    CadastroEntrada,
    DoadoraSaida,
    EntrarEntrada,
    PerguntaSaida,
    RenovarEntrada,
    TokensSaida,
    TriagemEntrada,
)
from contas.selectors import doadora_do_usuario
from contas.triagem import PERGUNTAS
from core.erros import ErroDominio

router_auth = Router(tags=["auth"], auth=None, throttle=AnonRateThrottle("10/m"))
router_doadora = Router(tags=["doadora"])


def tokens(usuario) -> dict:
    refresh = RefreshToken.for_user(usuario)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


@router_auth.post("/cadastro", response={201: TokensSaida})
def cadastro(request, dados: CadastroEntrada):
    usuario = services.cadastrar_doadora(**dados.dict())
    return 201, tokens(usuario)


@router_auth.post("/entrar", response=TokensSaida)
def entrar(request, dados: EntrarEntrada):
    telefone = services.so_digitos(dados.telefone)
    usuario = authenticate(request, telefone=telefone, password=dados.senha)
    if usuario is None:
        raise ErroDominio("nao_autenticado", "Telefone ou senha incorretos.")
    return tokens(usuario)


@router_auth.post("/renovar", response=AccessSaida)
def renovar(request, dados: RenovarEntrada):
    try:
        return {"access": str(RefreshToken(dados.refresh).access_token)}
    except TokenError:
        raise ErroDominio("nao_autenticado", "Sua sessão expirou. Entre de novo.")


@router_doadora.get("/eu", response=DoadoraSaida)
def eu(request):
    return doadora_do_usuario(request.auth)


@router_doadora.get("/triagem/perguntas", response=list[PerguntaSaida])
def perguntas(request):
    return PERGUNTAS


@router_doadora.post("/triagem", response={201: None})
def responder_triagem(request, dados: TriagemEntrada):
    services.enviar_triagem(doadora_do_usuario(request.auth), dados.respostas)
    return 201, None
