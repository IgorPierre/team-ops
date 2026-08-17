import type { Messages } from "./types";

export const pt: Messages = {
  meta: {
    title: "Team-Ops — o quadro para humanos e agentes",
    description:
      "Kanban de engenharia self-hosted. Humanos usam o quadro. Agentes usam a API e o MCP. PostgreSQL sob o seu controle.",
  },
  nav: {
    product: "Produto",
    agents: "Agentes",
    faq: "FAQ",
    source: "Código",
    runIt: "Rodar",
    menu: "Menu",
    viewSource: "Ver código",
    primary: "Principal",
    mobile: "Celular",
    language: "Idioma",
  },
  hero: {
    title1: "O quadro para humanos",
    title2: "e agentes.",
    subtitle: "Kanban open source. Você hospeda. Os agentes mantêm atualizado.",
    runItNow: "Rodar agora",
    viewSource: "Ver código",
  },
  cloud: { eyebrow: "Funciona com os agentes que você já usa" },
  quote: {
    text: "Os agentes de código já ==escrevem o código==. O quadro ainda ==fica para trás==.",
    caption: "O Team-Ops existe para fechar essa lacuna.",
  },
  product: {
    title: "O que é o Team-Ops?",
    p1: "Team-Ops é um **Kanban de engenharia self-hosted** para times mistos de pessoas e agentes de código. Humanos têm quatro colunas fixas — Backlog, Em progresso, Revisão, Concluído. Agentes têm uma API HTTP e um adapter MCP que falam as mesmas regras: concorrência otimista, **external_ref** idempotente e um histórico de quem fez o quê.",
    p2: "Não existe cloud Team-Ops. Você roda a API, o app web e o PostgreSQL na infraestrutura que controla — um laptop, uma VPS ou qualquer host com Postgres. Licença MIT. Faça fork, hospede, aplique patch.",
    install: "Instalar localmente →",
  },
  agents: {
    title: "Os agentes mantêm o quadro em dia.",
    lead: "Aponte o MCP para a sua instância. O adapter nunca fala com o banco — só com a API que você já roda.",
    tryItOut: "Experimente",
    needs: "Precisa de `TEAM_OPS_URL` e `TEAM_OPS_TOKEN`. O adapter nunca fala com o PostgreSQL.",
    runStackFirst: "Suba o stack primeiro",
    terminal: "Terminal",
    caption:
      "Peça ao agente para pegar o ERP-142. Ele move o card, registra o progresso, e o resto do time vê sem um roteiro de standup.",
    inProgress: "Em progresso",
    copied: "Copiado",
    copy: "Copiar",
    copyAria: "Copiar comando",
    copiedAria: "Copiado para a área de transferência",
  },
  features: {
    aTitle: "AI-native e agnóstico",
    aBody:
      "Funciona com o agente de código que você já paga. O MCP lista, cria e move trabalho pela mesma API Go que os humanos usam. Nunca fala com o PostgreSQL.",
    bTitle: "Versão, não last-write-wins.",
    bBody:
      "Toda task tem uma versão. Updates enviam `expectedVersion`. Um conflito devolve `TASK_VERSION_CONFLICT` e o quadro desfaz o move otimista.",
    bCta: "Como o quadro funciona",
    cTitle: "Seu PostgreSQL. Zero SDK de vendor.",
    cBody:
      "Docker, RDS, Cloud SQL, Neon, Supabase — um `DATABASE_URL`. O app nunca depende de uma cloud Team-Ops ou de um control plane hospedado.",
    cCta: "Traga o seu banco",
    dTitle: "Open source. MIT. Self hosted.",
    dBody:
      "Faça fork, hospede, aplique patch. Sem conta central. API keys com hash. Senhas com Argon2id. Coloque TLS na frente com o reverse proxy que você já usa.",
    dCta: "Ver no GitHub",
  },
  faq: {
    title: "Perguntas frequentes",
    items: [
      {
        q: "O Team-Ops exige uma cloud Team-Ops?",
        a: "Não. A instância e o banco rodam na infraestrutura que você controla. O agente de código que você escolher ainda pode enviar contexto para o próprio provedor.",
      },
      {
        q: "Onde o PostgreSQL deve ficar?",
        a: "Em qualquer lugar compatível: Docker Compose, RDS, Cloud SQL, Neon, Supabase, Railway, uma VM. Defina DATABASE_URL. Essa é a integração inteira.",
      },
      {
        q: "Como os agentes autenticam?",
        a: "Crie um agente no app web e emita uma key que começa com tops_sk_. A API guarda um hash, nunca o segredo. O MCP só precisa de TEAM_OPS_URL e TEAM_OPS_TOKEN.",
      },
      {
        q: "Duas pessoas podem editar o mesmo card?",
        a: "Sim, mas não em silêncio. Updates incluem expectedVersion. Se o card andou por baixo, a API devolve TASK_VERSION_CONFLICT e a UI desfaz.",
      },
      {
        q: "Por que só quatro colunas?",
        a: "Para o quadro continuar um quadro. Workflows customizados, sprints, épicos e apps mobile ficam de fora do v1 de propósito.",
      },
      {
        q: "É de graça?",
        a: "MIT. Clone, rode, modifique. Não existe um plano pago Team-Ops neste repositório.",
      },
    ],
  },
  cta: { title: "Clone. Rode. Conecte um agente.", github: "Ver no GitHub" },
  footer: { install: "Instalar", faq: "FAQ", security: "Segurança", nav: "Rodapé" },
};
