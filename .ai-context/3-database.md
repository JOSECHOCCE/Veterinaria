# Estrategia de Datos - Entity Framework Core Code-First

## 1. Convenciones del Modelo Físico
* Todas las tablas de la base de datos se generarán de manera automática a través de migraciones de código.
* **Nombres de tablas:** Pluralizados y con prefijo de esquema estructurado si aplica, de lo contrario en formato estándar (`dbo.Usuarios`, `dbo.Mascotas`, `dbo.Citas`).
* **Claves primarias:** Propiedades denominadas estrictamente `Id` en formato entero autoincremental (`Identity(1,1)`).

## 2. Configuraciones Explícitas vía Fluent API
Queda prohibido el uso de Data Annotations en las entidades de `Domain` para definir constraints de base de datos. Toda configuración debe hacerse en la capa de `Infrastructure` heredando de `IEntityTypeConfiguration<T>`.

### Restricciones Obligatorias a Configurar
* **Strings:** Definir longitud máxima de manera estricta (`builder.Property(u => u.Nombre).HasMaxLength(150).IsRequired();`).
* **Decimales:** Especificar precisión exacta para montos y métricas médicas (`builder.Property(m => m.Peso).HasColumnType("decimal(18,2)");`).
* **Comportamiento de Eliminación (Delete Behavior):** Todas las relaciones de clave foránea deben configurarse explícitamente con **Restricción de Cascada** (`DeleteBehavior.Restrict` o `DeleteBehavior.NoAction`). Si se elimina un cliente, sus citas históricas no deben borrarse en cascada de forma automática por seguridad de auditoría.

## 3. Sembrado de Datos (Seed Data) para Entornos de Pruebas
El DbContext debe inyectar de manera obligatoria durante el modelado inicial los registros mínimos para garantizar la ejecución exitosa de las pruebas unitarias automatizadas:
* **Tabla Usuarios:** Un usuario con ID `1`, Username: `"ALEX"`, Password hashed correspondiente al string original `"123456"`.
* **Tabla Clientes:** Un cliente por defecto para escenarios de pruebas de integración rápidas.
