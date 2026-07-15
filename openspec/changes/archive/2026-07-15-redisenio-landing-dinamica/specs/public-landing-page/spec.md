# Spec Delta: Public Dynamic Portal

## Requirements

### Requirement: Dynamic Services and Staff

The landing, services, and team public pages MUST display actual services and staff members fetched dynamically from the system backend database.

#### Scenario: Fetch Active Services Dynamically
- GIVEN the visitor opens the Services page or Landing page
- WHEN the page loads
- THEN the system MUST request active services from `/api/Servicios`
- AND display them in the UI with their actual names, descriptions, and prices.

#### Scenario: Fetch Veterinarians Dynamically
- GIVEN the visitor opens the Team page or Landing page
- WHEN the page loads
- THEN the system MUST request active veterinarians from `/api/Veterinarios` without requiring authentication
- AND display their names and specialties in the UI.
