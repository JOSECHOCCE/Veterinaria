import React from 'react';
import { useNavigate } from 'react-router-dom';

interface LowStockAlertBannerProps {
  lowStockCount: number;
}

export const LowStockAlertBanner: React.FC<LowStockAlertBannerProps> = ({ lowStockCount }) => {
  const navigate = useNavigate();

  if (lowStockCount <= 0) return null;

  return (
    <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs animate-fadeIn">
      <div className="flex items-center gap-3.5">
        <div className="p-3 bg-rose-500/10 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[24px]">warning</span>
        </div>
        <div>
          <h4 className="font-extrabold text-rose-950 text-sm md:text-base">
            ¡Atención! {lowStockCount} {lowStockCount === 1 ? 'producto o insumo tiene' : 'productos o insumos tienen'} bajo stock
          </h4>
          <p className="text-xs text-rose-800/80 mt-0.5 font-medium">
            Se requiere reordenar suministros médicos o vacunas para evitar desabastecimiento en la clínica.
          </p>
        </div>
      </div>

      <button
        onClick={() => navigate('/admin/productos')}
        className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
      >
        <span>Ver Productos</span>
        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
      </button>
    </div>
  );
};

export default LowStockAlertBanner;
