# caja-pagos-concurrencia Specification

## Purpose

Defines requirements and acceptance scenarios for billing order lifecycle (`OrdenCobro`), mixed payment processing, atomic stock deduction with row locking, idempotency key enforcement, Yape/Plin manual voucher verification, cashier-based daily cash closing reports, and multi-thread concurrency stress testing in VetCare Pro.

## Requirements

### Requirement: Automatic Billing Order Generation upon Consultation Completion

The system MUST automatically create an `OrdenCobro` with status `Pendiente` when a medical consultation is completed by a veterinarian. The order MUST contain line items for the consultation fee, internal prescription medicines, and procedures.

#### Scenario: Automatic generation of billing order upon finishing SOAP
- GIVEN a medical consultation in progress with internal prescription items and a consultation fee
- WHEN the veterinarian completes the consultation
- THEN the system MUST create an `OrdenCobro` with status `Pendiente`
- AND the order MUST contain line items for consultation, internal prescription medicines, and procedures

---

### Requirement: Mixed Payment Processing in Cashier

The system MUST support splitting a single billing order payment across multiple payment methods (Cash, Card, Yape, Plin) within a single cashier transaction. The sum of sub-payments MUST equal the total order amount unless a justified partial payment is authorized.

#### Scenario: Successful split payment with Cash and Yape
- GIVEN a pending `OrdenCobro` of S/. 100.00
- WHEN the cashier submits a payment split into S/. 60.00 Cash and S/. 40.00 Yape
- THEN the system MUST record both payment methods under the same transaction
- AND update the `OrdenCobro` status to `Pagada`

#### Scenario: Rejection when payment sub-totals do not match total order amount
- GIVEN a pending `OrdenCobro` of S/. 100.00
- WHEN the cashier submits sub-payments totaling S/. 90.00 without marking partial payment justification
- THEN the system MUST reject the payment transaction with an error message

---

### Requirement: Atomic Stock Deduction and Kardex Entry upon Payment

The system MUST execute stock deduction inside an atomic database transaction with row locking (`IDbContextTransaction`) at the exact moment payment is confirmed in cashier. Stock MUST NOT be deducted at prescription time.

#### Scenario: Atomic stock deduction on cashier payment confirmation
- GIVEN an `OrdenCobro` with 2 units of an internal prescription medicine having stock = 5
- WHEN the cashier confirms the payment
- THEN the system MUST deduct 2 units from `Producto.Stock` inside an atomic transaction
- AND register a Kardex entry of type `Venta` for each product

#### Scenario: Rejection on concurrent overselling attempt
- GIVEN a product with stock = 1 and two cashier transactions attempting to pay for 1 unit simultaneously
- WHEN both transactions attempt to confirm payment at the same time
- THEN the system MUST succeed for one transaction and reject the second with an insufficient stock error

---

### Requirement: Idempotency Key Protection

The system MUST require and validate a unique `Idempotency-Key` header/payload for payment processing requests to prevent duplicate charges or double stock deductions on network retries.

#### Scenario: Idempotent payment request processing
- GIVEN a payment request submitted with `Idempotency-Key: "IDEMP-8921-X"`
- WHEN the same request is re-submitted with the identical `Idempotency-Key`
- THEN the system MUST return the cached original response without processing a second payment or deducting stock twice

---

### Requirement: Yape/Plin Voucher Verification Workflow

The system MUST record Yape/Plin payments with a mandatory operation voucher number. The cashier MAY mark the payment as `PendienteVerificacion` to prevent blocking client exit. The Administrator MUST be able to review and transition pending payments to `Verificado` or `Rechazado`.

#### Scenario: Cashier registers Yape payment as Pending Verification
- GIVEN a pending `OrdenCobro` of S/. 50.00 and a Yape voucher with operation number `"987654"`
- WHEN the cashier selects `Yape` and marks the payment status as `PendienteVerificacion`
- THEN the system MUST close the billing order and queue the payment in the Admin verification list

#### Scenario: Admin verifies pending Yape payment during daily closing
- GIVEN a payment in status `PendienteVerificacion` with operation number `"987654"`
- WHEN the Administrator verifies the transaction in the bank app and clicks `Verificar`
- THEN the system MUST update the payment status to `Verificado`

---

### Requirement: Daily Cash Closing Report

The system MUST generate a daily cash closing report (`CierreCaja`) providing exact revenue totals itemized by payment method (Cash, Card, Yape, Plin) and cashier user ID.

#### Scenario: Generating daily cash closing report
- GIVEN multiple completed payments registered by Cashier "Juan" across Cash, Card, and Yape
- WHEN the Administrator generates the daily cash closing report for today's date
- THEN the system MUST return separate total sums for Cash, Card, Yape, and Plin, tagged with the cashier ID

---

### Requirement: Automated Multi-Threaded Concurrency & Stress Testing

The system MUST include automated xUnit test suites (`ConcurrencyStockPaymentTests.cs`) executing 15-20 parallel threads using `Task.WhenAll` against isolated `DbContext` instances to verify that high-volume concurrent payments and inventory deductions operate atomically without data corruption, race conditions, or duplicate charges.

#### Scenario: 20 parallel threads attempting concurrent payment on limited stock
- GIVEN a product with stock = 5 and 20 parallel tasks attempting to process payments for 1 unit each simultaneously
- WHEN `Task.WhenAll` executes all 20 payment tasks concurrently
- THEN exactly 5 tasks MUST succeed and 15 tasks MUST fail with an insufficient stock exception
- AND final `Producto.Stock` MUST equal 0 with exactly 5 Kardex entries created.
