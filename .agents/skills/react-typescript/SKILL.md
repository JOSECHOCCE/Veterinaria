---
name: react-typescript
description: React + TypeScript sin código genérico. Componentes bien estructurados, tipos explícitos, sin any, servicios separados de la UI. Usar cuando toques cualquier archivo .tsx o .ts del frontend.
category: generic
agents: [frontend]
triggers:
  frontend:
    - "Crear o modificar un componente React"
    - "Crear types o interfaces TypeScript"
---

## Cuándo usar esta skill
- Crear o modificar un componente React
- Crear interfaces o tipos TypeScript
- Crear hooks personalizados
- Organizar archivos del frontend

---

## Imports (REQUIRED)

```typescript
// ✅ ALWAYS
import { useState, useEffect } from "react";

// ❌ NEVER
import React from "react";
import * as React from "react";
```

---

## TypeScript: Interfaces (REQUIRED)

- ALWAYS: Una sola profundidad. Objeto anidado → interfaz separada
- ALWAYS: Tipos explícitos en props, nunca inferidos desde `any`
- NEVER: `any` en ningún caso
- NEVER: interfaces anidadas inline

```typescript
// ✅ CORRECTO
interface CitaDto {
  id: number;
  fechaHora: string;
  estado: string;
  mascota: MascotaDto;   // referencia, no inline
}

interface MascotaDto {
  id: number;
  nombre: string;
}

// ❌ NEVER
interface CitaDto {
  mascota: {             // inline anidado NO
    id: number;
    nombre: string;
  };
}
```

---

## Tipos con const (REQUIRED)

```typescript
// ✅ ALWAYS: const object primero, luego extraer tipo
const ESTADO_CITA = {
  PENDIENTE: "pendiente",
  CONFIRMADA: "confirmada",
  CANCELADA: "cancelada",
  EN_ATENCION: "en_atencion",
  COMPLETADA: "completada",
} as const;

type EstadoCita = (typeof ESTADO_CITA)[keyof typeof ESTADO_CITA];

// ❌ NEVER: union type directo
type EstadoCita = "pendiente" | "confirmada" | "cancelada";
```

---

## Props de componentes (REQUIRED)

```typescript
// ✅ ALWAYS: interfaz explícita para props
interface CitaCardProps {
  cita: CitaDto;
  onCancelar: (id: number) => void;
}

export function CitaCard({ cita, onCancelar }: CitaCardProps) {
  return (
    <div>
      <p>{cita.estado}</p>
      <button onClick={() => onCancelar(cita.id)}>Cancelar</button>
    </div>
  );
}

// ❌ NEVER
export function CitaCard(props: any) { }  // any NO
export function CitaCard({ cita, onCancelar }) { } // sin tipos NO
```

---

## Separación de responsabilidades (REQUIRED)

- ALWAYS: Llamadas HTTP en `services/`, nunca dentro de componentes
- ALWAYS: Lógica reutilizable en `hooks/`
- ALWAYS: Tipos compartidos en `types/`
- NEVER: `fetch` o `axios` directamente en un componente

```typescript
// ✅ CORRECTO — en services/citas.service.ts
export async function getCitas(): Promise<CitaDto[]> {
  const response = await api.get("/citas");
  return response.data;
}

// ✅ CORRECTO — en componente
import { getCitas } from "@/services/citas.service";

useEffect(() => {
  getCitas().then(setCitas);
}, []);

// ❌ NEVER — en componente
useEffect(() => {
  axios.get("/api/citas").then(res => setCitas(res.data)); // NO
}, []);
```

---

## ¿Dónde va cada archivo?

```text
¿Botón, input, modal reutilizable?    → components/
¿Pantalla completa del negocio?       → views/
¿Petición HTTP?                       → services/
¿Tipo o interfaz compartida (2+)?     → types/
¿Hook personalizado (2+)?             → hooks/
¿Solo se usa en 1 lugar?              → mantener local al feature
```

---

## Estados de carga (REQUIRED)

Todo componente que carga datos debe manejar los 3 estados:

```typescript
// ✅ ALWAYS: loading, error, data
const [citas, setCitas] = useState<CitaDto[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  getCitas()
    .then(setCitas)
    .catch(() => setError("Error al cargar citas"))
    .finally(() => setLoading(false));
}, []);

if (loading) return <Spinner />;
if (error) return <ErrorMessage message={error} />;
```

