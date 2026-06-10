---
name: testing
display: Testing / xUnit / pruebas unitarias
description: Cuando trabajes en pruebas unitarias, tests de integración o xUnit
---

# VetCare Testing — AI Agent Ruleset

> **Skills Reference**: Para patrones detallados usar estas skills:
> <!-- SKILLS_REF_START -->
> - [agent-creator](../skills/agent-creator/SKILL.md) - Crea nuevos sub-agentes para el orquestador principal de VetCare. Usar cuando necesites configurar una nueva especialidad para los agentes de IA.
> - [agent-sync](../skills/agent-sync/SKILL.md) - Sincroniza la tabla de sub-agentes y reglas de enrutamiento en AGENTS.md raíz. Usar siempre que agregues, elimines o cambies el nombre de un sub-agente.
> - [clean-architecture](../skills/clean-architecture/SKILL.md) - Onion Architecture para .NET Core. Vigila que las dependencias fluyan correctamente entre capas. Usar cuando crees, muevas o reorganices clases entre Domain, Application, Infrastructure y Web.
> - [commits](../skills/commits/SKILL.md) - Conventional commits para VetCare. Formato correcto de mensajes de commit. Usar siempre antes de hacer un git commit.
> - [csharp-dotnet](../skills/csharp-dotnet/SKILL.md) - Patrones C# profesionales, naming conventions, estructura de código y buenas prácticas para proyectos .NET Core. Usar cuando escribas o refactorices cualquier archivo .cs.
> - [pull-request](../skills/pull-request/SKILL.md) - Convenciones de Pull Request para VetCare. Título, descripción, checklist y cómo revisar. Usar siempre antes de crear o revisar un PR.
> <!-- SKILLS_REF_END -->

## Auto-invoke Skills

<!-- AUTO_INVOKE_START -->
| Acción | Skill |
|---|---|
| Crear o revisar un Pull Request | `pull-request` |
| Crear un nuevo sub-agente | `agent-creator` |
| Hacer un commit | `commits` |
| Modificar o agregar un sub-agente | `agent-sync` |
<!-- AUTO_INVOKE_END -->

## CRITICAL RULES — NON-NEGOTIABLE

### MSTest Framework
- ALWAYS: Decorar las clases de prueba con `[TestClass]` y los métodos con `[TestMethod]`.
- ALWAYS: Utilizar `[TestInitialize]` para inicializar el Sistema Bajo Prueba (`_sut`) y sus mocks antes de cada test.
- ALWAYS: Utilizar `[ClassInitialize]` (debe ser estático) para configuraciones que se ejecutan una sola vez por clase de prueba.
- ALWAYS: Utilizar `[DataRow]` para parametrizar pruebas y evitar código redundante.

### Patrón AAA (Arrange, Act, Assert)
- ALWAYS: Dividir el cuerpo de cada método de prueba explícitamente en tres bloques comentados:
  ```csharp
  // Arrange
  // Act
  // Assert
  ```
- NEVER: Mezclar preparación, ejecución y aserción en el mismo bloque.

### Aislamiento con Moq
- ALWAYS: Simular dependencias externas (Interfaces de base de datos, APIs de terceros, etc.) usando `Mock<T>`.
- ALWAYS: Configurar retornos esperados usando `.Setup(...)` y `.ReturnsAsync(...)` / `.Returns(...)`.
- ALWAYS: Verificar interacciones críticas usando `.Verify(..., Times.Once)` o `.Verify(..., Times.Never)`.
- NEVER: Simular comportamiento de entidades de dominio puro (instanciarlas normalmente).

### Cobertura de Código (90% - 95%)
- ALWAYS: Apuntar a una cobertura de código del 90% al 95% en los componentes de negocio testeables.
- ALWAYS: Incluir pruebas para flujos de error, validaciones, límites (edge cases) y excepciones.

### Estructura del Proyecto de Test
- ALWAYS: El proyecto `Veterinaria.Tests` vive como hermano de las demás capas dentro de `src/Backend/`.
- ALWAYS: Referenciar las 4 capas del proyecto (Domain, Application, Infrastructure, Web).
- ALWAYS: El proyecto debe estar registrado en `Veterinaria.sln`.
- NEVER: Crear el proyecto de test fuera de `src/Backend/` ni en una carpeta `tests/` separada.

