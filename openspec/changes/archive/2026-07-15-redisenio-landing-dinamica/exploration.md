# Exploration: Portal Público Dinámico (Landing, Servicios y Equipo)

## Context & Objectives
The landing page and public pages currently have static mock data for services and veterinarians that do not reflect the database. The client wants them to load dynamically from the backend APIs so that the public-facing site matches the registered system details.

## Technical Findings
1. **API Endpoints**:
   - `/api/Servicios` already supports anonymous `GET` request.
   - `/api/Veterinarios` is currently blocked by `[Authorize(Roles = "...")]` at class level in `VeterinariosController.cs`.
2. **Vite API client**:
   - The global axios instance `api.ts` has a response interceptor that redirects 401 errors directly to `/login`. If `/api/Veterinarios` or `/api/Servicios` returns 401 on public pages, visitors would get locked out. We should bypass the redirect if pathname is in public routes (`/`, `/servicios`, `/equipo`, `/contacto`).
3. **Seeded Data**:
   - Services seeded: `Consulta General`, `Vacunación`, `Cirugía Menor`, `Baño y Peluquería`, `Desparasitación`.
   - Veterinarians seeded: `Dr. Carlos Mendoza Ruiz` (Medicina General), `Dra. María Fernández López` (Cirugía y Traumatología).
4. **Assets**:
   - The client has beautiful pre-generated illustrations matching the service names (e.g. `src/Frontend/src/assets/Consulta General.png`, etc.). We will map the dynamic database services to these asset files by name.

## Proposed Strategy
- Annotate `VeterinariosController.Index` with `[AllowAnonymous]`.
- Adjust `api.ts` interceptor redirect check.
- Update `LandingPage.tsx` to fetch the first few services and vets.
- Update `ServiciosPublic.tsx` to fetch all active services and display them dynamically.
- Update `EquipoPublic.tsx` to fetch all active vets and display them dynamically.
