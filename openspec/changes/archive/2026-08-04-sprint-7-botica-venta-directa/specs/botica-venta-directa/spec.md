# Delta for botica-venta-directa

## ADDED Requirements

### Requirement: Venta Directa en Mostrador de Productos de Libre Comercio (OTC)

The system MUST allow receptionists and cashiers to process direct counter sales of unrestricted products (`RequiereReceta == false`) without requiring a prior medical appointment or consultation (`HU-013`, `RF-016`).

#### Scenario: Venta libre exitosa en recepción sin consulta previa

- GIVEN a customer requesting over-the-counter products (`RequiereReceta == false`, e.g., pet shampoo, food, accessories)
- WHEN the receptionist submits the sale request with valid payment details
- THEN the system MUST complete the sale with status `"Completada"`
- AND the system MUST deduct product stock atomically
- AND the system MUST generate an inventory movement (`MovimientoInventario`) with `TipoMovimiento = "SalidaVenta"`.

---

### Requirement: Bloqueo Automático de Venta de Fármacos Restringidos sin Receta

The system MUST automatically block any direct counter sale containing products flagged with `RequiereReceta == true` unless a valid, active medical prescription (`RecetaId`) is supplied (`HU-014`, `RF-017`).

#### Scenario: Bloqueo automático al intentar vender medicamento restringido sin receta

- GIVEN a catalog product configured with `RequiereReceta == true` (e.g., controlled antibiotic or anesthetic)
- WHEN a sale request is submitted for this product without a valid `RecetaId`
- THEN the system MUST reject the transaction
- AND the system MUST return an explicit error message: `"El producto '{producto.Nombre}' requiere una receta médica válida para su venta."`
- AND product stock and inventory records MUST remain unchanged.

---

### Requirement: Procesamiento Exitoso de Fármaco Restringido con Receta Válida

The system MUST allow counter sales of restricted pharmaceuticals (`RequiereReceta == true`) when a valid, active `RecetaId` issued by a licensed veterinarian is linked to the transaction (`HU-014`, `RF-017`).

#### Scenario: Venta exitosa de medicamento restringido vinculando receta válida

- GIVEN a valid, active medical prescription (`Receta`) issued to the customer's pet
- WHEN the receptionist submits a sale for a restricted product including the valid `RecetaId`
- THEN the system MUST verify that the prescription contains the prescribed product
- AND the system MUST process the sale successfully with status `"Completada"`
- AND the system MUST deduct stock and log Kardex inventory movement accordingly.

---

### Requirement: Auditoría de Inventario y Kardex en Ventas de Botica

The system MUST log a `MovimientoInventario` audit entry for every completed counter sale to maintain full Kardex alignment across all sales channels (`RNF-020`).

#### Scenario: Registro automático en Kardex por venta en mostrador

- GIVEN a completed counter sale containing 1 or more products
- WHEN the sale transaction commits
- THEN the system MUST create a `MovimientoInventario` entry for each product
- AND set `TipoMovimiento = "SalidaVenta"`
- AND record the quantity, timestamp, and operating user.
