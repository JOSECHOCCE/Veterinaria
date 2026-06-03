# Plan de Implementación Frontend V2 (Construcción Nativa Local)

Este documento define la nueva estrategia de implementación para el Frontend de VetCare Pro. Se abandona la extracción directa del código autogenerado por herramientas de diseño en favor de una **construcción nativa desde cero en React + TypeScript + Vite**. 

La fuente de verdad visual será la imagen `screen.png` y el diccionario de tokens/textos será el `code.html` almacenados localmente en `stitch_vetcare_pro_master_ui`.

## 🔍 Diagnóstico del Problema de Consistencia (Prototipos Originales)
En los prototipos generados por Stitch se observan las siguientes inconsistencias entre pantallas:
1. **Logotipos y Branding variables:** En algunas pantallas el logo tiene fondo marrón, en otras es solo texto, varía el tamaño o se omiten eslóganes.
2. **Ubicación de Acciones Críticas:** El botón `+ New Consultation` (o similar) aparece arriba del menú en unas vistas y al final del menú en otras.
3. **Estructura e Iconos del Menú:** Los nombres de las secciones, los espaciados, paddings e iconos de Material Symbols varían arbitrariamente de una pantalla a otra.
4. **Navegación Generalizada:** Los prototipos no diferencian las barras laterales según el rol del usuario, mostrando enlaces inapropiados.

## 🛠️ Soluciones y Decisiones del Usuario (Nuevas Reglas Estrictas)
1. **Logotipo Oficial:** Se adopta el diseño del **icono de huella de mascota sobre botón marrón** con el texto `VetCare Pro - Premium Animal Health`.
2. **Layout por Roles:** La barra lateral será dinámica. Solo mostrará las opciones que cada rol necesita según el documento de especificación funcional.
3. **Navegación del Cliente (Diferenciación Visual):** El **Portal de Clientes** usará una **barra de navegación superior horizontal (Navbar)** en lugar de la barra lateral vertical, diferenciando visualmente el área pública del cliente del panel administrativo del personal de la clínica.
4. **Dinamismo y Animaciones:** Aprovechando que trabajamos en React con TypeScript, implementaremos animaciones fluidas (con Framer Motion y Tailwind CSS transitions) para que la interfaz se sienta interactiva y premium, superando la naturaleza estática del prototipo.
5. **Estrategia de Desarrollo:** Implementaremos el sistema **módulo por módulo** construyéndolo desde cero usando React+Vite+Tailwind, para asegurar la calidad y validación paso a paso de cada funcionalidad y garantizando **cero errores de mapeo** o scroll no deseado.

> [!IMPORTANT]
> **Metodología de Trabajo por Módulo:**
> Para cada módulo, el AI Assistant analizará la imagen `screen.png` local para obtener las reglas visuales estrictas (layout, proporciones, ausencia de scroll). Luego, usará `code.html` local EXCLUSIVAMENTE para extraer tokens de diseño (configuración de Tailwind, colores, fuentes), textos y SVGs, escribiendo el código React de forma limpia y manual.

## 🧭 Lógica, Enrutamiento y Reglas de Negocio
Mientras que los prototipos dictan la capa **visual**, la capa **lógica** será guiada estrictamente por:
1. **`1-requerimientos_sistema_veterinario.md`**: Dictará las funciones de los formularios, roles permitidos y reglas de negocio.
2. **`flujos_uml_sistema_veterinaria.md`**: Servirá como nuestro mapa de enrutamiento estricto. Garantizará que los botones redirijan a las vistas correctas (`react-router-dom`) siguiendo la experiencia de usuario definida, sin flujos rotos.

---

## 🚀 Fases de Implementación (Módulo por Módulo)

### Fase 1: Arquitectura Base y Autenticación
Configuración de la estructura de Layouts y las pantallas de acceso que no deben tener scroll.
*   **Recursos locales a utilizar:**
    *   `acceso_al_sistema_vetcare_pro` (Login)
    *   `registro_de_cliente_vetcare_pro` (Registro)
