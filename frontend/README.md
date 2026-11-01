# Frontend — AI Portfolio

Aplicación construida con **Astro**, **React Islands**, **TypeScript**,
**Tailwind CSS**, **Motion** y **shadcn/ui**.

El contenido del portfolio lo sirve el **backend** (tools + agente). Este frontend consume la API y renderiza widgets a partir del contrato `AgentResponse`.

## Estructura

```
frontend/
├── public/                  # Estáticos (imágenes, CV PDF)
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui (CLI)
│   │   ├── layout/          # Header, footer, nav
│   │   ├── sections/        # Bloques Astro (hero, prompt, dashboard)
│   │   ├── pages/           # Composición de páginas
│   │   └── react/           # Islands: chat, widgets del agente
│   ├── i18n/                # Diccionarios es/en (UI del sitio)
│   ├── lib/                 # API SSE, hilo de chat, helpers visuales
│   ├── layouts/             # Layout base Astro
│   ├── pages/               # Rutas / y /en
│   ├── styles/              # Tailwind global
│   └── types/               # agent-response, chat-stream (alineados al backend)
├── astro.config.mjs
├── tailwind.config.mjs
├── components.json
└── package.json
```

### Convenciones

- **Imports:** alias `@/...` (ver `tsconfig.json`).
- **`components/ui`:** componentes shadcn; añadir con `npx shadcn@latest add <nombre>`.
- **`components/react`:** solo islas con `client:*`; el resto en `.astro` cuando baste HTML estático.
- **Chat y API:** usar `src/lib/api.ts` (`streamChatMessage`) y `src/lib/chat-thread.ts` (`thread_id` UUID en `localStorage`). Los componentes no hacen `fetch` directo al backend.
- **Copy estático** (proyectos, experiencia en modales): `src/lib/*Copy.ts` e i18n; los **hechos** del asistente vienen del backend en tiempo de ejecución.

## Scripts

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # astro check + build → dist/
npm run preview
```

## Variables de entorno

```bash
copy .env.example .env
```

| Variable | Descripción |
|---|---|
| `PUBLIC_API_URL` | URL base del backend FastAPI (ej. `http://localhost:8000`) |

No usar variables `PUBLIC_*` para secretos: se embeben en el bundle del cliente.

## Despliegue

Build estático en **Cloudflare Pages** (`dist/`). Configurar `PUBLIC_API_URL` con la URL de Railway. Ver [`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md).

Arquitectura completa: [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).
