using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using System;
using System.Threading.Tasks;

namespace VeterianariaAppTest.LegacyMocks
{
    // =========================================================================
    // REFACTORIZACIÓN MÍNIMA PROPUESTA (Interfaces, Models y Servicios a probar)
    // =========================================================================
    public class Cita { public int Id { get; set; } public DateTime Fecha { get; set; } public int MascotaId { get; set; } public bool EsUrgencia { get; set; } public string Estado { get; set; } = "Pendiente"; }
    public class Pago { public int Id { get; set; } public decimal Monto { get; set; } public int ClienteId { get; set; } }

    public interface ICitaRepository { Task<bool> IsHorarioOcupadoAsync(DateTime fecha); Task GuardarAsync(Cita cita); Task ActualizarAsync(Cita cita); Task<Cita?> ObtenerPorIdAsync(int id); }
    public interface IMascotaRepository { Task<bool> TieneVacunaAntirrabicaAsync(int mascotaId); Task<bool> ExisteMascotaAsync(int mascotaId); }
    public interface IClienteRepository { Task<int> ObtenerCantidadNoShowsAsync(int clienteId); Task<bool> EsClienteNuevoAsync(int clienteId); }
    public interface IPagoRepository { Task GuardarAsync(Pago pago); }

    public class CitasService
    {
        private readonly ICitaRepository _citaRepo;
        private readonly IMascotaRepository _mascotaRepo;

        public CitasService(ICitaRepository citaRepo, IMascotaRepository mascotaRepo)
        {
            _citaRepo = citaRepo;
            _mascotaRepo = mascotaRepo;
        }

        public async Task CrearCitaAsync(Cita cita)
        {
            if (cita.MascotaId <= 0) throw new ArgumentException("Faltan datos obligatorios.");

            if (await _citaRepo.IsHorarioOcupadoAsync(cita.Fecha))
                throw new InvalidOperationException("El horario ya está ocupado.");

            if (!cita.EsUrgencia && !await _mascotaRepo.TieneVacunaAntirrabicaAsync(cita.MascotaId))
                throw new InvalidOperationException("La mascota no cumple con la validación antirrábica para este servicio.");

            await _citaRepo.GuardarAsync(cita);
        }

        public async Task CancelarCitaAsync(int id)
        {
            var cita = await _citaRepo.ObtenerPorIdAsync(id) ?? throw new InvalidOperationException("La cita no existe.");
            cita.Estado = "Cancelada";
            await _citaRepo.ActualizarAsync(cita);
        }
    }

    public class PagoDepositoService
    {
        private readonly IClienteRepository _clienteRepo;
        private readonly IPagoRepository _pagoRepo;

        public PagoDepositoService(IClienteRepository clienteRepo, IPagoRepository pagoRepo)
        {
            _clienteRepo = clienteRepo;
            _pagoRepo = pagoRepo;
        }

        public async Task<bool> RequiereDepositoAsync(int clienteId)
        {
            if (await _clienteRepo.EsClienteNuevoAsync(clienteId)) return true;
            if (await _clienteRepo.ObtenerCantidadNoShowsAsync(clienteId) >= 2) return true;
            return false;
        }

        public async Task RegistrarPagoAsync(Pago pago)
        {
            if (pago.Monto <= 0) throw new ArgumentException("El monto debe ser mayor a 0.");
            await _pagoRepo.GuardarAsync(pago);
        }
    }


    // =========================================================================
    // PRUEBAS COMPLETAS (MSTest + Moq)
    // =========================================================================

    [TestClass]
    public sealed class CitasServiceTests
    {
        // 1. Crear cita correctamente
        [TestMethod]
        public async Task CrearCitaAsync_CuandoDatosSonValidos_LlamaGuardar()
        {
            // Arrange
            var citaRepoMock = new Mock<ICitaRepository>();
            var mascotaRepoMock = new Mock<IMascotaRepository>();

            citaRepoMock.Setup(repo => repo.IsHorarioOcupadoAsync(It.IsAny<DateTime>())).ReturnsAsync(false);
            mascotaRepoMock.Setup(repo => repo.TieneVacunaAntirrabicaAsync(It.IsAny<int>())).ReturnsAsync(true);

            var service = new CitasService(citaRepoMock.Object, mascotaRepoMock.Object);
            var cita = new Cita { MascotaId = 1, Fecha = DateTime.Now.AddDays(1), EsUrgencia = false };

            // Act
            await service.CrearCitaAsync(cita);

            // Assert
            citaRepoMock.Verify(repo => repo.GuardarAsync(It.IsAny<Cita>()), Times.Once);
        }

        // 2. No crear cita si horario está ocupado
        [TestMethod]
        public async Task CrearCitaAsync_CuandoHorarioEstaOcupado_LanzaExcepcionYNoGuarda()
        {
            // Arrange
            var citaRepoMock = new Mock<ICitaRepository>();
            var mascotaRepoMock = new Mock<IMascotaRepository>();

            citaRepoMock.Setup(repo => repo.IsHorarioOcupadoAsync(It.IsAny<DateTime>())).ReturnsAsync(true);

            var service = new CitasService(citaRepoMock.Object, mascotaRepoMock.Object);
            var cita = new Cita { MascotaId = 1, Fecha = DateTime.Now.AddDays(1) };

            // Act & Assert
            var ex = await Assert.ThrowsExactlyAsync<InvalidOperationException>(
                () => service.CrearCitaAsync(cita)
            );
            Assert.AreEqual("El horario ya está ocupado.", ex.Message);
            citaRepoMock.Verify(repo => repo.GuardarAsync(It.IsAny<Cita>()), Times.Never);
        }

