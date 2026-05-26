from pathlib import Path
import zipfile, textwrap

out_dir = Path('output')
out_dir.mkdir(exist_ok=True)
md_path = out_dir / 'arquitectura_veterinaria.md'
zip_path = out_dir / 'arquitectura_veterinaria.zip'

content = textwrap.dedent("""
# Arquitectura simple para sistema veterinario MVC

## Estructura de solución

```text
Veterinaria.sln
├─ Veterinaria.Web
│  ├─ Controllers
│  ├─ ViewModels
│  ├─ Views
│  ├─ Filters
│  └─ Program.cs / Startup.cs
├─ Veterinaria.Domain
│  ├─ Entities
│  ├─ Interfaces
│  ├─ Services
│  ├─ ValueObjects
│  └─ Rules
└─ Veterinaria.Infrastructure
   ├─ Persistence
   ├─ Repositories
   ├─ Configurations
   ├─ Migrations
   └─ Services
```

## Responsabilidad por capa

### Veterinaria.Web
Capa de presentación MVC. Recibe requests HTTP, valida entrada básica, coordina el flujo con servicios y retorna vistas o JSON si fuera necesario. Aquí viven los controladores, view models y la lógica de interfaz.

### Veterinaria.Domain
Capa central del negocio. Contiene entidades, reglas, contratos de repositorios y contratos de servicios de aplicación o dominio. No debe depender de ASP.NET Core ni de Entity Framework.

### Veterinaria.Infrastructure
Capa de acceso a datos e integración. Implementa `DbContext`, configuraciones de EF Core, repositorios concretos y servicios externos como correo o SMS. Esta capa depende de `Domain`, pero no al revés.

## Carpetas principales

### Veterinaria.Web
- Controllers.
- ViewModels.
- Views por módulo.
- Filters para autorización y validaciones.
- Helpers o extensions pequeñas si hacen falta.

### Veterinaria.Domain
- Entities para Cliente, Mascota, Cita, HistoriaClinica, Triage, Consentimiento y Pago.
- Interfaces para repositorios y servicios.
- Services para reglas de negocio puras.
- Rules para validaciones como depósitos, antigüedad de rabia o prioridades de triage.

### Veterinaria.Infrastructure
- Persistence para `VeterinariaDbContext`.
- Repositories con implementaciones EF Core.
- Configurations para Fluent API.
- Migrations.
- Services para envío de recordatorios por email o SMS.

## Controladores MVC

- `ClientesController`.
- `MascotasController`.
- `CitasController`.
- `TriageController`.
- `HistoriasClinicasController`.
- `ConsentimientosController`.
- `PagosController`.
- `RecordatoriosController`.
- `DashboardController`.

## Servicios e interfaces

### Servicios de aplicación
- `IClienteService`.
- `IMascotaService`.
- `ICitaService`.
- `ITriageService`.
- `IHistoriaClinicaService`.
- `IConsentimientoService`.
- `IPagoService`.
- `IRecordatorioService`.

### Repositorios
- `IClienteRepository`.
- `IMascotaRepository`.
- `ICitaRepository`.
- `ITriageRepository`.
- `IHistoriaClinicaRepository`.
- `IConsentimientoRepository`.
- `IPagoRepository`.

### Servicios de infraestructura
- `IEmailSender`.
- `ISmsSender`.
- `IDateTimeProvider`.
- `IUnitOfWork` si deseas confirmar varios cambios juntos.

## Repositorios sugeridos

- `ClienteRepository`.
- `MascotaRepository`.
- `CitaRepository`.
- `TriageRepository`.
- `HistoriaClinicaRepository`.
- `ConsentimientoRepository`.
- `PagoRepository`.

Cada repositorio debe manejar una sola entidad principal y consultas comunes del módulo. Para pruebas unitarias, las interfaces deben vivir en `Domain` y las implementaciones en `Infrastructure`.

## Flujo general del sistema

1. El usuario interactúa con una vista MVC en `Veterinaria.Web`.
2. El controlador recibe la solicitud y llama a un servicio de aplicación.
3. El servicio aplica reglas de negocio y coordina validaciones.
4. El servicio usa un repositorio mediante su interfaz.
5. El repositorio accede a `VeterinariaDbContext` y guarda o consulta datos.
6. La respuesta vuelve al servicio, luego al controlador y finalmente a la vista.

Ejemplo simple: `CitasController` llama a `ICitaService`, el servicio valida disponibilidad y política de depósito, luego usa `ICitaRepository` para persistir la cita.

## Arquitectura recomendada

La opción más práctica es una arquitectura en capas con separación clara entre UI, negocio y datos. Mantén la lógica de negocio fuera de los controladores y fuera del `DbContext` para que puedas probarla con MSTest usando mocks de interfaces.

Para tests, prioriza:
- servicios con lógica de negocio pura,
- repositorios con pruebas de integración separadas,
- controladores con pruebas unitarias ligeras usando servicios simulados.

Si quieres algo simple y sostenible, usa este patrón:
- controladores delgados,
- servicios con reglas,
- repositorios sin lógica de negocio,
- entidades con comportamiento básico.

## Recomendación final

Esta estructura es suficiente para el MVP veterinario y evita complejidad innecesaria. Permite cubrir citas, recordatorios, fichas, historia clínica, triage, consentimientos y pagos básicos con un diseño fácil de mantener y testear con MSTest.

""").strip() + '\n'

md_path.write_text(content, encoding='utf-8')
with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as z:
    z.write(md_path, arcname='arquitectura_veterinaria.md')
