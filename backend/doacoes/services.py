from datetime import date, timedelta

from django.db import IntegrityError, transaction
from django.utils import timezone

from contas.models import Doadora
from core.erros import ErroDominio
from doacoes import selectors
from doacoes.models import Coleta, SolicitacaoKit

DIAS_MAX_AGENDAMENTO = 14

TRANSICOES_COLETA = {
    Coleta.Status.AGENDADA: {Coleta.Status.CONFIRMADA, Coleta.Status.CANCELADA},
    Coleta.Status.CONFIRMADA: {Coleta.Status.A_CAMINHO, Coleta.Status.AUSENTE, Coleta.Status.CANCELADA},
    Coleta.Status.A_CAMINHO: {Coleta.Status.COLETADA, Coleta.Status.AUSENTE, Coleta.Status.CANCELADA},
}
TRANSICOES_KIT = {
    SolicitacaoKit.Status.SOLICITADO: {SolicitacaoKit.Status.EM_PREPARO, SolicitacaoKit.Status.CANCELADO},
    SolicitacaoKit.Status.EM_PREPARO: {SolicitacaoKit.Status.ENTREGUE, SolicitacaoKit.Status.CANCELADO},
}


def exigir_apta(doadora: Doadora, acao: str):
    if doadora.status != Doadora.Status.APTA:
        raise ErroDominio("conflito", f"Você poderá {acao} depois que o banco de leite aprovar seu cadastro.")


def dias_disponiveis(hoje: date) -> list[date]:
    """Próximos dias úteis em que a doadora pode agendar."""
    return [
        d for d in (hoje + timedelta(days=n) for n in range(1, DIAS_MAX_AGENDAMENTO + 1)) if d.weekday() < 5
    ]


def pedir_kit(doadora: Doadora, quantidade_frascos: int) -> SolicitacaoKit:
    exigir_apta(doadora, "pedir frascos")
    if selectors.kit_aberto(doadora):
        raise ErroDominio("conflito", "Você já tem um pedido de frascos em andamento.")
    try:
        with transaction.atomic():
            return SolicitacaoKit.objects.create(doadora=doadora, quantidade_frascos=quantidade_frascos)
    except IntegrityError:
        raise ErroDominio("conflito", "Você já tem um pedido de frascos em andamento.")


def agendar_coleta(doadora: Doadora, *, data: date, horario_id, quantidade_frascos: int) -> Coleta:
    exigir_apta(doadora, "agendar coletas")
    if not selectors.tem_kit_entregue(doadora):
        raise ErroDominio("conflito", "Peça seus frascos antes de agendar a coleta.")
    if data not in dias_disponiveis(timezone.localdate()):
        raise ErroDominio(
            "validacao", "Escolha um dia útil nas próximas duas semanas.", {"data": ["Dia indisponível."]}
        )
    horario = selectors.horarios_do_banco(doadora.banco).filter(id=horario_id).first()
    if horario is None:
        raise ErroDominio("validacao", "Escolha um dos horários disponíveis.", {"horario_id": ["Horário indisponível."]})
    endereco = doadora.enderecos.filter(ativo=True).first()
    if endereco is None:
        raise ErroDominio("conflito", "Cadastre um endereço para a equipe buscar o leite.")
    if selectors.coleta_ativa(doadora):
        raise ErroDominio("conflito", "Você já tem uma coleta agendada.")
    try:
        with transaction.atomic():
            return Coleta.objects.create(
                doadora=doadora,
                banco=doadora.banco,
                data=data,
                horario_inicio=horario.inicio,
                horario_fim=horario.fim,
                endereco=endereco.linha + (f" (Ref.: {endereco.referencia})" if endereco.referencia else ""),
                quantidade_frascos=quantidade_frascos,
            )
    except IntegrityError:
        raise ErroDominio("conflito", "Você já tem uma coleta agendada.")


def mudar_status_coleta(coleta: Coleta, novo: str, *, volume_ml: int | None = None, motivo: str = "") -> Coleta:
    if novo not in TRANSICOES_COLETA.get(coleta.status, set()):
        raise ErroDominio("transicao_invalida", "Essa coleta não pode mudar para esse status.")
    if novo == Coleta.Status.COLETADA:
        volume_ml = volume_ml or coleta.volume_ml
        if not volume_ml:
            raise ErroDominio("validacao", "Informe o volume coletado.", {"volume_ml": ["Obrigatório."]})
        coleta.volume_ml = volume_ml
        coleta.coletada_em = timezone.now()
    if novo == Coleta.Status.CANCELADA:
        coleta.motivo_cancelamento = motivo
    coleta.status = novo
    coleta.save()
    return coleta


def registrar_entrega_banco(coleta: Coleta) -> Coleta:
    if coleta.status != Coleta.Status.COLETADA or coleta.entregue_banco_em:
        raise ErroDominio("transicao_invalida", "Só leite coletado e ainda não entregue pode ser marcado como entregue ao banco.")
    coleta.entregue_banco_em = timezone.now()
    coleta.save(update_fields=["entregue_banco_em", "atualizado_em"])
    return coleta


def registrar_processamento(coleta: Coleta) -> Coleta:
    if not coleta.entregue_banco_em or coleta.processada_em:
        raise ErroDominio("transicao_invalida", "Marque a entrega ao banco antes do processamento.")
    coleta.processada_em = timezone.now()
    coleta.save(update_fields=["processada_em", "atualizado_em"])
    return coleta


def marcar_ajuste(coleta: Coleta, ajuste: str) -> Coleta:
    if coleta.status != Coleta.Status.COLETADA:
        raise ErroDominio("transicao_invalida", "O ajuste no frasco vale só para leite já coletado.")
    coleta.ajuste = Coleta.Ajuste(ajuste)
    coleta.save(update_fields=["ajuste", "atualizado_em"])
    return coleta


def cancelar_coleta(coleta: Coleta, motivo: str = "") -> Coleta:
    return mudar_status_coleta(coleta, Coleta.Status.CANCELADA, motivo=motivo)


def mudar_status_kit(kit: SolicitacaoKit, novo: str) -> SolicitacaoKit:
    if novo not in TRANSICOES_KIT.get(kit.status, set()):
        raise ErroDominio("transicao_invalida", "Esse pedido não pode mudar para esse status.")
    kit.status = novo
    kit.save()
    return kit
