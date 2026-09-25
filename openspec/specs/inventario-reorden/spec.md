# Capability Spec: Inventario Clínico, Punto de Reorden Dinámico (ROP) y Registro de Mermas (inventario-reorden)

## Requirement: Dynamic Reorder Point Calculation (HU-030, RF-065)

### Scenario: Automatic dynamic ROP calculation based on historical consumption
- **GIVEN** a product with 30 days of sales and prescription history totalizing 60 units consumed
- **AND** configured `LeadTimeDias = 5` and `StockSeguridad = 10`
- **WHEN** the system calculates the dynamic Reorder Point ($ROP$)
- **THEN** the daily average consumption is determined as 2 units/day ($60 / 30$)
- **AND** the dynamic ROP MUST be set to 20 units ($2 \times 5 + 10$)

### Scenario: Manual minimum stock fallback for new products (HU-033)
- **GIVEN** a newly registered product with 0 historical sales or prescriptions
- **AND** configured `StockMinimo = 15`
- **WHEN** the dynamic ROP calculation executes
- **THEN** the system MUST fallback to `StockMinimo` (15 units) as the effective reorder point

---

## Requirement: Supplier Lead Time & Safety Stock Configuration (HU-031, RF-064)

### Scenario: Updating product reorder parameters
- **GIVEN** an active product in the inventory catalog
- **WHEN** an authorized inventory manager sets `LeadTimeDias` to 7 and `StockSeguridad` to 15
- **THEN** the product parameters SHALL update successfully
- **AND** a dynamic ROP recalculation MUST be triggered automatically

---

## Requirement: Low Stock & Expiration Alerts (HU-032, HU-015, RF-067)

### Scenario: Low stock alert when inventory reaches ROP
- **GIVEN** a product with current `Stock = 18` and effective `ROP = 20`
- **WHEN** inventory status is evaluated
- **THEN** the product MUST appear in the low stock alert feed with urgency status "Reorden Requerido"

### Scenario: Expiration alert for products nearing expiration date (HU-015)
- **GIVEN** a pharmaceutical product with `FechaVencimiento` 25 days in the future
- **WHEN** the daily expiration check executes
- **THEN** the product MUST be flagged in the inventory expiration dashboard as "Por Vencer (< 30 días)"

---

## Requirement: Shrinkage & Waste Kardex Logging (HU-038, RF-066)

### Scenario: Logging product waste / shrinkage in Kardex
- **GIVEN** a product with current `Stock = 50`
- **WHEN** an inventory manager registers a waste log of 5 units with reason "Vencido" or "Dañado"
- **THEN** an immutable `MovimientoInventario` entry MUST be recorded with `TipoMovimiento = Merma_Vencido`
- **AND** the product `Stock` MUST be decremented automatically to 45
