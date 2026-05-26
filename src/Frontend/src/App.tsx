import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedLayout from './components/Layout/ProtectedLayout';
import Dashboard from './views/Dashboard/Dashboard';

// Public Views (Placeholder until subagents create them)
import Login from './views/Auth/Login';
import PortalCliente from './views/PortalCliente/PortalCliente';

// Protected Views (Placeholder)
import Agenda from './views/Citas/Agenda';
import NuevaCita from './views/Citas/NuevaCita';
import ColaAtencion from './views/Atencion/ColaAtencion';
import Triage from './views/Atencion/Triage';
import HistoriaClinica from './views/Atencion/HistoriaClinicaSOAP';
import FichaCliente from './views/Clientes/FichaCliente';
import FichaMascota from './views/Mascotas/FichaMascota';
import GestionPagos from './views/Pagos/GestionPagos';
import Consentimiento from './views/Legal/Consentimiento';

function App() {
  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/portal-cliente" element={<PortalCliente />} />

      {/* Rutas Protegidas (Requieren Auth) */}
      <Route path="/" element={<ProtectedLayout />}>
        {/* Redireccionar la raíz al dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Módulo Citas */}
        <Route path="agenda" element={<Agenda />} />
        <Route path="agenda/nueva" element={<NuevaCita />} />
        
        {/* Módulo Atención */}
        <Route path="cola" element={<ColaAtencion />} />
        <Route path="triage" element={<Triage />} />
        <Route path="historia-clinica" element={<HistoriaClinica />} />
        
        {/* Módulo Clientes y Mascotas */}
        <Route path="clientes" element={<FichaCliente />} />
        <Route path="mascotas" element={<FichaMascota />} />
        
        {/* Módulo Administrativo y Legal */}
        <Route path="pagos" element={<GestionPagos />} />
        <Route path="consentimiento" element={<Consentimiento />} />
      </Route>
      
      {/* Fallback 404 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
