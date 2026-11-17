from datetime import date

from django.conf import settings
from django.db.models import Count, Sum
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


# Reserva caso a equipe apague o texto no admin. Os textos editáveis ficam em conteudo.Texto (jornada.<codigo>).
ETAPAS = [
    ("em_analise", "Cadastro em análise", "O banco de leite está lendo suas respostas."),
    ("aprovada", "Cadastro aprovado", "Você já pode doar."),
    ("kit_solicitado", "Kit solicitado", "Frascos de vidro, touca e etiquetas."),
    ("kit_entregue", "Kit entregue", "Os frascos chegaram na sua casa."),
    ("coleta_agendada", "Coleta agendada", "A equipe passa no dia e horário marcados."),
    ("a_caminho", "Equipe a caminho", "Deixe os frascos prontos no congelador."),
    ("coletada", "Leite coletado", "Seu leite está indo para o banco de leite."),
    ("entregue_banco", "Entregue ao banco", "Seu leite chegou ao banco de leite."),
    ("processada", "Processado", "Pasteurizado e pronto para os bebês."),
]

AVISOS = {
    Coleta.Status.AUSENTE: "ausente",
    Coleta.Ajuste.FORA_DO_PADRAO: "ajuste.fora_do_padrao",
    Coleta.Ajuste.QUANTIDADE_INSUFICIENTE: "ajuste.quantidade_insuficiente",
}


def ultima_coleta(doadora: Doadora) -> Coleta | None:
    """A coleta que a jornada acompanha: a ativa ou a mais recente que não foi cancelada."""
    return coletas_da_doadora(doadora).exclude(status=Coleta.Status.CANCELADA).order_by("-criado_em").first()


def jornada(doadora: Doadora, coleta: Coleta | None) -> list[dict]:
    triagem = doadora.triagens.first()
    kit = kits_da_doadora(doadora).exclude(status=SolicitacaoKit.Status.CANCELADO).first()
    entregue = kits_da_doadora(doadora).filter(status=SolicitacaoKit.Status.ENTREGUE).first()
    # Ninguém em casa volta a jornada para o agendamento: a doadora precisa marcar de novo.
    if coleta and coleta.status == Coleta.Status.AUSENTE:
        coleta = None
    passou = coleta is not None and coleta.status in (Coleta.Status.A_CAMINHO, Coleta.Status.COLETADA)
    datas = {
        "em_analise": doadora.criado_em,
        "aprovada": triagem.atualizado_em if triagem and doadora.status == Doadora.Status.APTA else None,
        "kit_solicitado": kit.criado_em if kit else None,
        # shortcut: o kit não guarda a data da entrega; usa a última mudança do pedido.
        "kit_entregue": entregue.atualizado_em if entregue else None,
        "coleta_agendada": coleta.criado_em if coleta else None,
        "a_caminho": None,
        "coletada": coleta.coletada_em if coleta else None,
        "entregue_banco": coleta.entregue_banco_em if coleta else None,
        "processada": coleta.processada_em if coleta else None,
    }
    feitas = {c for c, d in datas.items() if d}
    if passou:
        feitas.add("a_caminho")
    if doadora.status == Doadora.Status.APTA:
        feitas.add("aprovada")
    editaveis = {t.chave: t for t in Texto.objects.filter(chave__startswith="jornada.")}
    etapas, achou_atual = [], False
    for codigo, rotulo, detalhe in ETAPAS:
        texto = editaveis.get(f"jornada.{codigo}")
        estado = "feita" if codigo in feitas else "pendente"
        if estado == "pendente" and not achou_atual:
            estado, achou_atual = "atual", True
        etapas.append({
            "codigo": codigo,
            "rotulo": (texto and texto.titulo) or rotulo,
            "detalhe": (texto and texto.corpo) or detalhe,
            "data": datas[codigo],
            "estado": estado,
        })
    return etapas


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
    ativa, kit = coleta_ativa(doadora), kit_aberto(doadora)
    ultima = ultima_coleta(doadora)
    return {
        "jornada": jornada(doadora, ultima),
        "aviso": aviso(ultima),
        "ultima_coleta": ultima,
        "doadora": doadora,
        "proxima_acao": proxima_acao(doadora, ativa, kit),
        "coleta_ativa": ativa,
        "kit_aberto": kit,
        "impacto": impacto(doadora),
        "historico": historico(doadora, timezone.localdate()),
        "banco": doadora.banco,
        "demo": settings.KAMBY_DEMO,
    }
