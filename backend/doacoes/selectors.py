from datetime import date

from django.conf import settings
from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone

from bancos.models import BancoDeLeite, HorarioColeta
from contas.models import Doadora
from conteudo.models import Texto
from core.erros import ErroDominio
from doacoes.models import Coleta, SolicitacaoKit

# Referência de campanha: 1 litro alimenta até 10 recém-nascidos por dia. Confirmar a fonte com o banco de leite.
ML_POR_RECEM_NASCIDO_DIA = 100


def horarios_do_banco(banco: BancoDeLeite):
    return HorarioColeta.objects.filter(banco=banco, ativo=True)


def coletas_da_doadora(doadora: Doadora):
    return Coleta.objects.filter(doadora=doadora).select_related("banco")


def coleta_da_doadora(doadora: Doadora, coleta_id) -> Coleta:
    coleta = coletas_da_doadora(doadora).filter(id=coleta_id).first()
    if coleta is None:
        raise ErroDominio("nao_encontrado", "Coleta não encontrada.")
    return coleta


def coletas_andamento(doadora: Doadora):
    """Pedidos que a doadora acompanha: do agendamento até o leite chegar ao banco."""
    return (
        coletas_da_doadora(doadora)
        .filter(
            Q(status__in=Coleta.ATIVAS)
            | Q(status=Coleta.Status.COLETADA, entregue_banco_em__isnull=True, ajuste="")
        )
        .order_by("data", "horario_inicio")
    )


def kits_da_doadora(doadora: Doadora):
    return SolicitacaoKit.objects.filter(doadora=doadora)


def kit_aberto(doadora: Doadora) -> SolicitacaoKit | None:
    return kits_da_doadora(doadora).filter(status__in=SolicitacaoKit.ABERTOS).first()


def tem_kit_entregue(doadora: Doadora) -> bool:
    # shortcut: um kit entregue libera coletas para sempre; rever quando o banco definir a reposição de frascos.
    return kits_da_doadora(doadora).filter(status=SolicitacaoKit.Status.ENTREGUE).exists()


def impacto(doadora: Doadora) -> dict:
    total = coletas_da_doadora(doadora).filter(status=Coleta.Status.COLETADA).aggregate(
        volume=Sum("volume_ml"), coletas=Count("id")
    )
    volume = total["volume"] or 0
    return {
        "volume_total_ml": volume,
        "recem_nascidos_dia": volume // ML_POR_RECEM_NASCIDO_DIA,
        "coletas": total["coletas"],
    }


def historico(doadora: Doadora, hoje: date, meses: int = 6) -> list[dict]:
    """Volume coletado por mês, do mais antigo ao atual, com zero nos meses sem coleta."""
    indices = [hoje.year * 12 + hoje.month - 1 - i for i in reversed(range(meses))]
    primeiros = [date(i // 12, i % 12 + 1, 1) for i in indices]
    volumes = dict(
        coletas_da_doadora(doadora)
        .filter(status=Coleta.Status.COLETADA, data__gte=primeiros[0])
        .annotate(mes=TruncMonth("data"))
        .values("mes")
        .annotate(volume=Sum("volume_ml"))
        .values_list("mes", "volume")
    )
    return [{"mes": mes, "volume_ml": volumes.get(mes) or 0} for mes in primeiros]


def proxima_acao(doadora: Doadora, kit: SolicitacaoKit | None) -> str:
    """Única ação principal da tela Início."""
    status = Doadora.Status
    if doadora.status == status.CADASTRADA:
        return "responder_triagem"
    if doadora.status == status.EM_ANALISE:
        return "aguardar_analise"
    if doadora.status != status.APTA:
        return "contatar_banco"
    if kit:
        return "aguardar_kit"
    if not tem_kit_entregue(doadora):
        return "pedir_kit"
    return "agendar_coleta"


ETAPAS = [
    ("pedido_feito", "Pedido feito", "A equipe passa no dia e horário marcados."),
    ("rota_iniciada", "Rota iniciada", "A equipe está a caminho. Deixe os frascos prontos no congelador."),
    ("entregue", "Entregue", "A equipe está levando seu leite ao banco de leite."),
    ("entregue_banco", "Entregue ao banco", "Seu leite chegou ao banco de leite."),
]


AVISOS = {
    Coleta.Status.AUSENTE: "ausente",
    Coleta.Ajuste.FORA_DO_PADRAO: "ajuste.fora_do_padrao",
    Coleta.Ajuste.QUANTIDADE_INSUFICIENTE: "ajuste.quantidade_insuficiente",
}


def ultima_coleta(doadora: Doadora) -> Coleta | None:
    return coletas_da_doadora(doadora).exclude(status=Coleta.Status.CANCELADA).order_by("-criado_em").first()


def etapas(coleta: Coleta) -> list[dict]:
    """Status da coleta em 4 etapas. A atual é a última que aconteceu; com todas feitas, não há atual."""
    rota = coleta.status in (Coleta.Status.A_CAMINHO, Coleta.Status.COLETADA)
    datas = {
        "pedido_feito": coleta.criado_em,
        "rota_iniciada": None,
        "entregue": coleta.coletada_em,
        "entregue_banco": coleta.entregue_banco_em,
    }
    lista = [
        {
            "codigo": codigo,
            "rotulo": rotulo,
            "detalhe": detalhe,
            "data": datas[codigo],
            "estado": "feita" if datas[codigo] or (codigo == "rota_iniciada" and rota) else "pendente",
        }
        for codigo, rotulo, detalhe in ETAPAS
    ]
    feitas = [e for e in lista if e["estado"] == "feita"]
    if feitas and len(feitas) < len(lista):
        feitas[-1]["estado"] = "atual"
    return lista


def aviso(coleta: Coleta | None) -> dict | None:
    """Exceção da última coleta que a doadora precisa ver. Some quando ela agenda outra."""
    if coleta is None:
        return None
    tipo = AVISOS.get(coleta.status) or AVISOS.get(coleta.ajuste)
    if not tipo:
        return None
    texto = Texto.objects.filter(chave=f"aviso.{tipo}").first()
    return {"tipo": tipo, "titulo": texto.titulo if texto else "", "corpo": texto.corpo if texto else "", "coleta": coleta}


def inicio(doadora: Doadora) -> dict:
    kit = kit_aberto(doadora)
    return {
        "coletas_andamento": list(coletas_andamento(doadora)),
        "aviso": aviso(ultima_coleta(doadora)),
        "doadora": doadora,
        "proxima_acao": proxima_acao(doadora, kit),
        "kit_aberto": kit,
        "impacto": impacto(doadora),
        "historico": historico(doadora, timezone.localdate()),
        "banco": doadora.banco,
        "demo": settings.KAMBY_DEMO,
    }
