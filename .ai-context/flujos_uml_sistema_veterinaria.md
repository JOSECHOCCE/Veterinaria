# 📘 Manual Completo de Flujos UML — Sistema de Gestión Veterinaria

Este documento contiene la especificación completa y el modelado visual de los procesos de negocio para el sistema de gestión de citas veterinarias. Todos los diagramas están estructurados utilizando la sintaxis oficial de **Mermaid**, listos para ser renderizados de forma nativa en entornos compatibles (como Obsidian, GitHub o Notion).

---

## 1. Visión general del sistema
Muestra el recorrido macro del negocio desde que un cliente o mascota entra al ecosistema hasta el cierre administrativo mediante el pago.

```mermaid
graph LR
    A[Registro Cliente/Mascota] --> B[Reserva / Solicitud Cita]
    B --> C{Revisión Recepción}
    C -- Rechazada --> D[Fin / Notificar]
    C -- Confirmada --> E[Día de la Cita: Llegada]
    E --> F[En Espera en Sala]
    F --> G[Atención Clínica Vet]
    G --> H[Cierre de Atención]
    H --> I[Registro de Cobro/Pago]
    I --> J[Emisión Comprobante PDF]
    J --> K[Fin del Proceso]

    style A fill:#e1f5fe,stroke:#0288d1,stroke-width:2px
    style B fill:#e1f5fe,stroke:#0288d1,stroke-width:2px
    style C fill:#fff9c4,stroke:#fbc02d,stroke-width:2px
    style G fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    style I fill:#ffe0b2,stroke:#f57c00,stroke-width:2px
    style K fill:#eceff1,stroke:#455a64,stroke-width:2px
```

---

## 2. Flujo de autenticación y acceso
Regula la seguridad en el inicio de sesión, el hashing seguro de contraseñas y la redirección forzada según el rol del usuario asignado.

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario (C/R/V/A)
    participant S as Sistema (Auth)
    
    U->+S: Ingresa Credenciales (Correo, Password)
    S->S: Aplica Hash Seguro y Compara con BD
    
    alt Credenciales Incorrectas o Cuenta Inactiva
        S-->>U: Error de acceso (Mensaje amigables y genérico)
    else Autenticación Exitosa
        S->S: Evalúa Rol del Usuario
        alt Rol == Cliente
            S-->>U: Redirige a /portal-cliente
        else Rol == Recepcionista
            S-->>U: Redirige a /agenda
        else Rol == Veterinario
            S-->>U: Redirige a /mi-agenda
        else Rol == Administrador
            S-->>-U: Redirige a /dashboard
        end
    end
```

---

## 3. Flujo de registro de cliente y mascota
Muestra los caminos gemelos para el alta de cuentas: el auto-registro web por parte del cliente y el registro manual en recepción, incluyendo la verificación de duplicados.

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente / Recepcionista
    participant S as Sistema
    
    C->+S: Envía Datos de Cliente (Nombre, Teléfono, Correo, Doc)
    S->S: Valida Duplicados (Mismo Correo o Documento)
    
    alt Duplicado Crítico Detectado
        S-->>C: Alerta de Error: El registro ya existe
    else Datos Únicos y Válidos
        S->S: Crea Registro de Cliente en Estado Activo
        C->>S: Envía Datos de Mascota (Nombre, Especie, Edad, Alergias)
        S->S: Enlaza e Indexa Mascota con ID del Cliente Responsable
        S-->>-C: Confirmación: Ficha Clínica e Historial Inicializados
    end
```

---

## 4. Flujo de solicitud de cita desde portal
Modelado del flujo de agendamiento autónomo por el cliente. Aplica la regla crítica de la reserva temporal de 5 minutos para congelar el bloque de tiempo.

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    participant S as Sistema
    
    C->+S: Ingresa a "Nueva Cita" desde Portal
    C->>S: Selecciona Mascota y Servicio Técnico/Clínico
    S->S: Cruza Horarios de Clínica, Veterinario y Duración del Servicio
    S-->>C: Despliega Calendario de Bloques Horarios Disponibles
    C->>S: Elige Bloque Específico e Inicia Proceso
    S->S: Activa "Reserva Temporal" (Bloquea espacio por 5 minutos)
    C->>S: Confirma y Envía Solicitud (Añade motivo opcional)
    
    alt Guardado dentro del tiempo (< 5 min)
        S->S: Transiciona Cita a "Pendiente de Confirmación"
        S-->>C: Pantalla de Éxito: Solicitud enviada a Recepción
    else Tiempo Expirado (> 5 min)
        S->S: Libera Bloque Horario automáticamente para otros usuarios
        S-->>-C: Error: Tiempo de espera agotado. Reintente selección
    end
