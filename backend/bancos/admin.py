from django.contrib import admin

from bancos.models import BancoDeLeite, HorarioColeta, Maternidade


class HorarioColetaInline(admin.TabularInline):
    model = HorarioColeta
    extra = 1
    fields = ["inicio", "fim", "ativo"]


@admin.register(BancoDeLeite)
class BancoDeLeiteAdmin(admin.ModelAdmin):
    list_display = ["nome", "cidade", "telefone", "ativo"]
    list_filter = ["ativo", "cidade"]
    inlines = [HorarioColetaInline]


@admin.register(Maternidade)
class MaternidadeAdmin(admin.ModelAdmin):
    list_display = ["nome", "cidade", "ordem", "ativa"]
    list_editable = ["ordem", "ativa"]
    list_filter = ["ativa", "cidade"]
    search_fields = ["nome"]
