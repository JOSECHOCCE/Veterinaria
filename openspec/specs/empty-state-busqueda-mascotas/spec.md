# Capability: empty-state-busqueda-mascotas

## Purpose
Proporcionar retroalimentación visual clara y opciones de acción rápida cuando las búsquedas de pacientes en la clínica no devuelvan resultados, evitando la incertidumbre del usuario y mejorando el flujo de registro.

## Scenarios

### Scenario: Búsqueda con resultados exitosos
- **Given** el usuario está en la vista de "Nueva Cita"
- **And** ha ingresado el término "Fido" en el buscador de pacientes
- **And** existen mascotas en la clínica cuyo nombre coincide con "Fido"
- **When** el sistema renderiza la lista de sugerencias
- **Then** se debe mostrar la lista desplegable con las mascotas coincidentes
- **And** no se debe mostrar el estado vacío (Empty State)

### Scenario: Búsqueda sin coincidencias muestra Estado Vacío (Empty State)
- **Given** el usuario está en la vista de "Nueva Cita"
- **And** ha ingresado el término "Rex Inexistente" en el buscador de pacientes
- **And** no existe ninguna mascota, propietario o teléfono que coincida en la base de datos de la clínica
- **When** el sistema termina de filtrar las sugerencias (`suggestions.length === 0`)
- **Then** se debe renderizar una tarjeta desplegable de estado vacío debajo del input de búsqueda
- **And** la tarjeta debe mostrar un texto informando que no se encontraron coincidencias para "Rex Inexistente"
- **And** la tarjeta debe incluir un botón o enlace de acción rápida para "Registrar nuevo paciente"

### Scenario: Buscador vacío o limpio
- **Given** el usuario está en la vista de "Nueva Cita"
- **And** el input de búsqueda de paciente está vacío (`searchTerm.trim() === ''`)
- **When** el usuario observa el formulario
- **Then** no se debe mostrar la lista de sugerencias ni tampoco la tarjeta de estado vacío
