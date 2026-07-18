# Frontend — AI Portfolio

Aplicación construida con **Astro**, **React Islands**, **TypeScript**,
**Tailwind CSS**, **Motion** y **shadcn/ui**.

## Estructura

```
frontend/
├── public/                  # Archivos estáticos servidos tal cual (favicon, imágenes)
│   └── images/
├── src/
│   ├── assets/               # Assets procesados por Astro (imágenes, svgs optimizables)
│   ├── components/
│   │   ├── ui/                # Componentes shadcn/ui (generados vía CLI, no editar a mano)
│   │   ├── layout/              # Header, Footer, Nav, contenedores estructurales
│   │   ├── sections/              # Bloques/secciones de página (Hero, About, Projects, etc.)
│   │   └── react/                  # React Islands puntuales (interactividad específica)
│   ├── data/                        # Contenido del portfolio en JSON local
│   ├── hooks/                        # Custom hooks de React (ej. useMediaQuery, useTheme)
│   ├── layouts/                       # Layouts base de Astro (envoltorio HTML de las páginas)
│   ├── lib/                            # Utilidades transversales (cn, helpers genéricos)
│   ├── pages/                           # Rutas del sitio (file-based routing de Astro)
│   ├── services/                         # Clientes de API / integración con el backend y Gemini
│   ├── styles/                            # Estilos globales (Tailwind + variables de tema)
│   ├── types/                              # Tipos e interfaces TypeScript compartidos
│   └── env.d.ts                             # Tipado de variables de entorno y cliente de Astro
├── astro.config.mjs                          # Integraciones: React + Tailwind
├── tailwind.config.mjs                        # Theme, colores (CSS vars) y plugins
├── components.json                             # Configuración de shadcn/ui (aliases, estilo)
├── tsconfig.json                                # TypeScript estricto + alias "@/*" -> "src/*"
└── package.json
```

### Convenciones

- **Alias de imports**: usar `@/...` en vez de rutas relativas largas (ej. `@/components/ui/button`, `@/lib/utils`).
- **`components/ui`**: solo componentes generados/gestionados por shadcn/ui (`npx shadcn@latest add <componente>`). No modificar su lógica interna manualmente, solo estilos vía `className`.
- **`components/react`**: usar únicamente para islas que requieren interactividad en cliente (`client:*` directives). El resto de la UI debe resolverse en `.astro` cuando sea posible, para minimizar JS enviado al cliente.
- **`data/`**: fuente de verdad del contenido del portfolio (JSON). No hay base de datos por el momento.
- **`services/`**: capa de acceso a datos externos (API del backend en FastAPI, llamadas relacionadas a Gemini). Los componentes no deben hacer `fetch` directamente.

## Scripts

```bash
npm install       # instalar dependencias
npm run dev       # entorno de desarrollo (http://localhost:4321)
npm run build     # type-check (astro check) + build de producción
npm run preview   # previsualizar build de producción
```

## Añadir componentes de shadcn/ui

```bash
npx shadcn@latest add <componente>
```

El componente se genera en `src/components/ui/` usando la configuración de
`components.json`.

## Variables de entorno

Copiar `.env.example` a `.env` y completar los valores necesarios:

```bash
cp .env.example .env
```

| Variable | Descripción |
|---|---|
| `PUBLIC_API_URL` | URL base del backend (FastAPI) |

> Las variables `PUBLIC_*` de Astro se inyectan en el bundle en build time; no poner secretos ahí.

## Despliegue

El frontend se buildea como sitio **estático** (`npm run build` → `dist/`) y se
despliega en **Cloudflare Pages**. En producción, `PUBLIC_API_URL` debe apuntar
al backend en Railway. Ver [`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md).
