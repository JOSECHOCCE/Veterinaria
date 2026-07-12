# Arquitectura del Sistema - VetCare Pro

## 1. Stack Tecnológico
| Capa | Tecnología |
|---|---|
| Frontend | React + TypeScript |
| Backend | .NET Core (Onion Architecture) |
| Persistencia | Entity Framework Core (Code-First) |
| Base de Datos | SQL Server |
| Autenticación | JWT (JSON Web Tokens) |
| Cliente HTTP | Axios con Interceptors |
| Prototipado UI | Stitch (carpeta `stitch_vetcare_pro_master_ui` ya descargada) |

---

## 2. Backend .NET Core

### 2.1 Patrón Arquitectónico: Arquitectura Cebolla (Onion Architecture)
El sistema se divide en proyectos independientes para asegurar el desacoplamiento total de la lógica central respecto a los agentes externos (bases de datos, frameworks, APIs).

### 2.2 Mapa de Carpetas y Responsabilidades de la Solución (`src/Backend/`)

#### 📂 `VetCare.Domain` (Biblioteca de Clases - Núcleo Puro)
* **Responsabilidad:** Contiene los modelos del dominio y las reglas que nunca cambian dentro del negocio.
* **Restricción:** No puede tener dependencias de frameworks externos (sin Entity Framework, sin librerías web). Solo C# puro.
* **Estructura Interna:**
  * `Entities/`: Entidades del software con propiedades autocontenidas (`Usuario.cs`, `Mascota.cs`, `Cita.cs`).
  * `Interfaces/`: Abstracciones puras de almacenamiento corporativo (`IUnitOfWork.cs`, `IUserRepository.cs`).

#### 📂 `VetCare.Application` (Biblioteca de Clases - Casos de Uso)
* **Responsabilidad:** Orquesta los flujos de la aplicación y ejecuta los requerimientos del sistema.
* **Estructura Interna:**
  * `DTOs/`: Objetos de transferencia de datos de entrada y salida (`UsersDto.cs`, `CitaCreateDto.cs`).
  * `Interfaces/`: Contratos de los servicios de aplicación (`IUsersApplication.cs`, `ICitaApplication.cs`).
  * `Main/`: Implementación concreta de los servicios encargados de coordinar la lógica de negocio.
  * `Validators/`: Reglas de validación de estructuras de datos antes de impactar el negocio.

#### 📂 `VetCare.Infrastructure` (Biblioteca de Clases - Implementación Externa)
* **Responsabilidad:** Conecta la aplicación con herramientas del mundo real (Base de datos, servicios de correo, cifradores).
* **Estructura Interna:**
  * `Data/`: El contexto de datos de Entity Framework Core (`VetCareDbContext.cs`).
  * `Repositories/`: Implementación física de los contratos de persistencia utilizando consultas LINQ y EF.
  * `Security/`: Mecanismos de generación y validación de tokens criptográficos JWT.

#### 📂 `VetCare.Web` (Proyecto ASP.NET Core Web API - Presentación)
* **Responsabilidad:** Expone los puntos de entrada HTTP (endpoints) de la aplicación de forma pública.
* **Estructura Interna:**
  * `Controllers/`: Controladores limpios (`UsersController.cs`, `CustomersController.cs`). Reciben JSON, invocan a la capa `Application` y devuelven `Response<T>`.
  * `Middleware/`: Capturadores globales de excepciones para transformar fallas de código en respuestas HTTP estructuradas seguras.

### 2.3 Patrón de Inyección de Dependencias (DI)
Toda resolución de dependencias debe registrarse explícitamente en el pipeline de la aplicación (`Program.cs` o `Startup.cs`). Se priorizará el ciclo de vida **Scoped** para repositorios y contextos de base de datos, y **Transient** para utilitarios de cálculo independientes.

---

## 3. Frontend (React + TypeScript)

