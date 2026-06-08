import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ReporteCitas from './ReporteCitas';
import ReportePagos from './ReportePagos';
import EstadisticasOperativas from './EstadisticasOperativas';

type TabKey = 'citas' | 'pagos' | 'estadisticas';

export default function ReportesHub() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('citas');

  const isAdmin = user?.role === 'Admin';

  // Si no es admin y de alguna forma se configuró otra pestaña, forzar a 'citas'
  useEffect(() => {
    if (!isAdmin && activeTab !== 'citas') {
      setActiveTab('citas');
    }
  }, [user, activeTab, isAdmin]);

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto flex flex-col gap-8 pb-12 select-none">
      
      {/* Page Header */}
      <header className="flex flex-col justify-between gap-4 border-b border-hairline pb-6">
        <div>
          <h1 className="font-display-lg text-display-lg text-ink">Reportes e Inteligencia</h1>
          <p className="font-body-md text-body-md text-body-muted mt-1">
            Auditoría de citas, flujos de ingresos financieros y análisis analítico de la operación de VetCare Pro.
          </p>
        </div>
      </header>

      {/* Tabs Menu */}
      <div className="flex gap-8 border-b border-hairline -mt-4">
        <button
          onClick={() => setActiveTab('citas')}
          className={`relative pb-3 font-nav-link text-nav-link transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'citas' ? 'text-primary font-bold' : 'text-body-muted hover:text-ink'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">calendar_month</span>
          Reporte de Citas
          {activeTab === 'citas' && (
            <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-primary rounded-t-full"></div>
          )}
        </button>

        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab('pagos')}
              className={`relative pb-3 font-nav-link text-nav-link transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'pagos' ? 'text-primary font-bold' : 'text-body-muted hover:text-ink'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">payments</span>
              Reporte de Pagos / Ingresos
              {activeTab === 'pagos' && (
                <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-primary rounded-t-full"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('estadisticas')}
              className={`relative pb-3 font-nav-link text-nav-link transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'estadisticas' ? 'text-primary font-bold' : 'text-body-muted hover:text-ink'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">analytics</span>
              Estadísticas Operativas
              {activeTab === 'estadisticas' && (
                <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-primary rounded-t-full"></div>
              )}
            </button>
          </>
        )}
      </div>

      {/* Render Active Component */}
      <div className="mt-2">
        {activeTab === 'citas' && <ReporteCitas />}
        {activeTab === 'pagos' && isAdmin && <ReportePagos />}
        {activeTab === 'estadisticas' && isAdmin && <EstadisticasOperativas />}
      </div>

    </div>
  );
}
