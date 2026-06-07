---
name: entity-framework
description: Patrones de EF Core Code-First para VetCare. Fluent API obligatorio, migraciones bien nombradas, sin Data Annotations en Domain. Usar cuando toques DbContext, entidades, migraciones o configuraciones de base de datos.
category: generic
agents: [database]
triggers:
  database:
    - "Crear configuración Fluent API (IEntityTypeConfiguration)"
    - "Crear o revisar una migración"
    - "Agregar índices o constraints"
---

## Cuándo usar esta skill
- Crear o modificar una entidad
- Crear una configuración `IEntityTypeConfiguration<T>`
- Crear o revisar una migración
- Agregar relaciones, índices o constraints

---

## Fluent API (REQUIRED)

- ALWAYS: Toda configuración de base de datos va en `Infrastructure` heredando de `IEntityTypeConfiguration<T>`
- NEVER: Data Annotations en entidades de `Domain` (`[Required]`, `[MaxLength]`, etc.)

```csharp
// ✅ CORRECTO — configuración en Infrastructure
public class CitaConfiguration : IEntityTypeConfiguration<Cita>
{
    public void Configure(EntityTypeBuilder<Cita> builder)
    {
        builder.ToTable("Citas");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Motivo).HasMaxLength(500);
        builder.Property(c => c.Estado).HasMaxLength(50).IsRequired();
    }
}

// ❌ NEVER — Data Annotations en Domain
public class Cita
{
    [Required]          // NO
    [MaxLength(500)]    // NO
    public string Motivo { get; set; }
}
```

---

## Tipos de datos (REQUIRED)

```csharp
// ✅ Strings: siempre con HasMaxLength
builder.Property(c => c.Nombre).HasMaxLength(150).IsRequired();

// ✅ Decimales: siempre con precisión exacta
builder.Property(p => p.Monto).HasColumnType("decimal(18,2)");

// ✅ PKs: int autoincremental
builder.HasKey(e => e.Id);
// En entidad: public int Id { get; set; }
```

---

## Relaciones y Delete Behavior (REQUIRED)

- ALWAYS: Configurar `DeleteBehavior.Restrict` en todas las FKs
- NEVER: Dejar el cascade por defecto

```csharp
// ✅ CORRECTO
builder.HasOne(c => c.Cliente)
       .WithMany(cl => cl.Citas)
       .HasForeignKey(c => c.ClienteId)
       .OnDelete(DeleteBehavior.Restrict);

// ❌ NEVER — cascade eliminaría historial
.OnDelete(DeleteBehavior.Cascade);
```

---

## Migraciones (REQUIRED)

- ALWAYS: Nombres descriptivos que expliquen el cambio
- NEVER: Editar migraciones ya aplicadas
- NEVER: Migración llamada `Migration1` o `Update`

```bash
# ✅ CORRECTO
dotnet ef migrations add CreateCitasTable
dotnet ef migrations add AddEstadoToCita
dotnet ef migrations add AddPagosTable

# ❌ NEVER
dotnet ef migrations add Migration1
dotnet ef migrations add Update
```

---

## Seed Data (REQUIRED para pruebas)

```csharp
// ✅ En OnModelCreating del DbContext
modelBuilder.Entity<Usuario>().HasData(new Usuario
{
    Id = 1,
    Username = "ALEX",
    PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
    Activo = true
});
```

---

## Registro en Program.cs

```csharp
// ✅ Scoped para DbContext y Repositories
builder.Services.AddDbContext<VetCareDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<ICitaRepository, CitaRepository>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
```

