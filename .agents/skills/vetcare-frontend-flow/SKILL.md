---
name: vetcare-frontend-flow
description: Flujo de desarrollo paso a paso para importar pantallas de StitchMCP, convertirlas a React + TypeScript y conectarlas a la API de .NET.
category: specific
agents: [frontend]
---

## Cuándo usar esta skill
- Cuando el usuario te pida implementar un módulo completo del frontend (ej: "ejecuta el módulo Clientes").
- Cuando vayas a traducir código HTML/CSS estático de Stitch a componentes y vistas reactivas en React + TypeScript.
- Cuando necesites conectar las nuevas vistas a los servicios de API.

---

## Patrón Principal de Automatización

Cuando el usuario te indique "ejecuta el módulo [NombreMódulo]", debes seguir este flujo automatizado sin necesidad de pedir confirmaciones intermedias:

### 1. Mapeo y Localización de Especificaciones
- **Paso 1.1:** Ve al archivo [.ai-context/5-stitch-screen-spec.md](file:///c:/Users/yaran/Documents/antigravity/Veterinaria-main/.ai-context/5-stitch-screen-spec.md) y busca la sección del módulo solicitado.
- **Paso 1.2:** Identifica todas las pantallas que componen dicho módulo.
- **Paso 1.3:** Localiza las carpetas correspondientes en [.ai-context/stitch_vetcare_pro_master_ui/](file:///c:/Users/yaran/Documents/antigravity/Veterinaria-main/.ai-context/stitch_vetcare_pro_master_ui/) para leer el archivo `code.html` de cada pantalla.

### 2. Conversión a Componentes React + TypeScript
Por cada pantalla identificada en el módulo:
- **Paso 2.1:** Crea o reemplaza el archivo correspondiente en `src/Frontend/src/views/{NombreMódulo}/`.
- **Paso 2.2:** Traduce el HTML estático de `code.html` a JSX de React.
- **Paso 2.3:** Reemplaza las referencias estáticas (como listas fijas, nombres estáticos, textos de ejemplo) por estados controlados (`useState` y `useEffect`).
- **Paso 2.4:** Implementa el manejo de los 3 estados requeridos por las guías del proyecto:
  * **Cargando** (`loading = true`): Skeleton o spinner.
  * **Vacío** (`data.length === 0`): Mensaje amigable con botón de acción.
  * **Error** (`error !== null`): Aviso sin detalles técnicos de backend, botón para reintentar.

### 3. Conexión con la API REST (Services)
- **Paso 3.1:** Revisa si el archivo en `src/Frontend/src/services/` correspondiente (ej: `clientes.service.ts`) tiene los endpoints necesarios.
- **Paso 3.2:** Si hacen falta endpoints, agrégalos al servicio utilizando la instancia centralizada de Axios `api.ts`.
- **Paso 3.3:** **CRÍTICO:** Nunca uses `fetch` ni hagas llamadas Axios directas desde el componente React; todas deben pasar por el archivo `.service.ts`.

### 4. Integración en la Navegación y Rutas (`App.tsx`)
- **Paso 4.1:** Importa tu vista en [src/Frontend/src/App.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria-main/src/Frontend/src/App.tsx).
- **Paso 4.2:** Reemplaza el componente `DummyView` o placeholder por tu componente de vista real.
- **Paso 4.3:** Asegúrate de envolver la ruta con el guard de rol adecuado si la especificación restringe su acceso (`RoleGuard`).

---

## Nivel de Estilo y Visuales (Tailwind v4)
- **ALWAYS:** Respeta fielmente las clases Tailwind v4 del archivo `code.html`.
- **ALWAYS:** Utiliza las variables CSS de tema oficial registradas en `index.css` (ej: `var(--color-primary)`, `bg-canvas`, `text-ink`).
- **NEVER:** Dejes layouts o contenedores a medio estilizar con apariencia básica. Debe sentirse premium, con micro-animaciones en botones e interacciones (usando `framer-motion` si es apropiado).

---

## Reglas de Consistencia (Branding y Navegación)

Dado que los prototipos generados por Stitch pueden presentar inconsistencias en barras laterales, logotipos, logos e iconos de una pantalla a otra:
- **NEVER:** Importes o recrees la barra lateral (Sidebar), el logotipo (Logo) o la cabecera (Header/TopBar) desde el código HTML de Stitch.
- **ALWAYS:** Utiliza los componentes estructurados que ya están centralizados en React: `<Logo />`, `<Sidebar />`, `<ClientLayout />` y `<ProtectedLayout />`.
- **ALWAYS:** Extrae **únicamente el contenido interno del lienzo principal** (el elemento `<main>` o el contenedor de la vista operativa central) del HTML de Stitch.
- **ALWAYS:** Deja que la visibilidad de las acciones críticas (como `+ Nueva Consulta`) y los enlaces del menú se rijan exclusivamente por la lógica dinámica del rol del usuario definida en `Sidebar.tsx` y `ClientLayout.tsx`.

---

## Decision Tree de Implementación

```text
¿El módulo requiere autenticación?
├── Sí ➔ Envuelve las rutas en ProtectedLayout/ClientLayout en App.tsx.
└── No ➔ Agrega la ruta como pública en App.tsx.

¿Falta algún endpoint en el servicio?
├── Sí ➔ Edita el archivo src/Frontend/src/services/{nombre}.service.ts.
└── No ➔ Importa las funciones directamente en la vista.
```

---

## Checklist antes de dar por terminado un Módulo

- [ ] Las vistas se encuentran creadas en la subcarpeta correcta en `src/Frontend/src/views/`.
- [ ] La ruta está registrada y funcional en `src/Frontend/src/App.tsx`.
- [ ] El componente maneja estados de Loading, Error y Empty.
- [ ] No hay llamadas directas a Axios en los componentes (todo pasa por servicios).
- [ ] El linter y typecheck compilan sin errores (`npm run typecheck`).