        // 3. Faltan datos obligatorios
        [TestMethod]
        public async Task CrearCitaAsync_CuandoFaltanDatos_LanzaExcepcion()
        {
            // Arrange
            var citaRepoMock = new Mock<ICitaRepository>();
            var mascotaRepoMock = new Mock<IMascotaRepository>();
            var service = new CitasService(citaRepoMock.Object, mascotaRepoMock.Object);

            // MascotaId inválido
            var cita = new Cita { MascotaId = 0, Fecha = DateTime.Now.AddDays(1) };

            // Act & Assert
            var ex = await Assert.ThrowsExactlyAsync<ArgumentException>(
                () => service.CrearCitaAsync(cita)
            );
            Assert.AreEqual("Faltan datos obligatorios.", ex.Message);
            citaRepoMock.Verify(repo => repo.GuardarAsync(It.IsAny<Cita>()), Times.Never);
        }

        // 4. No permitir autoagendamiento por vacuna antirrábica
        [TestMethod]
        public async Task CrearCitaAsync_CuandoMascotaSinVacunaYNoEsUrgencia_LanzaExcepcion()
        {
            // Arrange
            var citaRepoMock = new Mock<ICitaRepository>();
            var mascotaRepoMock = new Mock<IMascotaRepository>();

            citaRepoMock.Setup(repo => repo.IsHorarioOcupadoAsync(It.IsAny<DateTime>())).ReturnsAsync(false);
            mascotaRepoMock.Setup(repo => repo.TieneVacunaAntirrabicaAsync(1)).ReturnsAsync(false); // Falla vacuna

            var service = new CitasService(citaRepoMock.Object, mascotaRepoMock.Object);
            var cita = new Cita { MascotaId = 1, Fecha = DateTime.Now.AddDays(1), EsUrgencia = false };

            // Act & Assert
            var ex = await Assert.ThrowsExactlyAsync<InvalidOperationException>(
                () => service.CrearCitaAsync(cita)
            );
            Assert.AreEqual("La mascota no cumple con la validación antirrábica para este servicio.", ex.Message);
            citaRepoMock.Verify(repo => repo.GuardarAsync(It.IsAny<Cita>()), Times.Never);
        }

        // 5. Cancelar cita correctamente
        [TestMethod]
        public async Task CancelarCitaAsync_CuandoCitaExiste_LlamaActualizarConEstadoCancelada()
        {
            // Arrange
            var citaRepoMock = new Mock<ICitaRepository>();
            var mascotaRepoMock = new Mock<IMascotaRepository>();

            var citaExistente = new Cita { Id = 1, Estado = "Agendada" };
            citaRepoMock.Setup(repo => repo.ObtenerPorIdAsync(1)).ReturnsAsync(citaExistente);

            var service = new CitasService(citaRepoMock.Object, mascotaRepoMock.Object);

            // Act
            await service.CancelarCitaAsync(1);

            // Assert
            Assert.AreEqual("Cancelada", citaExistente.Estado);
            citaRepoMock.Verify(repo => repo.ActualizarAsync(citaExistente), Times.Once);
        }
    }

    [TestClass]
    public sealed class PagoDepositoServiceTests
    {
        // 1. Aplicar depósito a cliente nuevo
        [TestMethod]
        public async Task RequiereDepositoAsync_CuandoEsClienteNuevo_RetornaTrue()
        {
            // Arrange
            var clienteRepoMock = new Mock<IClienteRepository>();
            var pagoRepoMock = new Mock<IPagoRepository>();

            clienteRepoMock.Setup(repo => repo.EsClienteNuevoAsync(1)).ReturnsAsync(true);

            var service = new PagoDepositoService(clienteRepoMock.Object, pagoRepoMock.Object);

            // Act
            bool requiere = await service.RequiereDepositoAsync(1);

            // Assert
            Assert.IsTrue(requiere);
        }

        // 2. Aplicar depósito a cliente con no-shows recurrentes
        [TestMethod]
        public async Task RequiereDepositoAsync_CuandoClienteTieneNoShowsRecurrentes_RetornaTrue()
        {
            // Arrange
            var clienteRepoMock = new Mock<IClienteRepository>();
            var pagoRepoMock = new Mock<IPagoRepository>();

            clienteRepoMock.Setup(repo => repo.EsClienteNuevoAsync(2)).ReturnsAsync(false);
            clienteRepoMock.Setup(repo => repo.ObtenerCantidadNoShowsAsync(2)).ReturnsAsync(3); // >= 2

            var service = new PagoDepositoService(clienteRepoMock.Object, pagoRepoMock.Object);

            // Act
            bool requiere = await service.RequiereDepositoAsync(2);

            // Assert
            Assert.IsTrue(requiere);
        }

