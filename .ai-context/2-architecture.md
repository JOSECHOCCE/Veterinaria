# Diseño de Arquitectura de Software - Backend .NET Core

## 1. Patrón Arquitectónico: Arquitectura Cebolla (Onion Architecture)
El sistema se divide en proyectos independientes para asegurar el desacoplamiento total de la lógica central respecto a los agentes externos (bases de datos, frameworks, APIs).



## 2. Mapa de Carpetas y Responsabilidades de la Solución (`src/Backend/`)

### 📂 `VetCare.Domain` (Biblioteca de Clases - Núcleo Puro)
* **Responsabilidad:** Contiene los modelos del dominio y las reglas que nunca cambian dentro del negocio.
* **Restricción:** No puede tener dependencias de frameworks externos (sin Entity Framework, sin librerías web). Solo C# puro.
* **Estructura Interna:**
  * `Entities/`: Entidades del software con propiedades autocontenidas (`Usuario.cs`, `Mascota.cs`, `Cita.cs`).
  * `Interfaces/`: Abstracciones puras de almacenamiento corporativo (`IUnitOfWork.cs`, `IUserRepository.cs`).

### 📂 `VetCare.Application` (Biblioteca de Clases - Casos de Uso)
* **Responsabilidad:** Orquesta los flujos de la aplicación y ejecuta los requerimientos del sistema.
* **Estructura Interna:**
  * `DTOs/`: Objetos de transferencia de datos de entrada y salida (`UsersDto.cs`, `CitaCreateDto.cs`).
  * `Interfaces/`: Contratos de los servicios de aplicación (`IUsersApplication.cs`, `ICitaApplication.cs`).
  * `Main/`: Implementación concreta de los servicios encargados de coordinar la lógica de negocio.
  * `Validators/`: Reglas de validación de estructuras de datos antes de impactar el negocio.

### 📂 `VetCare.Infrastructure` (Biblioteca de Clases - Implementación Externa)
* **Responsabilidad:** Conecta la aplicación con herramientas del mundo real (Base de datos, servicios de correo, cifradores).
* **Estructura Interna:**
  * `Data/`: El contexto de datos de Entity Framework Core (`VetCareDbContext.cs`).
  * `Repositories/`: Implementación física de los contratos de persistencia utilizando consultas LINQ y EF.
  * `Security/`: Mecanismos de generación y validación de tokens criptográficos JWT.

### 📂 `VetCare.Web` (Proyecto ASP.NET Core Web API - Presentación)
* **Responsabilidad:** Expone los puntos de entrada HTTP (endpoints) de la aplicación de forma pública.
* **Estructura Interna:**
  * `Controllers/`: Controladores limpios (`UsersController.cs`, `CustomersController.cs`). Reciben JSON, invocan a la capa `Application` y devuelven `Response<T>`.
  * `Middleware/`: Capturadores globales de excepciones para transformar fallas de código en respuestas HTTP estructuradas seguras.

## 3. Patrón de Inyección de Dependencias (DI)
Toda resolución de dependencias debe registrarse explícitamente en el pipeline de la aplicación (`Program.cs` o `Startup.cs`). Se priorizará el ciclo de vida **Scoped** para repositorios y contextos de base de datos, y **Transient** para utilitarios de cálculo independientes.