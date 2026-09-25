# Exploration: Sprint 4 — Consulta Clínica SOAP, Presupuesto, Consentimiento y Receta Digital

## 1. Context & Objectives
Sprint 4 implements the core medical consultation workflow (**Consulta Clínica SOAP**) for veterinarians, including budget estimation (**Presupuesto**), informed consent (**Consentimiento Informado**), digital prescription with inventory integration (**Receta Digital**), and auto-generation of pending charges upon consultation closure (**Orden de Cobro**).

## 2. Requirements & Constraints Cross-Reference (RF + RNF + HU)

### Requirements Matrix
| ID | Source | Summary | Current Implementation Status | Gap Analysis / Action Required |
|---|---|---|---|---|
| **HU-007** | `05-historias-usuario.md` | SOAP Medical Consultation intake & history lookup | Partial (`HistorialClinico.cs`) | Field mapping to explicit SOAP format (Subjetivo, Objetivo, Análisis, Plan) needed in API/DTOs |
| **HU-008** | `05-historias-usuario.md` | Budget & Consent form prior to high-cost procedure | Partial (`Consentimiento.cs`) | `Presupuesto` entity does not exist. Needs creation + linking to Consentimiento & Cita |
| **HU-009** | `05-historias-usuario.md` | Digital prescription linked to inventory stock | Missing | `Receta` & `DetalleReceta` entities do not exist. Needs creation + stock validation against `Producto` |
| **RF-014** | `03-requisitos-funcionales.md` | Medical history in SOAP format | Partial | Structure DTOs and UI explicitly as SOAP (S: Motivo/Subjetivo, O: Examen/Objetivo, A: Diagnóstico/Análisis, P: Plan/Tratamiento) |
| **RF-015** | `03-requisitos-funcionales.md` | Display previous medical history of pet | Implemented in backend | Ensure UI component loads timeline of closed past consults during active SOAP entry |
| **RF-016** | `03-requisitos-funcionales.md` | Issue digital prescription from available stock | Missing | Create `Receta` entity, validate stock availability, link to `HistorialClinico` & `OrdenCobro` |
| **RF-017** | `03-requisitos-funcionales.md` | Generate budget & informed consent before procedure | Partial | Add `Presupuesto` model; enforce consent attachment before procedure execution |
| **RF-018** | `03-requisitos-funcionales.md` | Auto-generate pending charge order on consultation close | Partial (`CerrarAtencionAsync`) | Create/update pending `Pago`/`OrdenCobro` with consultation fee + prescribed items + procedure costs |
| **RNF-019** | `04-requisitos-no-funcionales.md` | Mandatory traceability for prescription-only drugs | Missing | Record prescriptor vet, client, pet, product, dosage, date on prescription items |
| **RNF-020** | `04-requisitos-no-funcionales.md` | Minimum 5-year retention of medical records | Missing policy | Soft check and retention date timestamp on `HistorialClinico` |
| **RNF-021** | `04-requisitos-no-funcionales.md` | Anonymize client data instead of deleting clinical records | Policy requirement | Will be enforced in client deletion handlers (retain pet/clinical entity with anonymized owner) |
| **RNF-022** | `04-requisitos-no-funcionales.md` | Block physical deletion of clinical records (even for Admin) | Missing restriction | Ensure no `Remove` / `DELETE` endpoint exists for `HistorialClinico` |

---

## 3. Architecture & Data Model Proposals

### Entity Modifications & Additions

1. **`HistorialClinico.cs` (Enhancement)**
   - Add explicit SOAP properties or aliases: `Subjetivo`, `Objetivo`, `Analisis`, `Plan`
   - Link `RecetaId` and `PresupuestoId` (nullable FKs)
   - Read-only enforcement when `Cerrado = true`

2. **`Presupuesto.cs` (New Entity)**
   - `Id`, `CitaId`, `MascotaId`, `UsuarioId`
   - `Items` (JSON or separate detail table: `Concepto`, `Cantidad`, `PrecioUnitario`, `Subtotal`)
   - `MontoTotal`, `Estado` (`Borrador`, `Aceptado`, `Rechazado`)
   - `FechaCreacion`, `FechaRespuesta`

3. **`Receta.cs` & `DetalleReceta.cs` (New Entities)**
   - `Receta`: `Id`, `HistorialClinicoId`, `CitaId`, `VeterinarioId`, `MascotaId`, `FechaEmision`, `ObservacionesPrescripcion`
   - `DetalleReceta`: `Id`, `RecetaId`, `ProductoId` (FK to `Producto`), `Dosis`, `Frecuencia`, `DuracionDias`, `CantidadPrescrita`, `RequiereRecetaObligatoria` (boolean from `Producto`)

---

## 4. Key Design Decisions for User Recommendation

1. **Stock Validation Strategy on Prescription Entry (HU-009)**
   - **Recommendation**: Allow adding item with warning indicator ⚠️ if low/zero stock, but **block closing consultation** until stock items are available or adjusted.

2. **Immutability of Closed Consultations (HU-007, RNF-022)**
   - **Recommendation**: Once `Cerrado = true`, record is 100% read-only for all roles. Physical deletion is strictly prohibited at API & EF Core level.

3. **Informed Consent Requirement Trigger (HU-008, RF-017)**
   - **Recommendation**: Mandatory consent signature required only when the consultation involves Surgical/Invasive procedures or when `Presupuesto` exceeds configured threshold.

4. **Auto-charge Generation (RF-018)**
   - **Recommendation**: Upon invoking `CerrarAtencionAsync`, auto-calculate total (Service price + Prescribed stock items + Procedures) and create/update pending billing record.

---

## 5. Next Steps
Move to `sdd-propose` to generate formal `proposal.md` detailing the schema migrations, application services, and endpoint contracts.
