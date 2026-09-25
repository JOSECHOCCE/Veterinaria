# Delta for caja-pagos-concurrencia

## ADDED Requirements

### Requirement: Automated Multi-Threaded Concurrency & Stress Testing

The system MUST include automated xUnit test suites (`ConcurrencyStockPaymentTests.cs`) executing 15-20 parallel threads using `Task.WhenAll` against isolated `DbContext` instances to verify that high-volume concurrent payments and inventory deductions operate atomically without data corruption, race conditions, or duplicate charges.

#### Scenario: 20 parallel threads attempting concurrent payment on limited stock
- GIVEN a product with stock = 5 and 20 parallel tasks attempting to process payments for 1 unit each simultaneously
- WHEN `Task.WhenAll` executes all 20 payment tasks concurrently
- THEN exactly 5 tasks MUST succeed and 15 tasks MUST fail with an insufficient stock exception
- AND final `Producto.Stock` MUST equal 0 with exactly 5 Kardex entries created.
