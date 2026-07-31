import React from 'react';

interface VetRankingTableProps {
  data: { nombre: string; especialidad: string; citasSemana: number; citasMes: number }[];
}

const MEDAL = ['🥇', '🥈', '🥉'];

export const VetRankingTable: React.FC<VetRankingTableProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center h-full min-h-[200px]">
        <span className="material-symbols-outlined text-[36px] text-slate-300">person_search</span>
        <p className="text-xs text-slate-400 font-semibold mt-2">Sin datos de veterinarios</p>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => b.citasMes - a.citasMes).slice(0, 5);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
            <h4 className="font-extrabold text-slate-800 text-base">Veterinarios más Activos</h4>
          </div>
          <p className="text-xs text-slate-500 mt-1">Ranking por citas atendidas</p>
        </div>
        <span className="text-xs px-3 py-1 bg-teal-50 text-teal-700 rounded-full font-bold border border-teal-200/60">Ranking</span>
      </div>

      <div className="flex flex-col gap-2">
        {sorted.map((vet, idx) => {
          const maxCitas = sorted[0].citasMes || 1;
          const pct = Math.round((vet.citasMes / maxCitas) * 100);
          return (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100/80 hover:bg-teal-50/40 transition-colors group">
              <span className="text-lg shrink-0">{idx < 3 ? MEDAL[idx] : `#${idx + 1}`}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-bold text-slate-800 text-sm truncate">{vet.nombre}</span>
                  <span className="font-extrabold text-teal-700 text-sm shrink-0">{vet.citasMes} citas</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">{vet.especialidad || 'General'}</p>
                <div className="w-full bg-slate-200/70 rounded-full h-1.5 mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VetRankingTable;
