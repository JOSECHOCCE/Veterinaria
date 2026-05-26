
# Diseño simple de base de datos veterinaria con EF Core Code First

## Objetivo
Propuesta simple, clara y fácil de implementar para una arquitectura MVC con capas **Web**, **Domain** e **Infrastructure** usando **SQL Server** y **Entity Framework Core**.

## 1) Entidades principales

### Cliente
Representa al dueño de la mascota.

Propiedades sugeridas:
- Id
- Nombres
- Apellidos
- DocumentoIdentidad
- Telefono
- Email
- Direccion
- Activo
- FechaRegistro

### Mascota
Representa al paciente veterinario.

Propiedades sugeridas:
- Id
- ClienteId
- Nombre
- Especie
- Raza
- Sexo
- FechaNacimiento
- Color
- Peso
- TieneMicrochip
- NumeroMicrochip
- Activa

### Cita
Representa la reserva o atención programada.

Propiedades sugeridas:
- Id
- ClienteId
- MascotaId
- VeterinarioId
- FechaHora
- Motivo
- Estado
- Observaciones
- CreadaEn

### Usuario
Representa al usuario interno del sistema.

Propiedades sugeridas:
- Id
- RolId
- Nombres
- Apellidos
- Email
- PasswordHash
- Activo
- FechaCreacion

### Rol
Representa el perfil de acceso.

Propiedades sugeridas:
- Id
- Nombre
- Descripcion
- Activo

### Triage
Registra la prioridad de atención.

Propiedades sugeridas:
- Id
- CitaId
- MascotaId
- UsuarioId
- Nivel
- Sintomas
- PrioridadColor
- TiempoEsperaEstimadoMin
- FechaRegistro

### HistoriaClinica
Registra la atención clínica básica.

Propiedades sugeridas:
- Id
- MascotaId
- UsuarioId
- CitaId
- MotivoConsulta
- Hallazgos
- Diagnostico
- Tratamiento
- Indicaciones
- FechaAtencion

### Consentimiento
Registra la aceptación legal y de comunicaciones.

Propiedades sugeridas:
- Id
- ClienteId
- TipoConsentimiento
- Aceptado
- FechaAceptacion
- IpOrigen
- Observaciones

### Pago
Registro simple de cobro o depósito.

Propiedades sugeridas:
- Id
- CitaId
- ClienteId
- Monto
- TipoPago
- EstadoPago
- MetodoPago
- Referencia
- FechaPago

### Recordatorio
Envía o registra recordatorios de cita.

Propiedades sugeridas:
- Id
- CitaId
- Medio
- Mensaje
- FechaProgramada
- FechaEnviada
- Estado
- Reintentado

## 2) Relaciones entre entidades

Relaciones simples recomendadas:
- Un **Cliente** tiene muchas **Mascotas**.
- Un **Cliente** tiene muchas **Citas**.
- Una **Mascota** pertenece a un **Cliente**.
- Una **Mascota** puede tener muchas **Citas**.
- Una **Cita** pertenece a un **Cliente** y a una **Mascota**.
- Una **Cita** puede tener una o varias **HistoriaClinica** si luego deseas varias atenciones; para simplificar, aquí se recomienda una relación 1 a 1 o 1 a muchos limitada según tu flujo.
- Una **Cita** puede tener un **Triage**.
- Una **Cita** puede tener un **Pago**.
- Una **Cita** puede tener muchos **Recordatorio**.
- Un **Cliente** puede tener muchos **Consentimiento**.
- Un **Rol** tiene muchos **Usuario**.
- Un **Usuario** puede registrar **Triage** e **HistoriaClinica**.

Relación mínima recomendada para MVP:
- Cliente 1..N Mascota
- Cliente 1..N Cita
- Mascota 1..N Cita
- Cita 1..1 Triage
- Cita 1..1 HistoriaClinica
- Cita 1..1 Pago
- Cita 1..N Recordatorio
- Cliente 1..N Consentimiento
- Rol 1..N Usuario

## 3) Entidades en Domain

En la capa **Domain** deben ir solo las entidades de negocio y sus reglas simples:
- Cliente
- Mascota
- Cita
- Usuario
- Rol
- Triage
- HistoriaClinica
- Consentimiento
- Pago
- Recordatorio

También puedes incluir:
- enums como EstadoCita, EstadoPago, MetodoPago, NivelTriage, MedioRecordatorio, TipoConsentimiento
- interfaces de repositorio si quieres abstraer acceso a datos

## 4) DbContext y configuraciones en Infrastructure

En **Infrastructure** conviene crear:
- `VeterinariaDbContext`
- configuraciones por entidad con `IEntityTypeConfiguration<T>`
- repositorios concretos
- migraciones

