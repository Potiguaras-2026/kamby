import re

from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import transaction
from django.utils import timezone

from bancos.models import BancoDeLeite
from contas.models import Doadora, Endereco, PerguntaSaude, Triagem, Usuario
from core.erros import ErroDominio


def so_digitos(valor: str) -> str:
    return re.sub(r"\D", "", valor)


def normalizar_telefone(telefone: str) -> str:
    digitos = so_digitos(telefone)
    if digitos.startswith("55") and len(digitos) > 11:
        digitos = digitos[2:]
    if len(digitos) not in (10, 11):
        raise ErroDominio("validacao", "Confira o telefone.", {"telefone": ["Use DDD e número."]})
    return digitos


@transaction.atomic
def cadastrar_doadora(
    *,
    senha: str,
    telefone: str,
    nome_completo: str,
    banco_id,
    consentimento: bool,
    respostas: dict[str, bool],
    detalhes: dict[str, str] | None = None,
    email: str = "",
    **endereco_e_dados,
) -> Usuario:
    """Conta, dados da mãe, endereço e perguntas de saúde num passo só: nunca fica conta pela metade."""
    if not consentimento:
        raise ErroDominio(
            "validacao", "Precisamos da sua autorização para continuar.", {"consentimento": ["Obrigatório."]}
        )
    telefone = normalizar_telefone(telefone)
    if Usuario.objects.filter(telefone=telefone).exists():
        raise ErroDominio("conflito", "Esse número já tem conta. Entre com sua senha.", {"telefone": ["Já cadastrado."]})
    banco = _banco_ativo(banco_id)

    email = email.strip().lower()
    if email:
        try:
            validate_email(email)
        except ValidationError:
            raise ErroDominio("validacao", "Confira o e-mail.", {"email": ["Use um e-mail como nome@exemplo.com."]})

    usuario = Usuario(telefone=telefone, nome_completo=nome_completo.strip(), email=email)
    try:
        validate_password(senha, usuario)
    except ValidationError as e:
        raise ErroDominio("validacao", "Escolha outra senha.", {"senha": list(e.messages)})
    usuario.set_password(senha)
    usuario.save()

    endereco = {c: endereco_e_dados.pop(c) for c in CAMPOS_ENDERECO if c in endereco_e_dados}
    doadora = Doadora.objects.create(usuario=usuario, banco=banco, consentimento_em=timezone.now(), **endereco_e_dados)
    criar_endereco(doadora, **endereco)
    triagem = enviar_triagem(doadora, respostas, detalhes)
    if settings.KAMBY_DEMO:
        avaliar_triagem(triagem, apta=True, avaliada_por=None, observacao="Aprovada automaticamente no modo demonstração.")
    return usuario


CAMPOS_ENDERECO = ["apelido", "cep", "logradouro", "numero", "complemento", "bairro", "cidade", "uf", "referencia"]


def _limpar_endereco(dados: dict) -> dict:
    dados = {c: str(v).strip() for c, v in dados.items() if c in CAMPOS_ENDERECO}
    dados["cep"] = so_digitos(dados["cep"])
    if len(dados["cep"]) != 8:
        raise ErroDominio("validacao", "Confira o CEP.", {"cep": ["Use os 8 números do CEP."]})
    dados["uf"] = dados["uf"].upper()
    dados["apelido"] = dados.get("apelido") or "Casa"
    return dados


def criar_endereco(doadora: Doadora, **dados) -> Endereco:
    """O primeiro endereço já nasce ativo: a coleta sempre tem para onde ir."""
    primeiro = not doadora.enderecos.exists()
    return Endereco.objects.create(doadora=doadora, ativo=primeiro, **_limpar_endereco(dados))


def editar_endereco(endereco: Endereco, **dados) -> Endereco:
    for campo, valor in _limpar_endereco(dados).items():
        setattr(endereco, campo, valor)
    endereco.save()
    return endereco


@transaction.atomic
def ativar_endereco(endereco: Endereco) -> Endereco:
    # Desativa os outros antes: a restrição do banco permite um só ativo por doadora.
    Endereco.objects.filter(doadora=endereco.doadora, ativo=True).exclude(pk=endereco.pk).update(ativo=False)
    endereco.ativo = True
    endereco.save(update_fields=["ativo", "atualizado_em"])
    return endereco


@transaction.atomic
def excluir_endereco(endereco: Endereco):
    outros = endereco.doadora.enderecos.exclude(pk=endereco.pk)
    if not outros.exists():
        raise ErroDominio("conflito", "Você precisa de pelo menos um endereço para a equipe buscar o leite.")
    era_ativo = endereco.ativo
    endereco.delete()
    if era_ativo:
        ativar_endereco(outros.order_by("criado_em").first())


@transaction.atomic
def enviar_triagem(doadora: Doadora, respostas: dict[str, bool], detalhes: dict[str, str] | None = None) -> Triagem:
    if doadora.status != Doadora.Status.CADASTRADA:
        raise ErroDominio("conflito", "Suas respostas já foram enviadas.")
    codigos = set(PerguntaSaude.objects.filter(ativa=True).values_list("codigo", flat=True))
    if set(respostas) != codigos:
        raise ErroDominio("validacao", "Responda todas as perguntas de saúde.", {"respostas": ["Incompletas."]})
    detalhes = {c: str(t).strip()[:500] for c, t in (detalhes or {}).items() if c in codigos and str(t).strip()}
    triagem = Triagem.objects.create(doadora=doadora, respostas=respostas, detalhes=detalhes)
    doadora.status = Doadora.Status.EM_ANALISE
    doadora.save(update_fields=["status", "atualizado_em"])
    return triagem


@transaction.atomic
def avaliar_triagem(triagem: Triagem, *, apta: bool, avaliada_por: Usuario | None, observacao: str = "") -> Triagem:
    if triagem.resultado != Triagem.Resultado.PENDENTE:
        raise ErroDominio("transicao_invalida", "Essa triagem já foi avaliada.")
    triagem.resultado = Triagem.Resultado.APTA if apta else Triagem.Resultado.INAPTA
    triagem.avaliada_por = avaliada_por
    triagem.observacao = observacao
    triagem.save()
    doadora = triagem.doadora
    doadora.status = Doadora.Status.APTA if apta else Doadora.Status.INAPTA
    doadora.save(update_fields=["status", "atualizado_em"])
    return triagem


def _banco_ativo(banco_id) -> BancoDeLeite:
    banco = BancoDeLeite.objects.filter(id=banco_id, ativo=True).first()
    if banco is None:
        raise ErroDominio("validacao", "Escolha um banco de leite da lista.", {"banco_id": ["Banco inválido."]})
    return banco


@transaction.atomic
def editar_doadora(doadora: Doadora, *, nome_completo: str, banco_id, **dados) -> Doadora:
    """Dados da mãe e do bebê. Coletas já marcadas guardam o banco que tinham."""
    doadora.banco = _banco_ativo(banco_id)
    for campo, valor in dados.items():
        setattr(doadora, campo, valor.strip() if isinstance(valor, str) else valor)
    doadora.save()
    doadora.usuario.nome_completo = nome_completo.strip()
    doadora.usuario.save(update_fields=["nome_completo"])
    return doadora


def excluir_conta(usuario: Usuario, senha: str) -> None:
    """Apaga a conta e tudo da doadora (endereços, respostas de saúde, pedidos e coletas)."""
    if not usuario.check_password(senha):
        raise ErroDominio("validacao", "Senha incorreta.", {"senha": ["Confira a senha."]})
    usuario.delete()
