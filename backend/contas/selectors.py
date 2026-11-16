from contas.models import Doadora, Usuario
from core.erros import ErroDominio


def doadora_do_usuario(usuario: Usuario) -> Doadora:
    try:
        return Doadora.objects.select_related("usuario", "banco").get(usuario=usuario)
    except Doadora.DoesNotExist:
        raise ErroDominio("sem_permissao", "Esta área é só para doadoras.")
