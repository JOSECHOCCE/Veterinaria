import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface SpeciesDistributionChartProps {
  data: { especie: string; cantidad: number }[];
}

const SPECIES_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export const SpeciesDistributionChart: React.FC<SpeciesDistributionChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center h-full min-h-[200px]">
        <span className="material-symbols-outlined text-[36px] text-slate-300">donut_large</span>
        <p className="text-xs text-slate-400 font-semibold mt-2">Sin datos de especies</p>
      </div>
    );
  }

  const total = data.reduce((acc, curr) => acc + curr.cantidad, 0);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
        <h4 className="font-extrabold text-slate-800 text-base">Mascotas por Especie</h4>
      </div>
      <p className="text-xs text-slate-500 mb-4">Distribución actual del registro</p>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 flex-1">
        <div className="h-40 w-40 relative flex items-center justify-center shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                formatter={(val: any) => [`${val} registros`, 'Cantidad']}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '10px',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12px',
                }}
              />
              <Pie data={data} dataKey="cantidad" nameKey="especie" innerRadius={45} outerRadius={65} paddingAngle={4}>
                {data.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={SPECIES_COLORS[index % SPECIES_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none">
            <span className="text-xl font-black text-slate-800">{total}</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full text-xs">
          {data.map((item, idx) => {
            const pct = total > 0 ? Math.round((item.cantidad / total) * 100) : 0;
            return (
              <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100/80">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: SPECIES_COLORS[idx % SPECIES_COLORS.length] }}></span>
                  <span className="font-medium text-slate-700 truncate">{item.especie}</span>
                </div>
                <span className="font-extrabold text-slate-900 ml-2 shrink-0">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SpeciesDistributionChart;
