---
name: jwt-auth
description: Patrón completo de autenticación JWT para VetCare. Generación en backend .NET, interceptor Axios en frontend, guards de rutas por rol. Usar cuando implementes login, rutas protegidas, middleware de auth o manejo de tokens.
category: generic
agents: [backend, frontend]
triggers:
  backend: "Implementar autenticación, roles, JWT"
  frontend: "Trabajar con Axios, interceptores, token JWT"
---

## Cuándo usar esta skill
- Implementar o modificar el login
- Proteger un endpoint en el backend
- Agregar un guard de ruta en el frontend
- Trabajar con el interceptor de Axios
- Manejar expiración o renovación de token

---

## BACKEND — Generación del Token (REQUIRED)

```csharp
// ✅ En Infrastructure/Security/JwtGenerator.cs
public string GenerarToken(Usuario usuario)
{
    var claims = new[]
    {
        new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
        new Claim(ClaimTypes.Name, usuario.Username),
        new Claim(ClaimTypes.Role, usuario.Rol)
    };

    var key = new SymmetricSecurityKey(
        Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

    var token = new JwtSecurityToken(
        issuer: _config["Jwt:Issuer"],
        audience: _config["Jwt:Audience"],
        claims: claims,
        expires: DateTime.UtcNow.AddHours(8),
        signingCredentials: creds);

    return new JwtSecurityTokenHandler().WriteToken(token);
}
```

---

## BACKEND — Protección de Endpoints (REQUIRED)

```csharp
// ✅ ALWAYS: decorar con Authorize y Roles explícitos
[Authorize(Roles = "Administrador")]
[HttpDelete("{id}")]
public async Task<IActionResult> Eliminar(int id) { }

[Authorize(Roles = "Recepcionista,Administrador")]
[HttpPost]
public async Task<IActionResult> CrearCita(CitaCreateDto dto) { }

// ✅ Rutas públicas con AllowAnonymous explícito
[AllowAnonymous]
[HttpPost("login")]
public async Task<IActionResult> Login(LoginDto dto) { }

// ❌ NEVER: endpoint sensible sin Authorize
[HttpDelete("{id}")]
public async Task<IActionResult> Eliminar(int id) { } // sin Authorize NO
```

---

## BACKEND — Registro en Program.cs (REQUIRED)

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

// ALWAYS: Authentication antes de Authorization
app.UseAuthentication();
app.UseAuthorization();
```

---

## FRONTEND — Instancia centralizada de Axios (REQUIRED)

```typescript
// ✅ En services/api.ts — UNA SOLA instancia
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

// Interceptor: inyecta token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: maneja 401 globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

// ❌ NEVER: Authorization manual en cada llamada
axios.get("/citas", {
  headers: { Authorization: `Bearer ${token}` } // NO, el interceptor lo hace
});
```

---

## FRONTEND — Guard de Rutas por Rol (REQUIRED)

```typescript
// ✅ En router/PrivateRoute.tsx
interface PrivateRouteProps {
  children: React.ReactNode;
  rolesPermitidos: string[];
}

export function PrivateRoute({ children, rolesPermitidos }: PrivateRouteProps) {
  const { usuario } = useAuth();

  if (!usuario) return <Navigate to="/login" replace />;

  if (!rolesPermitidos.includes(usuario.rol)) {
    return <Navigate to="/sin-acceso" replace />;
  }

  return <>{children}</>;
}

// ✅ Uso en el router
<Route path="/dashboard" element={
  <PrivateRoute rolesPermitidos={["Administrador"]}>
    <DashboardView />
  </PrivateRoute>
} />
```

---

## Roles del sistema (REFERENCE)

| Rol | Panel | Ruta base |
|-----|-------|-----------|
| `Cliente` | Portal Cliente | `/portal-cliente` |
| `Recepcionista` | Panel Operativo | `/agenda` |
| `Veterinario` | Panel Veterinario | `/mi-agenda` |
| `Administrador` | Panel Admin | `/dashboard` |

- NEVER: guardar el token completo de tarjeta u otros datos sensibles en localStorage
- NEVER: confiar en el rol del token sin validarlo también en el backend

