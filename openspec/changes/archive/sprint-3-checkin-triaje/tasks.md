# Tasks Breakdown: Sprint 3 — Check-in y Triaje

- [x] **Task 1: Add Check-in logic to CitaService**
  - Path: `src/Backend/Veterinaria.Application/Interfaces/ICitaService.cs` & `Services/CitaService.cs`
  - Action: Implement `CheckInCitaAsync(int citaId)` transitioning `Cita.Estado` to `"EnSalaDeEspera"` and creating linked `Triage` entry.

- [x] **Task 2: Enhance TriageService vital signs & priority queue**
  - Path: `src/Backend/Veterinaria.Application/Interfaces/ITriageService.cs` & `Services/TriageService.cs`
  - Action: Add `RegistrarSignosVitalesAsync` and enforce queue sorting by priority level (`N1` > `N2` > `N3`).

- [x] **Task 3: Expose Check-in and Triage endpoints in Web API**
  - Path: `src/Backend/Veterinaria.Web/Controllers/CitasController.cs` & `TriageController.cs`
  - Action: Add `POST /api/citas/{id}/check-in` and `PUT /api/triage/{id}/signos-vitales` endpoints with proper authorization.

- [x] **Task 4: Write Unit Tests**
  - Path: `src/Backend/Veterinaria.Tests/Application/CitaServiceTests.cs` & `TriageServiceTests.cs`
  - Action: Add test cases for valid check-in, invalid status rejection, triaje vital signs update, and priority queue ordering.

- [x] **Task 5: Frontend Check-in & Triaje UI integration**
  - Path: `src/Frontend/src/views/Atencion/ColaAtencion.tsx` & `Triage.tsx`
  - Action: Connect Check-in action button and vital signs input form modal.

- [x] **Task 6: Verification & Test Execution**
  - Action: Run `dotnet test` and `npx tsc -b` to verify zero build errors and 100% passing tests.
