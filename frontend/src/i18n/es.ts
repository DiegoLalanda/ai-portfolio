import type { Translations } from "@/i18n/types";

export const es: Translations = {
  meta: {
    title: "Diego - Ingeniero en IA y Profesor de Física",
  },
  hero: {
    greeting: "Hola",
    name: "Soy Diego",
    roles: ["Desarrollador de Software", "Ingeniero en IA", "Profesor"],
    tagline: "Conocé mi perfil preguntando lo que quieras.",
  },
  prompts: {
    placeholders: [
      "Preguntame sobre mi experiencia en IA...",
      "Preguntame sobre mis proyectos...",
      "Preguntame sobre mi docencia...",
      "Preguntame lo que quieras...",
    ],
    sendAriaLabel: "Enviar",
  },
  suggestions: [
    {
      id: "frontend",
      label: "Frontend",
      question: "¿Con qué tecnologías y frameworks frontend trabajás?",
    },
    {
      id: "ai",
      label: "Inteligencia Artificial",
      question: "Contame sobre tu experiencia en IA y machine learning...",
    },
    {
      id: "backend",
      label: "Backend",
      question: "¿Cuál es tu experiencia en desarrollo backend?",
    },
    {
      id: "fullstack",
      label: "Full-Stack",
      question: "¿Cómo describirías tu perfil full-stack?",
    },
    {
      id: "devops",
      label: "DevOps",
      question: "¿Qué herramientas y prácticas DevOps usás?",
    },
    {
      id: "cloud",
      label: "Cloud y AWS",
      question: "Contame sobre tu experiencia en cloud y AWS...",
    },
    {
      id: "architecture",
      label: "Arquitectura",
      question: "¿Cómo abordás la arquitectura de software y el diseño de sistemas?",
    },
    {
      id: "typescript",
      label: "TypeScript",
      question: "¿Cómo usás TypeScript en tus proyectos?",
    },
    {
      id: "python",
      label: "Python",
      question: "¿Cuál es tu experiencia con Python?",
    },
    {
      id: "react",
      label: "React",
      question: "Contame sobre tu experiencia con React...",
    },
    {
      id: "angular",
      label: "Angular",
      question: "¿Construiste APIs o apps con Angular?",
    },
    {
      id: "mobile",
      label: "Mobile",
      question: "¿Qué tecnologías de desarrollo mobile conocés?",
    },
    {
      id: "engineering",
      label: "Ingeniería",
      question: "¿Cómo describirías tu formación en ingeniería?",
    },
    {
      id: "education",
      label: "Educación",
      question: "¿Cuál es tu formación académica?",
    },
    {
      id: "experience",
      label: "Experiencia",
      question: "Resumí tu experiencia profesional...",
    },
    {
      id: "projects",
      label: "Proyectos",
      question: "Mostrame tus proyectos: freelance, universidad y personales...",
    },
    {
      id: "teaching",
      label: "Docencia",
      question: "Contame sobre tu experiencia docente...",
    },
    {
      id: "docker",
      label: "Docker y CI/CD",
      question: "¿Cómo usás Docker y CI/CD en tu flujo de trabajo?",
    },
    {
      id: "databases",
      label: "Bases de datos",
      question: "¿Con qué bases de datos y herramientas de datos trabajaste?",
    },
    {
      id: "llms",
      label: "LLMs y Agentes",
      question: "¿Qué experiencia tenés construyendo con LLMs y agentes de IA?",
    },
    {
      id: "game-dev",
      label: "Game Dev",
      question: "Contame sobre tu experiencia en desarrollo de videojuegos...",
    },
  ],
  loading: {
    label: "Arquitectando insights",
    status: {
      thinking: "Analizando tu pregunta…",
      synthesizing: "Armando la respuesta…",
      done: "¡Listo!",
      followUp: "Consultando…",
    },
    tools: {
      get_skills: "Skills",
      get_projects: "Proyectos",
      get_experience: "Experiencia",
      get_timeline: "Timeline",
      get_education: "Educación",
      get_certifications: "Certificaciones",
      get_languages: "Idiomas",
      get_soft_skills: "Habilidades blandas",
      get_contact: "Contacto",
    },
  },
  errors: {
    connectionTitle: "Problema de conexión",
    connectionSummary:
      "No pudimos conectar con el backend en este momento. Verificá que la API esté en ejecución.",
    rateLimitTitle: "Límite de preguntas superado",
    rateLimitSummary: "Has superado el límite de 10 preguntas por minuto. Por favor, espera un momento antes de volver a preguntar.",
    downloadCV: "Descargar CV Completo",
  },
  dashboard: {
    askAgain: "Volver a preguntar",
    askAgainAriaLabel: "Volver a la pantalla inicial para hacer otra pregunta",
  },
  footer: {
    tagline: "© Diego Lalanda · Hecho con amor, mates e inteligencia (artificial).",
    getInTouch: "Contacto",
  },
  langSwitcher: {
    ariaLabel: "Seleccionar idioma",
  },
  projects: {
    title: "Proyectos",
    viewDetails: "Ver detalles",
    modal: {
      close: "Cerrar detalle del proyecto",
      returnToPortfolio: "Volver al portfolio",
      challenge: "El desafío",
      solution: "La solución",
      results: "Resultados",
      highlights: "Puntos clave",
      role: "Rol",
    },
  },
};