        // 3. Monto inválido lanza excepción
        [TestMethod]
        public async Task RegistrarPagoAsync_CuandoMontoEsInvalido_LanzaExcepcion()
        {
            // Arrange
            var clienteRepoMock = new Mock<IClienteRepository>();
            var pagoRepoMock = new Mock<IPagoRepository>();
            var service = new PagoDepositoService(clienteRepoMock.Object, pagoRepoMock.Object);

            var pagoInvalido = new Pago { ClienteId = 1, Monto = -50m };

            // Act & Assert
            var ex = await Assert.ThrowsExactlyAsync<ArgumentException>(
                () => service.RegistrarPagoAsync(pagoInvalido)
            );
            Assert.AreEqual("El monto debe ser mayor a 0.", ex.Message);
            pagoRepoMock.Verify(repo => repo.GuardarAsync(It.IsAny<Pago>()), Times.Never);
        }

        [TestMethod]
        public async Task RegistrarPagoAsync_CuandoMontoEsCero_LanzaExcepcion()
        {
            var clienteRepoMock = new Mock<IClienteRepository>();
            var pagoRepoMock = new Mock<IPagoRepository>();
            var service = new PagoDepositoService(clienteRepoMock.Object, pagoRepoMock.Object);

            var ex = await Assert.ThrowsExactlyAsync<ArgumentException>(
                () => service.RegistrarPagoAsync(new Pago { ClienteId = 1, Monto = 0m })
            );
            Assert.AreEqual("El monto debe ser mayor a 0.", ex.Message);
        }

        [TestMethod]
        public async Task RegistrarPagoAsync_CuandoMontoEsValido_LlamaGuardar()
        {
            var clienteRepoMock = new Mock<IClienteRepository>();
            var pagoRepoMock = new Mock<IPagoRepository>();
            var service = new PagoDepositoService(clienteRepoMock.Object, pagoRepoMock.Object);

            await service.RegistrarPagoAsync(new Pago { ClienteId = 1, Monto = 100m });
            pagoRepoMock.Verify(repo => repo.GuardarAsync(It.IsAny<Pago>()), Times.Once);
        }
    }

    // =========================================================================
    // COMPLEMENTOS FALTANTES (Triage, Cliente, Mascota)
    // =========================================================================
    public class Triage { public int Id { get; set; } public int Nivel { get; set; } public int CitaId { get; set; } }
    public class Cliente { public int Id { get; set; } public string Nombre { get; set; } = ""; public bool TieneConsentimiento { get; set; } }
    public class Mascota { public int Id { get; set; } public string Especie { get; set; } = ""; public int ClienteId { get; set; } }

    public interface ITriageRepository { Task GuardarAsync(Triage triage); Task<Triage?> ObtenerPorCitaIdAsync(int citaId); }
    public interface IClienteRepoExtend : IClienteRepository { Task GuardarAsync(Cliente cliente); Task<Cliente?> ObtenerPorIdAsync(int id); }
    public interface IMascotaRepoExtend : IMascotaRepository { Task GuardarAsync(Mascota mascota); Task<Mascota?> ObtenerPorIdAsync(int id); }

    public class TriageService
    {
        private readonly ITriageRepository _repo;
        private readonly ICitaRepository _citaRepo;
        public TriageService(ITriageRepository repo, ICitaRepository citaRepo) { _repo = repo; _citaRepo = citaRepo; }

        public async Task RegistrarTriageAsync(Triage t) {
            if (t.CitaId <= 0) throw new ArgumentException("CitaId requerido.");
            if (t.Nivel < 1 || t.Nivel > 5) throw new ArgumentOutOfRangeException("Nivel inválido.");

            var cita = await _citaRepo.ObtenerPorIdAsync(t.CitaId) ?? throw new InvalidOperationException("Cita no existe.");
            if (t.Nivel == 1) { 
                cita.EsUrgencia = true; 
                await _citaRepo.ActualizarAsync(cita); 
            }
            await _repo.GuardarAsync(t);
        }
    }

    public class ClienteService
    {
        private readonly IClienteRepoExtend _repo;
        public ClienteService(IClienteRepoExtend repo) { _repo = repo; }

        public async Task RegistrarClienteAsync(Cliente c) {
            if (string.IsNullOrEmpty(c.Nombre)) throw new ArgumentException("Nombre requerido.");
            if (!c.TieneConsentimiento) throw new InvalidOperationException("Requiere consentimiento.");
            await _repo.GuardarAsync(c);
        }
    }

    public class MascotaService
    {
        private readonly IMascotaRepoExtend _repo;
        private readonly IClienteRepoExtend _clienteRepo;
        public MascotaService(IMascotaRepoExtend repo, IClienteRepoExtend clienteRepo) { _repo = repo; _clienteRepo = clienteRepo; }

        public async Task RegistrarMascotaAsync(Mascota m) {
            if (string.IsNullOrEmpty(m.Especie)) throw new ArgumentException("Especie requerida.");
            if (m.ClienteId > 0 && await _clienteRepo.ObtenerPorIdAsync(m.ClienteId) == null) throw new InvalidOperationException("Cliente inválido.");
            await _repo.GuardarAsync(m);
        }
    }

