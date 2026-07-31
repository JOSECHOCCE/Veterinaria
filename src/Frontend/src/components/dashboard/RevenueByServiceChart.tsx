import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

interface RevenueByServiceChartProps {
  data: { nombre: string; ingresos: number; cantidadCitas: number }[];
}

const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

export const RevenueByServiceChart: React.FC<RevenueByServiceChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center h-full min-h-[280px]">
        <span className="material-symbols-outlined text-[36px] text-slate-300">monetization_on</span>
        <p className="text-xs text-slate-400 font-semibold mt-2">Sin datos de ingresos</p>
      </div>
    );
  }

  const chartData = data.slice(0, 5).map((s) => ({
    name: s.nombre.length > 12 ? s.nombre.slice(0, 12) + '…' : s.nombre,
    fullName: s.nombre,
    ingresos: s.ingresos,
    citas: s.cantidadCitas,
  }));

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h4 className="font-extrabold text-slate-800 text-base">Ingresos por Servicio</h4>
          </div>
          <p className="text-xs text-slate-500 mt-1">Recaudación del mes por tipo de servicio</p>
        </div>
        <span className="text-xs px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-bold border border-emerald-200/60">S/</span>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val: number) => `S/${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
            />
            <Tooltip
              formatter={(value: any, _name: any, props: any) => [
                `S/ ${Number(value).toLocaleString('es-ES', { minimumFractionDigits: 2 })} (${props.payload.citas} citas)`,
                props.payload.fullName,
              ]}
              contentStyle={{
                backgroundColor: '#0f172a',
                borderRadius: '12px',
                border: 'none',
                color: '#fff',
                fontSize: '12px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
              }}
              itemStyle={{ color: '#34d399', fontWeight: 'bold' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
            />
            <Bar dataKey="ingresos" radius={[8, 8, 0, 0]} barSize={36}>
              {chartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueByServiceChart;
