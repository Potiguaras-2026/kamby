from django import forms
from django.contrib import admin, messages
from django.contrib.admin.forms import AdminAuthenticationForm
from django.contrib.auth import authenticate
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import AdminUserCreationForm, UserChangeForm
from django.utils.html import format_html_join

from contas import services
from contas.models import Doadora, Endereco, PerguntaSaude, Triagem, Usuario
from core.erros import ErroDominio


class LoginEquipe(AdminAuthenticationForm):
    """O admin entra por e-mail; o telefone é o login das doadoras no app."""

    username = forms.EmailField(label="E-mail", widget=forms.EmailInput(attrs={"autofocus": True, "autocomplete": "email"}))
    error_messages = {**AdminAuthenticationForm.error_messages, "invalid_login": "E-mail ou senha incorretos, ou a conta não é da equipe."}

    def clean(self):
        email, senha = self.cleaned_data.get("username"), self.cleaned_data.get("password")
        if email and senha:
            self.user_cache = authenticate(self.request, email=email, password=senha)
            if self.user_cache is None:
                raise self.get_invalid_login_error()
            self.confirm_login_allowed(self.user_cache)
        return self.cleaned_data


admin.site.login_form = LoginEquipe


class UsuarioCriacaoForm(AdminUserCreationForm):
    class Meta:
        model = Usuario
        fields = ("telefone", "nome_completo", "email")


class UsuarioAlteracaoForm(UserChangeForm):
    class Meta:
        model = Usuario
        fields = "__all__"


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    add_form = UsuarioCriacaoForm
    form = UsuarioAlteracaoForm
    ordering = ["nome_completo"]
    list_display = ["nome_completo", "telefone", "papel", "banco", "is_staff"]
    list_filter = ["papel", "banco", "is_staff"]
    search_fields = ["nome_completo", "telefone", "email"]
    fieldsets = [
        (None, {"fields": ["telefone", "password"]}),
        ("Dados", {"fields": ["nome_completo", "email", "papel", "banco"]}),
        ("Permissões", {"fields": ["is_active", "is_staff", "is_superuser", "groups"]}),
    ]
    add_fieldsets = [
        # E-mail: é com ele que a equipe entra no admin.
        (None, {"fields": ["telefone", "nome_completo", "email", "password1", "password2"]}),
    ]


class EnderecoInline(admin.StackedInline):
    model = Endereco
    extra = 0
    # Trocar o ativo passa pelo service, que respeita "um ativo por doadora"; aqui só leitura.
    readonly_fields = ["ativo"]


class TriagemInline(admin.TabularInline):
    model = Triagem
    extra = 0
    can_delete = False
    fields = ["criado_em", "resultado", "respostas_legiveis", "avaliada_por", "observacao"]
    readonly_fields = ["criado_em", "resultado", "respostas_legiveis", "avaliada_por"]

    def has_add_permission(self, request, obj=None):
        return False

    @admin.display(description="Respostas")
    def respostas_legiveis(self, obj):
        textos = dict(PerguntaSaude.objects.values_list("codigo", "texto"))
        return format_html_join(
            "",
            "<div>{}: <b>{}</b> {}</div>",
            ((textos.get(c, c), "Sim" if v else "Não", obj.detalhes.get(c, "")) for c, v in obj.respostas.items()),
        )


def avaliar(modeladmin, request, queryset, apta: bool):
    for doadora in queryset:
        triagem = doadora.triagens.first()
        try:
            if triagem is None:
                raise ErroDominio("conflito", "Ainda não respondeu as perguntas.")
            services.avaliar_triagem(triagem, apta=apta, avaliada_por=request.user)
        except ErroDominio as e:
            modeladmin.message_user(request, f"{doadora}: {e.mensagem}", messages.ERROR)


# shortcut: admin sem filtro por banco; usar só com superusuário até o painel web existir.
@admin.register(Doadora)
class DoadoraAdmin(admin.ModelAdmin):
    list_display = ["__str__", "telefone", "banco", "status", "criado_em"]
    fields = ["usuario", "banco", "status", "data_nascimento", "data_parto", "amamentando", "bebe_prematuro", "maternidade", "consentimento_em"]
    list_filter = ["status", "banco"]
    search_fields = ["usuario__nome_completo", "usuario__telefone"]
    readonly_fields = ["status", "consentimento_em"]
    inlines = [EnderecoInline, TriagemInline]
    actions = ["aprovar", "reprovar"]

    @admin.display(description="Telefone")
    def telefone(self, obj):
        return obj.usuario.telefone

    @admin.action(description="Aprovar para doar")
    def aprovar(self, request, queryset):
        avaliar(self, request, queryset, apta=True)

    @admin.action(description="Marcar como inapta")
    def reprovar(self, request, queryset):
        avaliar(self, request, queryset, apta=False)


@admin.register(PerguntaSaude)
class PerguntaSaudeAdmin(admin.ModelAdmin):
    list_display = ["texto", "codigo", "detalhe_se", "ordem", "ativa"]
    list_editable = ["ordem", "ativa"]
