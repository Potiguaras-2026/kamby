import type { Schemas } from "@kamby/api";

type ProximaAcao = Schemas["InicioSaida"]["proxima_acao"];

// Mensagem para quando a doadora ainda não pode doar.
// shortcut: triagem sem tela no app; a doadora do seed já está apta.
export const ACOES: Record<ProximaAcao, string> = {
  responder_triagem: "Responda algumas perguntas de saúde para começar. Leva 2 minutos.",
  // Prazo a confirmar com o banco de leite.
  aguardar_analise: "Recebemos suas respostas. O banco de leite responde em até 2 dias úteis.",
  contatar_banco: "Pelas suas respostas, a doação não é indicada agora. Fale com o banco de leite se tiver dúvidas.",
  pedir_kit: "Você já pode doar. Peça o kit e a equipe leva até você.",
  aguardar_kit: "Seu pedido de kit está em andamento.",
  agendar_coleta: "Quando os frascos estiverem cheios, agende a coleta.",
  acompanhar_coleta: "Sua coleta está agendada.",
};

const APTA: ProximaAcao[] = ["pedir_kit", "aguardar_kit", "agendar_coleta", "acompanhar_coleta"];

export const estaApta = (acao: ProximaAcao) => APTA.includes(acao);
