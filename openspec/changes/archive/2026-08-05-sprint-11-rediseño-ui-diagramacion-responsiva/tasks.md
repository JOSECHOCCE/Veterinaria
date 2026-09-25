# Tasks: Rediseño UI, Diagramación, Jerarquía Tipográfica y Layout Responsivo

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 250 - 350 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | single PR |
| Delivery strategy | auto-chain |
| Chain strategy | single-pr |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: single-pr
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Refactorización de tokens CSS y Sidebar colapsable | PR 1 | `npm run lint` | Navegación UI manual | `index.css`, `Sidebar.tsx` |
| 2 | Layout responsivo de Dashboard y POS Ventas | PR 1 | `npx tsc -b` | Renderizado POS y KPIs | `Dashboard.tsx`, `GestionVentas.tsx` |
| 3 | Split Screen de Triaje / SOAP y Pasaporte Mascota | PR 1 | `dotnet test` | Formulario SOAP y Ficha | `HistoriaClinicaSOAP.tsx`, `DetalleMascota.tsx` |

## Phase 1: Foundation / CSS Design System & Sidebar Toggle

- [ ] 1.1 Actualizar `src/Frontend/src/index.css` aumentando la escala base a `14px` (`0.875rem`) para textos de tablas, celdas compactas (`py-2.5`) y contenedores responsivos max-width.
- [ ] 1.2 Actualizar `src/Frontend/src/components/Layout/Sidebar.tsx` agregando toggle de estado compacto/extendido (`w-20` vs `w-64`) con animaciones suaves.

## Phase 2: Core Layout Refactoring (Dashboard & POS Ventas)

- [ ] 2.1 Refactorizar `src/Frontend/src/views/Dashboard/Dashboard.tsx` organizando KPIs en grilla dinámicamente adaptativa (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`) y resaltando valores numéricos a `30px font-black`.
- [ ] 2.2 Refactorizar `src/Frontend/src/views/Ventas/GestionVentas.tsx` a layout de pantalla completa `h-[calc(100vh-4rem)]` con 2 columnas fijas (65% catálogo visual / 35% carrito persistente).

## Phase 3: Split Screen Clinical Layout & Pet Passport

- [ ] 2.1 Refactorizar `src/Frontend/src/views/Atencion/HistoriaClinicaSOAP.tsx` disponiendo los signos vitales/antecedentes en el panel izquierdo (30%) y el formulario SOAP en el panel derecho (70%).
- [ ] 2.2 Refactorizar `src/Frontend/src/views/Mascotas/DetalleMascota.tsx` en estilo Ficha Pasaporte Médico Veterinario con avatar destacado, estado de vacunas y métricas clave.

## Phase 4: Testing & Verification

- [ ] 4.1 Ejecutar linter y TypeScript build checker (`npm run lint` & `npx tsc -b`).
- [ ] 4.2 Ejecutar suite de pruebas unitarias (`dotnet test` en `src/Backend`) para asegurar 100% de pasadas.