```

---

## 5. Flujo de gestión de cita por recepción
El panel operativo donde el personal evalúa las solicitudes entrantes, asigna veterinarios y procesa reprogramaciones válidas.

```mermaid
sequenceDiagram
    autonumber
    actor R as Recepcionista
    participant S as Sistema
    actor C as Cliente
    
    R->+S: Abre Listado de Citas "Pendientes de Confirmación"
    
    alt Acción: Confirmar Cita
        R->>S: Aprueba Cita (Asigna Veterinario/Especialidad compatible)
        S->S: Cambia Estado a "Confirmada"
        S-->>C: Envía Notificación Automática de Confirmación (Correo)
    else Acción: Rechazar Solicitud
        R->>S: Declina Cita e Ingresa Motivo Obligatorio
        S->S: Cambia Estado a "Rechazada" y Libera Espacio en Agenda
        S-->>C: Envía Notificación con Motivo del Rechazo
    else Acción: Reprogramar Cita
        R->>S: Modifica Fecha/Hora/Veterinario (Valida disponibilidad)
        S->S: Cambia Estado a "Reprogramada" -> "Confirmada"
        S-->>-C: Envía Notificación con Nuevos Detalles del Bloque Horario
    end
```

---

## 6. Ciclo de vida de una cita
Diagrama de estados exhaustivo que describe las transiciones válidas y restricciones lógicas que sufre la entidad Cita dentro de la base de datos.

```mermaid
stateDiagram-v2
    direction LR

    [*] --> ReservaTemporal : Cliente elige bloque disponible
    ReservaTemporal --> PendienteConfirmacion : Envía solicitud dentro del tiempo
    ReservaTemporal --> [*] : Tiempo expirado / Abandona proceso

    PendienteConfirmacion --> Confirmada : Recepción confirma con Vet Asignado
    PendienteConfirmacion --> Rechazada : Recepción rechaza solicitud
    PendienteConfirmacion --> Cancelada : Cliente cancela desde portal
    PendienteConfirmacion --> PendienteAsignacion : Registrada sin veterinario definitivo

    PendienteAsignacion --> Confirmada : Se asigna veterinario válido
    PendienteAsignacion --> Cancelada : Recepción o Admin cancelan

    Confirmada --> EnEspera : Check-in presencial en clínica
    Confirmada --> Cancelada : Cancelación anticipada (> 2 horas antes)
    Confirmada --> NoAsistio : Margen de tolerancia vencido (15 min)
    Confirmada --> EnAtencion : Veterinario inicia atención directa

    EnEspera --> EnAtencion : Veterinario llama al paciente a consulta
    EnEspera --> Cancelada : Cancelación operativa de fuerza mayor
    EnEspera --> NoAsistio : Cliente se retira antes del llamado

    EnAtencion --> Completada : Veterinario cierra y guarda registro clínico
    EnAtencion --> Cancelada : Incidente excepcional administrativo

    Completada --> [*]
    Cancelada --> [*]
    Rechazada --> [*]
    NoAsistio --> [*]
```

---

## 7. Flujo del día de la cita
Describe el protocolo físico y digital desde que el cliente pisa la clínica, pasando por el Check-in (En Espera) hasta que es llamado al box de consulta.

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    actor R as Recepcionista
    participant S as Sistema
    actor V as Veterinario
    
    C->>R: Llega presencialmente a la recepción de la clínica
    R->+S: Busca Cita Programada del Día (Estado: Confirmada)
    R->>S: Registra Entrada del Paciente (Check-in)
    S->S: Modifica Estado de la Cita a "En Espera"
    S-->>V: Actualiza en Tiempo Real el Panel Operativo "Mi Agenda"
    Note over V: El paciente aparece visible en la cola de espera del médico
    V->>S: Selecciona Paciente y Presiona "Iniciar Atención"
    S->S: Transiciona Cita automáticamente a "En Atención"
    S-->>-R: Remueve al paciente visualmente del monitor de sala de espera
```

---

## 8. Flujo de atención clínica
La secuencia exclusiva del veterinario dentro del box médico. Restringe el historial a modo solo lectura una vez que la consulta ha sido cerrada de forma definitiva.

```mermaid
sequenceDiagram
    autonumber
    actor V as Veterinario
    participant S as Sistema
    
    Note over V,S: La Cita se encuentra bajo el estado "En Atención"
    V->+S: Solicita Ficha de la Mascota en Pantalla
    S-->>V: Retorna Antecedentes, Alertas Críticas (Alergias) e Historial
    V->>S: Introduce Signos Básicos (Peso Actual, Temperatura, Frecuencia)
    V->>S: Registra Historia Clínica Simplificada (Motivo, Hallazgos, Diagnóstico, Receta)
    V->>S: Finaliza Consulta y Hace Clic en "Cerrar Atención"
    S->S: Cambia Estado de Cita a "Completada"
    S->S: Bloquea Registro Clínico Convirtiéndolo en Historial de Solo Lectura
    S-->>-V: Éxito: Datos resguardados y Módulo de Cobros Habilitado
```

