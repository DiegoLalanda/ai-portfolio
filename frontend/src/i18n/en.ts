import type { Translations } from "@/i18n/types";

export const en: Translations = {
  meta: {
    title: "Diego - AI Engineer & Physics Professor",
  },
  hero: {
    greeting: "Hi",
    name: "I'm Diego",
    roles: ["Software Developer", "AI Engineer", "Professor"],
    tagline: "Get to know me by asking anything.",
  },
  prompts: {
    placeholders: [
      "Ask about my AI experience...",
      "Ask about my projects...",
      "Ask about my teaching background...",
      "Ask me anything...",
    ],
    sendAriaLabel: "Send",
  },
  suggestions: [
    {
      id: "frontend",
      label: "Frontend",
      question: "What frontend technologies and frameworks do you work with?",
    },
    {
      id: "ai",
      label: "Artificial Intelligence",
      question: "Tell me about your AI and machine learning experience...",
    },
    {
      id: "backend",
      label: "Backend",
      question: "What is your backend development experience?",
    },
    {
      id: "fullstack",
      label: "Full-Stack",
      question: "How would you describe your full-stack skill set?",
    },
    {
      id: "devops",
      label: "DevOps",
      question: "What DevOps tools and practices do you use?",
    },
    {
      id: "cloud",
      label: "Cloud & AWS",
      question: "Tell me about your cloud and AWS experience...",
    },
    {
      id: "architecture",
      label: "Architecture",
      question: "How do you approach software architecture and system design?",
    },
    {
      id: "typescript",
      label: "TypeScript",
      question: "How do you use TypeScript in your projects?",
    },
    {
      id: "python",
      label: "Python",
      question: "What is your experience with Python?",
    },
    {
      id: "react",
      label: "React",
      question: "Tell me about your React development experience...",
    },
    {
      id: "angular",
      label: "Angular",
      question: "Have you built APIs or apps with Angular?",
    },
    {
      id: "mobile",
      label: "Mobile",
      question: "What mobile development technologies do you know?",
    },
    {
      id: "engineering",
      label: "Engineering",
      question: "How would you describe your engineering background?",
    },
    {
      id: "education",
      label: "Education",
      question: "What is your educational background?",
    },
    {
      id: "experience",
      label: "Experience",
      question: "Summarize your professional experience...",
    },
    {
      id: "projects",
      label: "Projects",
      question: "Show me your projects: freelance, university, and personal work...",
    },
    {
      id: "teaching",
      label: "Teaching",
      question: "Tell me about your teaching experience...",
    },
    {
      id: "docker",
      label: "Docker & CI/CD",
      question: "How do you use Docker and CI/CD in your workflow?",
    },
    {
      id: "databases",
      label: "Databases",
      question: "What databases and data tools have you worked with?",
    },
    {
      id: "llms",
      label: "LLMs & Agents",
      question: "What is your experience building with LLMs and AI agents?",
    },
    {
      id: "game-dev",
      label: "Game Dev",
      question: "Tell me about your game development experience...",
    },
  ],
  loading: {
    label: "Architecting Insights",
    status: {
      thinking: "Analyzing your question…",
      synthesizing: "Building the response…",
      done: "Done!",
      followUp: "Looking that up…",
    },
    tools: {
      get_skills: "Skills",
      get_projects: "Projects",
      get_experience: "Experience",
      get_timeline: "Timeline",
      get_education: "Education",
      get_certifications: "Certifications",
      get_languages: "Languages",
      get_contact: "Contact",
    },
  },
  errors: {
    connectionTitle: "Connection issue",
    connectionSummary: "Couldn't reach the backend right now. Please make sure the API is running.",
  },
  dashboard: {
    askAgain: "Ask again",
    askAgainAriaLabel: "Return to the home screen to ask another question",
  },
  footer: {
    tagline: "© Diego Lalanda · Made with love, mates, and artificial intelligence.",
    getInTouch: "Get in Touch",
  },
  langSwitcher: {
    ariaLabel: "Select language",
  },
  projects: {
    title: "Projects",
    viewDetails: "View details",
    modal: {
      close: "Close project detail",
      returnToPortfolio: "Return to portfolio",
      challenge: "The challenge",
      solution: "The solution",
      results: "Results",
      highlights: "Highlights",
      role: "Role",
    },
  },
};
