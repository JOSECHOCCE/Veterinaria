# Proposal: Rediseño Profesional del Dashboard POS/Veterinario

## Intent

Transformar el dashboard actual de la aplicación (`src/Frontend/src/views/Dashboard/Dashboard.tsx`) en un panel de control comercial de alto rendimiento UI/UX, inspirado en sistemas SaaS/POS profesionales (Mi Cafetería, Panadería, Zapatería). Se busca mejorar la jerarquía visual, tematización de color pastel por indicador, visualización de ventas en curva limpia y bloques de alerta para stock crítico de insumos/medicamentos.

## Scope

### In Scope
- **Tarjetas KPI Tintadas (Pastel Tints)**: Rediseñar las métricas principales (Ventas del día, Recaudación del mes, Mascotas/Citas atendidas, Ticket promedio) con fondos pastel armónicos (`bg-orange-50`, `bg-blue-50`, `bg-emerald-50`, `bg-purple-50`) y bordes suavemente redondeados (`rounded-2xl`).
- **Barra de Saludo y Acción Rápida (Header)**: Saludo dinámico con fecha formateada y botón destacado CTA (`+ Nueva Cita` / `+ Registrar Venta`).
- **Gráfico de Tendencia de Ventas (Area Chart)**: Gráfico de curva suave (`monotone`) con gradiente de transparencia y tooltips limpios en soles (`S/`).
- **Gráfico de Distribución por Categoría/Servicios (Donut Chart)**: Gráfico de anillo centrado con leyenda clara a la derecha (Consultas, Alimentos, Cirugías, Vacunas, Productos).
- **Sección de Alerta de Stock Crítico**: Banner destacado en tono rosa pastel para listar insumos o medicamentos próximos a agotarse.
- **Tabla de Últimas Transacciones / Atenciones**: Resumen visual limpio con badges de estado (`Completada`, `En Atención`, `Pendiente`).

### Out of Scope
- Modificación de la API Backend en C# (se utilizará la estructura de datos existente provista por `dashboardService.getDashboardData()`).
- Cambios en las vistas de configuración o reportes avanzados fuera del dashboard principal.

## Capabilities

### New Capabilities
- `pos-dashboard-ui`: Componentes visuales temáticos para dashboards comerciales de alto impacto (KpiCard pastel, SalesAreaChart, CategoryDonutChart, StockAlertBanner).

### Modified Capabilities
- `dashboard-view`: Actualización de la vista principal del Dashboard en React para consumir el nuevo layout UI/UX.

## Approach

1. **Librería de Gráficos**: Integrar `recharts` para gráficos vectoriales responsivos con gradientes y curvas `monotone`.
2. **Sistema de Componentes Modular**:
   - `KpiCard.tsx`: Componente de métricas reutilizable con soporte de variantes pastel (`orange`, `blue`, `green`, `purple`, `rose`).
   - `SalesTrendChart.tsx`: Gráfico de área con gradiente de color y tooltips formateados en moneda local (`S/`).
   - `CategoryDistributionChart.tsx`: Gráfico de donut responsivo.
   - `LowStockAlertBanner.tsx`: Banner de aviso de productos en stock mínimo.
3. **Consumo de Datos**: Enlazar los componentes al servicio de dashboard existente `DashboardViewModelDto` manteniendo la compatibilidad con roles (Admin vs Recepcionista).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/Frontend/src/views/Dashboard/Dashboard.tsx` | Modified | Reemplazo del layout actual por la nueva estructura comercial |
| `src/Frontend/src/components/dashboard/` | New | Nuevos componentes de tarjetas KPI y gráficos de Recharts |
| `src/Frontend/package.json` | Modified | Adición de la dependencia `recharts` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Incompatibilidad de Recharts con React 19 en Vite | Low | Verificar compatibilidad o usar flags `--legacy-peer-deps` / SVG puro si se requiere |
| Renderizado en pantallas móviles estrechas | Med | Garantizar diseño responsivo `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` |

## Rollback Plan

Si ocurren fallas en el renderizado, revertir los cambios en `Dashboard.tsx` usando Git `git checkout HEAD -- src/Frontend/src/views/Dashboard/Dashboard.tsx`.

## Dependencies

- Instalación de `recharts` en `src/Frontend`.

## Success Criteria

- [ ] Las 4 tarjetas KPI muestran montos en soles con fondos de color pastel y bordes redondeados `rounded-2xl`.
- [ ] El gráfico de tendencia de ventas muestra una curva con área en gradiente sin saturar los ejes.
- [ ] El gráfico de dona muestra la proporción por categorías con leyenda clara.
- [ ] El banner de stock crítico alerta visiblemente sobre productos/medicamentos bajos.
- [ ] La aplicación compila sin errores de TypeScript ni linter.
