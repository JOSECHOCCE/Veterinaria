# 4. Reglas del Frontend (Vite + React + TypeScript + Tailwind)

La capa del frontend en VetCare Pro es una aplicación Single Page Application (SPA) completamente desacoplada que se comunica de forma asíncrona con el backend mediante HTTP REST (JSON) y Websockets (SignalR).

---

## 1. Estándares Tecnológicos del Frontend
* **Vite**: Motor de desarrollo rápido y empaquetador para compilar archivos assets.
* **TypeScript**: Obligatorio. Toda variable, propiedad de componente y respuesta del API debe tener su correspondiente interfaz (`interface` o `type`) tipada para prevenir errores en tiempo de compilación.
* **Tailwind CSS**: Framework para construir interfaces de usuario premium y cohesivas sin escribir CSS plano repetitivo.
* **Framer Motion**: Librería estándar para transiciones fluidas de páginas, apertura de modales y micro-interacciones (ej. vibración de campana, fade-in de alertas).

---

## 2. Consumo de API y Gestión de Autenticación (Axios Interceptors)
* **Axios**: Cliente HTTP para solicitudes asíncronas.
* **Gestión del Token JWT**:
  El token JWT se almacena de forma segura en el `localStorage` del navegador tras un login exitoso.
* **Interceptor de Petición**:
  Se configura un interceptor global de Axios para inyectar automáticamente el token en todas las llamadas salientes:
  ```typescript
  axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
          config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
  });
  ```
* **Interceptor de Respuesta (Manejo 401)**:
  Si el servidor responde con un código `401 Unauthorized` (token expirado o inválido), el interceptor debe eliminar el token de `localStorage` y redirigir inmediatamente al usuario a la pantalla de `/login`.

---

## 3. Conexión a SignalR Websockets
* El cliente React se conecta al Hub de SignalR `/notificacionHub` utilizando la librería `@microsoft/signalr`.
* **Flujo**:
  1. Al iniciar sesión y verificarse el perfil, el cliente inicializa el `HubConnectionBuilder`.
  2. Escucha el evento `RecibirNotificacion`.
  3. Al dispararse, muestra un modal o toaster de alta prioridad en pantalla usando `Sonner` u otra librería de notificaciones toast, e incrementa en 1 un contador global de notificaciones no leídas.
  4. Cierra la conexión de forma segura al hacer logout o desmontar el componente raíz de la aplicación.

---

## 4. Estilo de Código y Buenas Prácticas
* **Componentes Funcionales**: Usar solo componentes funcionales con React Hooks.
* **Separación de Vistas y Componentes**:
  * `views/`: Pantallas completas con rutas asociadas (ej. `DashboardView`, `CitasView`).
  * `components/`: Bloques de interfaz de usuario atómicos y reutilizables (ej. `Button`, `Modal`, `CreditCardForm`).
* **Reglas de Tailwind**: Evitar clases CSS ad-hoc. Utilizar únicamente clases nativas de Tailwind CSS.
* **Responsividad**: Diseñar siempre con enfoque Mobile-First utilizando los modificadores `md:`, `lg:`.
