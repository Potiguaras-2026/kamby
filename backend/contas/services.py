import re

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from bancos.models import BancoDeLeite
from contas.models import Doadora, Triagem, Usuario
from contas.triagem import CODIGOS
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
def cadastrar_doadora(*, senha: str, telefone: str, nome_completo: str, banco_id, consentimento: bool, **endereco_e_datas) -> Usuario:
    if not consentimento:
        raise ErroDominio(
            "validacao", "Precisamos da sua autorização para continuar.", {"consentimento": ["Obrigatório."]}
        )
    telefone = normalizar_telefone(telefone)
    if Usuario.objects.filter(telefone=telefone).exists():
        raise ErroDominio("conflito", "Esse número já tem conta. Entre com sua senha.", {"telefone": ["Já cadastrado."]})
    banco = BancoDeLeite.objects.filter(id=banco_id, ativo=True).first()
    if banco is None:
        raise ErroDominio("validacao", "Escolha um banco de leite da lista.", {"banco_id": ["Banco inválido."]})

    usuario = Usuario(telefone=telefone, nome_completo=nome_completo.strip())
    try:
        validate_password(senha, usuario)
    except ValidationError as e:
        raise ErroDominio("validacao", "Escolha outra senha.", {"senha": list(e.messages)})
    usuario.set_password(senha)
    usuario.save()

    endereco_e_datas["cep"] = so_digitos(endereco_e_datas["cep"])
    Doadora.objects.create(usuario=usuario, banco=banco, consentimento_em=timezone.now(), **endereco_e_datas)
    return usuario


@transaction.atomic
def enviar_triagem(doadora: Doadora, respostas: dict[str, bool]) -> Triagem:
    if doadora.status != Doadora.Status.CADASTRADA:
        raise ErroDominio("conflito", "Suas respostas já foram enviadas.")
    if set(respostas) != CODIGOS:
        raise ErroDominio("validacao", "Responda todas as perguntas.", {"respostas": ["Incompletas."]})
    triagem = Triagem.objects.create(doadora=doadora, respostas=respostas)
    doadora.status = Doadora.Status.EM_ANALISE
    doadora.save(update_fields=["status", "atualizado_em"])
    return triagem


@transaction.atomic
def avaliar_triagem(triagem: Triagem, *, apta: bool, avaliada_por: Usuario, observacao: str = "") -> Triagem:
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