---

## 9. Flujo de pagos y cobros

Detalla el cierre administrativo de la atención. Permite registrar pagos totales, abonos parciales y la pista de auditoría obligatoria para anulaciones ejecutadas por el administrador.

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    actor R as Recepcionista
    participant S as Sistema
    actor A as Administrador

    Note over R,S: La cita debe estar en estado "Completada"

    R->>S: Abre ventana de cobro vinculada a la cita
    S->>S: Recupera servicio, precio base y saldo pendiente
    S-->>R: Muestra monto sugerido y métodos de pago

    alt Pago total
        R->>S: Registra monto final y método de pago
        S->>S: Valida monto > 0
        S->>S: Guarda pago como "Pagado"
        S-->>R: Confirma registro del pago
        S-->>C: Habilita comprobante PDF
    else Pago parcial
        R->>S: Registra abono parcial y método de pago
        S->>S: Valida monto > 0 y menor al total
        S->>S: Calcula saldo pendiente
        S->>S: Guarda estado "Pago parcial"
        S-->>R: Muestra saldo restante
        S-->>C: Habilita comprobante del abono
    else Anulación de pago
        A->>S: Solicita anular pago registrado
        S-->>A: Solicita motivo obligatorio
        A->>S: Confirma motivo de anulación
        S->>S: Cambia estado a "Anulado"
        S->>S: Guarda auditoría de la operación
        S-->>A: Confirma anulación
    end
```
## 10. Flujo de cancelación y no asistencia

Aplica las políticas de cancelación permitida, cancelación operativa y control de inasistencia del cliente.

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    actor R as Recepcionista
    participant S as Sistema
    actor A as Administrador

    alt Cancelación por cliente
        C->>S: Solicita cancelar su cita desde el portal
        S->>S: Verifica que la cita le pertenezca
        S->>S: Verifica anticipación mínima de 2 horas
        alt Cancelación permitida
            S->>S: Cambia estado a "Cancelada"
            S->>S: Registra motivo "Canceló el cliente"
            S-->>C: Confirma cancelación
        else Cancelación no permitida
            S-->>C: Informa que la cita ya no puede cancelarse
        end

    else Cancelación por recepción o administrador
        R->>S: Solicita cancelar cita
        S-->>R: Solicita motivo obligatorio
        R->>S: Registra motivo de cancelación
        S->>S: Cambia estado a "Cancelada"
        S-->>R: Confirma cancelación
        S-->>C: Notifica cancelación

    else No asistencia
        R->>S: Marca cita como "No asistió"
        S->>S: Verifica que pasó el margen permitido
        S->>S: Cambia estado a "No asistió"
        S-->>R: Confirma actualización
        S-->>C: Registra evento en historial
    end
```

## 12. Flujos opcionales futuros
Estructura modular diseñada para escalar el núcleo de negocio en fases posteriores del desarrollo (Urgencias, Automatizaciones por Tareas Cron y Auditoría completa).

```mermaid
graph TD
    subgraph Mecanismo_Urgencias["Módulo Extensible: Urgencias Médicas"]
        U1[Llegada Mascota Crítica sin Cita] --> U2[Recepción crea Entrada de Tipo 'Urgencia']
        U2 --> U3[Sistema salta Reserva Temporal y fuerza Estado a 'En Atención']
    end

    subgraph Recordatorios_Automatizados["Módulo Extensible: Notificaciones por Tareas Cron"]
        N1[Daemon / Servicio en Segundo Plano] --> N2{¿Existen Citas Confirmadas en las próximas 24h?}
        N2 -- Sí --> N3[Dispara Plantilla de Recordatorio Automatizado por Correo]
    end

    subgraph Logs_Auditoria["Módulo Extensible: Pista de Auditoría Avanzada"]
        A1[Modificación de Datos Sensibles / Precios / Roles] --> A2[Trigger captura: ID_Usuario, Timestamp, Valor_Viejo y Valor_Nuevo]
        A2 --> A3[Tabla Inmutable de Logs para Supervisión del Administrador]
    end

    style Mecanismo_Urgencias fill:#ffebee,stroke:#ef5350,stroke-width:1px
    style Recordatorios_Automatizados fill:#f3e5f5,stroke:#ab47bc,stroke-width:1px
    style Logs_Auditoria fill:#f5f5f5,stroke:#9e9e9e,stroke-width:1px
```