---

## Estrategia de Pruebas

### Pruebas Unitarias (Ejemplo)
```csharp
[TestClass]
public class CitaApplicationTests
{
    private Mock<ICitaRepository> _citaRepositoryMock;
    private Mock<IUnitOfWork> _unitOfWorkMock;
    private CitaApplication _sut;

    [TestInitialize]
    public void Initialize()
    {
        _citaRepositoryMock = new Mock<ICitaRepository>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        
        _sut = new CitaApplication(_citaRepositoryMock.Object, _unitOfWorkMock.Object);
    }

    [TestMethod]
    public async Task CrearCita_CuandoDatosValidos_DebeRetornarExito()
    {
        // Arrange
        var citaDto = new CitaCreateDto { MascotaId = 1, VeterinarioId = 2, Fecha = DateTime.Now.AddDays(1) };
        var citaCreada = new Cita { Id = 1, MascotaId = 1, Activo = true };
        
        _citaRepositoryMock.Setup(repo => repo.CrearAsync(It.IsAny<Cita>()))
            .ReturnsAsync(citaCreada);
        _unitOfWorkMock.Setup(uow => uow.SaveChangesAsync())
            .ReturnsAsync(true);

        // Act
        var result = await _sut.CrearCitaAsync(citaDto);

        // Assert
        Assert.IsTrue(result.IsSuccess);
        Assert.AreEqual(1, result.Data.Id);
        _citaRepositoryMock.Verify(repo => repo.CrearAsync(It.IsAny<Cita>()), Times.Once);
        _unitOfWorkMock.Verify(uow => uow.SaveChangesAsync(), Times.Once);
    }

    [TestMethod]
    [DataRow(0)]
    [DataRow(-5)]
    public async Task CrearCita_CuandoMascotaIdInvalido_DebeLanzarValidationException(int mascotaIdInvalido)
    {
        // Arrange
        var citaDto = new CitaCreateDto { MascotaId = mascotaIdInvalido, VeterinarioId = 2, Fecha = DateTime.Now.AddDays(1) };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ValidationException>(() => _sut.CrearCitaAsync(citaDto));
        _citaRepositoryMock.Verify(repo => repo.CrearAsync(It.IsAny<Cita>()), Times.Never);
    }
}
```

### Pruebas con Contexto de Base de Datos e Integración
Cuando el escenario requiera interactuar con un contexto real de base de datos o verificar integración de múltiples componentes:
- Usar `ServiceCollection` para registrar la infraestructura real.
- Utilizar `IServiceScopeFactory` para obtener instancias de forma aislada e independiente en cada prueba.

```csharp
[TestClass]
public abstract class TestBase
{
    protected static IServiceScopeFactory ScopeFactory;

    [ClassInitialize]
    public static void InitializeClass(TestContext context)
    {
        var services = new ServiceCollection();
        
        // Registrar base de datos real (in-memory o base de pruebas) y servicios
        services.AddDbContext<VetCareDbContext>(options => 
            options.UseInMemoryDatabase("VetCareTestDb"));
        
        services.AddTransient<ICitaRepository, CitaRepository>();
        // ... registrar otras dependencias ...

        var serviceProvider = services.BuildServiceProvider();
        ScopeFactory = serviceProvider.GetRequiredService<IServiceScopeFactory>();
    }
}
```

---

## Tech Stack
MSTest | Moq | Microsoft.Extensions.DependencyInjection | Entity Framework Core InMemory | coverlet.collector

---

## Project Structure

El proyecto de test es **hermano** de las demás capas dentro de `src/Backend/`:

