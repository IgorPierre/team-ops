import type { Catalog } from "../config";

/** common strings. Keys are the English text exactly as passed to t(). */
export const common: Catalog = {
  pt: {
    // lib/task-display.ts: STATUS_DISPLAY
    Backlog: "Backlog",
    "In progress": "Em progresso",
    "In review": "Em revisão",
    Done: "Concluído",
    // lib/board.ts: COLUMN_TITLES
    "In Progress": "Em progresso",
    Review: "Revisão",
    // lib/task-display.ts: PRIORITY_DISPLAY
    High: "Alta",
    Medium: "Média",
    Low: "Baixa",
    // lib/task-display.ts: ROLE_DISPLAY
    Admin: "Admin",
    Developer: "Desenvolvedor",
    Viewer: "Leitor",
    "Manages people, agents and settings": "Gerencia pessoas, agentes e configurações",
    "Writes the board and runs coding agents": "Edita o quadro e roda agentes de código",
    "Reads the board": "Lê o quadro",
    // components/layout/nav-config.ts
    General: "Geral",
    Team: "Time",
    Board: "Quadro",
    Timeline: "Linha do tempo",
    Reports: "Relatórios",
    People: "Pessoas",
    Agents: "Agentes",
    Workspace: "Workspace",
    // lib/utils.ts, lib/errors.ts
    "Completed {date}": "Concluído em {date}",
    "1 day overdue": "1 dia de atraso",
    "{n} days overdue": "{n} dias de atraso",
    "Due today": "Vence hoje",
    "1 day remaining": "Falta 1 dia",
    "{n} days remaining": "Faltam {n} dias",
    "Something went wrong": "Algo deu errado",
    // Shared words
    Cancel: "Cancelar",
    "Save changes": "Salvar alterações",
    Discard: "Descartar",
    Close: "Fechar",
    Search: "Buscar",
    Everyone: "Todos",
    Anyone: "Qualquer pessoa",
    "All projects": "Todos os projetos",
    Unassigned: "Sem responsável",
    "No owner": "Sem dono",
    You: "Você",
    Never: "Nunca",
    Language: "Idioma",
    // components/ui
    Copy: "Copiar",
    Copied: "Copiado",
    Progress: "Progresso",
  },
  es: {
    // lib/task-display.ts: STATUS_DISPLAY
    Backlog: "Backlog",
    "In progress": "En progreso",
    "In review": "En revisión",
    Done: "Hecho",
    // lib/board.ts: COLUMN_TITLES
    "In Progress": "En progreso",
    Review: "Revisión",
    // lib/task-display.ts: PRIORITY_DISPLAY
    High: "Alta",
    Medium: "Media",
    Low: "Baja",
    // lib/task-display.ts: ROLE_DISPLAY
    Admin: "Admin",
    Developer: "Desarrollador",
    Viewer: "Lector",
    "Manages people, agents and settings": "Gestiona personas, agentes y configuración",
    "Writes the board and runs coding agents": "Edita el tablero y ejecuta agentes de código",
    "Reads the board": "Lee el tablero",
    // components/layout/nav-config.ts
    General: "General",
    Team: "Equipo",
    Board: "Tablero",
    Timeline: "Cronología",
    Reports: "Reportes",
    People: "Personas",
    Agents: "Agentes",
    Workspace: "Espacio de trabajo",
    // lib/utils.ts, lib/errors.ts
    "Completed {date}": "Completado el {date}",
    "1 day overdue": "1 día de retraso",
    "{n} days overdue": "{n} días de retraso",
    "Due today": "Vence hoy",
    "1 day remaining": "Queda 1 día",
    "{n} days remaining": "Quedan {n} días",
    "Something went wrong": "Algo salió mal",
    // Shared words
    Cancel: "Cancelar",
    "Save changes": "Guardar cambios",
    Discard: "Descartar",
    Close: "Cerrar",
    Search: "Buscar",
    Everyone: "Todos",
    Anyone: "Cualquiera",
    "All projects": "Todos los proyectos",
    Unassigned: "Sin asignar",
    "No owner": "Sin responsable",
    You: "Tú",
    Never: "Nunca",
    Language: "Idioma",
    // components/ui
    Copy: "Copiar",
    Copied: "Copiado",
    Progress: "Progreso",
  },
};
