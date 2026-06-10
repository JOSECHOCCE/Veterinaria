using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Tests.Domain;

[TestClass]
public class DomainEntitiesTests
{
    [TestMethod]
    public void Test_DomainEntities_Properties()
    {
        // ApplicationUser
        var appUser = new ApplicationUser
        {
            Id = "user-1",
            NombreCompleto = "Test User"
        };
        Assert.AreEqual("user-1", appUser.Id);
        Assert.AreEqual("Test User", appUser.NombreCompleto);

        // Auditoria
        var auditoria = new Auditoria
        {
            Id = 1,
            Accion = "Accion",
            Entidad = "Entidad",
            EntidadId = "1",
            Detalle = "Detalle",
            UsuarioId = "user-1",
            UsuarioEmail = "user@test.com",
            Fecha = DateTime.Today
        };
        Assert.AreEqual(1, auditoria.Id);
        Assert.AreEqual("Accion", auditoria.Accion);
        Assert.AreEqual("Entidad", auditoria.Entidad);
        Assert.AreEqual("1", auditoria.EntidadId);
        Assert.AreEqual("Detalle", auditoria.Detalle);
        Assert.AreEqual("user-1", auditoria.UsuarioId);
        Assert.AreEqual("user@test.com", auditoria.UsuarioEmail);
        Assert.AreEqual(DateTime.Today, auditoria.Fecha);

        // BloqueoAgenda
        var bloqueo = new BloqueoAgenda
        {
            Id = 1,
            VeterinarioId = 2,
            FechaInicio = DateTime.Today.AddHours(9),
            FechaFin = DateTime.Today.AddHours(12),
            Motivo = "Reunión",
            Veterinario = new Veterinario()
        };
        Assert.AreEqual(1, bloqueo.Id);
        Assert.AreEqual(2, bloqueo.VeterinarioId);
        Assert.AreEqual(DateTime.Today.AddHours(9), bloqueo.FechaInicio);
        Assert.AreEqual(DateTime.Today.AddHours(12), bloqueo.FechaFin);
        Assert.AreEqual("Reunión", bloqueo.Motivo);
        Assert.IsNotNull(bloqueo.Veterinario);

        // Cita
        var cita = new Cita
        {
            Id = 1,
            FechaHora = DateTime.Today,
            Estado = "Pendiente",
            Motivo = "Motivo",
            TipoPago = "Completo",
            MontoTotal = 100m,
            MontoPagado = 50m,
            EstadoPago = "Parcial",
            ReprogramadoPorUsuarioId = "user-1",
            FechaReprogramacion = DateTime.Today,
            MotivoReprogramacion = "MotivoReprogramacion",
            MascotaId = 2,
            VeterinarioId = 3,
            ServicioId = 4,
            FechaCreacion = DateTime.Today,
            FechaExpiracionReserva = DateTime.Today,
            EsUrgencia = true,
            Mascota = new Mascota(),
            Veterinario = new Veterinario(),
            Servicio = new Servicio(),
            Historial = new HistorialClinico(),
            Pagos = new List<Pago>()
        };
        Assert.AreEqual(1, cita.Id);
        Assert.AreEqual(DateTime.Today, cita.FechaHora);
        Assert.AreEqual("Pendiente", cita.Estado);
        Assert.AreEqual("Motivo", cita.Motivo);
        Assert.AreEqual("Completo", cita.TipoPago);
        Assert.AreEqual(100m, cita.MontoTotal);
        Assert.AreEqual(50m, cita.MontoPagado);
        Assert.AreEqual("Parcial", cita.EstadoPago);
        Assert.AreEqual("user-1", cita.ReprogramadoPorUsuarioId);
        Assert.AreEqual(DateTime.Today, cita.FechaReprogramacion);
        Assert.AreEqual("MotivoReprogramacion", cita.MotivoReprogramacion);
        Assert.AreEqual(2, cita.MascotaId);
        Assert.AreEqual(3, cita.VeterinarioId);
        Assert.AreEqual(4, cita.ServicioId);
        Assert.AreEqual(DateTime.Today, cita.FechaCreacion);
        Assert.AreEqual(DateTime.Today, cita.FechaExpiracionReserva);
        Assert.IsTrue(cita.EsUrgencia);
        Assert.IsNotNull(cita.Mascota);
        Assert.IsNotNull(cita.Veterinario);
        Assert.IsNotNull(cita.Servicio);
        Assert.IsNotNull(cita.Historial);
        Assert.IsNotNull(cita.Pagos);

        // Consentimiento
        var consentimiento = new Consentimiento
        {
            Id = 1,
            UsuarioId = 2,
            MascotaId = 3,
            TipoConsentimiento = "Cirugía",
            NombrePropietario = "Juan",
            NombrePaciente = "Fido",
            DocumentoId = "FRM-123",
            Aceptado = true,
            FechaAceptacion = DateTime.Today,
            IpOrigen = "127.0.0.1",
            Observaciones = "Obs",
            FirmaDigital = "signature",
            FechaCreacion = DateTime.Today,
            Usuario = new Usuario(),
            Mascota = new Mascota()
        };
        Assert.AreEqual(1, consentimiento.Id);
        Assert.AreEqual(2, consentimiento.UsuarioId);
        Assert.AreEqual(3, consentimiento.MascotaId);
        Assert.AreEqual("Cirugía", consentimiento.TipoConsentimiento);
        Assert.AreEqual("Juan", consentimiento.NombrePropietario);
        Assert.AreEqual("Fido", consentimiento.NombrePaciente);
        Assert.AreEqual("FRM-123", consentimiento.DocumentoId);
        Assert.IsTrue(consentimiento.Aceptado);
        Assert.AreEqual(DateTime.Today, consentimiento.FechaAceptacion);
        Assert.AreEqual("127.0.0.1", consentimiento.IpOrigen);
        Assert.AreEqual("Obs", consentimiento.Observaciones);
        Assert.AreEqual("signature", consentimiento.FirmaDigital);
        Assert.AreEqual(DateTime.Today, consentimiento.FechaCreacion);
        Assert.IsNotNull(consentimiento.Usuario);
        Assert.IsNotNull(consentimiento.Mascota);

        // DetalleVenta
        var detalle = new DetalleVenta
        {
            Id = 1,
            VentaId = 2,
            ProductoId = 3,
            Cantidad = 5,
            PrecioUnitario = 10m,
            Venta = new Venta(),
            Producto = new Producto()
        };
        Assert.AreEqual(1, detalle.Id);
        Assert.AreEqual(2, detalle.VentaId);
        Assert.AreEqual(3, detalle.ProductoId);
        Assert.AreEqual(5, detalle.Cantidad);
        Assert.AreEqual(10m, detalle.PrecioUnitario);
        Assert.IsNotNull(detalle.Venta);
        Assert.IsNotNull(detalle.Producto);

        // HistorialClinico
        var hc = new HistorialClinico
        {
            Id = 1,
            CitaId = 2,
            Diagnostico = "Diagnostico",
            Tratamiento = "Tratamiento",
            Medicamentos = "Medicamentos",
            Observaciones = "Observaciones",
            FechaRegistro = DateTime.Today,
            Cerrado = true,
            MotivoConsulta = "Motivo",
            Hallazgos = "Hallazgos",
            Recomendaciones = "Recomendaciones",
            ProximoControl = DateTime.Today,
            PesoActual = 15.5m,
            Temperatura = 38.5m,
            FrecuenciaCardiaca = 80,
            Cita = new Cita()
        };
        Assert.AreEqual(1, hc.Id);
        Assert.AreEqual(2, hc.CitaId);
        Assert.AreEqual("Diagnostico", hc.Diagnostico);
        Assert.AreEqual("Tratamiento", hc.Tratamiento);
        Assert.AreEqual("Medicamentos", hc.Medicamentos);
        Assert.AreEqual("Observaciones", hc.Observaciones);
        Assert.AreEqual(DateTime.Today, hc.FechaRegistro);
        Assert.IsTrue(hc.Cerrado);
        Assert.AreEqual("Motivo", hc.MotivoConsulta);
        Assert.AreEqual("Hallazgos", hc.Hallazgos);
        Assert.AreEqual("Recomendaciones", hc.Recomendaciones);
        Assert.AreEqual(DateTime.Today, hc.ProximoControl);
        Assert.AreEqual(15.5m, hc.PesoActual);
        Assert.AreEqual(38.5m, hc.Temperatura);
        Assert.AreEqual(80, hc.FrecuenciaCardiaca);
        Assert.IsNotNull(hc.Cita);

        // HorarioClinica
        var hcClinica = new HorarioClinica
        {
            Id = 1,
            DiaSemana = 1,
            HoraApertura = new TimeSpan(8, 0, 0),
            HoraCierre = new TimeSpan(18, 0, 0),
            EsLaborable = true
        };
        Assert.AreEqual(1, hcClinica.Id);
        Assert.AreEqual(1, hcClinica.DiaSemana);
        Assert.AreEqual(new TimeSpan(8, 0, 0), hcClinica.HoraApertura);
        Assert.AreEqual(new TimeSpan(18, 0, 0), hcClinica.HoraCierre);
        Assert.IsTrue(hcClinica.EsLaborable);

        // HorarioVeterinario
        var hcVet = new HorarioVeterinario
        {
            Id = 1,
            VeterinarioId = 2,
            DiaSemana = 1,
            HoraInicio = new TimeSpan(8, 0, 0),
            HoraFin = new TimeSpan(18, 0, 0),
            DescansoInicio = new TimeSpan(13, 0, 0),
            DescansoFin = new TimeSpan(14, 0, 0),
            EsLaborable = true,
            Veterinario = new Veterinario()
        };
        Assert.AreEqual(1, hcVet.Id);
        Assert.AreEqual(2, hcVet.VeterinarioId);
        Assert.AreEqual(1, hcVet.DiaSemana);
        Assert.AreEqual(new TimeSpan(8, 0, 0), hcVet.HoraInicio);
        Assert.AreEqual(new TimeSpan(18, 0, 0), hcVet.HoraFin);
        Assert.AreEqual(new TimeSpan(13, 0, 0), hcVet.DescansoInicio);
        Assert.AreEqual(new TimeSpan(14, 0, 0), hcVet.DescansoFin);
        Assert.IsTrue(hcVet.EsLaborable);
        Assert.IsNotNull(hcVet.Veterinario);

        // Mascota
        var mascota = new Mascota
        {
            Id = 1,
            Nombre = "Fido",
            Especie = "Perro",
            Raza = "Raza",
            FechaNacimiento = DateTime.Today,
            Peso = 10.5m,
            Color = "Color",
            FotoUrl = "url",
            Activo = true,
            Sexo = "Macho",
            ObservacionesGenerales = "Obs",
            AlergiasConocidas = "Alergias",
            UsuarioId = 5,
            Usuario = new Usuario(),
            Citas = new List<Cita>()
        };
        Assert.AreEqual(1, mascota.Id);
        Assert.AreEqual("Fido", mascota.Nombre);
        Assert.AreEqual("Perro", mascota.Especie);
        Assert.AreEqual("Raza", mascota.Raza);
        Assert.AreEqual(DateTime.Today, mascota.FechaNacimiento);
        Assert.AreEqual(10.5m, mascota.Peso);
        Assert.AreEqual("Color", mascota.Color);
        Assert.AreEqual("url", mascota.FotoUrl);
        Assert.IsTrue(mascota.Activo);
        Assert.AreEqual("Macho", mascota.Sexo);
        Assert.AreEqual("Obs", mascota.ObservacionesGenerales);
        Assert.AreEqual("Alergias", mascota.AlergiasConocidas);
        Assert.AreEqual(5, mascota.UsuarioId);
        Assert.IsNotNull(mascota.Usuario);
        Assert.IsNotNull(mascota.Citas);

        // Notificacion
        var notif = new Notificacion
        {
            Id = 1,
            UsuarioId = 2,
            Titulo = "Titulo",
            Mensaje = "Mensaje",
            FechaCreacion = DateTime.Today,
            Leida = true,
            FechaLectura = DateTime.Today,
            Usuario = new Usuario()
        };
        Assert.AreEqual(1, notif.Id);
        Assert.AreEqual(2, notif.UsuarioId);
        Assert.AreEqual("Titulo", notif.Titulo);
        Assert.AreEqual("Mensaje", notif.Mensaje);
        Assert.AreEqual(DateTime.Today, notif.FechaCreacion);
        Assert.IsTrue(notif.Leida);
        Assert.AreEqual(DateTime.Today, notif.FechaLectura);
        Assert.IsNotNull(notif.Usuario);

        // Pago
        var pago = new Pago
        {
            Id = 1,
            CitaId = 2,
            Monto = 100m,
            MetodoPago = "Tarjeta",
            FechaPago = DateTime.Today,
            Observacion = "Obs",
            Cita = new Cita()
        };
        Assert.AreEqual(1, pago.Id);
        Assert.AreEqual(2, pago.CitaId);
        Assert.AreEqual(100m, pago.Monto);
        Assert.AreEqual("Tarjeta", pago.MetodoPago);
        Assert.AreEqual(DateTime.Today, pago.FechaPago);
        Assert.AreEqual("Obs", pago.Observacion);
        Assert.IsNotNull(pago.Cita);

        // Producto
        var producto = new Producto
        {
            Id = 1,
            Nombre = "Nombre",
            Descripcion = "Desc",
            Precio = 10m,
            Stock = 100,
            StockMinimo = 5,
            Categoria = "General",
            Activo = true,
            FechaCreacion = DateTime.Today
        };
        Assert.AreEqual(1, producto.Id);
        Assert.AreEqual("Nombre", producto.Nombre);
        Assert.AreEqual("Desc", producto.Descripcion);
        Assert.AreEqual(10m, producto.Precio);
        Assert.AreEqual(100, producto.Stock);
        Assert.AreEqual(5, producto.StockMinimo);
        Assert.AreEqual("General", producto.Categoria);
        Assert.IsTrue(producto.Activo);
        Assert.AreEqual(DateTime.Today, producto.FechaCreacion);

        // Servicio
        var servicio = new Servicio
        {
            Id = 1,
            Nombre = "Nombre",
            Descripcion = "Desc",
            Precio = 50m,
            DuracionMinutos = 30,
            Activo = true,
            EspecialidadRequerida = "Esp",
            Citas = new List<Cita>()
        };
        Assert.AreEqual(1, servicio.Id);
        Assert.AreEqual("Nombre", servicio.Nombre);
        Assert.AreEqual("Desc", servicio.Descripcion);
        Assert.AreEqual(50m, servicio.Precio);
        Assert.AreEqual(30, servicio.DuracionMinutos);
        Assert.IsTrue(servicio.Activo);
        Assert.AreEqual("Esp", servicio.EspecialidadRequerida);
        Assert.IsNotNull(servicio.Citas);

        // TarjetaGuardada
        var tarjeta = new TarjetaGuardada
        {
            Id = 1,
            UsuarioId = 2,
            NombreTitular = "Titular",
            NumeroTarjetaEncriptado = "enc",
            UltimosDigitos = "1234",
            FechaExpiracion = "12/26",
            CVVEncriptado = "cvv",
            FechaRegistro = DateTime.Today,
            Activa = true,
            Usuario = new Usuario()
        };
        Assert.AreEqual(1, tarjeta.Id);
        Assert.AreEqual(2, tarjeta.UsuarioId);
        Assert.AreEqual("Titular", tarjeta.NombreTitular);
        Assert.AreEqual("enc", tarjeta.NumeroTarjetaEncriptado);
        Assert.AreEqual("1234", tarjeta.UltimosDigitos);
        Assert.AreEqual("12/26", tarjeta.FechaExpiracion);
        Assert.AreEqual("cvv", tarjeta.CVVEncriptado);
        Assert.AreEqual(DateTime.Today, tarjeta.FechaRegistro);
        Assert.IsTrue(tarjeta.Activa);
        Assert.IsNotNull(tarjeta.Usuario);

        // Triage
        var triage = new Triage
        {
            Id = 1,
            CitaId = 2,
            MascotaId = 3,
            Nivel = "N1",
            Sintomas = "Sintomas",
            MotivoConsulta = "Motivo",
            Temperatura = 38.2m,
            FrecuenciaCardiaca = 90,
            PesoEstimado = 12.5m,
            PrioridadColor = "Rojo",
            TiempoEsperaEstimadoMin = 15,
            Consultorio = "Sala 1",
            Estado = "EnEspera",
            FechaRegistro = DateTime.Today,
            Cita = new Cita(),
            Mascota = new Mascota()
        };
        Assert.AreEqual(1, triage.Id);
        Assert.AreEqual(2, triage.CitaId);
        Assert.AreEqual(3, triage.MascotaId);
        Assert.AreEqual("N1", triage.Nivel);
        Assert.AreEqual("Sintomas", triage.Sintomas);
        Assert.AreEqual("Motivo", triage.MotivoConsulta);
        Assert.AreEqual(38.2m, triage.Temperatura);
        Assert.AreEqual(90, triage.FrecuenciaCardiaca);
        Assert.AreEqual(12.5m, triage.PesoEstimado);
        Assert.AreEqual("Rojo", triage.PrioridadColor);
        Assert.AreEqual(15, triage.TiempoEsperaEstimadoMin);
        Assert.AreEqual("Sala 1", triage.Consultorio);
        Assert.AreEqual("EnEspera", triage.Estado);
        Assert.AreEqual(DateTime.Today, triage.FechaRegistro);
        Assert.IsNotNull(triage.Cita);
        Assert.IsNotNull(triage.Mascota);

        // Usuario
        var usuario = new Usuario
        {
            Id = 1,
            Nombre = "Nombre",
            DNI = "DNI",
            Direccion = "Dir",
            Telefono = "Tel",
            Email = "email",
            Rol = "Rol",
            Activo = true,
            ApplicationUserId = "app-user",
            Observaciones = "Obs",
            RecibirRecordatorios = true,
            Mascotas = new List<Mascota>()
        };
        Assert.AreEqual(1, usuario.Id);
        Assert.AreEqual("Nombre", usuario.Nombre);
        Assert.AreEqual("DNI", usuario.DNI);
        Assert.AreEqual("Dir", usuario.Direccion);
        Assert.AreEqual("Tel", usuario.Telefono);
        Assert.AreEqual("email", usuario.Email);
        Assert.AreEqual("Rol", usuario.Rol);
        Assert.IsTrue(usuario.Activo);
        Assert.AreEqual("app-user", usuario.ApplicationUserId);
        Assert.AreEqual("Obs", usuario.Observaciones);
        Assert.IsTrue(usuario.RecibirRecordatorios);
        Assert.IsNotNull(usuario.Mascotas);

        // Venta
        var venta = new Venta
        {
            Id = 1,
            Fecha = DateTime.Today,
            Total = 150m,
            MetodoPago = "Efectivo",
            ClienteId = 5,
            Cliente = new Usuario(),
            Estado = "Completada",
            Detalles = new List<DetalleVenta>()
        };
        Assert.AreEqual(1, venta.Id);
        Assert.AreEqual(DateTime.Today, venta.Fecha);
        Assert.AreEqual(150m, venta.Total);
        Assert.AreEqual("Efectivo", venta.MetodoPago);
        Assert.AreEqual(5, venta.ClienteId);
        Assert.IsNotNull(venta.Cliente);
        Assert.AreEqual("Completada", venta.Estado);
        Assert.IsNotNull(venta.Detalles);

        // Veterinario
        var vet = new Veterinario
        {
            Id = 1,
            Nombre = "Nombre",
            Especialidad = "Esp",
            Email = "email",
            Telefono = "tel",
            Activo = true,
            HorarioInicio = new TimeSpan(8, 0, 0),
            HorarioFin = new TimeSpan(18, 0, 0),
            Bloqueos = new List<BloqueoAgenda>(),
            Citas = new List<Cita>(),
            Horarios = new List<HorarioVeterinario>()
        };
        Assert.AreEqual(1, vet.Id);
        Assert.AreEqual("Nombre", vet.Nombre);
        Assert.AreEqual("Esp", vet.Especialidad);
        Assert.AreEqual("email", vet.Email);
        Assert.AreEqual("tel", vet.Telefono);
        Assert.IsTrue(vet.Activo);
        Assert.AreEqual(new TimeSpan(8, 0, 0), vet.HorarioInicio);
        Assert.AreEqual(new TimeSpan(18, 0, 0), vet.HorarioFin);
        Assert.IsNotNull(vet.Bloqueos);
        Assert.IsNotNull(vet.Citas);
        Assert.IsNotNull(vet.Horarios);
    }
}