```text
src/Backend/
├── Veterinaria.Application/       ← Capa de servicios (el 90% de los tests van aquí)
├── Veterinaria.Domain/             ← Entidades puras
├── Veterinaria.Infrastructure/     ← EF Core, Repositories
├── Veterinaria.Web/                ← Controllers
├── Veterinaria.Tests/              ← ⭐ PROYECTO DE TESTS (al mismo nivel)
│   ├── Veterinaria.Tests.csproj
│   ├── Application/                ← Tests para cada *Application.cs
│   │   ├── CitaApplicationTests.cs
│   │   ├── ClienteApplicationTests.cs
│   │   ├── MascotaApplicationTests.cs
│   │   ├── PagoApplicationTests.cs
│   │   └── UsersApplicationTests.cs
│   ├── Domain/                     ← Tests de entidades con lógica de negocio
│   │   └── EntidadesTests.cs
│   ├── Infrastructure/             ← Tests de integración (opcional)
│   │   └── RepositoryIntegrationTests.cs
│   └── Helpers/                    ← Clases base, builders, fakes reutilizables
│       └── TestBase.cs
└── Veterinaria.sln                 ← Registra Veterinaria.Tests como proyecto
```

---

## Referencias del Proyecto (OBLIGATORIAS)

El archivo `Veterinaria.Tests.csproj` debe referenciar las 4 capas:

```xml
<ItemGroup>
  <ProjectReference Include="..\Veterinaria.Domain\Veterinaria.Domain.csproj" />
  <ProjectReference Include="..\Veterinaria.Application\Veterinaria.Application.csproj" />
  <ProjectReference Include="..\Veterinaria.Infrastructure\Veterinaria.Infrastructure.csproj" />
  <ProjectReference Include="..\Veterinaria.Web\Veterinaria.Web.csproj" />
</ItemGroup>
```

---

## Paquetes NuGet Requeridos

```xml
<ItemGroup>
  <PackageReference Include="MSTest.TestAdapter" Version="3.*" />
  <PackageReference Include="MSTest.TestFramework" Version="3.*" />
  <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.*" />
  <PackageReference Include="Moq" Version="4.*" />
  <PackageReference Include="coverlet.collector" Version="6.*" />
  <PackageReference Include="Microsoft.EntityFrameworkCore.InMemory" Version="8.*" />
</ItemGroup>
```

---

## Setup Commands (Crear proyecto de test desde cero)

```bash
# 1. Crear el proyecto MSTest dentro de src/Backend/
cd src/Backend
dotnet new mstest -n Veterinaria.Tests

# 2. Agregar el proyecto a la solución
dotnet sln Veterinaria.sln add Veterinaria.Tests/Veterinaria.Tests.csproj

# 3. Agregar referencias a las 4 capas
cd Veterinaria.Tests
dotnet add reference ../Veterinaria.Domain/Veterinaria.Domain.csproj
dotnet add reference ../Veterinaria.Application/Veterinaria.Application.csproj
dotnet add reference ../Veterinaria.Infrastructure/Veterinaria.Infrastructure.csproj
dotnet add reference ../Veterinaria.Web/Veterinaria.Web.csproj

# 4. Instalar paquetes NuGet necesarios
dotnet add package Moq
dotnet add package coverlet.collector
dotnet add package Microsoft.EntityFrameworkCore.InMemory
```

---

## Commands (Ejecución de tests)

```bash
# Ejecutar todas las pruebas
dotnet test src/Backend/Veterinaria.sln

# Ejecutar un test o clase específica
dotnet test src/Backend/Veterinaria.sln --filter "FullyQualifiedName~CitaApplicationTests"

# Ejecutar con análisis de cobertura para Visual Studio
dotnet test src/Backend/Veterinaria.sln --collect:"XPlat Code Coverage"

# Ejecutar con coverlet (formato Cobertura para reportes)
dotnet test src/Backend/Veterinaria.sln /p:CollectCoverage=true /p:CoverletOutputFormat=cobertura
```

---

## Decision Tree: ¿Qué capa testear?

```text
¿La clase tiene lógica de negocio (validaciones, flujos)?  → TEST UNITARIO (Application/)
¿La entidad del Domain tiene métodos propios?              → TEST UNITARIO (Domain/)
¿Necesitas validar queries reales con EF?                  → TEST INTEGRACIÓN (Infrastructure/)
¿El Controller solo delega al Application layer?           → NO TESTEAR
¿El Controller tiene lógica propia?                        → MOVER lógica al Application layer
```

---

## QA Checklist

