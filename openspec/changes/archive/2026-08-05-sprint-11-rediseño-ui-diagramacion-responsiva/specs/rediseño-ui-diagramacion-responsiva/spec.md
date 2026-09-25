# Delta for Rediseño UI y Diagramación Responsiva

## ADDED Requirements

### Requirement: Jerarquía Tipográfica y Escala de Lectura
El sistema MUST utilizar una escala de lectura base de al menos `14px` (`0.875rem`) para textos de cuerpo y tablas, asegurando legibilidad sin forzar la vista en resoluciones de alta densidad.

#### Scenario: Lectura cómoda de tablas y listas
- GIVEN un usuario autenticado en la vista de Clientes, Productos o Pagos
- WHEN la tabla de datos renderiza los registros en pantalla
- THEN el tamaño de fuente del cuerpo de la tabla MUST ser de al menos 14px
- AND las celdas MUST mantener un padding vertical compacto de 10px (`py-2.5`) permitiendo visualizar al menos 12 registros sin scroll excesivo.

### Requirement: Layout Responsivo de Pantalla Completa en POS
El módulo de Punto de Venta (POS / Botica / Cobro) MUST ocupar el 100% de la altura de pantalla utilizable (`h-[calc(100vh-4rem)]`) dividiéndose en dos columnas funcionales persistentes.

#### Scenario: Visualización del Punto de Venta en Pantalla Grande
- GIVEN el usuario navega a la sección de Ventas o Registrar Cobro
- WHEN la interfaz se carga en una pantalla de escritorio (ancho `>= 1024px`)
- THEN el catálogo de productos MUST ocupar el 65% del ancho de la vista a la izquierda
- AND el carrito de compras y totalizador de pago MUST ocupar el 35% del ancho de la vista de forma fija a la derecha.

### Requirement: Sidebar Colapsable con Toggle de Espacio
La barra de navegación lateral (Sidebar) MUST permitir al usuario alternar entre la vista extendida (`256px`) y la vista compacta (`80px`), liberando 176px de ancho útil para el área de trabajo principal.

#### Scenario: Colapsar Sidebar para maximizar espacio de trabajo
- GIVEN el usuario se encuentra en el Dashboard o Historia Clínica SOAP
- WHEN el usuario hace clic en el botón de alternar Sidebar compacto
- THEN el Sidebar MUST reducir su ancho a `w-20` mostrando solo íconos
- AND el área de contenido principal MUST expandirse suavemente ocupando el espacio recuperado.

### Requirement: Layout Dividido para Atención Clínica y SOAP
El formulario de consulta médica SOAP MUST presentar los antecedentes y signos vitales de la mascota de forma persistente junto al formulario de registro.

#### Scenario: Registro de atención médica SOAP en vista dividida
- GIVEN un veterinario atendiendo una consulta clínica
- WHEN se abre la vista de Historia Clínica SOAP
- THEN los signos vitales y antecedentes MUST mostrarse en el panel izquierdo (30% ancho)
- AND los campos de entrada SOAP (Subjetivo, Objetivo, Avalúo, Plan) MUST disponerse en el panel derecho principal (70% ancho).
