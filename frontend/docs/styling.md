# Guia de Estilos

## Paleta de colores

El dashboard usa un tema oscuro heredado del prototipo original (`gitlab-mr-board_1.html`). Todos los colores estan definidos como extensiones de Tailwind en `tailwind.config.js`.

### Colores base

| Token Tailwind    | Hex       | Uso                              |
|-------------------|-----------|----------------------------------|
| `bg`              | `#12141A` | Fondo principal de la pagina     |
| `surface`         | `#1A1D24` | Fondo de paneles y columnas      |
| `surface-raised`  | `#22262F` | Fondo de cards y elementos elevados |
| `border`          | `#2A2F3A` | Bordes principales               |
| `border-soft`     | `#22252D` | Bordes sutiles (entre cards)     |

### Colores de texto

| Token Tailwind    | Hex       | Uso                              |
|-------------------|-----------|----------------------------------|
| `text-primary`    | `#E7E9ED` | Texto principal                  |
| `text-muted`      | `#9098A6` | Texto secundario, metadata       |
| `text-faint`      | `#5C6270` | Texto muy sutil, placeholders    |

### Colores de acento

| Token Tailwind    | Hex       | Uso                              |
|-------------------|-----------|----------------------------------|
| `accent`          | `#45B8C9` | Links, botones primarios, focus  |
| `accent-soft`     | `#173238` | Fondo de chips activos           |

### Colores semanticos (bloqueantes)

| Token Tailwind    | Hex       | Uso semantico                    |
|-------------------|-----------|----------------------------------|
| `ready`           | `#4FB477` | Todo OK, listo para merge        |
| `ready-soft`      | `#16261D` | Fondo de badges verdes           |
| `draft`           | `#D9A441` | Pendiente, en progreso           |
| `draft-soft`      | `#2B2213` | Fondo de badges amarillos        |
| `conflict`        | `#E5484D` | Error, bloqueado, conflicto      |
| `conflict-soft`   | `#301617` | Fondo de badges rojos            |

### Mapeo de mergeability a colores

| Mergeability | Borde izquierdo card    | Badge background   | Badge text        |
|--------------|------------------------|--------------------|--------------------|
| `green`      | `border-l-ready`       | `bg-ready-soft`    | `text-ready`       |
| `yellow`     | `border-l-draft`       | `bg-draft-soft`    | `text-draft`       |
| `red`        | `border-l-conflict`    | `bg-conflict-soft` | `text-conflict`    |
| `gray`       | `border-l-text-faint`  | `bg-surface`       | `text-text-muted`  |
| `review`     | `border-l-blue-400`    | —                  | —                  |
| `attention`  | `border-l-orange-400`  | —                  | —                  |
| `backlog`    | `border-l-text-muted`  | —                  | —                  |

> **Nota**: `review`, `attention` y `backlog` usan colores de Tailwind directamente (`blue-400`, `orange-400`, `text-muted`) en vez de tokens semanticos custom. Los badges internos de cada card siguen usando los colores semanticos del bloqueante correspondiente.

## Tipografia

| Token Tailwind | Font stack                                                        | Uso            |
|----------------|-------------------------------------------------------------------|----------------|
| `font-sans`    | -apple-system, BlinkMacSystemFont, Segoe UI, Inter, Roboto, sans-serif | Texto general |
| `font-mono`    | ui-monospace, SFMono-Regular, SF Mono, Consolas, Cascadia Code, monospace | Ramas, paths, metadata tecnica |

### Tamanos de texto usados

| Clase Tailwind     | Tamano  | Donde se usa                     |
|--------------------|---------|----------------------------------|
| `text-lg`          | 18px    | Titulo principal (h1)            |
| `text-[13px]`      | 13px    | Titulo de MR en cards            |
| `text-[12.5px]`    | 12.5px  | Tabs, titulos de columna         |
| `text-[12px]`      | 12px    | Mensajes de error, estados vacios|
| `text-[11.5px]`    | 11.5px  | Footer, chips de filtro          |
| `text-[11px]`      | 11px    | Autor, contador de columna       |
| `text-[10.5px]`    | 10.5px  | Ramas (font-mono)                |
| `text-[10px]`      | 10px    | Badges, labels, status tags      |

## Componentes visuales

### Cards de MR

- Fondo: `bg-surface-raised`
- Borde: `border border-border-soft` + borde izquierdo de 3px con color de mergeability
- Border radius: `rounded-md` (6px)
- Padding: `p-2.5 px-3`

### Columnas del tablero

- Fondo: `bg-surface`
- Borde: `border border-border rounded-lg`
- Ancho fijo: `min-w-[290px] max-w-[290px]`
- Altura maxima: `max-h-[74vh]` con scroll interno
- Gap entre columnas: `gap-3.5`

### Blocker Badges

- Inline-flex con `gap-1`
- Font size: `text-[10px] font-semibold`
- Padding: `px-1.5 py-0.5`
- Border radius: `rounded`
- Colores de fondo/texto segun la tabla de colores semanticos

### Chips de filtro

- Font: `font-mono text-[11.5px]`
- Padding: `px-2 py-1`
- Activo: `border-accent bg-accent-soft text-text-primary`
- Inactivo: `border-border bg-surface text-text-muted`

### Botones

- Base: `bg-surface-raised border border-border text-text-primary rounded-md`
- Hover: `hover:border-text-faint`
- Disabled: `disabled:opacity-50 disabled:cursor-not-allowed`

## Estilos globales

Definidos en `src/assets/main.css`:

- Scrollbars personalizadas (webkit): Track `#1A1D24`, thumb `#2A2F3A` con border-radius
- Links: Color `#45B8C9` (accent), underline on hover
- Box-sizing: `border-box` global

## Responsive

- El tablero usa `overflow-x: auto` para scroll horizontal cuando hay muchas columnas.
- Las columnas tienen ancho fijo de 290px, se acomodan horizontalmente.
- El layout principal tiene `max-w-[1600px] mx-auto` para centrar en pantallas muy anchas.
- Los tabs y la barra de busqueda usan `flex-wrap` para adaptarse a pantallas chicas.
