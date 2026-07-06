# AI Portfolio

Portfolio web Full Stack moderno.

## Stack tecnológico

### Frontend
- [Astro](https://astro.build/)
- React Islands
- TypeScript
- Tailwind CSS
- [Motion](https://motion.dev/)
- [shadcn/ui](https://ui.shadcn.com/)

### Backend
- [FastAPI](https://fastapi.tiangolo.com/)
- Python

### IA
- Google Gemini

### Datos
Por el momento no se utiliza base de datos. Toda la información del portfolio
se almacena en archivos JSON locales (`frontend/src/data` y `backend/app/data`).

## Estructura del proyecto

```
ai-portfolio/
├── frontend/   # Aplicación Astro + React Islands
├── backend/    # API FastAPI
├── docs/       # Documentación del proyecto
├── README.md
└── .gitignore
```

Consulta el `README.md` de cada carpeta (`frontend/`, `backend/`) para más detalle
sobre su estructura interna.

## Primeros pasos

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Estado del proyecto

Este repositorio contiene únicamente la estructura inicial del proyecto.
Aún no se ha implementado lógica de negocio.
