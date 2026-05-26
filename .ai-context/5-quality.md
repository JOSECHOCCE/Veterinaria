# Estándares de Aseguramiento de Calidad y Cobertura de Código

## 1. Umbral de Aceptación de Cobertura
* La solución de software requiere una cobertura mínima obligatoria del **95% de bloques y líneas** en las capas de `Application` y `Domain`.
* No se aprobará ninguna refactorización que reduzca el porcentaje actual de éxito del explorador de pruebas.

## 2. Flujo de Pruebas Unitarias con Moq (Caminos Felices y Tristes)
* Se deben probar todos los escenarios posibles de un método de servicio.
* **Estructura del Test:** Dividido visualmente bajo el patrón **Arrange, Act, Assert**.
* Las aserciones deben validar que los mensajes devueltos por la estructura `Response<T>` coincidan exactamente con las cadenas de texto del archivo de requerimientos (`"Usuario no existe"`, `"Errores de Validación"`).

## 3. Automatización de Pruebas de Integración con Base de Datos Real (Estilo Lab 5)
Para validar el funcionamiento correcto de los repositorios y controladores de autenticación sin usar Mocks:
* La clase de prueba debe contener un método estático anotado con `[ClassInitialize]`.
* Este método levantará un `ServiceCollection` real e inyectará el `DbContext` configurado con la cadena de conexión de pruebas de tu `appsettings.json`.
* **Aislamiento de Datos:** En cada ejecución de pruebas, se debe llamar obligatoriamente al comando de limpieza para garantizar un entorno consistente:
  ```csharp
  dbContext.Database.EnsureDeleted(); // Destruye la base de datos de la prueba anterior
  dbContext.Database.EnsureCreated(); // Recrea las tablas limpias y ejecuta el Seed Data inicial