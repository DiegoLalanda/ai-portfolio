# Datos del portfolio

Esta carpeta es la **fuente única de verdad** de toda la información que el asistente de IA puede consultar: experiencia, proyectos, skills, educación, certificaciones, habilidades blandas, idiomas, una línea de tiempo unificada y datos de contacto.

Está pensada para que las "tools" del backend (handlers de function calling) la lean directamente una vez que se implemente la lógica de IA — todavía no hay base de datos, solo archivos JSON validados.

## Archivos

| Archivo | Forma | Descripción |
|---|---|---|
| `experience.json` | array | Trabajos, freelance, docencia. |
| `projects.json` | array | Proyectos profesionales / académicos / personales / freelance / juegos. |
| `skills.json` | array | Listado plano de skills técnicas, agrupadas por `category`. |
| `education.json` | array | Títulos y tecnicaturas. |
| `certifications.json` | array | Cursos, diplomaturas y certificaciones. |
| `softskills.json` | array | Habilidades blandas / transferibles. |
| `languages.json` | array | Idiomas hablados y nivel. |
| `timeline.json` | array | Índice cronológico unificado (opcionalmente apunta a los archivos anteriores). |
| `contact.json` | object | Objeto único: identidad, datos de contacto y links sociales. |

Por ahora cada archivo tiene un **placeholder vacío** (`[]` u `{}`). El contenido real se va a cargar más adelante; por el momento solo importa la *forma* de los datos.

## Esquemas

Cada archivo tiene su [JSON Schema](https://json-schema.org/) correspondiente (draft 2020-12) dentro de [`schema/`](./schema/), por ejemplo `experience.json` ↔ `schema/experience.schema.json`. Las piezas reutilizables (`id`, `yearMonth`, `tags`, `link`, `media`, `teamMember`) viven en [`schema/_common.schema.json`](./schema/_common.schema.json) y se referencian con `$ref` para mantener todos los archivos consistentes en vez de redefinir la misma forma nueve veces.

Para validar un archivo de datos contra su esquema una vez que se cargue contenido (ejemplo con `jsonschema` + `referencing` en Python):

```python
import json
from pathlib import Path
from jsonschema import Draft202012Validator
from referencing import Registry, Resource

data_dir = Path("app/data")
schema_dir = data_dir / "schema"

registry = Registry().with_resources(
    (f"{path.name}", Resource.from_contents(json.loads(path.read_text())))
    for path in schema_dir.glob("*.schema.json")
)

schema = json.loads((schema_dir / "experience.schema.json").read_text())
validator = Draft202012Validator(schema, registry=registry)
validator.validate(json.loads((data_dir / "experience.json").read_text()))
```

## Convenciones

- **Ids**: kebab-case, prefijados por tipo para que sean legibles y globalmente únicos, ej. `exp-finnegans-ai-developer`, `proj-cachibache-app`, `skill-python`, `edu-uner-tecnicatura-web`, `cert-...`, `soft-leadership`, `lang-english`, `tl-...`.
- **Fechas**: strings `"YYYY-MM"` (solo año y mes). Los períodos abiertos usan `endDate: null` junto con un flag booleano (`current` en experiencia/proyectos, `status: "in-progress"` en educación).
- **Referencias cruzadas**: en vez de duplicar información, las entradas se referencian entre sí por id:
  - `experience[].stack`, `projects[].stack` y `certifications[].skills` → ids de `skills.json`.
  - `timeline[].refId` → id de la entrada correspondiente en `experience.json` / `education.json` / `projects.json` / `certifications.json` (o `null` para un `milestone` independiente).
- **Control de visualización**: la mayoría de las colecciones comparten `featured` (boolean), `order` (integer, orden manual) y `visible` (boolean, ocultar sin borrar) para que el frontend y las tools de IA puedan filtrar/ordenar de forma consistente sin lógica extra.
- **Tags**: keywords libres en minúscula (`tags: string[]`) en casi todas las entradas, pensadas solo para búsqueda/filtrado por parte de las tools de IA, no para mostrarse en la UI.
- **Links y media**: objetos reutilizables `link` (`{ label, url, type }`) y `media` (`{ type, url, alt }`), compartidos entre `projects.json`, `certifications.json` y `contact.json`.

## Por qué esta estructura

El diseño está pensado para que el asistente de IA pueda consultar estos datos más adelante mediante **tools** simples, por ejemplo:

- `get_experience()` / `get_experience_by_id(id)`
- `get_projects(featured=True)` / `get_project_by_id(id)`
- `get_skills_by_category("ai")`
- `get_timeline(from_year=2023)`
- `get_contact_info()`

Como todas las colecciones siguen las mismas convenciones (`id`, `tags`, `featured`, `order`, `visible`, fechas `YYYY-MM`), esas tools pueden compartir helpers genéricos de filtrado/ordenamiento en vez de escribir lógica particular por archivo.
