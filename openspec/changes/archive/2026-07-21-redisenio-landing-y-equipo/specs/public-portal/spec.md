# Specification: Rediseño de Portal Público (Landing & Equipo)

## Purpose

Definir los criterios de aceptación visual y comportamiento interactivo del nuevo diseño de la Landing Page y la vista de Equipo de VetCare Pro.

## Requirements

### Requirement: Ambient Shadow y Colores de Acento
El portal público MUST reflejar el estilo visual premium de los prototipos Stitch, incluyendo las sombras suaves y los colores de acento definidos en el tema.

#### Scenario: Carga de Estilos en Landing Page
- GIVEN el usuario visita la ruta raíz `/`
- WHEN la página se renderiza completamente
- THEN las tarjetas de servicios y estadísticas MUST mostrar la sombra ambiental `.ambient-shadow`
- AND los elementos de acento de marca (botones primarios, enlaces activos y badges) MUST usar el color primario `#006a63` y de contenedor `#4fd1c5`.

---

### Requirement: Contenedor Bento Responsivo de Especialidades (Equipo)
La página `/equipo` MUST presentar la lista de veterinarios activos ordenados en un layout bento responsivo que mantenga el estilo visual de las tarjetas del prototipo.

#### Scenario: Cargar Directorio de Especialistas
- GIVEN el usuario visita `/equipo`
- WHEN el backend responde con la lista de veterinarios activos
- THEN cada veterinario MUST ser renderizado en una tarjeta con bordes redondeados `rounded-3xl`
- AND la especialidad del veterinario MUST mostrarse dentro de un badge con fondo verde claro `#e6fffa` y el icono de la especialidad.
- AND las citas célebres del veterinario MUST mostrarse con estilo cursiva (`italic`).

---

### Requirement: CTA con Fondos Decorativos Difuminados
La sección de CTA final del Landing y la de Reclutamiento de Equipo MUST mostrar los fondos difuminados decorativos con efecto blur.

#### Scenario: Visualizar Sección de CTA
- GIVEN el usuario ve el final de la página raíz `/` o `/equipo`
- WHEN se desplaza hasta el final
- THEN el contenedor de CTA MUST mostrar los orbes degradados de fondo con efecto `blur-3xl` y posicionamiento absoluto.
- AND el botón de acción principal MUST tener transiciones suaves al pasar el cursor (hover).
