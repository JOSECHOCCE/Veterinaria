# 3. Diseño e Integración de la Base de Datos (EF Core Code-First)

Este documento detalla la configuración del motor de persistencia relacional SQL Server utilizando **Entity Framework Core** mediante el enfoque **Code-First**.

---

## 1. Relaciones Clave del Negocio (Fluent API)
Para evitar el comportamiento por defecto de cascada que pueda corromper la integridad de datos, las relaciones se configuran de forma explícita en `VetCareDbContext` mediante Fluent API:

```
        ┌─────────────┐
        │   Usuario   │
        └──────┬──────┘
               │ 1
               │
               │ N
        ┌──────▼──────┐
        │   Mascota   │
        └──────┬──────┘
               │ 1
               │
               │ N
        ┌──────▼──────┐
        │    Cita     │
        └──┬───┬───┬──┘
         1 │   │ 1 │ 1
    ┌──────┘   │   └──────┐
  1 │          │ N        │ 1
┌──▼───┐  ┌────▼────┐  ┌──▼───┐
│Triage│  │  Pagos  │  │Hist. │
└──────┘  └─────────┘  └──────┘
```

* **Usuario - Mascota**: Relación uno-a-muchos. Si se elimina un usuario, se eliminan lógicamente sus mascotas.
* **Mascota - Cita**: Relación uno-a-muchos. No se permite la eliminación física en cascada de citas si una mascota tiene historial (`onDelete: DeleteBehavior.Restrict`).
* **Cita - Pago**: Relación uno-a-muchos (para soportar pagos parciales y liquidación posterior).
* **Cita - Historial Clínico**: Relación uno-a-uno. Un historial clínico pertenece exclusivamente a una cita completada.
* **Cita - Triage**: Relación uno-a-uno opcional. Un registro de triage puede evolucionar o no a una cita formal.

---

## 2. Convenciones de Tipos de Datos y Mappings
* **MontoTotal, MontoPagado (Pagos / Citas)**: Mapeados explícitamente a tipos decimales de base de datos de alta precisión financiera:
  ```csharp
  builder.Entity<Cita>()
      .Property(c => c.MontoTotal)
      .HasColumnType("decimal(18,2)");
  ```
* **Signos Vitales (Temperatura, Peso en Triage / Mascotas)**:
  Mapeados como `decimal(5,2)` para permitir valores como `38.50` (temperatura corporal) o `12.75` (peso en kg).
* **Vínculo con Identity**:
  La tabla `Usuarios` (del dominio) se vincula con la tabla `AspNetUsers` (de Identity) mediante la propiedad `ApplicationUserId` de tipo string (`nvarchar(450)`).

---

## 3. Estrategia de Migraciones y Seeding
* **Migrations**: Las modificaciones del modelo de dominio se registran en `VetCare.Infrastructure/Migrations/` mediante comandos de consola:
  ```powershell
  dotnet ef migrations add NombreMigracion --project src/Backend/VetCare.Infrastructure --startup-project src/Backend/VetCare.Web
  ```
* **Seeding de Datos**: El archivo `DbSeeder.cs` carga en cada inicio de la aplicación si el entorno es de desarrollo:
  * Creación de roles obligatorios: `Admin` y `Usuario`.
  * Creación de usuarios semilla: `admin@veterinaria.com` (Admin) y `usuario@test.com` (Usuario).
  * Servicios veterinarios precargados con precios y tiempos de duración estandarizados.
  * Veterinarios con horarios de inicio y fin de turno configurados.
