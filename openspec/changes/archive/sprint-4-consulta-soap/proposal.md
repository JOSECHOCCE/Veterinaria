# Proposal: Sprint 4 — Consulta Clínica SOAP, Presupuesto, Consentimiento y Receta Digital

## 1. Intent & Capability Scope
Provide veterinarians with an integrated, realistic clinical workflow for:
1. **SOAP Clinical Consultation (`HU-007`, `RF-014`, `RF-015`)**: Structured registration of Subjetivo, Objetivo, Análisis, and Plan, with instant timeline access to past closed medical records for the pet.
2. **Budget Estimation (`HU-008`, `RF-017`)**: Generation of medical budgets (`Presupuesto`) for treatment proposals, linked to consultation and procedure approval.
3. **Informed Consent (`HU-008`, `RF-017`)**: Mandatory signed consent requirement for surgical, anesthetic, and high-risk procedures prior to closing the consultation.
4. **Digital Prescription with Stock Awareness (`HU-009`, `RF-016`, `RNF-019`)**: Prescription of drugs with clear distinction between in-house inventory dispensing (adds to clinical bill) and external purchase prescriptions.
5. **Auto-billing Order Generation (`RF-018`)**: Automated generation of pending billing orders (`OrdenCobro`) upon consultation closure.

---

## 2. Technical Architecture & Component Changes

### A. Domain Entities (`Veterinaria.Domain.Entities`)

#### 1. `HistorialClinico.cs` (Enhancement)
- Add explicit SOAP properties mapping:
  - `Subjetivo` (string 1000): Anamnesis, owner observations, reason for visit
  - `Objetivo` (string 1000): Physical exam findings, vital signs summary (Peso, Temp, FC)
  - `Analisis` (string 1000): Differential diagnostic & clinical evaluation
  - `Plan` (string 1000): Treatment plan, procedures, recommendations
- Maintain legacy fields (`Diagnostico`, `Tratamiento`, etc.) via backwards-compatible computed getters/setters.
- `Addendum` / `NotasAclaratorias` (string 2000 nullable): Post-closure clarification notes without modifying original record.

#### 2. `Presupuesto.cs` (New Entity)
- `Id` (int PK)
- `CitaId` (int FK)
- `MascotaId` (int FK)
- `UsuarioId` (int FK - Client)
- `VeterinarioId` (int FK - Prescriptor)
- `MontoTotal` (decimal 10,2)
- `Estado` (string: `"Borrador"`, `"PendienteAprobacion"`, `"Aceptado"`, `"Rechazado"`)
- `Observaciones` (string 500)
- `FechaCreacion` (DateTime)
- `FechaRespuesta` (DateTime?)
- Navigation property: `List<DetallePresupuesto> Items`

#### 3. `DetallePresupuesto.cs` (New Entity)
- `Id` (int PK)
- `PresupuestoId` (int FK)
- `Concepto` (string 200)
- `Cantidad` (int)
- `PrecioUnitario` (decimal 10,2)
- `Subtotal` (decimal 10,2)

#### 4. `Receta.cs` & `DetalleReceta.cs` (New Entities)
- **`Receta`**:
  - `Id` (int PK)
  - `HistorialClinicoId` (int FK)
  - `CitaId` (int FK)
  - `MascotaId` (int FK)
  - `VeterinarioId` (int FK)
  - `FechaEmision` (DateTime)
  - `IndicacionesGenerales` (string 1000)
  - Navigation property: `List<DetalleReceta> Items`
- **`DetalleReceta`**:
  - `Id` (int PK)
  - `RecetaId` (int FK)
  - `ProductoId` (int? FK - Nullable if manual external drug)
  - `NombreProducto` (string 200)
  - `Dosis` (string 100 - e.g. "1 pastilla c/12h")
  - `Frecuencia` (string 100)
  - `DuracionDias` (int)
  - `CantidadPrescrita` (int)
  - `EsStockInterno` (bool - True if dispensed from clinic inventory)
  - `RequiereRecetaObligatoria` (bool - RNF-019 traceability indicator)

---

### B. Application Services (`Veterinaria.Application`)

1. **`IHistorialClinicoService` & `HistorialClinicoService`**:
   - Update `GuardarBorradorAsync` and `ActualizarBorradorAsync` for SOAP fields.
   - Add `AgregarAddendumAsync(int historialId, string nota, string userEmail)`.
   - Update `CerrarAtencionAsync(int citaId)` to auto-generate `OrdenCobro` pending order containing consultation fee + internal prescription items + accepted budget procedures.

2. **`IPresupuestoService` & `PresupuestoService` (New Service)**:
   - `CrearPresupuestoAsync(Presupuesto presupuesto)`
   - `ResponderPresupuestoAsync(int presupuestoId, bool aceptado)`
   - `GetPresupuestosByCitaIdAsync(int citaId)`

3. **`IRecetaService` & `RecetaService` (New Service)**:
   - `CrearRecetaAsync(Receta receta)`
   - `GetRecetaByHistorialIdAsync(int historialId)`
   - `ObtenerStockDisponibleProductosAsync(List<int> productoIds)` (Check in-house stock)

---

### C. Web Controllers (`Veterinaria.Web.Controllers`)

1. **`HistorialesClinicosController.cs`**:
   - Update `PUT /api/HistorialesClinicos/{id}` for SOAP.
   - `POST /api/HistorialesClinicos/{id}/addendum` (Add post-closure clarification note).
2. **`PresupuestosController.cs` (New Controller)**:
   - `POST /api/Presupuestos`
   - `PUT /api/Presupuestos/{id}/responder`
   - `GET /api/Presupuestos/cita/{citaId}`
3. **`RecetasController.cs` (New Controller)**:
   - `POST /api/Recetas`
   - `GET /api/Recetas/historial/{historialId}`
   - `GET /api/Recetas/{id}/pdf` (Generate digital prescription PDF)

---

## 3. Real-World Clinical Validation Rules

1. **Receta vs. Stock**:
   - Veterinarians can prescribe any drug needed.
   - Items with `EsStockInterno = true` check inventory availability. If stock is zero, warning ⚠️ is displayed and item defaults to `EsStockInterno = false` (external purchase) so consultation closure is **never blocked**.
2. **Consent Requirement**:
   - If service category is `Cirugía`, `Anestesia` or `Hospitalización`, `CerrarAtencionAsync` verifies that `Consentimiento.Aceptado == true` exists for the pet/cita.
3. **Immutability & Legal Compliance**:
   - Once `Cerrado = true`, record cannot be updated directly or deleted. Only `Addendum` entries are appended.

---

## 4. Acceptance Criteria (Definition of Done)

- [ ] **AC-1**: Veterinarian can save draft and update clinical consultation in explicit SOAP format (Subjetivo, Objetivo, Análisis, Plan).
- [ ] **AC-2**: Past closed medical records for the pet can be viewed in a timeline view during active consultation.
- [ ] **AC-3**: Prescriptions can be generated with automatic distinction between internal inventory items and external purchase items.
- [ ] **AC-4**: High-risk services require an accepted informed consent prior to closing consultation.
- [ ] **AC-5**: Closing consultation auto-generates a pending billing order with total fees.
- [ ] **AC-6**: Closed consultation is immutable; addendums can be appended with timestamp & author audit.
- [ ] **AC-7**: All unit tests pass (`dotnet test`) and TypeScript compiles without errors (`npx tsc -b`).
