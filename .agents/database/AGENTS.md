# VetCare Database — AI Agent Ruleset

> **Skills Reference**:
> <!-- SKILLS_REF_START -->
> - [commits](../skills/commits/SKILL.md) - Conventional commits para VetCare. Formato correcto de mensajes de commit. Usar siempre antes de hacer un git commit.
> - [entity-framework](../skills/entity-framework/SKILL.md) - Patrones de EF Core Code-First para VetCare. Fluent API obligatorio, migraciones bien nombradas, sin Data Annotations en Domain. Usar cuando toques DbContext, entidades, migraciones o configuraciones de base de datos.
> - [vetcare-db](../skills/vetcare-db/SKILL.md) - Entidades, relaciones y configuraciones Fluent API específicas de VetCare. Usar cuando crees o modifiques entidades del Domain o configuraciones de Infrastructure.
<!-- SKILLS_REF_END -->

## Auto-invoke Skills

<!-- AUTO_INVOKE_START -->
| Acción | Skill |
|---|---|
| Agregar índices o constraints | `entity-framework` |
| Crear configuración Fluent API (IEntityTypeConfiguration) | `entity-framework` |
| Crear o modificar una entidad del Domain | `vetcare-db` |
| Crear o revisar una migración | `entity-framework` |
| Hacer un commit | `commits` |
| Trabajar con relaciones entre entidades | `vetcare-db` |
<!-- AUTO_INVOKE_END -->

## CRITICAL RULES — NON-NEGOTIABLE

### Entidades
- ALWAYS: PK nombrada `Id`, tipo `int`, autoincremental
- ALWAYS: Campos string con `HasMaxLength()` en Fluent API
- ALWAYS: Decimales con `HasColumnType("decimal(18,2)")`
- NEVER: Data Annotations en entidades de Domain (usar Fluent API en Infrastructure)

### Migraciones
- ALWAYS: Nombres descriptivos (`AddCitaEstadoField`, `CreatePagosTable`)
- NEVER: Editar migraciones ya aplicadas en producción
- NEVER: DELETE en cascade automático (usar `DeleteBehavior.Restrict`)

### Eliminación
- ALWAYS: Campo `Activo` (bool) para eliminación lógica
- NEVER: Eliminación física si el registro tiene historial

### Relaciones
- ALWAYS: Configurar `DeleteBehavior.Restrict` en todas las FKs
- NEVER: Dejar el comportamiento de cascade en su valor por defecto

## Tech Stack

SQL Server | Entity Framework Core | Code-First | Fluent API

## Project Structure

```text
VetCare.Infrastructure/
├── Data/
│   └── VetCareDbContext.cs
├── Repositories/
│   └── Configurations/
│       ├── UsuarioConfiguration.cs
│       ├── ClienteConfiguration.cs
│       ├── MascotaConfiguration.cs
│       ├── CitaConfiguration.cs
│       ├── AtencionClinicaConfiguration.cs
│       └── PagoConfiguration.cs
└── Migrations/
```

## Commands

```bash
# Crear migración
dotnet ef migrations add <Nombre> --project VetCare.Infrastructure --startup-project VetCare.Web

# Aplicar migración
dotnet ef database update --project VetCare.Infrastructure --startup-project VetCare.Web

# Revertir última migración
dotnet ef migrations remove --project VetCare.Infrastructure
```

## QA Checklist

- [ ] Migración creada y revisada antes de aplicar
- [ ] Todos los strings tienen `HasMaxLength()`
- [ ] Todos los decimales tienen `HasColumnType("decimal(18,2)")`
- [ ] Todas las FKs con `DeleteBehavior.Restrict`
- [ ] Eliminación lógica con campo `Activo`
- [ ] Sin Data Annotations en Domain

## Naming Conventions

| Entidad | Patrón | Ejemplo |
|---------|--------|---------|
| Tabla | Plural, PascalCase | `Citas`, `Mascotas` |
| Configuración | `<Entidad>Configuration` | `CitaConfiguration` |
| Migración | Acción descriptiva | `AddCitaEstadoField` |
| FK | `<Entidad>Id` | `ClienteId`, `MascotaId` |
