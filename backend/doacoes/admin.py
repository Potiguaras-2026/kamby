from django.contrib import admin, messages

from core.erros import ErroDominio
from doacoes import services
from doacoes.models import Coleta, SolicitacaoKit


def aplicar(modeladmin, request, queryset, funcao):
    """Muda status pelo service para respeitar as transições; erros aparecem como mensagem."""
    for obj in queryset:
        try:
            funcao(obj)
        except ErroDominio as e:
            modeladmin.message_user(request, f"{obj}: {e.mensagem}", messages.ERROR)


# shortcut: admin sem filtro por banco; usar só com superusuário até o painel web existir.
@admin.register(Coleta)
class ColetaAdmin(admin.ModelAdmin):
    list_display = ["doadora", "data", "horario_rotulo", "quantidade_frascos", "status", "volume_ml"]
    list_filter = ["status", "data", "banco"]
    list_editable = ["volume_ml"]
    readonly_fields = ["status", "coletada_em", "endereco"]
    actions = ["confirmar", "a_caminho", "coletada", "cancelar"]

    @admin.display(description="Horário")
    def horario_rotulo(self, obj):
        return obj.horario_rotulo

    @admin.action(description="Confirmar")
    def confirmar(self, request, qs):
        aplicar(self, request, qs, lambda c: services.mudar_status_coleta(c, Coleta.Status.CONFIRMADA))

    @admin.action(description="Equipe a caminho")
    def a_caminho(self, request, qs):
        aplicar(self, request, qs, lambda c: services.mudar_status_coleta(c, Coleta.Status.A_CAMINHO))

    @admin.action(description="Marcar como coletada (preencha o volume antes)")
    def coletada(self, request, qs):
        aplicar(self, request, qs, lambda c: services.mudar_status_coleta(c, Coleta.Status.COLETADA))

    @admin.action(description="Cancelar")
    def cancelar(self, request, qs):
        aplicar(self, request, qs, lambda c: services.cancelar_coleta(c, "Cancelada pelo banco de leite."))


@admin.register(SolicitacaoKit)
class SolicitacaoKitAdmin(admin.ModelAdmin):
    list_display = ["doadora", "quantidade_frascos", "status", "criado_em"]
    list_filter = ["status"]
    readonly_fields = ["status"]
    actions = ["em_preparo", "entregue", "cancelar"]

    @admin.action(description="Em preparo")
    def em_preparo(self, request, qs):
        aplicar(self, request, qs, lambda k: services.mudar_status_kit(k, SolicitacaoKit.Status.EM_PREPARO))

    @admin.action(description="Entregue")
    def entregue(self, request, qs):
        aplicar(self, request, qs, lambda k: services.mudar_status_kit(k, SolicitacaoKit.Status.ENTREGUE))

    @admin.action(description="Cancelar")
    def cancelar(self, request, qs):
        aplicar(self, request, qs, lambda k: services.mudar_status_kit(k, SolicitacaoKit.Status.CANCELADO))