    [TestClass]
    public sealed class TriageServiceTests
    {
        private Mock<ITriageRepository> _tRepo = new Mock<ITriageRepository>();
        private Mock<ICitaRepository> _cRepo = new Mock<ICitaRepository>();
        private TriageService _svc;

#pragma warning disable CS8618 
        [TestInitialize] public void Init() { 
            _tRepo = new Mock<ITriageRepository>(); 
            _cRepo = new Mock<ICitaRepository>(); 
            _svc = new TriageService(_tRepo.Object, _cRepo.Object); 
        }
#pragma warning restore CS8618 

        [TestMethod] public async Task RegistrarTriage_ConDatosValidos_LlamaGuardar() {
            _cRepo.Setup(r => r.ObtenerPorIdAsync(1)).ReturnsAsync(new Cita { Id = 1 });
            await _svc.RegistrarTriageAsync(new Triage { CitaId = 1, Nivel = 3 });
            _tRepo.Verify(r => r.GuardarAsync(It.IsAny<Triage>()), Times.Once);
        }
        [TestMethod] public async Task RegistrarTriage_NivelInvalidoSuperior_LanzaExcepcion() {
            await Assert.ThrowsExactlyAsync<ArgumentOutOfRangeException>(() => _svc.RegistrarTriageAsync(new Triage { CitaId = 1, Nivel = 6 }));
        }
        [TestMethod] public async Task RegistrarTriage_NivelInvalidoInferior_LanzaExcepcion() {
            await Assert.ThrowsExactlyAsync<ArgumentOutOfRangeException>(() => _svc.RegistrarTriageAsync(new Triage { CitaId = 1, Nivel = 0 }));
        }
        [TestMethod] public async Task RegistrarTriage_CitaInvalida_LanzaExcepcion() {
            await Assert.ThrowsExactlyAsync<ArgumentException>(() => _svc.RegistrarTriageAsync(new Triage { CitaId = 0, Nivel = 3 }));
        }
        [TestMethod] public async Task RegistrarTriage_CitaNoExiste_LanzaExcepcion() {
            _cRepo.Setup(r => r.ObtenerPorIdAsync(1)).ReturnsAsync((Cita?)null);
            await Assert.ThrowsExactlyAsync<InvalidOperationException>(() => _svc.RegistrarTriageAsync(new Triage { CitaId = 1, Nivel = 3 }));
        }
        [TestMethod] public async Task RegistrarTriage_PriorizaEmergencia_CambiaEstadoCita() {
            var cita = new Cita { Id = 1, EsUrgencia = false };
            _cRepo.Setup(r => r.ObtenerPorIdAsync(1)).ReturnsAsync(cita);
            await _svc.RegistrarTriageAsync(new Triage { CitaId = 1, Nivel = 1 });
            Assert.IsTrue(cita.EsUrgencia);
            _cRepo.Verify(r => r.ActualizarAsync(cita), Times.Once);
        }
        [TestMethod] public async Task RegistrarTriage_VerificaLlamadaAActualizarNuncaAislado() {
            var cita = new Cita { Id = 1, EsUrgencia = false };
            _cRepo.Setup(r => r.ObtenerPorIdAsync(1)).ReturnsAsync(cita);
            await _svc.RegistrarTriageAsync(new Triage { CitaId = 1, Nivel = 2 });
            _cRepo.Verify(r => r.ActualizarAsync(It.IsAny<Cita>()), Times.Never);
        }
    }

    [TestClass]
    public sealed class ClienteServiceTests
    {
        private Mock<IClienteRepoExtend> _repo = new Mock<IClienteRepoExtend>();
        private ClienteService _svc;

#pragma warning disable CS8618 
        [TestInitialize] public void Init() { 
            _repo = new Mock<IClienteRepoExtend>(); 
            _svc = new ClienteService(_repo.Object); 
        }
#pragma warning restore CS8618 

        [TestMethod] public async Task RegistrarCliente_DatosValidos_LlamaGuardar() {
            await _svc.RegistrarClienteAsync(new Cliente { Nombre = "Juan", TieneConsentimiento = true });
            _repo.Verify(r => r.GuardarAsync(It.IsAny<Cliente>()), Times.Once);
        }
        [TestMethod] public async Task RegistrarCliente_SinNombre_LanzaExcepcion() {
            await Assert.ThrowsExactlyAsync<ArgumentException>(() => _svc.RegistrarClienteAsync(new Cliente { Nombre = "", TieneConsentimiento = true }));
        }
        [TestMethod] public async Task RegistrarCliente_SinConsentimiento_LanzaExcepcion() {
            await Assert.ThrowsExactlyAsync<InvalidOperationException>(() => _svc.RegistrarClienteAsync(new Cliente { Nombre = "Juan", TieneConsentimiento = false }));
        }
    }

