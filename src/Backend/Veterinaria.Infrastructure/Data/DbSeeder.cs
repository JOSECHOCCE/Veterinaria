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

        // 3. Seed Recepcionista
        await SeedRecepcionistaUserAsync(userManager);

        // 4. Seed Veterinarios
        await SeedVeterinariosAsync(context);
        await SeedVeterinarioAccountsAsync(userManager);

        // 5. Seed Usuario Normal (Cliente)
        var usuarioNormal = await SeedNormalUserAsync(userManager, context);

        // 6. Seed Servicios
        await SeedServiciosAsync(context);

        // 7. Seed Mascotas (asociadas al usuario normal)
        await SeedMascotasAsync(context, usuarioNormal, isDevelopment);

        // 8. Seed Triage, Citas y Pagos (para simular el ecosistema de Stitch)
        await SeedCitasTriagePagosAsync(context);
    }

    private const string DefaultFotoPerro = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=256&h=256&q=80";
    private const string DefaultFotoGato = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=256&h=256&q=80";

    private static async Task SeedRolesAsync(RoleManager<IdentityRole> roleManager)
    {
        string[] roles = { "Admin", "Veterinario", "Recepcionista", "Cliente", "Usuario" };

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

    private static async Task SeedRecepcionistaUserAsync(UserManager<ApplicationUser> userManager)
    {
        var email = "recepcionista@veterinaria.com";
        var user = await userManager.FindByEmailAsync(email);
        if (user == null)
        {
            user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                NombreCompleto = "Recepcionista Principal",
                FechaRegistro = DateTime.Now,
                EmailConfirmed = true
            };
            var result = await userManager.CreateAsync(user, "Recepcion123!");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(user, "Recepcionista");
            }
        }
    }

    private static async Task SeedVeterinarioAccountsAsync(UserManager<ApplicationUser> userManager)
    {
        var vets = new[]
        {
            new { Email = "carlos.mendoza@veterinaria.com", Nombre = "Dr. Carlos Mendoza Ruiz" },
            new { Email = "maria.fernandez@veterinaria.com", Nombre = "Dra. María Fernández López" }
        };

        foreach (var vet in vets)
        {
            var user = await userManager.FindByEmailAsync(vet.Email);
            if (user == null)
            {
                user = new ApplicationUser
                {
                    UserName = vet.Email,
                    Email = vet.Email,
                    NombreCompleto = vet.Nombre,
                    FechaRegistro = DateTime.Now,
                    EmailConfirmed = true
                };
                var result = await userManager.CreateAsync(user, "Veterinario123!");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(user, "Veterinario");
                }
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
                // Agregamos tanto el rol Cliente como el antiguo Usuario para compatibilidad
                await userManager.AddToRoleAsync(normalUser, "Cliente");
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
                Rol = "Cliente",
                ApplicationUserId = normalUser.Id // Vincular con Identity
            };

            context.Usuarios.Add(usuarioExistente);
            await context.SaveChangesAsync();
        }
        else
        {
            usuarioExistente.Rol = "Cliente";
            if (string.IsNullOrEmpty(usuarioExistente.ApplicationUserId))
            {
                usuarioExistente.ApplicationUserId = normalUser.Id;
            }
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

    private static async Task SeedCitasTriagePagosAsync(VeterinariaDbContext context)
    {
        if (await context.Citas.AnyAsync())
            return;

        var max = await context.Mascotas.FirstOrDefaultAsync(m => m.Nombre == "Max");
        var luna = await context.Mascotas.FirstOrDefaultAsync(m => m.Nombre == "Luna");
        var drMendoza = await context.Veterinarios.FirstOrDefaultAsync(m => m.Nombre.Contains("Mendoza"));
        var draFernandez = await context.Veterinarios.FirstOrDefaultAsync(m => m.Nombre.Contains("Fernández"));
        var consultaGeneral = await context.Servicios.FirstOrDefaultAsync(m => m.Nombre == "Consulta General");
        var cirugia = await context.Servicios.FirstOrDefaultAsync(m => m.Nombre.Contains("Cirugía"));

        if (max == null || luna == null || drMendoza == null || draFernandez == null || consultaGeneral == null || cirugia == null)
            return;

        // 1. Cita para Max (Confirmada hoy)
        var citaMax = new Cita
        {
            FechaHora = DateTime.Today.AddHours(9),
            Estado = "Confirmada",
            Motivo = "Consulta de Control",
            TipoPago = "Completo",
            MontoTotal = 50.00m,
            MontoPagado = 50.00m,
            EstadoPago = "Pagado",
            MascotaId = max.Id,
            VeterinarioId = drMendoza.Id,
            ServicioId = consultaGeneral.Id,
            FechaCreacion = DateTime.UtcNow
        };

        // 2. Cita para Luna (En proceso hoy - pago parcial)
        var citaLuna = new Cita
        {
            FechaHora = DateTime.Today.AddHours(11),
            Estado = "EnProceso",
            Motivo = "Cirugía de Quiste Renal",
            TipoPago = "Parcial",
            MontoTotal = 250.00m,
            MontoPagado = 150.00m,
            EstadoPago = "Parcial",
            MascotaId = luna.Id,
            VeterinarioId = draFernandez.Id,
            ServicioId = cirugia.Id,
            FechaCreacion = DateTime.UtcNow
        };

        context.Citas.AddRange(citaMax, citaLuna);
        await context.SaveChangesAsync();

        // 3. Pago parcial de Luna
        var pagoLuna = new Pago
        {
            CitaId = citaLuna.Id,
            Monto = 150.00m,
            MetodoPago = "Tarjeta",
            TipoPago = "Parcial",
            Referencia = "REF-987456",
            UltimosDigitosTarjeta = "4242",
            FechaPago = DateTime.Now
        };

        context.Pagos.Add(pagoLuna);
        await context.SaveChangesAsync();

        // 4. Triage para Max (para simular ingreso)
        var triageMax = new Triage
        {
            CitaId = citaMax.Id,
            MascotaId = max.Id,
            Nivel = "N1", // L1 - Resucitación / Emergencia
            MotivoConsulta = "Consulta de control y cojera leve",
            Sintomas = "Dolor leve al apoyar pata trasera derecha",
            Temperatura = 39.10m,
            PesoEstimado = 32.50m,
            FrecuenciaCardiaca = 120,
            PrioridadColor = "Rojo",
            TiempoEsperaEstimadoMin = 0,
            Consultorio = "Sala de Shock",
            Estado = "EnAtencion",
            FechaRegistro = DateTime.Now
        };

        context.Triages.Add(triageMax);
        await context.SaveChangesAsync();
    }
}