- [ ] El proyecto `Veterinaria.Tests` existe en `src/Backend/` como hermano de las demás capas.
- [ ] El proyecto está registrado en `Veterinaria.sln`.
- [ ] Tiene referencias a Domain, Application, Infrastructure y Web.
- [ ] Los paquetes MSTest, Moq y coverlet están instalados.
- [ ] La clase de prueba tiene el atributo `[TestClass]`.
- [ ] Los métodos de prueba tienen el atributo `[TestMethod]`.
- [ ] Los métodos siguen la convención `NombreMetodo_Escenario_ResultadoEsperado`.
- [ ] Se implementó el patrón AAA con comentarios explícitos.
- [ ] Las dependencias externas están simuladas con `Mock<IInterface>`.
- [ ] Se validaron los casos de frontera (boundary conditions) y flujos excepcionales.
- [ ] No hay dependencias cruzadas de base de datos en tests unitarios.
- [ ] `dotnet test` pasa sin errores.
- [ ] La cobertura está entre 90% y 95%.

---

## Solución de Problemas Comunes en EF Core InMemory

Cuando trabajes con `Microsoft.EntityFrameworkCore.InMemory` en los tests, presta atención a los siguientes escenarios típicos de fallo:

### 1. Incompatibilidad de Versiones NuGet (MissingMethodException)
* **Problema**: El paquete `Microsoft.EntityFrameworkCore.InMemory` usa una versión mayor (ej. `10.*`) diferente a la de `Microsoft.EntityFrameworkCore` en el backend (ej. `8.0.11`). Provoca `MissingMethodException` al inicializar el DbContext.
* **Solución**: Sincroniza la versión del paquete InMemory en `Veterinaria.Tests.csproj` para que coincida exactamente con la versión de EF Core de `Veterinaria.Infrastructure.csproj` (ej. `8.0.11`).

### 2. Error de Sintaxis en UseInMemoryDatabase
* **Problema**: Poner la expresión de configuración de base de datos dentro de los paréntesis de `Guid.NewGuid()`.
* **Error**: `Guid.NewGuid(, b => b.EnableNullChecks(false)).ToString()`
* **Solución**: Separa los argumentos correctamente. El nombre de la base de datos es el primer parámetro y la lambda es el segundo:
  ```csharp
  .UseInMemoryDatabase(databaseName: "VetCareTestDb_Name_" + Guid.NewGuid().ToString(), inMemoryOptionsAction: b => b.EnableNullChecks(false))
  ```

### 3. Consultas con .Include que Retornan Null
* **Problema**: Si el código bajo test usa `.Include()` sobre relaciones obligatorias (claves foráneas no nulables) y en la base de datos en memoria no existe la entidad relacionada, la consulta completa podría retornar `null`.
* **Solución**: En la fase de `Arrange`, inicializa y guarda en el contexto todas las entidades requeridas en la relación (ej. `Usuario`, `Servicio`, `Veterinario`) con IDs coincidentes.

### 4. Conflictos de Seguimiento de Entidades (Identity Conflict / Tracking)
* **Problema**: Se guarda una entidad en `Arrange` (queda rastreada en el `DbContext`). Luego, el servicio la consulta (mediante `AsNoTracking()`) y trata de ejecutar un `Update()`. EF Core intenta rastrear la nueva instancia pero falla con: *`The instance of entity type '...' cannot be tracked because another instance with the same key...`*
* **Solución**: Detacha todas las entidades del Arrange limpiando el Change Tracker justo después de `SaveChangesAsync()`:
  ```csharp
  await _context.SaveChangesAsync();
  _context.ChangeTracker.Clear(); // Detacha todas las entidades rastreadas
  ```

---

## Naming Conventions

| Entidad | Patrón | Ejemplo |
|---------|--------|---------|
| Proyecto de Test | `<NombreSolucion>.Tests` | `Veterinaria.Tests` |
| Carpeta por capa | Nombre de la capa | `Application/`, `Domain/`, `Infrastructure/` |
| Clase de Test | `<ClaseBajoTest>Tests` | `CitaApplicationTests` |
| Método de Test | `NombreMetodo_Escenario_ResultadoEsperado` | `CrearCita_CuandoDatosValidos_DebeRetornarExito` |
| Clase base compartida | `TestBase` | `TestBase.cs` en `Helpers/` |