    [TestClass]
    public sealed class MascotaServiceTests
    {
        private Mock<IMascotaRepoExtend> _mRepo = new Mock<IMascotaRepoExtend>();
        private Mock<IClienteRepoExtend> _cRepo = new Mock<IClienteRepoExtend>();
        private MascotaService _svc;

#pragma warning disable CS8618 
        [TestInitialize] public void Init() { 
            _mRepo = new Mock<IMascotaRepoExtend>(); 
            _cRepo = new Mock<IClienteRepoExtend>(); 
            _svc = new MascotaService(_mRepo.Object, _cRepo.Object); 
        }
#pragma warning restore CS8618 

        [TestMethod] public async Task RegistrarMascota_DatosValidos_LlamaGuardar() {
            _cRepo.Setup(r => r.ObtenerPorIdAsync(1)).ReturnsAsync(new Cliente { Id = 1 });
            await _svc.RegistrarMascotaAsync(new Mascota { Especie = "Perro", ClienteId = 1 });
            _mRepo.Verify(r => r.GuardarAsync(It.IsAny<Mascota>()), Times.Once);
        }
        [TestMethod] public async Task RegistrarMascota_SinEspecie_LanzaExcepcion() {
            await Assert.ThrowsExactlyAsync<ArgumentException>(() => _svc.RegistrarMascotaAsync(new Mascota { Especie = "", ClienteId = 1 }));
        }
        [TestMethod] public async Task RegistrarMascota_ClienteAsociadoNoExiste_LanzaExcepcion() {
            _cRepo.Setup(r => r.ObtenerPorIdAsync(1)).ReturnsAsync((Cliente?)null);
            await Assert.ThrowsExactlyAsync<InvalidOperationException>(() => _svc.RegistrarMascotaAsync(new Mascota { Especie = "Gato", ClienteId = 1 }));
        }

        [TestMethod] public async Task RegistrarMascota_VerificaLlamadaAlRepo_Never() {
            _cRepo.Setup(r => r.ObtenerPorIdAsync(1)).ReturnsAsync((Cliente?)null);
            try { await _svc.RegistrarMascotaAsync(new Mascota { Especie = "Gato", ClienteId = 1 }); } catch { }
            _mRepo.Verify(r => r.GuardarAsync(It.IsAny<Mascota>()), Times.Never);
        }

        [TestMethod] public async Task RegistrarMascota_AsociarMascota_ClienteExistente_AsociaMascota() {
            _cRepo.Setup(r => r.ObtenerPorIdAsync(2)).ReturnsAsync(new Cliente { Id = 2 });
            await _svc.RegistrarMascotaAsync(new Mascota { Especie = "Loro", ClienteId = 2 });
            _mRepo.Verify(r => r.GuardarAsync(It.Is<Mascota>(m => m.ClienteId == 2)), Times.Once);
        }
    }

    // =========================================================================
    // NUEVAS ENTIDADES Y SERVICIOS (HistoriaClinica, Consentimiento, Recordatorio)
    // =========================================================================
    public class HistoriaClinica { public int Id { get; set; } public int MascotaId { get; set; } public string DiagnosticoSOAP { get; set; } = string.Empty; }
    public class Consentimiento { public int Id { get; set; } public int ClienteId { get; set; } public bool Aceptado { get; set; } }
    public class Recordatorio { public int Id { get; set; } public int CitaId { get; set; } public DateTime FechaEnvio { get; set; } public bool Enviado { get; set; } }

    public interface IHistoriaClinicaRepository { Task GuardarAsync(HistoriaClinica h); }
    public interface IConsentimientoRepository { Task GuardarAsync(Consentimiento c); Task ActualizarAsync(Consentimiento c); Task<Consentimiento?> ObtenerPorClienteIdAsync(int clienteId); }
    public interface IRecordatorioRepository { Task GuardarAsync(Recordatorio r); }

    public class HistoriaClinicaService {
        private readonly IHistoriaClinicaRepository _repo;
        private readonly IMascotaRepoExtend _mascotaRepo;
        public HistoriaClinicaService(IHistoriaClinicaRepository repo, IMascotaRepoExtend mascotaRepo) { _repo = repo; _mascotaRepo = mascotaRepo; }
        public async Task RegistrarHistoriaAsync(HistoriaClinica h) {
            if (string.IsNullOrEmpty(h.DiagnosticoSOAP)) throw new ArgumentException("Diagnostico requerido.");
            if (await _mascotaRepo.ObtenerPorIdAsync(h.MascotaId) == null) throw new InvalidOperationException("Mascota no existe.");
            await _repo.GuardarAsync(h);
        }
    }

    public class ConsentimientoService {
        private readonly IConsentimientoRepository _repo;
        public ConsentimientoService(IConsentimientoRepository repo) { _repo = repo; }
        public async Task RegistrarConsentimientoAsync(Consentimiento c) {
            if (c.ClienteId <= 0) throw new ArgumentException("Cliente inválido.");
            await _repo.GuardarAsync(c);
        }
        public async Task RevocarConsentimientoAsync(int id) {
            var c = await _repo.ObtenerPorClienteIdAsync(id) ?? throw new InvalidOperationException("No existe.");
            c.Aceptado = false;
            await _repo.ActualizarAsync(c);
        }
    }

