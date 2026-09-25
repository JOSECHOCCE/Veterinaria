# Design: Rediseño UI, Diagramación, Jerarquía Tipográfica y Layout Responsivo

## Technical Approach
Refactorizar la estructura de renderizado de los componentes de vista en `src/Frontend/src/views/` y layout en `src/Frontend/src/components/Layout/` utilizando tokens CSS de TailwindCSS v4, clases de grilla dinámica y layouts divididos sin alterar el estado de React ni los contratos de API REST.

## Architecture Decisions

### Decision: Escala Tipográfica Base y Densidad
**Choice**: Establecer tamaño de fuente base `14px` (`0.875rem`) para textos de tablas y lecturas, con padding vertical en celdas de `py-2.5 px-4`.  
**Alternatives considered**: Mantener `13.5px` (muy pequeño) o incrementar a `16px` (demasiado grande en tablas compactas).  
**Rationale**: Garantiza legibilidad óptima en monitores 1080p/4K incrementando la densidad de filas visibles (+40%).

### Decision: Layout POS de Pantalla Completa en 2 Columnas
**Choice**: Utilizar `h-[calc(100vh-4rem)]` con división `grid grid-cols-12 gap-4` (8 columnas catálogo / 4 columnas carrito).  
**Alternatives considered**: Disposición vertical única con scroll de página completa.  
**Rationale**: Simula un terminal de cobro profesional rápido donde el operador no pierde de vista el carrito mientras busca medicamentos.

### Decision: Sidebar Compacto con Toggle
**Choice**: Añadir estado `isCollapsed` con alternancia `w-64` vs `w-20` mediante CSS transition suave (`transition-all duration-300`).  
**Alternatives considered**: Sidebar flotante u oculto totalmente.  
**Rationale**: Los usuarios administradores requieren ver iconos permanentes de navegación mientras disponen de 176px más de área de trabajo.

## Data Flow

```
[ Layout Component / Sidebar ] ──(isCollapsed state)──→ [ Dynamic CSS Width: w-20 | w-64 ]
           │
           ▼
[ Main Content View Container ] ──(Max Width & Grid)──→ [ Responsive 12-Col Grid Layout ]
           │
           ├── [ POS / Ventas View ] ──→ [ 65% Catálogo | 35% Carrito Persistente ]
           ├── [ Triage / SOAP View ] ──→ [ 30% Signos Vitales | 70% Formulario ]
           └── [ Dashboard / Reportes ] ──→ [ Grid 1 → 2 → 4 Cols KPIs ]
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/Frontend/src/index.css` | Modify | Reajuste de variables de tipografía, utilidades CSS y escala responsiva. |
| `src/Frontend/src/components/Layout/Sidebar.tsx` | Modify | Soporte de toggle compacto/extendido. |
| `src/Frontend/src/views/Dashboard/Dashboard.tsx` | Modify | Grilla responsiva de KPIs y layout de gráficos. |
| `src/Frontend/src/views/Ventas/GestionVentas.tsx` | Modify | Layout POS de pantalla completa (65% / 35%). |
| `src/Frontend/src/views/Atencion/HistoriaClinicaSOAP.tsx` | Modify | Split screen para signos vitales y formulario SOAP. |
| `src/Frontend/src/views/Mascotas/DetalleMascota.tsx` | Modify | Rediseño estilo Pasaporte Médico Veterinario. |

## Interfaces / Contracts
Sin modificaciones en contratos C# ni DTOs de Backend. Se agregan interfaces de componentes React para soportar el estado `isCollapsed` en Sidebar (`SidebarProps { isCollapsed?: boolean; onToggleCollapse?: () => void; }`).

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Componentes React | `dotnet test` (Backend PASS 297/297) + `npx tsc -b` |
| Component | Sidebar y POS Grid | Verificación de renderizado y compilación de TypeScript |
| Manual / UI | Responsividad | Verificación en resoluciones Laptop, Desktop y Móvil |

## Threat Matrix
`N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.`

## Migration / Rollout
No migration required.
