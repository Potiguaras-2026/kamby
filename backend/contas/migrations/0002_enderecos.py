import uuid

import django.db.models.deletion
from django.db import migrations, models

CAMPOS = ["cep", "logradouro", "numero", "complemento", "bairro", "cidade", "uf", "referencia"]


def copiar_endereco(apps, schema_editor):
    Doadora = apps.get_model("contas", "Doadora")
    Endereco = apps.get_model("contas", "Endereco")
    for d in Doadora.objects.all():
        Endereco.objects.create(doadora=d, apelido="Casa", ativo=True, **{c: getattr(d, c) for c in CAMPOS})


class Migration(migrations.Migration):
    dependencies = [("contas", "0001_initial")]

    operations = [
        migrations.CreateModel(
            name="Endereco",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                ("apelido", models.CharField(default="Casa", max_length=40)),
                ("cep", models.CharField(max_length=8)),
                ("logradouro", models.CharField(max_length=150)),
                ("numero", models.CharField(max_length=10)),
                ("complemento", models.CharField(blank=True, max_length=60)),
                ("bairro", models.CharField(max_length=80)),
                ("cidade", models.CharField(max_length=80)),
                ("uf", models.CharField(max_length=2)),
                ("referencia", models.CharField(blank=True, max_length=150)),
                ("ativo", models.BooleanField(default=False)),
                (
                    "doadora",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="enderecos", to="contas.doadora"
                    ),
                ),
            ],
            options={"verbose_name": "endereço", "verbose_name_plural": "endereços", "ordering": ["-ativo", "criado_em"]},
        ),
        migrations.AddConstraint(
            model_name="endereco",
            constraint=models.UniqueConstraint(
                condition=models.Q(("ativo", True)), fields=("doadora",), name="um_endereco_ativo_por_doadora"
            ),
        ),
        migrations.RunPython(copiar_endereco, migrations.RunPython.noop),
        *[migrations.RemoveField("doadora", campo) for campo in [*CAMPOS, "latitude", "longitude"]],
    ]
