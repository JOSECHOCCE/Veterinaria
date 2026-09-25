# Exploration: Rediseño UI, Diagramación, Jerarquía Tipográfica y Layout Responsivo

## Current State
Actualmente, el sistema **VetCare Pro** cuenta con vistas funcionales construidas en `React 19` + `TailwindCSS v4`. Sin embargo, durante la auditoría visual y de diagramación se identificaron las siguientes oportunidades de mejora:
1. **Pérdida de espacio utilizable**: Las vistas principales (`Dashboard`, `Triage`, `HistoriaClinicaSOAP`, `POS/Ventas`, `ClientesDashboard`) utilizan un contenedor rígido `max-w-7xl` con `gap-8` excesivo, dejando grandes márgenes muertos laterales en pantallas anchas (laptop 15", monitores 1080p y 4K).
2. **Desequilibrio Tipográfico**: La escala tipográfica base (`--text-body-md: 13.5px` en `index.css`) resulta ligeramente ajustada en monitores de alta resolución, mientras que algunos encabezados o botones no tienen una proporción jerárquica destacada.
3. **Densidad de Información en Tablas y Formularios**: Las tablas de Clientes, Productos y Citas usan paddings amplios (`py-4`), reduciendo la cantidad de registros visibles por pantalla. Los formularios de salud (SOAP) y configuración se extienden horizontalmente sin estructura de columnas.
4. **Falta de Adaptación Táctil y POS**: El punto de venta (POS) y cobro no aprovechan el alto total de pantalla (`100vh`) como una interfaz dividida (catálogo a la izquierda, carrito persistente a la derecha).

---

## Affected Areas

### 1. Sistema de Diseño Global & Tokens
- [index.css](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/index.css) — Reajuste de variables CSS, escala tipográfica (`14px` base), utilidades de densidad y grid.
- [Sidebar.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/components/Layout/Sidebar.tsx) — Implementación de toggle para Sidebar compacto/colapsable (`w-20` mini vs `w-64` expandido).
- [TopAppBar.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/components/Layout/TopAppBar.tsx) — Optimización de altura a `h-14` y barra de búsqueda centralizada.

### 2. Vistas Principales (Dashboard & Métricas)
- [Dashboard.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/views/Dashboard/Dashboard.tsx) — Grilla responsiva de KPIs (`1 → 2 → 4` columnas), números destacados (`30px font-black`) y ajuste de márgenes `gap-5`.

### 3. Atención Clínica (Triaje & SOAP)
- [Triage.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/views/Atencion/Triage.tsx) — Layout dividido (*Split View*: 60% Cola de pacientes + 40% Ficha seleccionada) con badges de pulso animado de prioridad.
- [HistoriaClinicaSOAP.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/views/Atencion/HistoriaClinicaSOAP.tsx) — Formulario en 2 columnas (*Split Screen*: Antecedentes/Signos vitales a la izquierda, Formulario SOAP en la derecha).

### 4. Caja, Ventas & Botica (POS)
- [GestionVentas.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/views/Ventas/GestionVentas.tsx) y [RegistrarCobro.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/views/Pagos/RegistrarCobro.tsx) — Pantalla completa `h-[calc(100vh-4rem)]` con 2 columnas fijas (65% catálogo visual de productos / 35% carrito con totalizador destacado).

### 5. Clientes & Carnet de Mascota
- [ClientesDashboard.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/views/Clientes/ClientesDashboard.tsx) — Tabla compacta (`py-2.5 px-4 text-sm`) con incremento de registros visibles (+40%).
- [DetalleMascota.tsx](file:///c:/Users/yaran/Documents/antigravity/Veterinaria/src/Frontend/src/views/Mascotas/DetalleMascota.tsx) — Ficha estilo "Carnet / Pasaporte Veterinario" con avatar, estado de vacunación y métricas.

---

## Approaches

### Option A: Refactorización Progresiva por Módulos (Recomendada)
- **Descripción**: Implementar el rediseño en 3 entregas/fases de sprint:
  1. **Fase 1**: Sistema de diseño base (`index.css`), Sidebar colapsable y Dashboard responsivo.
  2. **Fase 2**: Módulo POS (Ventas/Caja) de pantalla completa + Tablas compactas (Clientes/Productos).
  3. **Fase 3**: Layout dividido de Triaje/SOAP + Ficha Pasaporte Veterinario.
- **Pros**: Control de cambios atómico, pruebas continuas, cero disrupción visual.
- **Cons**: Requiere validación por fase.
- **Effort**: Medium

### Option B: Rediseño Global en Bloque Único
- **Descripción**: Modificar todos los componentes de la interfaz simultáneamente en una sola gran tarea.
- **Pros**: Finalización en un solo commit masivo.
- **Cons**: Alto riesgo de regresiones visuales en componentes secundarios.
- **Effort**: High

---

## Recommendation
Se recomienda la **Opción A (Refactorización Progresiva por Módulos)** bajo el estándar de **SDD + TDD Estricto + Engram Híbrido** (ID 76), garantizando que las pruebas unitarias y de componentes se mantengan en verde en cada fase.

---

## Risks
- Posible desalineación de estilos heredados en pantallas secundarias.
- *Mitigación*: Uso estricto de clases utilitarias de TailwindCSS v4 y pruebas en múltiples resoluciones (Laptop 1366x768, Desktop 1080p, Ultrawide 1440p y Móvil/Tablet).

---

## Ready for Proposal
**Yes** — La fase de exploración queda lista para continuar con `sdd-propose`.
