from django.contrib import admin

from bancos.models import BancoDeLeite


@admin.register(BancoDeLeite)
class BancoDeLeiteAdmin(admin.ModelAdmin):
    list_display = ["nome", "cidade", "telefone", "ativo"]
    list_filter = ["ativo", "cidade"]