### 3.1 Estructura del Cliente (React + TypeScript)
El proyecto frontend se ubicará de forma totalmente aislada dentro del directorio `src/Frontend/`. Su estructura organizativa será de tipo modular:
* `src/components/`: Componentes atómicos reutilizables (Botones, inputs, modales de alerta).
* `src/views/`: Pantallas completas del negocio (`FichaCliente`, `HistoriaClinica`, `Login`).
* `src/services/`: Capa cliente encargada de realizar las peticiones HTTP al API en C#.

### 3.2 Consumo de Endpoints y Manejo del Token JWT
* Las peticiones a la API se realizarán mediante una instancia centralizada de **Axios**.
* Se implementará un **Interceptor de Peticiones** (Request Interceptor) que inspeccionará el almacenamiento del cliente (`localStorage` o `sessionStorage`) en busca del token JWT.
* Si el token existe, se inyectará automáticamente en la cabecera HTTP por cada petición saliente hacia endpoints protegidos:
  `Authorization: Bearer <token_string>`

### 3.3 Protocolo de Integración con los Prototipos Stitch
* Los prototipos del sistema ya se encuentran descargados en la carpeta local `stitch_vetcare_pro_master_ui`.
* Dicha carpeta contiene subcarpetas por cada pantalla del sistema, y cada subcarpeta incluye la imagen de referencia y el código HTML correspondiente a esa pantalla.
* El Agente de IA debe tomar el código HTML de cada subcarpeta y convertirlo en un componente React dentro de `src/views/`, conservando la estructura visual limpia del prototipo.
* Cada componente visual incorporado debe mapear sus campos de entrada directamente a un estado controlado de React (`useState`) para enlazarse limpiamente con los payloads JSON definidos en los requerimientos del backend.

---

## 4. Base de Datos (SQL Server + EF Core Code-First)

### 4.1 Convenciones del Modelo Físico
* Todas las tablas de la base de datos se generarán de manera automática a través de migraciones de código.
* **Nombres de tablas:** Pluralizados y con prefijo de esquema estructurado si aplica, de lo contrario en formato estándar (`dbo.Usuarios`, `dbo.Mascotas`, `dbo.Citas`).
* **Claves primarias:** Propiedades denominadas estrictamente `Id` en formato entero autoincremental (`Identity(1,1)`).

### 4.2 Configuraciones Explícitas vía Fluent API
Queda prohibido el uso de Data Annotations en las entidades de `Domain` para definir constraints de base de datos. Toda configuración debe hacerse en la capa de `Infrastructure` heredando de `IEntityTypeConfiguration<T>`.

#### Restricciones Obligatorias a Configurar
* **Strings:** Definir longitud máxima de manera estricta (`builder.Property(u => u.Nombre).HasMaxLength(150).IsRequired();`).
* **Decimales:** Especificar precisión exacta para montos y métricas médicas (`builder.Property(m => m.Peso).HasColumnType("decimal(18,2)");`).
* **Comportamiento de Eliminación (Delete Behavior):** Todas las relaciones de clave foránea deben configurarse explícitamente con **Restricción de Cascada** (`DeleteBehavior.Restrict` o `DeleteBehavior.NoAction`). Si se elimina un cliente, sus citas históricas no deben borrarse en cascada de forma automática por seguridad de auditoría.

### 4.3 Sembrado de Datos (Seed Data) para Entornos de Pruebas
El DbContext debe inyectar de manera obligatoria durante el modelado inicial los registros mínimos para garantizar la ejecución exitosa de las pruebas unitarias automatizadas:
* **Tabla Usuarios:** Un usuario con ID `1`, Username: `"ALEX"`, Password hashed correspondiente al string original `"123456"`.
* **Tabla Clientes:** Un cliente por defecto para escenarios de pruebas de integración rápidas.

### 4.4 Motor de Base de Datos SQL Server (a completar)
* Connection String en `appsettings.json`: `"Server=.;Database=VetCareDB;Trusted_Connection=True;"`
* Registro en `Program.cs`: `builder.Services.AddDbContext<VetCareDbContext>(opt => opt.UseSqlServer(...))`
* Comandos EF CLI: `Add-Migration`, `Update-Database`