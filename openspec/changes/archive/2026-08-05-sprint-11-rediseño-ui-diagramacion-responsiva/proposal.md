# Proposal: Rediseño UI, Diagramación, Jerarquía Tipográfica y Layout Responsivo

## Intent
Optimizar la experiencia visual y operativa (UI/UX) del sistema VetCare Pro eliminando márgenes muertos en pantallas de laptop/desktop, elevando la escala tipográfica a un tamaño de lectura confortable (14px base) y reestructurando la distribución espacial (layout grids) en los 5 módulos principales del sistema.

## Scope

### In Scope
- **Refactorización de tokens de diseño**: Escala tipográfica mejorada, colores primarios clínicos, densidad de tablas y utilidades CSS en `index.css`.
- **Sidebar colapsable**: Toggle interactivo para alternar entre Sidebar extendido (`w-64`) y modo compacto (`w-20`), ganando 176px de espacio de trabajo útil.
- **Rediseño responsivo de Dashboard**: KPIs en grilla adaptativa (`grid-cols-1 md:grid-cols-4 gap-4`), números destacados y márgenes balanceados.
- **Rediseño POS (Ventas/Caja)**: Pantalla de dos columnas fijas a alto completo (`h-[calc(100vh-4rem)]`) con catálogo visual a la izquierda (65%) y carrito persistente a la derecha (35%).
- **Layout de Atención (Triaje y SOAP)**: Vista dividida (*Split Screen*) para signos vitales e historia clínica.
- **Ficha de Mascota**: Rediseño estilo "Pasaporte Médico Digital Veterinario".

### Out of Scope
- Reescritura de lógica de negocio en Backend .NET.
- Cambios de esquemas en base de datos.
- Modificación de endpoints API REST.

## Capabilities

### New Capabilities
- `rediseño-ui-diagramacion-responsiva`: Especificación de interfaz de usuario responsiva, jerarquía tipográfica y layout optimizado.

### Modified Capabilities
- `pos-dashboard-ui`: Actualización de la especificación delta para el diseño del dashboard y punto de venta.

## Approach
Implementación modular usando clases de TailwindCSS v4 y `Framer Motion` sin alterar el contrato de los componentes de estado ni la arquitectura de servicios React.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/Frontend/src/index.css` | Modified | Ajuste de variables CSS, escala tipográfica y clases utilitarias de layout. |
| `src/Frontend/src/components/Layout/Sidebar.tsx` | Modified | Incorporación de estado colapsable y badges compactos. |
| `src/Frontend/src/views/Dashboard/Dashboard.tsx` | Modified | Reorganización de KPIs en grilla responsiva. |
| `src/Frontend/src/views/Ventas/GestionVentas.tsx` | Modified | Maquetación POS en 2 columnas fijas. |
| `src/Frontend/src/views/Atencion/HistoriaClinicaSOAP.tsx` | Modified | Split View para formulario SOAP. |
| `src/Frontend/src/views/Mascotas/DetalleMascota.tsx` | Modified | Ficha Pasaporte Médico Veterinario. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Ruptura visual en resoluciones móviles pequeñas | Low | Pruebas de renderizado responsive con Playwright y breakpoints Tailwind (`sm`, `md`, `lg`, `xl`). |

## Rollback Plan
Revertir los commits de cambios en los componentes TSX de `src/Frontend/src/` mediante Git.

## Dependencies
- `@tailwindcss/vite` 4.3.0
- `framer-motion` 12.40.0
- `@phosphor-icons/react` 2.1.10

## Success Criteria
- [ ] 100% de las páginas principales aprovechan adecuadamente la resolución horizontal sin márgenes muertos gigantes.
- [ ] Tamaño de letra legible en todas las tablas y textos (`>= 14px` para cuerpo).
- [ ] Sidebar colapsable operativo recuperando 176px de ancho de pantalla.
- [ ] 297/297 pruebas unitarias de backend e integración frontend pasando limpiamente.
