from django.contrib import admin

from conteudo.models import Dica, Guia, Texto


@admin.register(Texto)
class TextoAdmin(admin.ModelAdmin):
    list_display = ["chave", "titulo", "atualizado_em"]
    search_fields = ["chave", "titulo", "corpo"]


@admin.register(Dica)
class DicaAdmin(admin.ModelAdmin):
    list_display = ["titulo", "secao", "ordem", "publicada"]
    list_filter = ["secao", "publicada"]
    list_editable = ["ordem", "publicada"]
    prepopulated_fields = {"slug": ["titulo"]}


@admin.register(Guia)
class GuiaAdmin(admin.ModelAdmin):
    list_display = ["titulo", "tom", "destaque", "ordem", "publicada"]
    list_editable = ["ordem", "publicada"]
    prepopulated_fields = {"slug": ["titulo"]}
