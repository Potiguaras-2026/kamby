import type { Schemas } from "@kamby/api";

type Acao = { texto: string; botao?: string; rota?: string };

// Uma ação principal por estado. Rotas sem tela ainda: /triagem, /kit, /coleta/agendar, /coleta.
export const ACOES: Record<Schemas["InicioSaida"]["proxima_acao"], Acao> = {
  responder_triagem: {
    texto: "Responda algumas perguntas de saúde para começar. Leva 2 minutos.",
    botao: "Responder perguntas",
    rota: "/triagem",
  },
  // Prazo a confirmar com o banco de leite.
  aguardar_analise: { texto: "Recebemos suas respostas. O banco de leite responde em até 2 dias úteis." },
  contatar_banco: {
    texto: "Pelas suas respostas, a doação não é indicada agora. Fale com o banco de leite se tiver dúvidas.",
  },
  pedir_kit: {
    texto: "Você já pode doar. Peça os frascos esterilizados e a equipe leva até você.",
    botao: "Pedir frascos",
    rota: "/kit",
  },
  aguardar_kit: { texto: "Seu pedido de frascos está em andamento." },
  agendar_coleta: {
    texto: "Quando os frascos estiverem cheios, agende a coleta.",
    botao: "Agendar coleta",
    rota: "/coleta/agendar",
  },
  acompanhar_coleta: { texto: "Sua coleta está agendada.", botao: "Ver minha coleta", rota: "/coleta" },
};
