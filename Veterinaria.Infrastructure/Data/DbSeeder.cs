using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Domain.Entities;
using Veterinaria.Infrastructure.Persistence;

namespace Veterinaria.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(
        VeterinariaDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        bool isDevelopment = false)
    {
        // 1. Seed Roles
        await SeedRolesAsync(roleManager);

        // 2. Seed Usuario Admin
        await SeedAdminUserAsync(userManager);

        // 3. Seed Usuario Normal
        var usuarioNormal = await SeedNormalUserAsync(userManager, context);

        // 4. Seed Veterinarios
        await SeedVeterinariosAsync(context);

        // 5. Seed Servicios
        await SeedServiciosAsync(context);

        // 6. Seed Mascotas (asociadas al usuario normal)
        await SeedMascotasAsync(context, usuarioNormal, isDevelopment);
    }

    private const string DefaultFotoPerro = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=256&h=256&q=80";
    private const string DefaultFotoGato = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=256&h=256&q=80";

    private static async Task SeedRolesAsync(RoleManager<IdentityRole> roleManager)
    {
        string[] roles = { "Admin", "Usuario" };

        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }
    }

    private static async Task SeedAdminUserAsync(UserManager<ApplicationUser> userManager)
    {
        var adminEmail = "admin@veterinaria.com";
        var adminUser = await userManager.FindByEmailAsync(adminEmail);

        if (adminUser == null)
        {
            adminUser = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                NombreCompleto = "Administrador del Sistema",
                FechaRegistro = DateTime.Now,
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(adminUser, "Admin123!");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, "Admin");
            }
        }
    }

    private static async Task<Usuario?> SeedNormalUserAsync(
        UserManager<ApplicationUser> userManager,
        VeterinariaDbContext context)
    {
        var userEmail = "usuario@test.com";
        var normalUser = await userManager.FindByEmailAsync(userEmail);

        if (normalUser == null)
        {
            normalUser = new ApplicationUser
            {
                UserName = userEmail,
                Email = userEmail,
                NombreCompleto = "Usuario de Prueba",
                FechaRegistro = DateTime.Now,
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(normalUser, "Usuario123!");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(normalUser, "Usuario");
            }
        }

        // Verificar si existe el Usuario en la tabla Usuarios (propietarios de mascotas)
        var usuarioExistente = await context.Usuarios
            .FirstOrDefaultAsync(u => u.Email == userEmail);

        if (usuarioExistente == null)
        {
            usuarioExistente = new Usuario
            {
                Nombre = "Juan Pérez García",
                Email = userEmail,
                Telefono = "999888777",
                Direccion = "Av. Principal 123, Lima",
                FechaRegistro = DateTime.Now,
                Activo = true,
                ApplicationUserId = normalUser.Id // Vincular con Identity
            };

            context.Usuarios.Add(usuarioExistente);
            await context.SaveChangesAsync();
        }
        else if (string.IsNullOrEmpty(usuarioExistente.ApplicationUserId))
        {
            // Actualizar vínculo si no existe
            usuarioExistente.ApplicationUserId = normalUser.Id;
            await context.SaveChangesAsync();
        }

        return usuarioExistente;
    }

    private static async Task SeedVeterinariosAsync(VeterinariaDbContext context)
    {
        if (await context.Veterinarios.AnyAsync())
            return;

        var veterinarios = new List<Veterinario>
        {
            new Veterinario
            {
                Nombre = "Dr. Carlos Mendoza Ruiz",
                Especialidad = "Medicina General",
                Telefono = "987654321",
                Email = "carlos.mendoza@veterinaria.com",
                HorarioInicio = new TimeSpan(8, 0, 0),
                HorarioFin = new TimeSpan(17, 0, 0),
                Activo = true
            },
            new Veterinario
            {
                Nombre = "Dra. María Fernández López",
                Especialidad = "Cirugía y Traumatología",
                Telefono = "987654322",
                Email = "maria.fernandez@veterinaria.com",
                HorarioInicio = new TimeSpan(9, 0, 0),
                HorarioFin = new TimeSpan(18, 0, 0),
                Activo = true
            }
        };

        context.Veterinarios.AddRange(veterinarios);
        await context.SaveChangesAsync();
    }

    private static async Task SeedServiciosAsync(VeterinariaDbContext context)
    {
        if (await context.Servicios.AnyAsync())
            return;

        var servicios = new List<Servicio>
        {
            new Servicio
            {
                Nombre = "Consulta General",
                Descripcion = "Evaluación completa del estado de salud de la mascota, incluyendo examen físico, revisión de signos vitales y recomendaciones.",
                Precio = 50.00m,
                DuracionMinutos = 45,
                Activo = true
            },
            new Servicio
            {
                Nombre = "Vacunación",
                Descripcion = "Aplicación de vacunas según el calendario de vacunación. Incluye vacunas antirrábica, parvovirus, moquillo, entre otras.",
                Precio = 80.00m,
                DuracionMinutos = 30,
                Activo = true
            },
            new Servicio
            {
                Nombre = "Cirugía Menor",
                Descripcion = "Procedimientos quirúrgicos menores como esterilización, extracción de tumores pequeños, suturas y otros.",
                Precio = 300.00m,
                DuracionMinutos = 120,
                Activo = true
            },
            new Servicio
            {
                Nombre = "Baño y Peluquería",
                Descripcion = "Servicio completo de higiene que incluye baño con shampoo especializado, secado, corte de pelo y limpieza de oídos.",
                Precio = 40.00m,
                DuracionMinutos = 60,
                Activo = true
            },
            new Servicio
            {
                Nombre = "Desparasitación",
                Descripcion = "Tratamiento antiparasitario interno y externo. Incluye evaluación previa y recomendaciones de prevención.",
                Precio = 60.00m,
                DuracionMinutos = 30,
                Activo = true
            }
        };

        context.Servicios.AddRange(servicios);
        await context.SaveChangesAsync();
    }

    private static async Task SeedMascotasAsync(VeterinariaDbContext context, Usuario? propietario, bool isDevelopment)
    {
        if (propietario == null)
            return;

        if (isDevelopment)
        {
            await BackfillMascotaFotosAsync(context);
        }

        if (await context.Mascotas.AnyAsync())
            return;

        const string fotoPerro2 = "https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=256&h=256&q=80";

        var mascotas = new List<Mascota>
        {
            new Mascota
            {
                Nombre = "Max",
                Especie = "Perro",
                Raza = "Golden Retriever",
                FechaNacimiento = DateTime.Now.AddYears(-3).AddMonths(-6),
                Peso = 32.5m,
                Color = "Dorado",
                FotoUrl = DefaultFotoPerro,
                UsuarioId = propietario.Id,
                Activo = true
            },
            new Mascota
            {
                Nombre = "Luna",
                Especie = "Gato",
                Raza = "Siamés",
                FechaNacimiento = DateTime.Now.AddYears(-2).AddMonths(-3),
                Peso = 4.2m,
                Color = "Crema con puntos oscuros",
                FotoUrl = DefaultFotoGato,
                UsuarioId = propietario.Id,
                Activo = true
            },
            new Mascota
            {
                Nombre = "Rocky",
                Especie = "Perro",
                Raza = "Bulldog Francés",
                FechaNacimiento = DateTime.Now.AddYears(-1).AddMonths(-8),
                Peso = 12.8m,
                Color = "Atigrado",
                FotoUrl = fotoPerro2,
                UsuarioId = propietario.Id,
                Activo = true
            }
        };

        context.Mascotas.AddRange(mascotas);
        await context.SaveChangesAsync();
    }

    private static async Task BackfillMascotaFotosAsync(VeterinariaDbContext context)
    {
        var mascotasSinFoto = await context.Mascotas
            .Where(m => m.Activo && (m.FotoUrl == null || m.FotoUrl.Trim() == string.Empty))
            .ToListAsync();

        if (mascotasSinFoto.Count == 0)
            return;

        foreach (var mascota in mascotasSinFoto)
        {
            mascota.FotoUrl = GetDefaultFotoUrlByEspecie(mascota.Especie);
        }

        await context.SaveChangesAsync();
    }

    private static string GetDefaultFotoUrlByEspecie(string? especie)
    {
        var especieNorm = (especie ?? string.Empty).Trim().ToLowerInvariant();
        return especieNorm.Contains("gato") ? DefaultFotoGato : DefaultFotoPerro;
    }
}