    public class RecordatorioService {
        private readonly IRecordatorioRepository _repo;
        private readonly ICitaRepository _citaRepo;
        public RecordatorioService(IRecordatorioRepository repo, ICitaRepository citaRepo) { _repo = repo; _citaRepo = citaRepo; }
        public async Task CrearRecordatorioAsync(Recordatorio r) {
            if (r.FechaEnvio < DateTime.Now) throw new ArgumentException("Fecha inválida.");
            if (await _citaRepo.ObtenerPorIdAsync(r.CitaId) == null) throw new InvalidOperationException("Cita inválida.");
            await _repo.GuardarAsync(r);
        }
    }

    [TestClass]
    public sealed class HistoriaClinicaServiceTests
    {
        private Mock<IHistoriaClinicaRepository> _hRepo = new Mock<IHistoriaClinicaRepository>();
        private Mock<IMascotaRepoExtend> _mRepo = new Mock<IMascotaRepoExtend>();
        private HistoriaClinicaService _svc;

#pragma warning disable CS8618 
        [TestInitialize] public void Init() { _hRepo = new Mock<IHistoriaClinicaRepository>(); _mRepo = new Mock<IMascotaRepoExtend>(); _svc = new HistoriaClinicaService(_hRepo.Object, _mRepo.Object); }
#pragma warning restore CS8618

        [TestMethod] public async Task RegistrarHistoria_ConDatosValidos_LlamaGuardar() { _mRepo.Setup(r => r.ObtenerPorIdAsync(1)).ReturnsAsync(new Mascota { Id = 1 }); await _svc.RegistrarHistoriaAsync(new HistoriaClinica { MascotaId = 1, DiagnosticoSOAP = "Sano" }); _hRepo.Verify(r => r.GuardarAsync(It.IsAny<HistoriaClinica>()), Times.Once); }
        [TestMethod] public async Task RegistrarHistoria_MascotaNoExiste_LanzaExcepcion() { _mRepo.Setup(r => r.ObtenerPorIdAsync(1)).ReturnsAsync((Mascota?)null); await Assert.ThrowsExactlyAsync<InvalidOperationException>(() => _svc.RegistrarHistoriaAsync(new HistoriaClinica { MascotaId = 1, DiagnosticoSOAP = "S" })); }
        [TestMethod] public async Task RegistrarHistoria_FaltaDiagnostico_LanzaExcepcion() { await Assert.ThrowsExactlyAsync<ArgumentException>(() => _svc.RegistrarHistoriaAsync(new HistoriaClinica { MascotaId = 1, DiagnosticoSOAP = "" })); }
        [TestMethod] public async Task RegistrarHistoria_EnErrorNoLlamaRepositorio() { await Assert.ThrowsExactlyAsync<ArgumentException>(() => _svc.RegistrarHistoriaAsync(new HistoriaClinica { DiagnosticoSOAP = "" })); _hRepo.Verify(r => r.GuardarAsync(It.IsAny<HistoriaClinica>()), Times.Never); }
        [TestMethod] public async Task RegistrarHistoria_FaltaDiagnosticoNull_LanzaExcepcion() { await Assert.ThrowsExactlyAsync<ArgumentException>(() => _svc.RegistrarHistoriaAsync(new HistoriaClinica { MascotaId = 1, DiagnosticoSOAP = null! })); }
    }

    [TestClass]
    public sealed class ConsentimientoServiceTests
    {
        private Mock<IConsentimientoRepository> _repo = new Mock<IConsentimientoRepository>();
        private ConsentimientoService _svc;

#pragma warning disable CS8618 
        [TestInitialize] public void Init() { _repo = new Mock<IConsentimientoRepository>(); _svc = new ConsentimientoService(_repo.Object); }
#pragma warning restore CS8618

        [TestMethod] public async Task RegistrarConsentimiento_DatosValidos_LlamaGuardar() { await _svc.RegistrarConsentimientoAsync(new Consentimiento { ClienteId = 1, Aceptado = true }); _repo.Verify(r => r.GuardarAsync(It.IsAny<Consentimiento>()), Times.Once); }
        [TestMethod] public async Task RegistrarConsentimiento_ClienteInvalido_LanzaExcepcion() { await Assert.ThrowsExactlyAsync<ArgumentException>(() => _svc.RegistrarConsentimientoAsync(new Consentimiento { ClienteId = 0 })); }
        [TestMethod] public async Task RevocarConsentimiento_ConsentimientoExiste_ActualizaAceptado() { var c = new Consentimiento { ClienteId = 1, Aceptado = true }; _repo.Setup(r => r.ObtenerPorClienteIdAsync(1)).ReturnsAsync(c); await _svc.RevocarConsentimientoAsync(1); Assert.IsFalse(c.Aceptado); _repo.Verify(r => r.ActualizarAsync(c), Times.Once); }
        [TestMethod] public async Task RevocarConsentimiento_NoExiste_LanzaExcepcion() { _repo.Setup(r => r.ObtenerPorClienteIdAsync(1)).ReturnsAsync((Consentimiento?)null); await Assert.ThrowsExactlyAsync<InvalidOperationException>(() => _svc.RevocarConsentimientoAsync(1)); }
        [TestMethod] public async Task RevocarConsentimiento_EnErrorNoVerificaLlamada() { _repo.Setup(r => r.ObtenerPorClienteIdAsync(1)).ReturnsAsync((Consentimiento?)null); try { await _svc.RevocarConsentimientoAsync(1); } catch { } _repo.Verify(r => r.ActualizarAsync(It.IsAny<Consentimiento>()), Times.Never); }
    }

