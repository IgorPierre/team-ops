import type { Catalog } from "../config";

/** auth strings. Keys are the English text exactly as passed to t(). */
export const auth: Catalog = {
  pt: {
    "Email or password is incorrect.": "E-mail ou senha incorretos.",
    "you@company.com": "voce@empresa.com",
    // (auth)/layout
    "Ship with your agents. The board keeps up.": "Entregue com seus agentes. O quadro acompanha.",
    // shared form labels
    Email: "E-mail",
    Password: "Senha",
    Name: "Nome",
    // login
    "Log in to your account": "Entre na sua conta",
    "Welcome back. Enter your details to continue.": "Bem-vindo de volta. Informe seus dados para continuar.",
    "This instance is invite-only. Use the link an admin sent you to create an account.":
      "Esta instância é só para convidados. Use o link que um admin te enviou para criar uma conta.",
    "Don't have an account?": "Não tem uma conta?",
    "Sign up": "Cadastre-se",
    "Could not sign in": "Não foi possível entrar",
    "Signing in…": "Entrando…",
    "Sign in": "Entrar",
    // register
    "This invite is invalid or expired.": "Este convite é inválido ou expirou.",
    "Could not register": "Não foi possível criar a conta",
    "Join {org}": "Entrar em {org}",
    "Create an account": "Crie uma conta",
    "You're invited as {role}.": "Você foi convidado como {role}.",
    "Set up your Team-Ops account.": "Configure sua conta do Team-Ops.",
    "Already have an account?": "Já tem uma conta?",
    "Log in": "Entrar",
    "This instance is invite-only. Ask an admin to send you a link, then come back here.":
      "Esta instância é só para convidados. Peça um link a um admin e depois volte aqui.",
    "Your name": "Seu nome",
    "Must be at least 8 characters.": "Precisa ter pelo menos 8 caracteres.",
    "Create a password": "Crie uma senha",
    "Join workspace": "Entrar no workspace",
    "Get started": "Começar",
    // onboarding
    "Set up your workspace": "Configure seu workspace",
    "Create an organization and its first project.": "Crie uma organização e o primeiro projeto dela.",
    "Organization name": "Nome da organização",
    "URL slug": "Slug da URL",
    "Lowercase letters, numbers and dashes.": "Letras minúsculas, números e hifens.",
    "First project": "Primeiro projeto",
    Key: "Chave",
    "Could not create workspace": "Não foi possível criar o workspace",
    "Creating…": "Criando…",
    "Continue to board": "Ir para o quadro",
    // oauth/authorize
    "See the projects and tasks in the organization you choose": "Ver os projetos e tarefas da organização que você escolher",
    "Create, update and move cards, comment, and mark work done":
      "Criar, atualizar e mover cards, comentar e marcar trabalho como concluído",
    "Act as you: cards it opens are assigned to you": "Agir como você: os cards que ele abrir ficam atribuídos a você",
    "An application": "Um aplicativo",
    "This sign-in request is not supported (response_type must be code).":
      "Este pedido de login não é suportado (response_type precisa ser code).",
    "This sign-in link is incomplete. Start the connection again from your editor.":
      "Este link de login está incompleto. Comece a conexão de novo pelo seu editor.",
    "This editor didn't use PKCE (S256), which Team-Ops requires.":
      "Este editor não usou PKCE (S256), que o Team-Ops exige.",
    "Unknown application.": "Aplicativo desconhecido.",
    "This request returns to an address {app} didn't register. Start the connection again from your editor.":
      "Este pedido volta para um endereço que {app} não registrou. Comece a conexão de novo pelo seu editor.",
    "Can't connect": "Não foi possível conectar",
    Connected: "Conectado",
    "You can close this tab and go back to {app}.": "Você pode fechar esta aba e voltar para {app}.",
    "View-only account": "Conta somente leitura",
    "Your account can only view boards. Ask an admin for developer access to connect a coding agent.":
      "Sua conta só pode ver quadros. Peça a um admin acesso de desenvolvedor para conectar um agente de código.",
    "{app} will be able to:": "{app} poderá:",
    Organization: "Organização",
    "Organization:": "Organização:",
    "Could not approve the request.": "Não foi possível aprovar o pedido.",
    "Allow access": "Permitir acesso",
    "Connect {app}": "Conectar {app}",
    "{app} wants to keep your team's board up to date as it works.":
      "{app} quer manter o quadro do seu time atualizado enquanto trabalha.",
    "Signed in as": "Conectado como",
    "You can disconnect it any time in Agents.": "Você pode desconectá-lo a qualquer momento em Agentes.",
    "MCP client": "Cliente MCP",
  },
  es: {
    "Email or password is incorrect.": "Correo o contraseña incorrectos.",
    "you@company.com": "tu@empresa.com",
    // (auth)/layout
    "Ship with your agents. The board keeps up.": "Entrega con tus agentes. El tablero sigue el ritmo.",
    // shared form labels
    Email: "Correo electrónico",
    Password: "Contraseña",
    Name: "Nombre",
    // login
    "Log in to your account": "Inicia sesión en tu cuenta",
    "Welcome back. Enter your details to continue.": "Hola de nuevo. Ingresa tus datos para continuar.",
    "This instance is invite-only. Use the link an admin sent you to create an account.":
      "Esta instancia es solo por invitación. Usa el enlace que te envió un admin para crear una cuenta.",
    "Don't have an account?": "¿No tienes una cuenta?",
    "Sign up": "Regístrate",
    "Could not sign in": "No se pudo iniciar sesión",
    "Signing in…": "Iniciando sesión…",
    "Sign in": "Iniciar sesión",
    // register
    "This invite is invalid or expired.": "Esta invitación no es válida o expiró.",
    "Could not register": "No se pudo crear la cuenta",
    "Join {org}": "Únete a {org}",
    "Create an account": "Crea una cuenta",
    "You're invited as {role}.": "Te invitaron como {role}.",
    "Set up your Team-Ops account.": "Configura tu cuenta de Team-Ops.",
    "Already have an account?": "¿Ya tienes una cuenta?",
    "Log in": "Inicia sesión",
    "This instance is invite-only. Ask an admin to send you a link, then come back here.":
      "Esta instancia es solo por invitación. Pídele un enlace a un admin y luego vuelve aquí.",
    "Your name": "Tu nombre",
    "Must be at least 8 characters.": "Debe tener al menos 8 caracteres.",
    "Create a password": "Crea una contraseña",
    "Join workspace": "Unirse al espacio de trabajo",
    "Get started": "Comenzar",
    // onboarding
    "Set up your workspace": "Configura tu espacio de trabajo",
    "Create an organization and its first project.": "Crea una organización y su primer proyecto.",
    "Organization name": "Nombre de la organización",
    "URL slug": "Slug de la URL",
    "Lowercase letters, numbers and dashes.": "Letras minúsculas, números y guiones.",
    "First project": "Primer proyecto",
    Key: "Clave",
    "Could not create workspace": "No se pudo crear el espacio de trabajo",
    "Creating…": "Creando…",
    "Continue to board": "Ir al tablero",
    // oauth/authorize
    "See the projects and tasks in the organization you choose": "Ver los proyectos y tareas de la organización que elijas",
    "Create, update and move cards, comment, and mark work done":
      "Crear, actualizar y mover tarjetas, comentar y marcar trabajo como hecho",
    "Act as you: cards it opens are assigned to you": "Actuar como tú: las tarjetas que abra se te asignan a ti",
    "An application": "Una aplicación",
    "This sign-in request is not supported (response_type must be code).":
      "Esta solicitud de inicio de sesión no es compatible (response_type debe ser code).",
    "This sign-in link is incomplete. Start the connection again from your editor.":
      "Este enlace de inicio de sesión está incompleto. Vuelve a iniciar la conexión desde tu editor.",
    "This editor didn't use PKCE (S256), which Team-Ops requires.":
      "Este editor no usó PKCE (S256), que Team-Ops requiere.",
    "Unknown application.": "Aplicación desconocida.",
    "This request returns to an address {app} didn't register. Start the connection again from your editor.":
      "Esta solicitud vuelve a una dirección que {app} no registró. Vuelve a iniciar la conexión desde tu editor.",
    "Can't connect": "No se puede conectar",
    Connected: "Conectado",
    "You can close this tab and go back to {app}.": "Puedes cerrar esta pestaña y volver a {app}.",
    "View-only account": "Cuenta de solo lectura",
    "Your account can only view boards. Ask an admin for developer access to connect a coding agent.":
      "Tu cuenta solo puede ver tableros. Pídele a un admin acceso de desarrollador para conectar un agente de código.",
    "{app} will be able to:": "{app} podrá:",
    Organization: "Organización",
    "Organization:": "Organización:",
    "Could not approve the request.": "No se pudo aprobar la solicitud.",
    "Allow access": "Permitir acceso",
    "Connect {app}": "Conectar {app}",
    "{app} wants to keep your team's board up to date as it works.":
      "{app} quiere mantener al día el tablero de tu equipo mientras trabaja.",
    "Signed in as": "Sesión iniciada como",
    "You can disconnect it any time in Agents.": "Puedes desconectarlo cuando quieras en Agentes.",
    "MCP client": "Cliente MCP",
  },
};
