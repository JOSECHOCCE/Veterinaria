---
name: csharp-dotnet
description: Patrones C# profesionales, naming conventions, estructura de código y buenas prácticas para proyectos .NET Core. Usar cuando escribas o refactorices cualquier archivo .cs.
category: generic
agents: [backend]
triggers:
  backend: "Crear DTOs de entrada o salida"
---

## Cuándo usar esta skill
- Crear o modificar clases, interfaces, servicios, controllers
- Crear DTOs, validators, repositories
- Refactorizar cualquier archivo `.cs`

---

## Naming Conventions

- Clases, interfaces, métodos → `PascalCase`
- Variables locales, parámetros → `camelCase`
- Constantes → `UPPER_SNAKE_CASE`
- Campos privados → `_camelCase` (con guión bajo al inicio)

```csharp
// ✅ CORRECTO
public class CitaApplication { }
public interface ICitaApplication { }
private readonly ICitaRepository _citaRepository;
public const int MAX_CITAS_DIA = 20;

// ❌ NEVER
var x = new Cita();
private ICitaRepository citaRepository; // sin guión bajo
```

---

## Interfaces (REQUIRED)

- ALWAYS: Programar contra interfaces, nunca contra implementaciones concretas
- NEVER: Instanciar repositorios o servicios con `new` dentro de clases de negocio

```csharp
// ✅ CORRECTO
public class CitaApplication
{
    private readonly ICitaRepository _repo;
    public CitaApplication(ICitaRepository repo) => _repo = repo;
}

// ❌ NEVER
private readonly CitaRepository _repo; // implementación concreta
```

---

## Patrón Response<T> (REQUIRED)

Todas las respuestas de la capa Application deben usar `Response<T>`.

```csharp
// ✅ Éxito con datos
return new Response<CitaDto> { IsSuccess = true, Data = citaDto };

// ✅ Error de negocio
return new Response<CitaDto> { IsSuccess = false, Message = "Cita no encontrada" };

// ❌ NEVER: lanzar excepciones para errores de negocio esperados
throw new Exception("Cita no encontrada"); // NO
```

---

## Async / Await (REQUIRED)

- ALWAYS: sufijo `Async` en todos los métodos asíncronos
- ALWAYS: `await` en todas las llamadas asíncronas
- NEVER: `.Result` o `.Wait()` (provocan deadlocks)

```csharp
// ✅ CORRECTO
public async Task<Response<CitaDto>> ObtenerCitaAsync(int id)
{
    var cita = await _repo.GetByIdAsync(id);
    return new Response<CitaDto> { IsSuccess = true, Data = _mapper.Map<CitaDto>(cita) };
}

// ❌ NEVER
var cita = _repo.GetByIdAsync(id).Result;
```

---

## Inyección de Dependencias (REQUIRED)

- ALWAYS: por constructor
- NEVER: `new` dentro de clases de negocio

```csharp
// ✅ CORRECTO
public class CitaApplication : ICitaApplication
{
    private readonly ICitaRepository _citaRepo;
    private readonly IUnitOfWork _unitOfWork;

    public CitaApplication(ICitaRepository citaRepo, IUnitOfWork unitOfWork)
    {
        _citaRepo = citaRepo;
        _unitOfWork = unitOfWork;
    }
}
```

---

## Manejo de Errores (REQUIRED)

- ALWAYS: validar en Application antes de ejecutar lógica
- ALWAYS: el Middleware global captura excepciones no controladas
- NEVER: exponer stack trace o mensajes técnicos al cliente
- NEVER: `try/catch` vacíos que oculten errores

```csharp
// ✅ CORRECTO
if (dto == null)
    return new Response<CitaDto> { IsSuccess = false, Message = "Datos inválidos" };

// ❌ NEVER
return BadRequest(ex.StackTrace);
return BadRequest(ex.Message); // puede exponer detalles internos
```

---

## Eliminación (REQUIRED)

- ALWAYS: eliminación lógica con campo `Activo = false`
- NEVER: DELETE físico si el registro tiene historial asociado

```csharp
// ✅ CORRECTO
entidad.Activo = false;
await _unitOfWork.SaveAsync();

// ❌ NEVER
_context.Citas.Remove(cita);
```

