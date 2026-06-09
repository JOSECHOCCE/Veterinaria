import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ReporteCitas from './ReporteCitas';
import ReportePagos from './ReportePagos';
import EstadisticasOperativas from './EstadisticasOperativas';
import PageHeader from '../../components/common/PageHeader';

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
      <PageHeader
        title="Reportes e Inteligencia"
        description="Auditoría de citas, flujos de ingresos financieros y análisis analítico de la operación de VetCare Pro."
        actions={
          <div className="flex gap-xs bg-surface-soft p-1 rounded-lg border border-hairline">
            <button
              onClick={() => setActiveTab('citas')}
              className={`px-4 py-2 font-button text-button rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'citas'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-secondary hover:text-ink'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">calendar_month</span>
              Citas
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() => setActiveTab('pagos')}
                  className={`px-4 py-2 font-button text-button rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'pagos'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-secondary hover:text-ink'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">payments</span>
                  Pagos / Ingresos
                </button>

                <button
                  onClick={() => setActiveTab('estadisticas')}
                  className={`px-4 py-2 font-button text-button rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'estadisticas'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-secondary hover:text-ink'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">analytics</span>
                  Estadísticas
                </button>
              </>
            )}
          </div>
        }
        hasDivider={true}
      />

      {/* Render Active Component */}
      <div className="mt-2">
        {activeTab === 'citas' && <ReporteCitas />}
        {activeTab === 'pagos' && isAdmin && <ReportePagos />}
        {activeTab === 'estadisticas' && isAdmin && <EstadisticasOperativas />}
      </div>

    </div>
  );
}
