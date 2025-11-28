using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Infrastructure.Persistence;

public class VeterinariaDbContext : IdentityDbContext<ApplicationUser>
{
    public VeterinariaDbContext(DbContextOptions<VeterinariaDbContext> options) : base(options)
    {
    }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Mascota> Mascotas => Set<Mascota>();
    public DbSet<Veterinario> Veterinarios => Set<Veterinario>();
    public DbSet<Servicio> Servicios => Set<Servicio>();
    public DbSet<Cita> Citas => Set<Cita>();
    public DbSet<HistorialClinico> HistorialesClinicos => Set<HistorialClinico>();
    public DbSet<Pago> Pagos => Set<Pago>();
    public DbSet<Notificacion> Notificaciones => Set<Notificacion>();
    public DbSet<TarjetaGuardada> TarjetasGuardadas => Set<TarjetaGuardada>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ApplicationUser
        modelBuilder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(e => e.NombreCompleto)
                .HasMaxLength(200);
        });

        // Usuario
        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Nombre)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.Email)
                .IsRequired()
                .HasMaxLength(150);

            entity.HasIndex(e => e.Email)
                .IsUnique();

            entity.Property(e => e.Telefono)
                .HasMaxLength(20);

            entity.Property(e => e.Direccion)
                .HasMaxLength(200);

            entity.Property(e => e.Rol)
                .HasMaxLength(20);

            entity.HasMany(e => e.Mascotas)
                .WithOne(m => m.Usuario)
                .HasForeignKey(m => m.UsuarioId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Mascota
        modelBuilder.Entity<Mascota>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Nombre)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.Especie)
                .HasMaxLength(30);

            entity.Property(e => e.Raza)
                .HasMaxLength(50);

            entity.Property(e => e.Peso)
                .HasPrecision(5, 2);

            entity.Property(e => e.Color)
                .HasMaxLength(30);

            entity.HasMany(e => e.Citas)
                .WithOne(c => c.Mascota)
                .HasForeignKey(c => c.MascotaId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Veterinario
        modelBuilder.Entity<Veterinario>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Nombre)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.Especialidad)
                .HasMaxLength(100);

            entity.Property(e => e.Email)
                .HasMaxLength(150);

            entity.Property(e => e.Telefono)
                .HasMaxLength(20);

            entity.HasMany(e => e.Citas)
                .WithOne(c => c.Veterinario)
                .HasForeignKey(c => c.VeterinarioId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Servicio
        modelBuilder.Entity<Servicio>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Nombre)
                .IsRequired()
                .HasMaxLength(100);

            entity.HasIndex(e => e.Nombre)
                .IsUnique();

            entity.Property(e => e.Descripcion)
                .HasMaxLength(500);

            entity.Property(e => e.Precio)
                .HasPrecision(10, 2);

            entity.HasMany(e => e.Citas)
                .WithOne(c => c.Servicio)
                .HasForeignKey(c => c.ServicioId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Cita
        modelBuilder.Entity<Cita>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Estado)
                .IsRequired()
                .HasMaxLength(30);

            entity.Property(e => e.Motivo)
                .HasMaxLength(300);

            // Index compuesto para evitar citas duplicadas del mismo veterinario a la misma hora
            entity.HasIndex(e => new { e.VeterinarioId, e.FechaHora })
                .IsUnique();

            entity.HasOne(e => e.Historial)
                .WithOne(h => h.Cita)
                .HasForeignKey<HistorialClinico>(h => h.CitaId)
                .OnDelete(DeleteBehavior.Cascade);

            // Una cita puede tener múltiples pagos (parcial + restante)
            entity.HasMany(e => e.Pagos)
                .WithOne(p => p.Cita)
                .HasForeignKey(p => p.CitaId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // HistorialClinico
        modelBuilder.Entity<HistorialClinico>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Diagnostico)
                .IsRequired()
                .HasMaxLength(1000);

            entity.Property(e => e.Tratamiento)
                .HasMaxLength(1000);

            entity.Property(e => e.Medicamentos)
                .HasMaxLength(500);

            entity.Property(e => e.Observaciones)
                .HasMaxLength(1000);

            entity.HasIndex(e => e.CitaId)
                .IsUnique();
        });

        // Pago
        modelBuilder.Entity<Pago>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Monto)
                .HasPrecision(10, 2);

            entity.Property(e => e.MetodoPago)
                .HasMaxLength(30);

            entity.Property(e => e.TipoPago)
                .HasMaxLength(30);

            entity.Property(e => e.Referencia)
                .HasMaxLength(50);

            entity.Property(e => e.UltimosDigitosTarjeta)
                .HasMaxLength(4);

            entity.HasIndex(e => e.CitaId);

            entity.HasIndex(e => e.Referencia)
                .IsUnique();
        });

        // Notificacion
        modelBuilder.Entity<Notificacion>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Titulo)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(e => e.Mensaje)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.Tipo)
                .HasMaxLength(20);

            entity.Property(e => e.Icono)
                .HasMaxLength(50);

            entity.Property(e => e.UrlAccion)
                .HasMaxLength(200);

            entity.HasOne(e => e.Usuario)
                .WithMany()
                .HasForeignKey(e => e.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => new { e.UsuarioId, e.Leida });
            entity.HasIndex(e => e.FechaCreacion);
        });
    }
}
