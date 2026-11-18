from django.contrib.auth.backends import ModelBackend

from contas.models import Usuario


class EmailEquipe(ModelBackend):
    """Login do admin: e-mail e senha, só para a equipe. As doadoras entram no app pelo telefone."""

    def authenticate(self, request, email=None, password=None, **kwargs):
        if not email or not password:
            return None
        equipe = list(Usuario.objects.filter(email__iexact=email.strip(), is_staff=True)[:2])
        # E-mail repetido entre membros da equipe: ninguém entra, em vez de entrar na conta errada.
        if len(equipe) != 1:
            return None
        usuario = equipe[0]
        if usuario.check_password(password) and self.user_can_authenticate(usuario):
            return usuario
        return None
