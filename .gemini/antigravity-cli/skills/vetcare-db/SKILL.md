---
name: vetcare-db
description: Entidades, relaciones y configuraciones Fluent API específicas de VetCare. Usar cuando crees o modifiques entidades del Domain o configuraciones de Infrastructure.
---

## Cuándo usar esta skill
- Crear o modificar una entidad de Domain
- Crear o modificar una configuración `IEntityTypeConfiguration<T>`
- Revisar relaciones entre entidades
- Crear una migración

---

## Entidades del Domain

### Usuario
```csharp
public class Usuario
{
    public int Id { get; set; }
    public string Username { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }
    public string Rol { get; set; } // Cliente | Recepcionista | Veterinario | Administrador
    public bool Activo { get; set; } = true;
}
```

### Cliente
```csharp
public class Cliente
{
    public int Id { get; set; }
    public string NombreCompleto { get; set; }
    public string Telefono { get; set; }
    public string? Documento { get; set; }
    public string? Email { get; set; }
    public string? Direccion { get; set; }
    public string? Observaciones { get; set; }
    public bool Activo { get; set; } = true;
    public int? UsuarioId { get; set; }

    public Usuario? Usuario { get; set; }
    public ICollection<Mascota> Mascotas { get; set; }
}
```

### Mascota
```csharp
public class Mascota
{
    public int Id { get; set; }
    public string Nombre { get; set; }
    public string Especie { get; set; } // Perro | Gato | Ave | Otro
    public string? Raza { get; set; }
    public string? Sexo { get; set; }
    public DateTime? FechaNacimiento { get; set; }
    public decimal? Peso { get; set; }
    public string? Color { get; set; }
    public string? Alergias { get; set; }
    public string? Observaciones { get; set; }
    public bool Activo { get; set; } = true;
    public int ClienteId { get; set; }

    public Cliente Cliente { get; set; }
    public ICollection<Cita> Citas { get; set; }
}
```

### Servicio
```csharp
public class Servicio
{
    public int Id { get; set; }
    public string Nombre { get; set; }
    public int DuracionMinutos { get; set; }
    public decimal PrecioBase { get; set; }
    public string? Descripcion { get; set; }
    public bool RequiereVeterinario { get; set; } = true;
    public string? EspecialidadRequerida { get; set; }
    public bool Activo { get; set; } = true;
}
```

### Cita
```csharp
public class Cita
{
    public int Id { get; set; }
    public DateTime FechaHora { get; set; }
    public string Estado { get; set; }
    public string? Motivo { get; set; }
    public string? Canal { get; set; } // presencial | portal | telefono
    public bool EsUrgencia { get; set; } = false;
    public bool Activo { get; set; } = true;
    public int MascotaId { get; set; }
    public int ServicioId { get; set; }
    public int? VeterinarioId { get; set; }
    public int? ClienteId { get; set; }

    public Mascota Mascota { get; set; }
    public Servicio Servicio { get; set; }
    public Veterinario? Veterinario { get; set; }
    public AtenciónClinica? AtenciónClinica { get; set; }
    public Pago? Pago { get; set; }
}
```

### AtenciónClinica
```csharp
public class AtenciónClinica
{
    public int Id { get; set; }
    public decimal? Peso { get; set; }
    public decimal? Temperatura { get; set; }
    public int? FrecuenciaCardiaca { get; set; }
    public string? ObservacionesIngreso { get; set; }
    public string? MotivoConsulta { get; set; }
    public string? Hallazgos { get; set; }
    public string? Diagnostico { get; set; }
    public string? Tratamiento { get; set; }
    public string? Medicacion { get; set; }
    public string? Recomendaciones { get; set; }
    public DateTime? ProximoControl { get; set; }
    public int CitaId { get; set; }

    public Cita Cita { get; set; }
}
```

### Pago
```csharp
public class Pago
{
    public int Id { get; set; }
    public decimal MontoTotal { get; set; }
    public decimal MontoPagado { get; set; }
    public string Estado { get; set; } // Pendiente | Pagado | PagoParcial | Anulado
    public string MetodoPago { get; set; } // Efectivo | Tarjeta | Transferencia | Yape
    public string? NumeroOperacion { get; set; }
    public string? Observacion { get; set; }
    public string? MotivoAnulacion { get; set; }
    public DateTime FechaRegistro { get; set; }
    public int CitaId { get; set; }

    public Cita Cita { get; set; }
}
```

---

## Configuraciones Fluent API clave

```csharp
// CitaConfiguration.cs
public class CitaConfiguration : IEntityTypeConfiguration<Cita>
{
    public void Configure(EntityTypeBuilder<Cita> builder)
    {
        builder.ToTable("Citas");
        builder.Property(c => c.Estado).HasMaxLength(50).IsRequired();
        builder.Property(c => c.Motivo).HasMaxLength(500);
        builder.Property(c => c.Canal).HasMaxLength(50);

        builder.HasOne(c => c.Mascota)
               .WithMany(m => m.Citas)
               .HasForeignKey(c => c.MascotaId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Servicio)
               .WithMany()
               .HasForeignKey(c => c.ServicioId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Veterinario)
               .WithMany(v => v.Citas)
               .HasForeignKey(c => c.VeterinarioId)
               .IsRequired(false)
               .OnDelete(DeleteBehavior.Restrict);
    }
}

// PagoConfiguration.cs
public class PagoConfiguration : IEntityTypeConfiguration<Pago>
{
    public void Configure(EntityTypeBuilder<Pago> builder)
    {
        builder.ToTable("Pagos");
        builder.Property(p => p.MontoTotal).HasColumnType("decimal(18,2)");
        builder.Property(p => p.MontoPagado).HasColumnType("decimal(18,2)");
        builder.Property(p => p.Estado).HasMaxLength(50).IsRequired();
        builder.Property(p => p.MetodoPago).HasMaxLength(50).IsRequired();

        builder.HasOne(p => p.Cita)
               .WithOne(c => c.Pago)
               .HasForeignKey<Pago>(p => p.CitaId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
```

---

## Estados válidos de una Cita (REFERENCE)

```csharp
public static class EstadoCita
{
    public const string ReservaTemporal = "ReservaTemporal";
    public const string PendienteConfirmacion = "PendienteConfirmacion";
    public const string PendienteAsignacion = "PendienteAsignacion";
    public const string Confirmada = "Confirmada";
    public const string EnEspera = "EnEspera";
    public const string EnAtencion = "EnAtencion";
    public const string Completada = "Completada";
    public const string Cancelada = "Cancelada";
    public const string Rechazada = "Rechazada";
    public const string Reprogramada = "Reprogramada";
    public const string NoAsistio = "NoAsistio";
}
```
