# Arquitectura Frontend y Conexión con el Servidor MCP

## 1. Estructura del Cliente (React + TypeScript)
El proyecto frontend se ubicará de forma totalmente aislada dentro del directorio `src/Frontend/`. Su estructura organizativa será de tipo modular:
* `src/components/`: Componentes atómicos reutilizables (Botones, inputs, modales de alerta).
* `src/views/`: Pantallas completas del negocio (`FichaCliente`, `HistoriaClinica`, `Login`).
* `src/services/`: Capa cliente encargada de realizar las peticiones HTTP al API en C#.

## 2. Consumo de Endpoints y Manejo del Token JWT
* Las peticiones a la API se realizarán mediante una instancia centralizada de **Axios**.
* Se implementará un **Interceptor de Peticiones** (Request Interceptor) que inspeccionará el almacenamiento del cliente (`localStorage` o `sessionStorage`) en busca del token JWT.
* Si el token existe, se inyectará automáticamente en la cabecera HTTP por cada petición saliente hacia endpoints protegidos:
  `Authorization: Bearer <token_string>`

## 3. Protocolo de Integración con el Servidor MCP de Stitch
* Para construir las vistas profesionales basadas en los prototipos avanzados, el Agente de IA tiene la obligación de apoyarse en el servidor MCP de Stitch que se encuentra activo en el backend de la sesión.
* Se debe usar la herramienta del servidor para descargar la estructura limpia de los componentes visuales e incorporarla de manera nativa dentro del árbol de componentes de React.
* Cada componente visual importado debe mapear sus campos de entrada directamente a un estado controlado de React (`useState`) para enlazarse limpiamente con los payloads JSON definidos en los requerimientos del backend.