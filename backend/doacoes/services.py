from datetime import date, timedelta

from django.db import transaction
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


def escolher_dia_e_horario(banco, data: date, horario_id):
    """Mesma regra para entrega de kit e coleta: dia útil nas próximas duas semanas e horário ativo do banco."""
    if data not in dias_disponiveis(timezone.localdate()):
        raise ErroDominio(
            "validacao", "Escolha um dia útil nas próximas duas semanas.", {"data": ["Dia indisponível."]}
        )
    horario = selectors.horarios_do_banco(banco).filter(id=horario_id).first()
    if horario is None:
        raise ErroDominio("validacao", "Escolha um dos horários disponíveis.", {"horario_id": ["Horário indisponível."]})
    return horario


def pedir_kit(doadora: Doadora, quantidade_frascos: int, *, data: date, horario_id) -> SolicitacaoKit:
    exigir_apta(doadora, "pedir frascos")
    horario = escolher_dia_e_horario(doadora.banco, data, horario_id)
    return SolicitacaoKit.objects.create(
        doadora=doadora,
        quantidade_frascos=quantidade_frascos,
        data_entrega=data,
        horario_inicio=horario.inicio,
        horario_fim=horario.fim,
    )


@transaction.atomic
def agendar_coleta(doadora: Doadora, *, data: date, horario_id, quantidade_frascos: int, com_kit: bool = False) -> Coleta:
    """com_kit: a equipe leva um kit novo na mesma visita. Coleta e kit são criados juntos ou nenhum."""
    exigir_apta(doadora, "agendar coletas")
    # Primeira doação: o kit pode ir junto, na mesma visita da coleta. Kit a caminho também vale.
    if not com_kit and not selectors.tem_kit_entregue(doadora) and not selectors.kit_aberto(doadora):
        raise ErroDominio("conflito", "Peça seus frascos antes de agendar a coleta.")
    horario = escolher_dia_e_horario(doadora.banco, data, horario_id)
    endereco = doadora.enderecos.filter(ativo=True).first()
    if endereco is None:
        raise ErroDominio("conflito", "Cadastre um endereço para a equipe buscar o leite.")
    coleta = Coleta.objects.create(
        doadora=doadora,
        banco=doadora.banco,
        data=data,
        horario_inicio=horario.inicio,
        horario_fim=horario.fim,
        endereco=endereco.linha + (f" (Ref.: {endereco.referencia})" if endereco.referencia else ""),
        quantidade_frascos=quantidade_frascos,
    )
    if com_kit:
        # Kit tem no máximo 10 frascos; a coleta aceita até 20.
        pedir_kit(doadora, min(quantidade_frascos, 10), data=data, horario_id=horario_id)
    return coleta


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


def remarcar_coleta(coleta: Coleta, *, data: date, horario_id) -> Coleta:
    """Só antes de a equipe sair. Volta para "agendada": o banco confirma o novo dia."""
    if coleta.status not in (Coleta.Status.AGENDADA, Coleta.Status.CONFIRMADA):
        raise ErroDominio("transicao_invalida", "Esta coleta não pode mais ser remarcada.")
    horario = escolher_dia_e_horario(coleta.banco, data, horario_id)
    coleta.data, coleta.horario_inicio, coleta.horario_fim = data, horario.inicio, horario.fim
    coleta.status = Coleta.Status.AGENDADA
    coleta.save()
    return coleta


def remarcar_kit(kit: SolicitacaoKit, *, data: date, horario_id) -> SolicitacaoKit:
    if kit.status not in SolicitacaoKit.ABERTOS:
        raise ErroDominio("transicao_invalida", "Este pedido não pode mais ser remarcado.")
    horario = escolher_dia_e_horario(kit.doadora.banco, data, horario_id)
    kit.data_entrega, kit.horario_inicio, kit.horario_fim = data, horario.inicio, horario.fim
    kit.save()
    return kit


def cancelar_kit(kit: SolicitacaoKit) -> SolicitacaoKit:
    if kit.status not in SolicitacaoKit.ABERTOS:
        raise ErroDominio("transicao_invalida", "Este pedido não pode mais ser cancelado.")
    return mudar_status_kit(kit, SolicitacaoKit.Status.CANCELADO)


@transaction.atomic
def simular_proxima_etapa(coleta: Coleta) -> Coleta:
    """Modo demonstração: faz o papel da equipe do banco e avança a coleta uma etapa."""
    if coleta.status == Coleta.Status.AGENDADA:
        mudar_status_coleta(coleta, Coleta.Status.CONFIRMADA)
    if coleta.status == Coleta.Status.CONFIRMADA:
        return mudar_status_coleta(coleta, Coleta.Status.A_CAMINHO)
    if coleta.status == Coleta.Status.A_CAMINHO:
        # A equipe entrega os kits pedidos na mesma visita.
        for kit in selectors.kits_da_doadora(coleta.doadora).filter(status__in=SolicitacaoKit.ABERTOS):
            if kit.status == SolicitacaoKit.Status.SOLICITADO:
                mudar_status_kit(kit, SolicitacaoKit.Status.EM_PREPARO)
            mudar_status_kit(kit, SolicitacaoKit.Status.ENTREGUE)
        return mudar_status_coleta(coleta, Coleta.Status.COLETADA, volume_ml=coleta.quantidade_frascos * 180)
    if coleta.status == Coleta.Status.COLETADA and not coleta.entregue_banco_em:
        return registrar_entrega_banco(coleta)
    raise ErroDominio("conflito", "Não há próxima etapa para simular nesta coleta.")
