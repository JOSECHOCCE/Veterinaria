# Proposal: Portal Público Dinámico

## Scope of Changes
We will make the following changes:
1. **Backend**:
   - Allow anonymous read access to the veterinarian listing API.
2. **Frontend client**:
   - Safeguard the axios response interceptor from redirecting public guests.
3. **Frontend views**:
   - Fetch actual active services and veterinarians in the Landing, Services, and Team pages.
   - Use dynamic values (name, specialty, description, duration, pricing).
   - Dynamically map services to existing images.

## Impact Assessment
- **Security**: Allowing anonymous listing of services and veterinarians is safe since they are public entities visible during booking anyway.
- **Performance**: Fetches are done on page load. A simple loading skeleton or spinner will prevent UI layout shifts.
- **Resilience**: A simple fallback to mock data or empty lists if the API is offline.