Configuraciones mínimas sugeridas:
- ClienteConfiguration
- MascotaConfiguration
- CitaConfiguration
- UsuarioConfiguration
- RolConfiguration
- TriageConfiguration
- HistoriaClinicaConfiguration
- ConsentimientoConfiguration
- PagoConfiguration
- RecordatorioConfiguration

### Ejemplo de DbContext
```csharp
using Microsoft.EntityFrameworkCore;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Infrastructure.Persistence;

public class VeterinariaDbContext : DbContext
{
    public VeterinariaDbContext(DbContextOptions<VeterinariaDbContext> options)
        : base(options)
    {
    }

    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Mascota> Mascotas => Set<Mascota>();
    public DbSet<Cita> Citas => Set<Cita>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Rol> Roles => Set<Rol>();
    public DbSet<Triage> Triages => Set<Triage>();
    public DbSet<HistoriaClinica> HistoriasClinicas => Set<HistoriaClinica>();
    public DbSet<Consentimiento> Consentimientos => Set<Consentimiento>();
    public DbSet<Pago> Pagos => Set<Pago>();
    public DbSet<Recordatorio> Recordatorios => Set<Recordatorio>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(VeterinariaDbContext).Assembly);
    }
}
```

### Ejemplo de configuración simple
```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Infrastructure.Persistence.Configurations;

public class ClienteConfiguration : IEntityTypeConfiguration<Cliente>
{
    public void Configure(EntityTypeBuilder<Cliente> builder)
    {
        builder.ToTable("Clientes");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Nombres).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Apellidos).HasMaxLength(100).IsRequired();
        builder.Property(x => x.DocumentoIdentidad).HasMaxLength(20);
        builder.Property(x => x.Telefono).HasMaxLength(20);
        builder.Property(x => x.Email).HasMaxLength(150);

        builder.HasMany(x => x.Mascotas)
            .WithOne(x => x.Cliente)
            .HasForeignKey(x => x.ClienteId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
```

## 5) Migración inicial recomendada

Conviene crear una sola migración inicial llamada:
- `InitialCreate`

Debe incluir:
- tablas base de catálogo y operación
- claves primarias y foráneas
- índices básicos en `Email`, `DocumentoIdentidad`, `FechaHora`
- restricciones simples de longitud y nullability

Orden recomendado de tablas en la migración:
1. Roles
2. Usuarios
3. Clientes
4. Mascotas
5. Citas
6. Triages
7. HistoriasClinicas
8. Consentimientos
9. Pagos
10. Recordatorios

## 6) Cadena de conexión en appsettings.json

Para SQL Server local, una opción simple es usar LocalDB o tu instancia local de SQL Server.

### Ejemplo con SQL Server local
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=VeterinariaDb;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=True"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

### Ejemplo con LocalDB
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\MSSQLLocalDB;Database=VeterinariaDb;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=True"
  }
}
```

## 7) Repositorios básicos

Para mantenerlo simple, crea repositorios solo para agregados principales:
- `IClienteRepository` / `ClienteRepository`
- `IMascotaRepository` / `MascotaRepository`
- `ICitaRepository` / `CitaRepository`
- `IUsuarioRepository` / `UsuarioRepository`
- `IRolRepository` / `RolRepository`
- `ITriageRepository` / `TriageRepository`
- `IHistoriaClinicaRepository` / `HistoriaClinicaRepository`
- `IConsentimientoRepository` / `ConsentimientoRepository`
- `IPagoRepository` / `PagoRepository`
- `IRecordatorioRepository` / `RecordatorioRepository`

Métodos mínimos por repositorio:
- `GetByIdAsync`
- `GetAllAsync`
- `AddAsync`
- `UpdateAsync`
- `DeleteAsync`
- consultas específicas como `GetByClienteIdAsync`, `GetByMascotaIdAsync`, `GetByFechaAsync`

## 8) Orden de implementación

Orden práctico para avanzar sin complicarte:
1. Crear solución y proyectos Web, Domain e Infrastructure.
2. Crear las entidades en Domain.
3. Crear enums y validaciones básicas.
4. Crear `VeterinariaDbContext` en Infrastructure.
5. Crear configuraciones de EF Core por entidad.
6. Registrar Infrastructure en Web con inyección de dependencias.
7. Agregar la cadena de conexión en `appsettings.json`.
8. Crear migración inicial `InitialCreate`.
9. Aplicar la base de datos.
10. Crear repositorios básicos.
11. Construir CRUD simple de Clientes, Mascotas y Citas primero.
12. Agregar Triage, HistoriaClinica, Consentimiento, Pago y Recordatorio.

## 9) Recomendación técnica final

Para un MVP, no necesitas herencia compleja, tablas intermedias innecesarias ni una separación excesiva. Mantén las relaciones directas, usa `int` o `Guid` como claves primarias de forma consistente y evita normalizar de más en esta etapa.

Si quieres, el siguiente paso ideal es generar también la **estructura completa de carpetas y clases C#** para Domain e Infrastructure lista para copiar y pegar.
