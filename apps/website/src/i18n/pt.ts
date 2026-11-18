import type { Messages } from "./types";

export const pt: Messages = {
  meta: {
    title: "Team-Ops: Kanban que os agentes conseguem atualizar",
    description:
      "Kanban de engenharia self-hosted. Humanos usam o quadro. Agentes usam a API HTTP e o MCP. Você roda o PostgreSQL. MIT. Sem cloud Team-Ops.",
  },
  nav: {
    product: "Produto",
    agents: "Agentes",
    faq: "FAQ",
    source: "Repo",
    runIt: "Rodar",
    menu: "Menu",
    viewSource: "Ver o repo",
    primary: "Principal",
    mobile: "Celular",
    language: "Idioma",
    theme: "Tema",
    themeToDark: "Usar tema escuro",
    themeToLight: "Usar tema claro",
  },
  hero: {
    title1: "O quadro que os agentes",
    title2: "conseguem atualizar",
    subtitle: "Kanban self-hosted no seu Postgres. Humanos arrastam cards, agentes movem pelo MCP",
    runItNow: "Rodar localmente",
    viewSource: "Ver o repo",
  },
  cloud: { eyebrow: "Funciona com o agente que você já paga" },
  quote: {
    text: "Os agentes de código já ==escrevem o código==. O quadro ainda ==fica para trás==",
    caption: "Hospede o quadro que acompanha o código",
  },
  product: {
    title: "Um quadro em que os agentes podem escrever",
    p1: "Team-Ops é um **Kanban de engenharia self-hosted** para pessoas e agentes de código no mesmo time. Humanos têm quatro colunas: Backlog, Em progresso, Revisão, Concluído. Agentes têm uma API HTTP e MCP com as mesmas regras: concorrência otimista, **external_ref** idempotente e um histórico de quem fez o quê.",
    p2: "Não existe cloud Team-Ops. Você roda a API, o app web e o PostgreSQL num laptop, numa VPS ou em qualquer host com Postgres. MIT. Faça fork, hospede, aplique patch.",
    install: "Clonar e instalar →",
  },
  agents: {
    title: "Peça ao agente, veja o card andar",
    lead: "Adicione a URL MCP da sua instância e faça login. O servidor fala só com a sua API, nunca com o PostgreSQL",
    tryItOut: "Copie isto",
    needs: "Só precisa da URL do seu Team-Ops. O editor faz login pelo navegador (OAuth); nada de chave para copiar.",
    runStackFirst: "Inicie a instância primeiro",
    terminal: "Terminal",
    caption:
      "Peça ao agente para pegar o ERP-142. Ele move o card e registra o progresso. O time vê sem standup.",
    inProgress: "Em progresso",
    copied: "Copiado",
    copy: "Copiar",
    copyAria: "Copiar comando",
    copiedAria: "Copiado para a área de transferência",
  },
  features: {
    title: "Feito para times mistos",
    lead: "Pessoas ganham um quadro, agentes ganham uma API, o banco continua seu",
    aTitle: "Traga o agente que você já usa",
    aBody:
      "O MCP lista, cria e move trabalho pela mesma API Go que a UI usa. Nunca fala com o PostgreSQL. Mantenha o agente de código que você já paga.",
    bTitle: "Conflito não sobrescreve em silêncio",
    bBody:
      "Toda tarefa tem uma versão. As atualizações enviam `expectedVersion`. Um conflito devolve `TASK_VERSION_CONFLICT` e o quadro desfaz a movimentação.",
    bCta: "Ver como o quadro funciona",
    cTitle: "Seu Postgres, uma variável de ambiente",
    cBody:
      "Docker, RDS, Cloud SQL, Neon, Supabase. Defina `DATABASE_URL`. O app nunca depende de uma cloud Team-Ops ou de um serviço central hospedado.",
    cCta: "Usar o seu banco",
    dTitle: "MIT. Sem conta central",
    dBody:
      "Faça fork, hospede, aplique patch. Sem login central. Tokens com hash. Senhas com Argon2id. Coloque TLS na frente com o reverse proxy que você já usa.",
    dCta: "Abrir o repo",
  },
  faq: {
    title: "Antes de clonar",
    items: [
      {
        q: "Preciso de uma cloud Team-Ops?",
        a: "Não. Você roda a instância e o banco. O agente de código que você escolher ainda pode enviar contexto para o próprio provedor.",
      },
      {
        q: "Onde o PostgreSQL fica?",
        a: "Onde o Postgres 15+ rodar: Docker Compose, RDS, Cloud SQL, Neon, Supabase, Railway, uma VM. Defina DATABASE_URL. Essa é a integração inteira.",
      },
      {
        q: "Como os agentes se autenticam?",
        a: "Cada dev adiciona sua-instancia/mcp no editor e entra com a conta do Team-Ops (OAuth com PKCE). Os tokens agem em nome daquele dev e ficam com hash. Desconecte um editor quando quiser em Configurações → Agentes.",
      },
      {
        q: "Duas pessoas podem editar o mesmo card?",
        a: "Sim. Se outra pessoa já alterou o card, o quadro avisa sobre o conflito e desfaz a sua movimentação para preservar a alteração anterior.",
      },
      {
        q: "Por que só quatro colunas?",
        a: "Para o quadro continuar um quadro. Workflows customizados, sprints, épicos e apps mobile ficam de fora do v1 de propósito.",
      },
      {
        q: "Quanto custa?",
        a: "MIT. Clone, rode, modifique. Não existe um plano pago Team-Ops neste repositório.",
      },
    ],
  },
  cta: {
    title: "Clone · Rode · Conecte um agente",
    titleLines: ["Clone", "Rode", "Conecte um agente"],
    subtitle: "Sua máquina, seu Postgres, o agente que você já usa",
    github: "Pegar o repo",
    scrollHint: "Role",
  },
  footer: { install: "Instalar", faq: "FAQ", security: "Segurança", nav: "Rodapé" },
};
