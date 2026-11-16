from contas.models import Doadora, Endereco, Usuario
from core.erros import ErroDominio


def doadora_do_usuario(usuario: Usuario) -> Doadora:
    try:
        return Doadora.objects.select_related("usuario", "banco").get(usuario=usuario)
    except Doadora.DoesNotExist:
        raise ErroDominio("sem_permissao", "Esta área é só para doadoras.")


def endereco_da_doadora(doadora: Doadora, endereco_id) -> Endereco:
    endereco = doadora.enderecos.filter(id=endereco_id).first()
    if endereco is None:
        raise ErroDominio("nao_encontrado", "Endereço não encontrado.")
    return endereco
