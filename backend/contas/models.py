from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.db.models import Q

from core.models import ModeloBase


class UsuarioManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, telefone, password=None, **extra):
        usuario = self.model(telefone=telefone, **extra)
        usuario.set_password(password)
        usuario.save(using=self._db)
        return usuario

    def create_superuser(self, telefone, password=None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        return self.create_user(telefone, password, **extra)


class Usuario(AbstractUser):
    class Papel(models.TextChoices):
        DOADORA = "doadora", "Doadora"
        EQUIPE_BANCO = "equipe_banco", "Equipe do banco"

    username = None
    first_name = None
    last_name = None
    telefone = models.CharField(max_length=11, unique=True, help_text="Só números, com DDD.")
    nome_completo = models.CharField(max_length=150)
    papel = models.CharField(max_length=20, choices=Papel.choices, default=Papel.DOADORA)
    banco = models.ForeignKey(
        "bancos.BancoDeLeite", null=True, blank=True, on_delete=models.PROTECT, related_name="equipe"
    )

    USERNAME_FIELD = "telefone"
    REQUIRED_FIELDS = ["nome_completo"]
    objects = UsuarioManager()

    class Meta:
        verbose_name = "usuário"

    def __str__(self):
        return self.nome_completo or self.telefone

    def get_full_name(self):
        return self.nome_completo

    def get_short_name(self):
        return self.nome_completo.split(" ")[0]


class Doadora(ModeloBase):
    class Status(models.TextChoices):
        CADASTRADA = "cadastrada", "Cadastrada"
        EM_ANALISE = "em_analise", "Em análise"
        APTA = "apta", "Pronta para doar"
        INAPTA = "inapta", "Doação não indicada agora"
        INATIVA = "inativa", "Inativa"

    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name="doadora")
    banco = models.ForeignKey("bancos.BancoDeLeite", on_delete=models.PROTECT, related_name="doadoras")
    data_nascimento = models.DateField()
    data_parto = models.DateField(help_text="Pode ser futura, se ainda estiver grávida.")
    amamentando = models.BooleanField(null=True)
    bebe_prematuro = models.BooleanField("bebê prematuro", null=True)
    maternidade = models.CharField(max_length=150, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.CADASTRADA)
    consentimento_em = models.DateTimeField()

    class Meta:
        indexes = [models.Index(fields=["banco", "status"])]

    def __str__(self):
        return self.usuario.nome_completo


class Endereco(ModeloBase):
    """Onde a equipe busca o leite. A doadora pode ter vários; a coleta usa o ativo."""

    doadora = models.ForeignKey(Doadora, on_delete=models.CASCADE, related_name="enderecos")
    apelido = models.CharField(max_length=40, default="Casa")
    cep = models.CharField(max_length=8)
    logradouro = models.CharField(max_length=150)
    numero = models.CharField(max_length=10)
    complemento = models.CharField(max_length=60, blank=True)
    bairro = models.CharField(max_length=80)
    cidade = models.CharField(max_length=80)
    uf = models.CharField(max_length=2)
    referencia = models.CharField(max_length=150, blank=True)
    ativo = models.BooleanField(default=False)

    class Meta:
        verbose_name = "endereço"
        verbose_name_plural = "endereços"
        ordering = ["-ativo", "criado_em"]
        constraints = [
            models.UniqueConstraint(fields=["doadora"], condition=Q(ativo=True), name="um_endereco_ativo_por_doadora")
        ]

    def __str__(self):
        return f"{self.apelido}: {self.linha}"

    @property
    def linha(self) -> str:
        complemento = f" - {self.complemento}" if self.complemento else ""
        return f"{self.logradouro}, {self.numero}{complemento}, {self.bairro}, {self.cidade}-{self.uf}"


class Triagem(ModeloBase):
    class Resultado(models.TextChoices):
        PENDENTE = "pendente", "Pendente"
        APTA = "apta", "Apta"
        INAPTA = "inapta", "Inapta"

    doadora = models.ForeignKey(Doadora, on_delete=models.CASCADE, related_name="triagens")
    respostas = models.JSONField()
    detalhes = models.JSONField(default=dict, blank=True, help_text="O que a doadora escreveu em cada pergunta.")
    resultado = models.CharField(max_length=10, choices=Resultado.choices, default=Resultado.PENDENTE)
    avaliada_por = models.ForeignKey(
        Usuario, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    observacao = models.TextField(blank=True, help_text="Visível só para a equipe.")

    class Meta:
        verbose_name_plural = "triagens"
        ordering = ["-criado_em"]


class PerguntaSaude(ModeloBase):
    """Pergunta de saúde do cadastro. A equipe do banco edita no admin; o app mostra as ativas, na ordem."""

    class DetalheSe(models.TextChoices):
        NENHUM = "", "Não pede detalhe"
        SIM = "sim", "Quando responder Sim"
        NAO = "nao", "Quando responder Não"

    codigo = models.SlugField(max_length=40, unique=True, help_text="Identifica a resposta salva. Não mude depois de usar.")
    texto = models.CharField(max_length=150)
    ajuda = models.CharField(max_length=200, blank=True)
    detalhe_se = models.CharField("pedir detalhe", max_length=3, choices=DetalheSe.choices, blank=True)
    detalhe_rotulo = models.CharField("rótulo do detalhe", max_length=120, blank=True)
    ordem = models.PositiveSmallIntegerField(default=0)
    ativa = models.BooleanField(default=True)

    class Meta:
        verbose_name = "pergunta de saúde"
        verbose_name_plural = "perguntas de saúde"
        ordering = ["ordem"]

    def __str__(self):
        return self.texto
