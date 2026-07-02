---
name: vetcare-api
description: Endpoints, DTOs, controllers y contratos de la API REST de VetCare. Usar cuando crees o modifiques controllers, DTOs, servicios de Application o rutas del backend.
---

## Cuándo usar esta skill
- Crear o modificar un Controller
- Crear DTOs de entrada o salida
- Definir una nueva ruta de la API
- Revisar qué rol puede acceder a qué endpoint

---

## Convención de rutas

```text
/api/auth           → Autenticación
/api/usuarios       → Gestión de usuarios internos
/api/clientes       → Gestión de clientes
/api/mascotas       → Gestión de mascotas
/api/servicios      → Catálogo de servicios
/api/citas          → Agenda y citas
/api/atenciones     → Atención clínica
/api/pagos          → Pagos y cobros
/api/notificaciones → Notificaciones
/api/reportes       → Dashboard y reportes
```

---

## Endpoints por módulo

### Auth
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/api/auth/login` | Público | Login, devuelve JWT |
| POST | `/api/auth/registro` | Público | Auto-registro de cliente |

### Clientes
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/api/clientes` | Recepcionista, Admin | Listar con búsqueda |
| GET | `/api/clientes/{id}` | Recepcionista, Admin | Ficha del cliente |
| POST | `/api/clientes` | Recepcionista, Admin | Crear cliente |
| PUT | `/api/clientes/{id}` | Recepcionista, Admin | Editar cliente |
| PATCH | `/api/clientes/{id}/inactivar` | Admin | Inactivar cliente |

### Mascotas
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/api/mascotas` | Recepcionista, Admin | Listar mascotas |
| GET | `/api/mascotas/{id}` | Recepcionista, Admin, Veterinario | Ficha completa |
| POST | `/api/mascotas` | Recepcionista, Admin, Cliente | Registrar mascota |
| PUT | `/api/mascotas/{id}` | Recepcionista, Admin | Editar mascota |
| PATCH | `/api/mascotas/{id}/inactivar` | Admin | Inactivar mascota |
| PATCH | `/api/mascotas/{id}/responsable` | Admin | Cambiar responsable |

### Servicios
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/api/servicios` | Todos | Listar servicios activos |
| POST | `/api/servicios` | Admin | Crear servicio |
| PUT | `/api/servicios/{id}` | Admin | Editar servicio |
| PATCH | `/api/servicios/{id}/estado` | Admin | Activar/desactivar |

### Citas
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/api/citas` | Recepcionista, Admin, Veterinario | Listar con filtros |
| GET | `/api/citas/{id}` | Recepcionista, Admin, Veterinario | Detalle de cita |
| GET | `/api/citas/disponibilidad` | Todos | Bloques disponibles |
| POST | `/api/citas` | Recepcionista, Admin, Cliente | Crear/solicitar cita |
| PATCH | `/api/citas/{id}/confirmar` | Recepcionista, Admin | Confirmar |
| PATCH | `/api/citas/{id}/cancelar` | Todos (con reglas) | Cancelar |
| PATCH | `/api/citas/{id}/rechazar` | Recepcionista, Admin | Rechazar |
| PATCH | `/api/citas/{id}/reprogramar` | Recepcionista, Admin | Reprogramar |
| PATCH | `/api/citas/{id}/llegada` | Recepcionista | Marcar en espera |
| PATCH | `/api/citas/{id}/iniciar` | Veterinario | Iniciar atención |
| PATCH | `/api/citas/{id}/no-asistio` | Recepcionista | Marcar no asistencia |

### Atenciones
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/api/atenciones/{citaId}` | Veterinario, Admin | Ver atención |
| POST | `/api/atenciones` | Veterinario | Crear atención |
| PUT | `/api/atenciones/{id}` | Veterinario | Editar (solo si abierta) |
| PATCH | `/api/atenciones/{id}/cerrar` | Veterinario | Cerrar atención |

### Pagos
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/api/pagos` | Recepcionista, Admin | Registrar cobro |
| PATCH | `/api/pagos/{id}/anular` | Admin | Anular pago |
| GET | `/api/pagos/{id}/comprobante` | Recepcionista, Admin, Cliente | PDF comprobante |

---

## DTOs principales

```csharp
// Login
public class LoginDto
{
    public string Email { get; set; }
    public string Password { get; set; }
}

public class LoginResponseDto
{
    public string Token { get; set; }
    public string Rol { get; set; }
    public string NombreCompleto { get; set; }
}

// Cita
public class CitaCreateDto
{
    public int MascotaId { get; set; }
    public int ServicioId { get; set; }
    public DateTime FechaHora { get; set; }
    public int? VeterinarioId { get; set; }
    public string? Motivo { get; set; }
    public string? Canal { get; set; }
}

public class CitaDto
{
    public int Id { get; set; }
    public DateTime FechaHora { get; set; }
    public string Estado { get; set; }
    public string? Motivo { get; set; }
    public bool EsUrgencia { get; set; }
    public MascotaResumenDto Mascota { get; set; }
    public ServicioResumenDto Servicio { get; set; }
    public VeterinarioResumenDto? Veterinario { get; set; }
}

// Pago
public class PagoCreateDto
{
    public int CitaId { get; set; }
    public decimal MontoTotal { get; set; }
    public decimal MontoPagado { get; set; }
    public string MetodoPago { get; set; }
    public string? NumeroOperacion { get; set; }
    public string? Observacion { get; set; }
}
```

---

## Patrón de Controller (REQUIRED)

```csharp
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CitasController : ControllerBase
{
    private readonly ICitaApplication _citaApplication;

    public CitasController(ICitaApplication citaApplication)
    {
        _citaApplication = citaApplication;
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Recepcionista,Administrador,Veterinario")]
    public async Task<IActionResult> GetById(int id)
    {
        var response = await _citaApplication.ObtenerPorIdAsync(id);
        return Ok(response);
    }

    [HttpPost]
    [Authorize(Roles = "Recepcionista,Administrador,Cliente")]
    public async Task<IActionResult> Crear(CitaCreateDto dto)
    {
        var response = await _citaApplication.CrearAsync(dto);
        return Ok(response);
    }
}
```

---

## NEVER en Controllers

- NEVER: lógica de negocio dentro del controller
- NEVER: acceso directo a DbContext
- NEVER: devolver entidades de Domain (solo DTOs)
- NEVER: endpoint sin decorador `[Authorize]` salvo login y registro
