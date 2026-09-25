# Tasks Breakdown: Sprint 4 — Consulta Médica SOAP, Presupuesto, Consentimiento y Receta Digital

- [ ] **Task 1: Domain Entities & Database Schema Migration**
  - Path: `src/Backend/Veterinaria.Domain/Entities` & `Veterinaria.Infrastructure/Data/VeterinariaDbContext.cs`
  - Action: Update `HistorialClinico.cs` (add `Subjetivo`, `Objetivo`, `Analisis`, `Plan`, `Addendum`). Create `Presupuesto.cs`, `DetallePresupuesto.cs`, `Receta.cs`, `DetalleReceta.cs`. Configure EF Core relations & DbSets. Generate EF Migration `Sprint4_ConsultaSoap_Presupuesto_Receta`.

- [ ] **Task 2: Service Contracts & DTOs**
  - Path: `src/Backend/Veterinaria.Application/Interfaces` & `DTOs`
  - Action: Create `GuardarSoapDto`, `AddendumDto`, `CrearPresupuestoDto`, `CrearRecetaDto`. Define `IPresupuestoService` and `IRecetaService` interfaces. Update `IHistorialClinicoService`.

- [ ] **Task 3: Application Services Logic Implementation**
  - Path: `src/Backend/Veterinaria.Application/Services`
  - Action: Implement `HistorialClinicoService` SOAP draft, Addendum, and `CerrarAtencionAsync` auto-billing order creation. Implement `PresupuestoService` (budget creation & acceptance). Implement `RecetaService` (prescription creation & in-house vs external stock check).

- [ ] **Task 4: Web API Controllers Exposition**
  - Path: `src/Backend/Veterinaria.Web/Controllers`
  - Action: Update `HistorialesClinicosController.cs` (SOAP update, Addendum endpoint). Add `PresupuestosController.cs` and `RecetasController.cs`. Register services in `Program.cs`.

- [ ] **Task 5: Unit Tests Coverage**
  - Path: `src/Backend/Veterinaria.Tests/Application`
  - Action: Write tests for SOAP draft save, closed record immutability & Addendum, budget creation & acceptance, prescription stock handling, and `CerrarAtencionAsync` auto-billing order generation.

- [ ] **Task 6: Frontend UI Integration**
  - Path: `src/Frontend/src/views/Atencion` & `services`
  - Action: Build SOAP consultation intake view, previous history timeline component, prescription builder with in-house/external stock indicators, budget modal, and consent warning popup.