    [TestClass]
    public sealed class RecordatorioServiceTests
    {
        private Mock<IRecordatorioRepository> _rRepo = new Mock<IRecordatorioRepository>();
        private Mock<ICitaRepository> _cRepo = new Mock<ICitaRepository>();
        private RecordatorioService _svc;

#pragma warning disable CS8618 
        [TestInitialize] public void Init() { _rRepo = new Mock<IRecordatorioRepository>(); _cRepo = new Mock<ICitaRepository>(); _svc = new RecordatorioService(_rRepo.Object, _cRepo.Object); }
#pragma warning restore CS8618

        [TestMethod] public async Task CrearRecordatorio_CitaValida_LlamaGuardar() { _cRepo.Setup(r => r.ObtenerPorIdAsync(1)).ReturnsAsync(new Cita { Id = 1 }); await _svc.CrearRecordatorioAsync(new Recordatorio { CitaId = 1, FechaEnvio = DateTime.Now.AddDays(1) }); _rRepo.Verify(r => r.GuardarAsync(It.IsAny<Recordatorio>()), Times.Once); }
        [TestMethod] public async Task CrearRecordatorio_CitaNoValida_LanzaExcepcion() { _cRepo.Setup(r => r.ObtenerPorIdAsync(1)).ReturnsAsync((Cita?)null); await Assert.ThrowsExactlyAsync<InvalidOperationException>(() => _svc.CrearRecordatorioAsync(new Recordatorio { CitaId = 1, FechaEnvio = DateTime.Now.AddDays(1) })); }
        [TestMethod] public async Task CrearRecordatorio_FechaPasada_LanzaExcepcion() { await Assert.ThrowsExactlyAsync<ArgumentException>(() => _svc.CrearRecordatorioAsync(new Recordatorio { CitaId = 1, FechaEnvio = DateTime.Now.AddDays(-1) })); }
        [TestMethod] public async Task CrearRecordatorio_FaltaCita_LanzaExcepcion() { _cRepo.Setup(r => r.ObtenerPorIdAsync(0)).ReturnsAsync((Cita?)null); await Assert.ThrowsExactlyAsync<InvalidOperationException>(() => _svc.CrearRecordatorioAsync(new Recordatorio { CitaId = 0, FechaEnvio = DateTime.Now.AddDays(1) })); }
        [TestMethod] public async Task CrearRecordatorio_EnErrorVerificarGuardar_Never() { try { await _svc.CrearRecordatorioAsync(new Recordatorio { CitaId = 1, FechaEnvio = DateTime.Now.AddDays(-1) }); } catch { } _rRepo.Verify(r => r.GuardarAsync(It.IsAny<Recordatorio>()), Times.Never); }
    }

    [TestClass]
    public sealed class PruebasCitasAdicionalesTests
    {
        private Mock<ICitaRepository> _cRepo = new Mock<ICitaRepository>();
        private Mock<IMascotaRepository> _mRepo = new Mock<IMascotaRepository>();
        private CitasService _svc;

#pragma warning disable CS8618 
        [TestInitialize] public void Init() { _cRepo = new Mock<ICitaRepository>(); _mRepo = new Mock<IMascotaRepository>(); _svc = new CitasService(_cRepo.Object, _mRepo.Object); }
#pragma warning restore CS8618

