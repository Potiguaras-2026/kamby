# Changelog

Formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Datas em AAAA-MM-DD.

## [Não lançado]

### Alterado
- "(opcional)" entre parênteses nos campos, saudação da Início em Poppins e logo do topo leva para a Início.

### Adicionado
- Pedido de kit com dia e horário da entrega; ao agendar a coleta, dá para pedir um kit novo para o mesmo dia.
- Perfil mostra os dados do cadastro (mãe, bebê e endereço); dicas com a gotinha como personagem; "Doar leite" abre a tela de doação com o primeiro kit indo junto na coleta; a simulação só aparece depois.
- Modo demonstração (`KAMBY_DEMO=1`): cadastro aprovado na hora e botão para simular cada etapa da doação no app.
- Cadastro em 4 etapas: perguntas de saúde numa tela só, maternidades de Natal com busca, dicas animadas e avanço sempre pelo botão.
- Campos de formulário novos em todo o app (rótulo, exemplo, ajuda, erro e CEP conferido), contato com o banco pelo WhatsApp, "em análise" com etapas e Sobre com a equipe Potiguaras e ícones das redes.
- Jornada da doação: linha do tempo com 9 etapas, cartão "Minha doação" na Início, entrega ao banco e processamento no admin, avisos de "ninguém em casa" e "ajuste no frasco", resumo após pedir kit e doadoras de demonstração em cada etapa.
- Cadastro da doadora no app em 6 etapas: conta, mãe e bebê, perguntas de saúde uma por tela, endereço com busca de CEP, consentimento e confirmação.
- Textos, dicas, guias e perguntas de saúde editáveis no admin. O app lê tudo da API.
- API da doadora: cadastro, login, perguntas de saúde, pedido de frascos, agendamento e cancelamento de coleta, tela Início com próxima ação e impacto.
- Admin para a equipe do banco: aprovar doadoras, mudar status de frascos e coletas, registrar volume coletado.
- App mobile: login e tela Início ligados à API.
- App mobile no visual do Figma: marca, splash, abas, Início com histórico de doações, agendar coleta, acompanhar e cancelar coleta, solicitar kit, perfil, endereço, bancos de leite, dicas, guias e Por trás do Kamby.
- Acabamento do app: animações de entrada e toque, vibração leve, gráfico tocável, celebração ao agendar, confirmações em folha e carregamento em esqueleto.
- Ilustrações e fotos do protótipo no app (mãe com bebê, itens do kit, dicas com página própria) e visual mais próximo do Figma.
- App da doadora abre no navegador do computador (`npm run mobile:web`), em coluna com largura de celular.
- Horários de coleta por banco de leite, cadastrados no admin. Ao agendar, a doadora escolhe a data no calendário e o horário num select, como no protótipo (substitui manhã/tarde).
- Vários endereços por doadora: adicionar, editar, excluir e escolher o ativo. A coleta guarda o endereço do agendamento.
- Painel web: base com layout acessível e conexão com a API.
- Dados de demonstração (`seed_demo`) e deploy com Docker Compose e Caddy.
- Ambiente de desenvolvimento em Docker (Postgres, API e painel com hot reload).
- AGENTS.md e docs de arquitetura, design e infraestrutura.
