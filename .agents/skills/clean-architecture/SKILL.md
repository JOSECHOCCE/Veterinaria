---
name: clean-architecture
description: Onion Architecture para .NET Core. Vigila que las dependencias fluyan correctamente entre capas. Usar cuando crees, muevas o reorganices clases entre Domain, Application, Infrastructure y Web.
category: generic
agents: [backend]
triggers:
  backend:
    - "Crear o modificar un Service (Application layer)"
    - "Crear o modificar una Interface"
---

## Cuándo usar esta skill
- Crear un nuevo proyecto o capa
- Mover clases entre capas
- Agregar dependencias entre proyectos
- Revisar si una clase está en la capa correcta

---

## Regla de Oro: Dirección de Dependencias

```text
VetCare.Web
    ↓
VetCare.Application
    ↓
VetCare.Domain
    ↑
VetCare.Infrastructure → implementa contratos de Domain
```

- ALWAYS: Las dependencias apuntan hacia adentro (hacia Domain)
- NEVER: Domain depende de cualquier otra capa
- NEVER: Application importa clases de Infrastructure directamente

---

## Qué va en cada capa

### Domain (núcleo puro)
- ALWAYS: Solo C# puro. Sin EF, sin ASP.NET, sin librerías externas
- Entidades con propiedades y reglas de negocio internas
- Interfaces de repositorios (`IClienteRepository`, `IUnitOfWork`)

```csharp
// ✅ Domain solo conoce C# puro
public class Cita
{
    public int Id { get; set; }
    public DateTime FechaHora { get; set; }
    public bool Activo { get; set; } = true;
}

// ❌ NEVER en Domain
using Microsoft.EntityFrameworkCore; // NO
[Required] // NO - Data Annotations pertenecen a Infrastructure
```

### Application (casos de uso)
- ALWAYS: Recibe DTOs, devuelve DTOs (nunca entidades de Domain)
- ALWAYS: Depende solo de interfaces de Domain
- DTOs de entrada (`CitaCreateDto`) y salida (`CitaDto`)
- Interfaces de servicios (`ICitaApplication`)
- Implementaciones de servicios (`CitaApplication`)
- Validators por entidad

```csharp
// ✅ Application usa interfaces, no implementaciones
public class CitaApplication : ICitaApplication
{
    private readonly ICitaRepository _repo; // interfaz de Domain ✅
}

// ❌ NEVER en Application
private readonly VetCareDbContext _context; // Infrastructure NO
```

### Infrastructure (implementación externa)
- ALWAYS: Implementa las interfaces definidas en Domain
- DbContext, Repositories con EF Core, JWT, BCrypt
- Configuraciones Fluent API (`IEntityTypeConfiguration<T>`)

```csharp
// ✅ Infrastructure implementa contratos de Domain
public class CitaRepository : ICitaRepository
{
    private readonly VetCareDbContext _context;
    public async Task<Cita> GetByIdAsync(int id)
        => await _context.Citas.FindAsync(id);
}
```

### Web (presentación)
- ALWAYS: Controllers limpios — reciben JSON, invocan Application, devuelven `Response<T>`
- ALWAYS: Registrar dependencias en `Program.cs`
- NEVER: Lógica de negocio en Controllers
- NEVER: Acceso directo a DbContext desde Controllers

```csharp
// ✅ Controller limpio
[HttpGet("{id}")]
public async Task<IActionResult> GetById(int id)
{
    var response = await _citaApplication.ObtenerCitaAsync(id);
    return Ok(response);
}

// ❌ NEVER en Controller
var cita = await _context.Citas.FindAsync(id); // NO
```

---

## Checklist antes de agregar una clase

- [ ] ¿Tiene lógica de negocio pura? → `Domain/Entities`
- [ ] ¿Orquesta un flujo de la app? → `Application/Main`
- [ ] ¿Define un contrato? → `Domain/Interfaces` o `Application/Interfaces`
- [ ] ¿Conecta con EF, JWT, BCrypt? → `Infrastructure`
- [ ] ¿Es un endpoint HTTP? → `Web/Controllers`