        [TestMethod] public async Task ReprogramarCita_CitaNoExistente_LanzaExcepcion() { _cRepo.Setup(r => r.ObtenerPorIdAsync(1)).ReturnsAsync((Cita?)null); try { await _svc.CancelarCitaAsync(1); } catch (InvalidOperationException ex) { Assert.AreEqual("La cita no existe.", ex.Message); } _cRepo.Verify(r => r.ActualizarAsync(It.IsAny<Cita>()), Times.Never); }
        [TestMethod] public async Task CancelarCita_CitaExistente_VerificaActualizar() { var cita = new Cita { Id = 2, Estado = "Activa" }; _cRepo.Setup(r => r.ObtenerPorIdAsync(2)).ReturnsAsync(cita); await _svc.CancelarCitaAsync(2); _cRepo.Verify(r => r.ActualizarAsync(It.IsAny<Cita>()), Times.Once); }
        [TestMethod] public async Task CrearCita_EmergenciaSinVacuna_LlamaGuardar() { _cRepo.Setup(r => r.IsHorarioOcupadoAsync(It.IsAny<DateTime>())).ReturnsAsync(false); _mRepo.Setup(r => r.TieneVacunaAntirrabicaAsync(It.IsAny<int>())).ReturnsAsync(false); await _svc.CrearCitaAsync(new Cita { MascotaId = 1, Fecha = DateTime.Now.AddDays(1), EsUrgencia = true }); _cRepo.Verify(r => r.GuardarAsync(It.IsAny<Cita>()), Times.Once); }
        [TestMethod] public async Task CrearCita_FechaPasada_ContinuaProcessoSiRepoNoValida() { _cRepo.Setup(r => r.IsHorarioOcupadoAsync(It.IsAny<DateTime>())).ReturnsAsync(false); _mRepo.Setup(r => r.TieneVacunaAntirrabicaAsync(It.IsAny<int>())).ReturnsAsync(true); await _svc.CrearCitaAsync(new Cita { MascotaId = 1, Fecha = DateTime.Now.AddDays(-1), EsUrgencia = false }); _cRepo.Verify(r => r.GuardarAsync(It.IsAny<Cita>()), Times.Once); }
        [TestMethod] public async Task CrearCita_EstadoPorDefectoEsPendiente() { _cRepo.Setup(r => r.IsHorarioOcupadoAsync(It.IsAny<DateTime>())).ReturnsAsync(false); _mRepo.Setup(r => r.TieneVacunaAntirrabicaAsync(It.IsAny<int>())).ReturnsAsync(true); Cita guardada = null!; _cRepo.Setup(r => r.GuardarAsync(It.IsAny<Cita>())).Callback<Cita>(c => guardada = c); await _svc.CrearCitaAsync(new Cita { MascotaId = 1, Fecha = DateTime.Now.AddDays(1) }); Assert.AreEqual("Pendiente", guardada.Estado); }
        [TestMethod] public async Task CancelarCita_CompruebaQueActualizaEstado_Correcto() { var cita = new Cita { Id = 3, Estado = "Pendiente" }; _cRepo.Setup(r => r.ObtenerPorIdAsync(3)).ReturnsAsync(cita); await _svc.CancelarCitaAsync(3); Assert.AreEqual("Cancelada", cita.Estado); }
    }

    [TestClass]
    public sealed class PruebasVariasAdicionalesTests
    {
        private Mock<IClienteRepoExtend> _cRepo = new Mock<IClienteRepoExtend>();
        private ClienteService _cSvc;
        private Mock<ITriageRepository> _tRepo = new Mock<ITriageRepository>();
        private Mock<ICitaRepository> _citaRepo = new Mock<ICitaRepository>();
        private TriageService _tSvc;

#pragma warning disable CS8618 
        [TestInitialize] public void Init() { _cRepo = new Mock<IClienteRepoExtend>(); _cSvc = new ClienteService(_cRepo.Object); _tRepo = new Mock<ITriageRepository>(); _citaRepo = new Mock<ICitaRepository>(); _tSvc = new TriageService(_tRepo.Object, _citaRepo.Object); }
#pragma warning restore CS8618

        [TestMethod] public async Task ClienteService_RegistrarCliente_ValidaNombreNull_LanzaExcepcion() { await Assert.ThrowsExactlyAsync<ArgumentException>(() => _cSvc.RegistrarClienteAsync(new Cliente { Nombre = null!, TieneConsentimiento = true })); }
        [TestMethod] public async Task ClienteService_RegistrarCliente_ConsientePeroSinNombre_NuncaGuarda() { try { await _cSvc.RegistrarClienteAsync(new Cliente { Nombre = "", TieneConsentimiento = true }); } catch { } _cRepo.Verify(r => r.GuardarAsync(It.IsAny<Cliente>()), Times.Never); }
        [TestMethod] public async Task TriageService_RegistrarTriage_NivelValido5_LlamaGuardar() { _citaRepo.Setup(r => r.ObtenerPorIdAsync(1)).ReturnsAsync(new Cita { Id = 1 }); await _tSvc.RegistrarTriageAsync(new Triage { CitaId = 1, Nivel = 5 }); _tRepo.Verify(r => r.GuardarAsync(It.IsAny<Triage>()), Times.Once); }
        [TestMethod] public async Task TriageService_RegistrarTriage_NivelValido4_LlamaGuardar() { _citaRepo.Setup(r => r.ObtenerPorIdAsync(1)).ReturnsAsync(new Cita { Id = 1 }); await _tSvc.RegistrarTriageAsync(new Triage { CitaId = 1, Nivel = 4 }); _tRepo.Verify(r => r.GuardarAsync(It.IsAny<Triage>()), Times.Once); }
        [TestMethod] public async Task TriageService_RegistrarTriage_ActualizaCitaEmergencia() { var cita = new Cita { Id = 1, EsUrgencia = false }; _citaRepo.Setup(r => r.ObtenerPorIdAsync(1)).ReturnsAsync(cita); await _tSvc.RegistrarTriageAsync(new Triage { CitaId = 1, Nivel = 1 }); Assert.IsTrue(cita.EsUrgencia); _citaRepo.Verify(r => r.ActualizarAsync(cita), Times.Once); }
        [TestMethod] public async Task TriageService_RegistrarTriage_VerificaNoActualizarCitaParaNivel2() { var cita = new Cita { Id = 1, EsUrgencia = false }; _citaRepo.Setup(r => r.ObtenerPorIdAsync(1)).ReturnsAsync(cita); await _tSvc.RegistrarTriageAsync(new Triage { CitaId = 1, Nivel = 2 }); _citaRepo.Verify(r => r.ActualizarAsync(It.IsAny<Cita>()), Times.Never); }
    }
}
