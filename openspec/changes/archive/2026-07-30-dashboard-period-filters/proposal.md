# Proposal: Filtros por Período de Tiempo en Dashboard (Hoy / Semana / Mes)

## Intent

Permitir a los administradores y personal operativo filtrar las métricas, gráficos e indicadores clave de rendimiento (KPIs) del dashboard por rango de tiempo (`Hoy`, `7 Días` / `Semana`, `30 Días` / `Este Mes`), evitando datos estáticos y permitiendo análisis comparativos de rendimiento comercial y operativo en la veterinaria.

## Scope

### In Scope
- Parámetro de consulta `periodo` (`hoy`, `semana`, `mes`) en el endpoint `/api/Dashboard` del backend C# .NET.
- Filtrado en backend (EF Core queries) de ingresos, citas, servicios más solicitados y veterinarios más activos según el rango seleccionado.
- Componente de selector de período tipo "Pill Toggle" (`Hoy` | `7 Días` | `Este Mes`) en el header del Dashboard en React.
- Actualización dinámica de KPI cards, gráficos y tablas sin recargar la página.

### Out of Scope
- Date picker para rangos de fecha personalizados (reservado para la vista de Reportes e Ingresos).
- Exportación a PDF/Excel del dashboard (reservado para módulo de Reportes).

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `dashboard-view`: Agregar requerimiento de filtrado por período de tiempo (`hoy`, `semana`, `mes`) a través del backend API y selector de UI.

## Approach

1. Modificar `IDashboardService` y `DashboardService` en C# para aceptar el enum/string `periodo` (valores: `"hoy"`, `"semana"`, `"mes"`).
2. Actualizar `DashboardController` para aceptar `[FromQuery] string periodo = "mes"`.
3. Ajustar consultas LINQ en `DashboardService` para calcular rangos de `DateTime.UtcNow` basados en `periodo`.
4. En el Frontend React (`Dashboard.tsx`), agregar estado `periodo` (`'hoy' | 'semana' | 'mes'`), pasar el parámetro a `dashboardService.getDashboardData(periodo)`, y renderizar la barra de pills interactiva en la cabecera.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/Backend/Veterinaria.Application/Interfaces/IDashboardService.cs` | Modified | Firma del método con parámetro `periodo` |
| `src/Backend/Veterinaria.Infrastructure/Services/DashboardService.cs` | Modified | Consultas LINQ filtradas por rango |
| `src/Backend/Veterinaria.Web/Controllers/DashboardController.cs` | Modified | Endpoint con query param `periodo` |
| `src/Frontend/src/services/dashboard.service.ts` | Modified | Método `getDashboardData(periodo)` |
| `src/Frontend/src/views/Dashboard/Dashboard.tsx` | Modified | Selector de pills y recarga dinámica |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Consultas LINQ lentas con grandes rangos de fechas | Low | Índices en `FechaHora` (Citas) y `FechaPago` (Pagos) |
| Incompatibilidad con datos por defecto | Low | Fallback por defecto a `"mes"` si no se envía parámetro |

## Rollback Plan

Revertir los cambios en `DashboardController` y `DashboardService` para omitir el parámetro `periodo` y retornar la vista mensual predeterminada.

## Dependencies

- Ninguna externa. Usar infraestructura EF Core y React State existente.

## Success Criteria

- [ ] El endpoint `/api/Dashboard?periodo=hoy` retorna KPIs y estadísticas calculadas estrictamente para la fecha actual UTC/Local.
- [ ] El endpoint `/api/Dashboard?periodo=semana` retorna estadísticas de los últimos 7 días.
- [ ] El endpoint `/api/Dashboard?periodo=mes` retorna estadísticas de los últimos 30 días / mes actual.
- [ ] Al hacer clic en los botones `Hoy`, `7 Días` y `Este Mes` en la UI, el dashboard actualiza sus datos en tiempo real con indicador de carga.
