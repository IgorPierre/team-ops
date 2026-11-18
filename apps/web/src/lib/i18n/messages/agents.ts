import type { Catalog } from "../config";

/** agents strings. Keys are the English text exactly as passed to t(). */
export const agents: Catalog = {
  pt: {
    // Page
    "Connect an editor": "Conectar um editor",
    "Your agents": "Seus agentes",
    "Editors signed in as you. Their cards are assigned to you.": "Editores conectados como você. Os cards deles são atribuídos a você.",
    "Connect Claude Code, Cursor or VS Code and it shows up here once you sign in.":
      "Conecte o Claude Code, o Cursor ou o VS Code e ele aparece aqui assim que você entrar.",
    "Viewers follow the board but don't run coding agents. Ask an admin for developer access.":
      "Leitores acompanham o quadro, mas não rodam agentes de código. Peça acesso de dev a um admin.",
    "Team agents": "Agentes do time",
    "Agents your teammates connected.": "Agentes que seus colegas conectaram.",
    "Add the Team-Ops MCP server and sign in with your account. No keys involved.":
      "Adicione o servidor MCP do Team-Ops e entre com sua conta. Sem chaves.",
    "MCP server URL": "URL do servidor MCP",
    // Agents table
    Disconnected: "Desconectado",
    "Signed in": "Conectado",
    "Not signed in": "Não conectado",
    "Disconnected. The editor is signed out.": "Desconectado. O editor foi desconectado da conta.",
    "Agent updated": "Agente atualizado",
    "No agents yet": "Nenhum agente ainda",
    Owner: "Dono",
    "Owner of {name}": "Dono de {name}",
    "{name} (you)": "{name} (você)",
    "Last active": "Última atividade",
    Disconnect: "Desconectar",
    // Connect an editor
    Editor: "Editor",
    Terminal: "Terminal",
    "Copilot agent": "Agente do Copilot",
    "Setup CLI": "CLI de setup",
    "Any editor + skill": "Qualquer editor + skill",
    Allow: "Permitir",
    "In the repo you code in (add {flag} for every repo):": "No repositório em que você trabalha (adicione {flag} para todos os repositórios):",
    "Run {command}, pick {server} and choose {action}.": "Rode {command}, selecione {server} e escolha {action}.",
    "Your browser opens Team-Ops. Click {allow}.": "O navegador abre o Team-Ops. Clique em {allow}.",
    "Add to {file} (or {globalFile} for every repo):": "Adicione a {file} (ou a {globalFile} para todos os repositórios):",
    "In Cursor Settings → MCP, use the sign-in prompt next to {server}.":
      "Em Cursor Settings → MCP, use o botão de login ao lado de {server}.",
    "Click {allow} in the browser.": "Clique em {allow} no navegador.",
    "Add to {file} in the repo:": "Adicione a {file} no repositório:",
    "Start the server from the file (or {command}) and sign in when asked.":
      "Inicie o servidor pelo arquivo (ou por {command}) e entre quando for pedido.",
    "Click {allow} in the browser, then use Copilot in agent mode.":
      "Clique em {allow} no navegador e use o Copilot no modo agente.",
    "In the repo you code in. Writes the MCP config, {file} and the Team-Ops skill:":
      "No repositório em que você trabalha. Grava a config do MCP, o {file} e a skill do Team-Ops:",
    "Restart the editor and sign in when it asks.": "Reinicie o editor e entre quando ele pedir.",
    "No keys to copy. The editor signs in as you and its cards are assigned to you; the config has no secrets, so you can commit it for the team.":
      "Nenhuma chave para copiar. O editor entra como você e os cards dele são atribuídos a você; a config não tem segredos, então dá para commitar para o time.",
  },
  es: {
    // Page
    "Connect an editor": "Conectar un editor",
    "Your agents": "Tus agentes",
    "Editors signed in as you. Their cards are assigned to you.":
      "Editores con tu sesión iniciada. Sus tarjetas se te asignan a ti.",
    "Connect Claude Code, Cursor or VS Code and it shows up here once you sign in.":
      "Conecta Claude Code, Cursor o VS Code y aparecerá aquí cuando inicies sesión.",
    "Viewers follow the board but don't run coding agents. Ask an admin for developer access.":
      "Los lectores siguen el tablero, pero no ejecutan agentes de código. Pide acceso de desarrollador a un admin.",
    "Team agents": "Agentes del equipo",
    "Agents your teammates connected.": "Agentes que conectaron tus compañeros.",
    "Add the Team-Ops MCP server and sign in with your account. No keys involved.":
      "Agrega el servidor MCP de Team-Ops e inicia sesión con tu cuenta. Sin claves.",
    "MCP server URL": "URL del servidor MCP",
    // Agents table
    Disconnected: "Desconectado",
    "Signed in": "Sesión iniciada",
    "Not signed in": "Sin sesión",
    "Disconnected. The editor is signed out.": "Desconectado. Se cerró la sesión del editor.",
    "Agent updated": "Agente actualizado",
    "No agents yet": "Aún no hay agentes",
    Owner: "Responsable",
    "Owner of {name}": "Responsable de {name}",
    "{name} (you)": "{name} (tú)",
    "Last active": "Última actividad",
    Disconnect: "Desconectar",
    // Connect an editor
    Editor: "Editor",
    Terminal: "Terminal",
    "Copilot agent": "Agente de Copilot",
    "Setup CLI": "CLI de configuración",
    "Any editor + skill": "Cualquier editor + skill",
    Allow: "Permitir",
    "In the repo you code in (add {flag} for every repo):": "En el repositorio donde programas (agrega {flag} para todos los repositorios):",
    "Run {command}, pick {server} and choose {action}.": "Ejecuta {command}, selecciona {server} y elige {action}.",
    "Your browser opens Team-Ops. Click {allow}.": "El navegador abre Team-Ops. Haz clic en {allow}.",
    "Add to {file} (or {globalFile} for every repo):": "Agrega a {file} (o a {globalFile} para todos los repositorios):",
    "In Cursor Settings → MCP, use the sign-in prompt next to {server}.":
      "En Cursor Settings → MCP, usa el botón de inicio de sesión junto a {server}.",
    "Click {allow} in the browser.": "Haz clic en {allow} en el navegador.",
    "Add to {file} in the repo:": "Agrega a {file} en el repositorio:",
    "Start the server from the file (or {command}) and sign in when asked.":
      "Inicia el servidor desde el archivo (o con {command}) e inicia sesión cuando te lo pida.",
    "Click {allow} in the browser, then use Copilot in agent mode.":
      "Haz clic en {allow} en el navegador y luego usa Copilot en modo agente.",
    "In the repo you code in. Writes the MCP config, {file} and the Team-Ops skill:":
      "En el repositorio donde programas. Escribe la config del MCP, {file} y la skill de Team-Ops:",
    "Restart the editor and sign in when it asks.": "Reinicia el editor e inicia sesión cuando te lo pida.",
    "No keys to copy. The editor signs in as you and its cards are assigned to you; the config has no secrets, so you can commit it for the team.":
      "No hay claves que copiar. El editor inicia sesión como tú y sus tarjetas se te asignan; la config no tiene secretos, así que puedes hacer commit para el equipo.",
  },
};