*   **Componentes Clave:**
    *   Configuración global de Tailwind (extraída de los `code.html`).
    *   `AuthLayout`: Contenedor estricto (`h-screen w-screen overflow-hidden`) para garantizar 0 scroll.
    *   Pantallas de Login y Registro desde cero.

### Fase 2: Layouts Principales y Dashboards
Implementación de los contenedores base según el rol y las pantallas principales de inicio.
*   **Recursos locales a utilizar:**
    *   `dashboard_diario_operativo_admin` (Admin/Staff)
    *   `dashboard_del_cliente_vetcare_pro` (Cliente)
*   **Componentes Clave:**
    *   `AdminLayout`: Con Sidebar dinámico y el **Logotipo Oficial** estandarizado.
    *   `ClientLayout`: Con Navbar horizontal superior, diferenciando visualmente la experiencia.

### Fase 3: Portal del Cliente
Desarrollo completo de la experiencia del dueño de la mascota (interfaz limpia, Navbar superior).
*   **Recursos locales a utilizar:**
    *   `mis_mascotas_portal_del_cliente`
    *   `mis_citas_portal_del_cliente`
    *   `nueva_cita_portal_del_cliente`
    *   `mis_pagos_portal_del_cliente`
    *   `mi_perfil_portal_del_cliente`
    *   `preferencias_de_notificaci_n_portal_del_cliente`

### Fase 4: Gestión Core (Pacientes y Clientes)
Módulos administrativos para el manejo de la información clínica.
*   **Recursos locales a utilizar:**
    *   `listado_de_clientes_vetcare_pro`
    *   `ficha_del_cliente_vetcare_pro`
    *   `registrar_nuevo_cliente_vetcare_pro`
    *   `cambio_de_titularidad_vetcare_pro`
    *   `gesti_n_de_pacientes_vetcare_pro`
    *   `ficha_del_paciente_vetcare_pro`
    *   `registrar_paciente_vetcare_pro`
    *   `historial_cl_nico_de_la_mascota_vetcare_pro`

### Fase 5: Operaciones y Agenda
Manejo del calendario, citas médicas y notificaciones internas.
*   **Recursos locales a utilizar:**
    *   `agenda_operativa_vetcare_pro`
    *   `solicitudes_de_citas_vetcare_pro`
    *   `agendar_nueva_cita_vetcare_pro`
    *   `detalle_de_la_cita_vetcare_pro`
    *   `mi_agenda_del_veterinario_vetcare_pro`
    *   `atenci_n_cl_nica_activa_vetcare_pro`
    *   `centro_de_notificaciones_internas_vetcare_pro`

### Fase 6: Facturación, Configuración y Reportes
Cierre del sistema con flujos de pago, configuraciones maestras y estadísticas.
*   **Recursos locales a utilizar:**
    *   `cobros_pendientes_vetcare_pro`, `registrar_cobro_vetcare_pro`, `historial_de_pagos_vetcare_pro`, `anular_pago_vetcare_pro`
    *   `cat_logo_de_servicios_vetcare_pro`, `configurar_servicio_vetcare_pro`, `configuraci_n_de_horarios_y_bloqueos_vetcare_pro`
    *   `estad_sticas_operativas_admin`, `reporte_de_citas_vetcare_pro`, `reporte_de_pagos_admin`, `gesti_n_de_usuarios_admin`

---

## Verificación
*   **Revisión Visual Estricta:** Comparar componente final renderizado en Vite lado a lado con el `screen.png`.
*   **Validación de Reglas de Layout:** Confirmar ausencia de scroll en vistas de Autenticación, correcto funcionamiento de Layout Admin (Sidebar) y Layout Cliente (Navbar superior).
*   **Comprobación de Dinamismo:** Testear animaciones de Framer Motion en interacciones (hover, menús, modales).
