from django.shortcuts import get_object_or_404
from ninja import Router

from conteudo.models import Dica, Guia, Texto
from conteudo.schemas import DicaSaida, GuiaSaida, TextoSaida

# Público: o conteúdo aparece antes do login (cadastro) e não tem dado pessoal.
router = Router(tags=["conteudo"], auth=None)


@router.get("/textos", response=dict[str, TextoSaida])
def textos(request):
    return {t.chave: t for t in Texto.objects.all()}


@router.get("/dicas", response=list[DicaSaida])
def dicas(request):
    return Dica.objects.filter(publicada=True)


@router.get("/dicas/{slug}", response=DicaSaida)
def dica(request, slug: str):
    return get_object_or_404(Dica, slug=slug, publicada=True)


@router.get("/guias", response=list[GuiaSaida])
def guias(request):
    return Guia.objects.filter(publicada=True)


@router.get("/guias/{slug}", response=GuiaSaida)
def guia(request, slug: str):
    return get_object_or_404(Guia, slug=slug, publicada=True)
