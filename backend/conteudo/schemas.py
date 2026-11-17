from ninja import ModelSchema, Schema

from conteudo.models import Dica, Guia


class TextoSaida(Schema):
    titulo: str
    corpo: str


def linhas(texto: str) -> list[str]:
    return [l.strip() for l in texto.splitlines() if l.strip()]


class DicaSaida(ModelSchema):
    paragrafos: list[str]

    class Meta:
        model = Dica
        fields = ["slug", "titulo", "resumo", "imagem", "secao"]

    @staticmethod
    def resolve_paragrafos(obj):
        return linhas(obj.paragrafos)


class GuiaSaida(ModelSchema):
    passos: list[str]

    class Meta:
        model = Guia
        fields = ["slug", "titulo", "resumo", "tom", "imagem", "destaque"]

    @staticmethod
    def resolve_passos(obj):
        return linhas(obj.passos)
