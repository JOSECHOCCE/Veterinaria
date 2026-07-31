import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

interface TopServicesBarChartProps {
  data: { nombre: string; cantidadCitas: number; ingresos: number }[];
}

const BAR_COLORS = ['#d97706', '#f59e0b', '#fbbf24', '#fcd34d', '#fde68a'];

export const TopServicesBarChart: React.FC<TopServicesBarChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center h-full min-h-[280px]">
        <span className="material-symbols-outlined text-[36px] text-slate-300">bar_chart</span>
        <p className="text-xs text-slate-400 font-semibold mt-2">Sin datos de servicios</p>
      </div>
    );
  }

  const chartData = data.slice(0, 5).map((s) => ({
    name: s.nombre.length > 18 ? s.nombre.slice(0, 18) + '…' : s.nombre,
    fullName: s.nombre,
    citas: s.cantidadCitas,
    ingresos: s.ingresos,
  }));

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <h4 className="font-extrabold text-slate-800 text-base">Top Servicios más Solicitados</h4>
          </div>
          <p className="text-xs text-slate-500 mt-1">Cantidad de citas por servicio este mes</p>
        </div>
        <span className="text-xs px-3 py-1 bg-amber-50 text-amber-700 rounded-full font-bold border border-amber-200/60">Mes</span>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value: any, _name: any, props: any) => [
                `${value} citas — S/ ${props.payload.ingresos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
                props.payload.fullName,
              ]}
              contentStyle={{
                backgroundColor: '#1e293b',
                borderRadius: '12px',
                border: 'none',
                color: '#fff',
                fontSize: '12px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
              }}
              itemStyle={{ color: '#fbbf24', fontWeight: 'bold' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
            />
            <Bar dataKey="citas" radius={[0, 6, 6, 0]} barSize={20}>
              {chartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TopServicesBarChart;
