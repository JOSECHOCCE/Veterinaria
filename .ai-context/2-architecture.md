# 2. Arquitectura de Software: Capas de la Arquitectura Cebolla (Onion Architecture)

El backend de VetCare Pro sigue una implementación estricta de la **Arquitectura Cebolla (Onion Architecture)**, asegurando que el dominio central sea independiente de frameworks, bases de datos y la interfaz de usuario.

```
                   [ WEB / PRESENTACIÓN ] (Controllers, SignalR)
                             ↓
                 [ INFRAESTRUCTURA ] (DbContext, Repositories, JWT)
                             ↓
                   [ APLICACIÓN ] (Interfaces, Servicios, DTOs)
                             ↓
                     [ DOMINIO ] (Entidades puras)
```

---

## 1. Capa de Dominio (`VetCare.Domain`)
* Es el núcleo central de la aplicación y **no tiene dependencias externas** de ninguna otra capa ni biblioteca.
* **Contenido**:
  * **Entidades**: Clases C# que modelan la base de datos y la lógica pura de negocio (ej. `Cita`, `Mascota`, `Triage`, `Usuario`, `Pago`).
  * **Contratos (Interfaces de Repositorio)**: Contratos generales (`IRepository<T>`, `IUnitOfWork`) que definen cómo se accede a los datos sin implementar detalles de base de datos.

---

## 2. Capa de Aplicación (`VetCare.Application`)
* Contiene los casos de uso específicos del negocio. Depende únicamente de `VetCare.Domain`.
* **Contenido**:
  * **Interfaces de Servicios**: Contratos de los servicios de aplicación (`ICitaService`, `IMascotaService`, `ITriageService`, `INotificacionService`).
  * **Servicios de Aplicación**: Implementaciones de los servicios que contienen la lógica procedimental orquestando entidades y repositorios mediante `IUnitOfWork`.
  * **DTOs (Data Transfer Objects)**: Modelos de transferencia de datos planos para desacoplar la salida del dominio hacia el cliente.

---

## 3. Capa de Infraestructura (`VetCare.Infrastructure`)
* Provee implementaciones concretas para las necesidades externas de la aplicación. Depende de `VetCare.Application` y `VetCare.Domain`.
* **Contenido**:
  * **Persistencia**: `VetCareDbContext` con la configuración de Entity Framework Core.
  * **Repositorios**: Implementaciones concretas del patrón repositorio (`Repository<T>`) y del Unit of Work (`UnitOfWork`).
  * **Autenticación (JWT)**: Servicio generador y validador de tokens JWT para comunicación sin estado.
  * **Servicios Tecnológicos**: Generación de PDFs (`PdfService`), correos, etc.

---

## 4. Capa de Presentación / Web (`VetCare.Web`)
* Actúa como el punto de entrada de la aplicación. En esta arquitectura desacoplada, funciona exclusivamente como una **Web API REST sin estado**.
* **Contenido**:
  * **Controladores API**: Controladores C# que heredan de `ControllerBase` (`[ApiController]`) que exponen recursos en formato JSON consumibles por Axios.
  * **Websockets (SignalR)**: `NotificacionHub` que gestiona conexiones en tiempo real de clientes React.
  * **Program.cs**: Configuración de dependencias (DI), middleware de autenticación JWT y políticas CORS.
