STATUS_POR_CODIGO = {
    "validacao": 422,
    "nao_autenticado": 401,
    "sem_permissao": 403,
    "nao_encontrado": 404,
    "conflito": 409,
    "transicao_invalida": 409,
}


class ErroDominio(Exception):
    """Erro de negócio. `mensagem` vai direto para a tela, em pt-BR."""

    def __init__(self, codigo: str, mensagem: str, campos: dict[str, list[str]] | None = None):
        super().__init__(mensagem)
        self.codigo = codigo
        self.mensagem = mensagem
        self.campos = campos or {}
        self.status = STATUS_POR_CODIGO[codigo]
