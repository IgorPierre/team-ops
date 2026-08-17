import type { Messages } from "./types";

export const es: Messages = {
  meta: {
    title: "Team-Ops — el tablero para humanos y agentes",
    description:
      "Kanban de ingeniería autoalojado. Los humanos usan el tablero. Los agentes usan la API y MCP. PostgreSQL bajo tu control.",
  },
  nav: {
    product: "Producto",
    agents: "Agentes",
    faq: "FAQ",
    source: "Código",
    runIt: "Ejecutar",
    menu: "Menú",
    viewSource: "Ver código",
    primary: "Principal",
    mobile: "Móvil",
    language: "Idioma",
  },
  hero: {
    title1: "El tablero para humanos",
    title2: "y agentes.",
    subtitle: "Kanban de código abierto. Tú lo hospedas. Los agentes lo mantienen al día.",
    runItNow: "Ejecutar ahora",
    viewSource: "Ver código",
  },
  cloud: { eyebrow: "Funciona con los agentes que ya usas" },
  quote: {
    text: "Los agentes de código ya ==escriben el código==. El tablero todavía ==va atrasado==.",
    caption: "Team-Ops existe para cerrar esa brecha.",
  },
  product: {
    title: "¿Qué es Team-Ops?",
    p1: "Team-Ops es un **Kanban de ingeniería autoalojado** para equipos mixtos de personas y agentes de código. Los humanos tienen cuatro columnas fijas — Backlog, En progreso, Revisión, Hecho. Los agentes tienen una API HTTP y un adapter MCP que hablan las mismas reglas: concurrencia optimista, **external_ref** idempotente y un historial de quién hizo qué.",
    p2: "No hay una cloud Team-Ops. Tú ejecutas la API, la app web y PostgreSQL en la infraestructura que controlas — un portátil, un VPS o cualquier host con Postgres. Licencia MIT. Haz fork, hospeda, parchea.",
    install: "Instalar en local →",
  },
  agents: {
    title: "Los agentes mantienen el tablero al día.",
    lead: "Apunta MCP a tu instancia. El adapter nunca habla con la base de datos — solo con la API que ya ejecutas.",
    tryItOut: "Pruébalo",
    needs: "Necesita `TEAM_OPS_URL` y `TEAM_OPS_TOKEN`. El adapter nunca habla con PostgreSQL.",
    runStackFirst: "Levanta el stack primero",
    terminal: "Terminal",
    caption:
      "Pídele al agente que tome ERP-142. Mueve la tarjeta, escribe el progreso, y el resto del equipo lo ve sin un guion de standup.",
    inProgress: "En progreso",
    copied: "Copiado",
    copy: "Copiar",
    copyAria: "Copiar comando",
    copiedAria: "Copiado al portapapeles",
  },
  features: {
    aTitle: "AI-native y agnóstico",
    aBody:
      "Funciona con el agente de código que ya pagas. MCP lista, crea y mueve trabajo a través de la misma API Go que usan los humanos. Nunca habla con PostgreSQL.",
    bTitle: "Versión, no last-write-wins.",
    bBody:
      "Cada task lleva una versión. Los updates envían `expectedVersion`. Un conflicto devuelve `TASK_VERSION_CONFLICT` y el tablero deshace el move optimista.",
    bCta: "Cómo funciona el tablero",
    cTitle: "Tu PostgreSQL. Cero SDK de vendor.",
    cBody:
      "Docker, RDS, Cloud SQL, Neon, Supabase — un `DATABASE_URL`. La app nunca depende de una cloud Team-Ops ni de un control plane hospedado.",
    cCta: "Trae tu base de datos",
    dTitle: "Open source. MIT. Self hosted.",
    dBody:
      "Haz fork, hospeda, parchea. Sin cuenta central. API keys con hash. Contraseñas con Argon2id. Pon TLS delante con el reverse proxy que ya usas.",
    dCta: "Ver en GitHub",
  },
  faq: {
    title: "Preguntas frecuentes",
    items: [
      {
        q: "¿Team-Ops exige una cloud Team-Ops?",
        a: "No. La instancia y la base de datos corren en la infraestructura que controlas. El agente de código que elijas aún puede enviar contexto a su propio proveedor.",
      },
      {
        q: "¿Dónde debe vivir PostgreSQL?",
        a: "En cualquier sitio compatible: Docker Compose, RDS, Cloud SQL, Neon, Supabase, Railway, una VM. Define DATABASE_URL. Esa es toda la integración.",
      },
      {
        q: "¿Cómo se autentican los agentes?",
        a: "Crea un agente en la app web y emite una key que empieza con tops_sk_. La API guarda un hash, nunca el secreto. MCP solo necesita TEAM_OPS_URL y TEAM_OPS_TOKEN.",
      },
      {
        q: "¿Dos personas pueden editar la misma tarjeta?",
        a: "Sí, pero no en silencio. Los updates incluyen expectedVersion. Si la tarjeta se movió por debajo, la API devuelve TASK_VERSION_CONFLICT y la UI deshace el cambio.",
      },
      {
        q: "¿Por qué solo cuatro columnas?",
        a: "Para que el tablero siga siendo un tablero. Workflows a medida, sprints, épicas y apps móviles quedan fuera del v1 a propósito.",
      },
      {
        q: "¿Es gratis?",
        a: "MIT. Clónalo, ejecútalo, modifícalo. No hay un plan de pago Team-Ops en este repositorio.",
      },
    ],
  },
  cta: { title: "Clónalo. Ejecútalo. Conecta un agente.", github: "Ver en GitHub" },
  footer: { install: "Instalar", faq: "FAQ", security: "Seguridad", nav: "Pie de página" },
};
