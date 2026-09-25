# Technical Design: Sprint 4 — Consulta Médica SOAP, Presupuesto, Consentimiento y Receta Digital

## 1. System Architecture Diagram

```
[ Frontend: React / Vite ]
    │
    ├─> SOAP Consultation Form ────> PUT /api/HistorialesClinicos/{id} ────> HistorialClinicoService
    │                                                                             │
    ├─> Addendum Form ─────────────> POST /api/HistorialesClinicos/{id}/addendum ──┤
    │                                                                             │
    ├─> Budget Management ─────────> POST /api/Presupuestos ────────────────> PresupuestoService
    │                                PUT /api/Presupuestos/{id}/responder         │
    │                                                                             │
    ├─> Digital Prescription ──────> POST /api/Recetas ────────────────────> RecetaService
    │                                GET /api/Recetas/{id}/pdf                    │
    │                                                                             │
    └─> Complete Consultation ─────> POST /api/HistorialesClinicos/Cerrar/{citaId}
                                                                                  │
                                                                                  ▼
                                                                       Auto-generate OrdenCobro
                                                                       & Notify Reception (SignalR)
```

---

## 2. Database Schema Additions & Modifications

### Tables to Add:

```sql
-- Presupuestos
CREATE TABLE Presupuestos (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CitaId INT NOT NULL FOREIGN KEY REFERENCES Citas(Id),
    MascotaId INT NOT NULL FOREIGN KEY REFERENCES Mascotas(Id),
    UsuarioId INT NOT NULL FOREIGN KEY REFERENCES Usuarios(Id),
    VeterinarioId INT NOT NULL FOREIGN KEY REFERENCES Veterinarios(Id),
    MontoTotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    Estado NVARCHAR(50) NOT NULL DEFAULT 'Borrador', -- Borrador, PendienteAprobacion, Aceptado, Rechazado
    Observaciones NVARCHAR(500) NULL,
    FechaCreacion DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FechaRespuesta DATETIME2 NULL
);

-- DetallePresupuestos
CREATE TABLE DetallePresupuestos (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    PresupuestoId INT NOT NULL FOREIGN KEY REFERENCES Presupuestos(Id) ON DELETE CASCADE,
    Concepto NVARCHAR(200) NOT NULL,
    Cantidad INT NOT NULL DEFAULT 1,
    PrecioUnitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    Subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00
);

-- Recetas
CREATE TABLE Recetas (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    HistorialClinicoId INT NOT NULL FOREIGN KEY REFERENCES HistorialesClinicos(Id),
    CitaId INT NOT NULL FOREIGN KEY REFERENCES Citas(Id),
    MascotaId INT NOT NULL FOREIGN KEY REFERENCES Mascotas(Id),
    VeterinarioId INT NOT NULL FOREIGN KEY REFERENCES Veterinarios(Id),
    FechaEmision DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    IndicacionesGenerales NVARCHAR(1000) NULL
);

-- DetalleRecetas
CREATE TABLE DetalleRecetas (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    RecetaId INT NOT NULL FOREIGN KEY REFERENCES Recetas(Id) ON DELETE CASCADE,
    ProductoId INT NULL FOREIGN KEY REFERENCES Productos(Id),
    NombreProducto NVARCHAR(200) NOT NULL,
    Dosis NVARCHAR(100) NOT NULL,
    Frecuencia NVARCHAR(100) NOT NULL,
    DuracionDias INT NOT NULL DEFAULT 1,
    CantidadPrescrita INT NOT NULL DEFAULT 1,
    EsStockInterno BIT NOT NULL DEFAULT 1,
    RequiereRecetaObligatoria BIT NOT NULL DEFAULT 0
);
```

### Table Column Modifications (`HistorialesClinicos`):
- Add `Subjetivo` (NVARCHAR(1000) NULL)
- Add `Objetivo` (NVARCHAR(1000) NULL)
- Add `Analisis` (NVARCHAR(1000) NULL)
- Add `Plan` (NVARCHAR(1000) NULL)
- Add `Addendum` (NVARCHAR(2000) NULL)

---

## 3. Data Transfer Objects (DTOs)

```csharp
public class GuardarSoapDto
{
    public int CitaId { get; set; }
    public string? Subjetivo { get; set; }
    public string? Objetivo { get; set; }
    public string? Analisis { get; set; }
    public string? Plan { get; set; }
    public decimal? PesoActual { get; set; }
    public decimal? Temperatura { get; set; }
    public int? FrecuenciaCardiaca { get; set; }
}

public class AddendumDto
{
    public string Nota { get; set; } = default!;
}

public class CrearPresupuestoDto
{
    public int CitaId { get; set; }
    public string? Observaciones { get; set; }
    public List<DetallePresupuestoDto> Items { get; set; } = new();
}

public class DetallePresupuestoDto
{
    public string Concepto { get; set; } = default!;
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
}

public class CrearRecetaDto
{
    public int HistorialClinicoId { get; set; }
    public string? IndicacionesGenerales { get; set; }
    public List<DetalleRecetaDto> Items { get; set; } = new();
}

public class DetalleRecetaDto
{
    public int? ProductoId { get; set; }
    public string NombreProducto { get; set; } = default!;
    public string Dosis { get; set; } = default!;
    public string Frecuencia { get; set; } = default!;
    public int DuracionDias { get; set; }
    public int CantidadPrescrita { get; set; }
    public bool EsStockInterno { get; set; }
}
```

---

## 4. Sequence Diagram — Closing Consultation (`CerrarAtencionAsync`)

```
Vet User          HistorialClinicoService           ConsentService        Pago/Cita Order         SignalR
   │                         │                            │                     │                    │
   ├─ POST /Cerrar/{citaId} ─>│                            │                     │                    │
   │                         ├─ Check Cita & Historial ──>│                     │                    │
   │                         ├─ If Cirugía/Anestesia ────>│ Verify Consent      │                    │
   │                         │  Check Consent Aceptado ───>│                     │                    │
   │                         │                            │                     │                    │
   │                         ├─ Mark Historial.Cerrado = true                   │                    │
   │                         ├─ Update Cita.Estado = "Completada"               │                    │
   │                         ├─ Generate OrdenCobro (Fee + Receta + Presupuesto)│                    │
   │                         │  Add pending Pago record ───────────────────────>│                    │
   │                         ├─ Broadcast SignalR Notif ─────────────────────────────────────────────>│
   │<─ 200 OK (Success) ─────┤
```
