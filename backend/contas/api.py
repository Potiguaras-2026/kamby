from uuid import UUID

from django.contrib.auth import authenticate
from ninja import Router
from ninja.throttling import AnonRateThrottle
from ninja_jwt.exceptions import TokenError
from ninja_jwt.tokens import RefreshToken

from contas import services
from contas.schemas import (
    EnderecoEntrada,
    EnderecoSaida,
    AccessSaida,
    CadastroEntrada,
    DoadoraSaida,
    EntrarEntrada,
    PerguntaSaida,
    RenovarEntrada,
    TokensSaida,
    TriagemEntrada,
)
from contas.selectors import doadora_do_usuario, endereco_da_doadora
from contas.models import PerguntaSaude
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


# Pública: o cadastro mostra as perguntas antes de existir conta.
@router_doadora.get("/triagem/perguntas", response=list[PerguntaSaida], auth=None)
def perguntas(request):
    return PerguntaSaude.objects.filter(ativa=True)


@router_doadora.post("/triagem", response={201: None})
def responder_triagem(request, dados: TriagemEntrada):
    services.enviar_triagem(doadora_do_usuario(request.auth), dados.respostas, dados.detalhes)
    return 201, None


@router_doadora.get("/enderecos", response=list[EnderecoSaida])
def listar_enderecos(request):
    return doadora_do_usuario(request.auth).enderecos.all()


@router_doadora.post("/enderecos", response={201: EnderecoSaida})
def criar_endereco(request, dados: EnderecoEntrada):
    return 201, services.criar_endereco(doadora_do_usuario(request.auth), **dados.dict())


@router_doadora.put("/enderecos/{endereco_id}", response=EnderecoSaida)
def editar_endereco(request, endereco_id: UUID, dados: EnderecoEntrada):
    endereco = endereco_da_doadora(doadora_do_usuario(request.auth), endereco_id)
    return services.editar_endereco(endereco, **dados.dict())


@router_doadora.post("/enderecos/{endereco_id}/ativar", response=EnderecoSaida)
def ativar_endereco(request, endereco_id: UUID):
    return services.ativar_endereco(endereco_da_doadora(doadora_do_usuario(request.auth), endereco_id))


@router_doadora.delete("/enderecos/{endereco_id}", response={204: None})
def excluir_endereco(request, endereco_id: UUID):
    services.excluir_endereco(endereco_da_doadora(doadora_do_usuario(request.auth), endereco_id))
    return 204, None
