import type { Messages } from "./types";

export const es: Messages = {
  meta: {
    title: "Team-Ops: Kanban que tus agentes pueden actualizar",
    description:
      "Kanban de ingeniería autoalojado. Los humanos usan el tablero. Los agentes usan la API HTTP y MCP. Tú corres PostgreSQL. MIT. Sin cloud Team-Ops.",
  },
  nav: {
    product: "Producto",
    agents: "Agentes",
    faq: "FAQ",
    source: "Repo",
    runIt: "Ejecutar",
    menu: "Menú",
    viewSource: "Ver el repo",
    primary: "Principal",
    mobile: "Móvil",
    language: "Idioma",
    theme: "Tema",
    themeToDark: "Usar tema oscuro",
    themeToLight: "Usar tema claro",
  },
  hero: {
    title1: "El tablero que los agentes",
    title2: "sí pueden actualizar",
    subtitle: "Kanban autoalojado en tu Postgres. Los humanos arrastran tarjetas, los agentes las mueven por MCP",
    runItNow: "Ejecutar en local",
    viewSource: "Ver el repo",
  },
  cloud: { eyebrow: "Funciona con el agente que ya pagas" },
  quote: {
    text: "Los agentes de código ya ==escriben el código==. El tablero todavía ==va atrasado==",
    caption: "Aloja el tablero que puede seguir el ritmo",
  },
  product: {
    title: "Un tablero en el que los agentes pueden escribir",
    p1: "Team-Ops es un **Kanban de ingeniería autoalojado** para personas y agentes de código en el mismo equipo. Los humanos tienen cuatro columnas: Backlog, En progreso, Revisión, Hecho. Los agentes tienen una API HTTP y MCP con las mismas reglas: concurrencia optimista, **external_ref** idempotente y un historial de quién hizo qué.",
    p2: "No hay una cloud Team-Ops. Tú ejecutas la API, la app web y PostgreSQL en un portátil, un VPS o cualquier host con Postgres. MIT. Haz fork, hospeda, parchea.",
    install: "Clonar e instalar →",
  },
  agents: {
    title: "Pídeselo al agente, mira moverse la tarjeta",
    lead: "Apunta MCP a tu instancia. El adapter habla solo con tu API, nunca con PostgreSQL",
    tryItOut: "Copia esto",
    needs: "Necesita `TEAM_OPS_URL` y `TEAM_OPS_TOKEN`. El adapter nunca habla con PostgreSQL.",
    runStackFirst: "Levanta el stack primero",
    terminal: "Terminal",
    caption:
      "Pídele al agente que tome ERP-142. Mueve la tarjeta y escribe el progreso. El equipo lo ve sin standup.",
    inProgress: "En progreso",
    copied: "Copiado",
    copy: "Copiar",
    copyAria: "Copiar comando",
    copiedAria: "Copiado al portapapeles",
  },
  features: {
    title: "Hecho para equipos mixtos",
    lead: "Las personas reciben un tablero, los agentes una API, la base de datos sigue siendo tuya",
    aTitle: "Trae el agente que ya usas",
    aBody:
      "MCP lista, crea y mueve trabajo a través de la misma API Go que usa la UI. Nunca habla con PostgreSQL. Quédate con el agente de código que ya pagas.",
    bTitle: "Los conflictos no se pisan en silencio",
    bBody:
      "Cada task lleva una versión. Los updates envían `expectedVersion`. Un conflicto devuelve `TASK_VERSION_CONFLICT` y el tablero deshace el move optimista.",
    bCta: "Ver cómo funciona el tablero",
    cTitle: "Tu Postgres, una env var",
    cBody:
      "Docker, RDS, Cloud SQL, Neon, Supabase. Define `DATABASE_URL`. La app nunca depende de una cloud Team-Ops ni de un control plane hospedado.",
    cCta: "Usa tu base de datos",
    dTitle: "MIT. Sin cuenta, sin cloud",
    dBody:
      "Haz fork, hospeda, parchea. Sin login central. API keys con hash. Contraseñas con Argon2id. Pon TLS delante con el reverse proxy que ya usas.",
    dCta: "Abrir el repo",
  },
  faq: {
    title: "Antes de clonar",
    items: [
      {
        q: "¿Necesito una cloud Team-Ops?",
        a: "No. Tú corres la instancia y la base de datos. El agente de código que elijas aún puede enviar contexto a su propio proveedor.",
      },
      {
        q: "¿Dónde vive PostgreSQL?",
        a: "Donde corra Postgres 15+: Docker Compose, RDS, Cloud SQL, Neon, Supabase, Railway, una VM. Define DATABASE_URL. Esa es toda la integración.",
      },
      {
        q: "¿Cómo se autentican los agentes?",
        a: "Crea un agente en la app web y emite una key que empieza con tops_sk_. La API guarda un hash, nunca el secreto. MCP solo necesita TEAM_OPS_URL y TEAM_OPS_TOKEN.",
      },
      {
        q: "¿Dos personas pueden editar la misma tarjeta?",
        a: "Sí. Verás el choque. Los updates incluyen expectedVersion. Si la tarjeta se movió por debajo, la API devuelve TASK_VERSION_CONFLICT y la UI deshace el cambio.",
      },
      {
        q: "¿Por qué solo cuatro columnas?",
        a: "Para que el tablero siga siendo un tablero. Workflows a medida, sprints, épicas y apps móviles quedan fuera del v1 a propósito.",
      },
      {
        q: "¿Cuánto cuesta?",
        a: "MIT. Clónalo, ejecútalo, modifícalo. No hay un plan de pago Team-Ops en este repositorio.",
      },
    ],
  },
  cta: {
    title: "Clónalo · Ejecútalo · Conecta un agente",
    titleLines: ["Clónalo", "Ejecútalo", "Conecta un agente"],
    subtitle: "Tu máquina, tu Postgres, el agente que ya usas",
    github: "Ir al repo",
    scrollHint: "Desplaza",
  },
  footer: { install: "Instalar", faq: "FAQ", security: "Seguridad", nav: "Pie de página" },
};
