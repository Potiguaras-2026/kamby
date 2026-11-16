from datetime import date

from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone

from bancos.models import BancoDeLeite, HorarioColeta
from contas.models import Doadora
from core.erros import ErroDominio
from doacoes.models import Coleta, SolicitacaoKit

# Referência de campanha: 1 litro alimenta até 10 recém-nascidos por dia. Confirmar a fonte com o banco de leite.
ML_POR_RECEM_NASCIDO_DIA = 100


def horarios_do_banco(banco: BancoDeLeite):
    return HorarioColeta.objects.filter(banco=banco, ativo=True)


def coletas_da_doadora(doadora: Doadora):
    return Coleta.objects.filter(doadora=doadora)


def coleta_da_doadora(doadora: Doadora, coleta_id) -> Coleta:
    coleta = coletas_da_doadora(doadora).filter(id=coleta_id).first()
    if coleta is None:
        raise ErroDominio("nao_encontrado", "Coleta não encontrada.")
    return coleta


def coleta_ativa(doadora: Doadora) -> Coleta | None:
    return coletas_da_doadora(doadora).filter(status__in=Coleta.ATIVAS).first()


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


def proxima_acao(doadora: Doadora, ativa: Coleta | None, kit: SolicitacaoKit | None) -> str:
    """Única ação principal da tela Início."""
    status = Doadora.Status
    if doadora.status == status.CADASTRADA:
        return "responder_triagem"
    if doadora.status == status.EM_ANALISE:
        return "aguardar_analise"
    if doadora.status != status.APTA:
        return "contatar_banco"
    if ativa:
        return "acompanhar_coleta"
    if kit:
        return "aguardar_kit"
    if not tem_kit_entregue(doadora):
        return "pedir_kit"
    return "agendar_coleta"


def inicio(doadora: Doadora) -> dict:
    ativa, kit = coleta_ativa(doadora), kit_aberto(doadora)
    return {
        "doadora": doadora,
        "proxima_acao": proxima_acao(doadora, ativa, kit),
        "coleta_ativa": ativa,
        "kit_aberto": kit,
        "impacto": impacto(doadora),
        "historico": historico(doadora, timezone.localdate()),
        "banco": doadora.banco,
    }
