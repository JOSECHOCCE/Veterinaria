import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export interface CategoryItem {
  name: string;
  value: number;
  color: string;
}

interface CategoryDistributionChartProps {
  data?: CategoryItem[];
}

const defaultCategories: CategoryItem[] = [
  { name: 'Consultas Médicas', value: 45, color: '#3b82f6' },
  { name: 'Vacunación', value: 25, color: '#10b981' },
  { name: 'Alimentos / Insumos', value: 18, color: '#f59e0b' },
  { name: 'Estética y Baños', value: 12, color: '#8b5cf6' },
];

export const CategoryDistributionChart: React.FC<CategoryDistributionChartProps> = ({
  data = defaultCategories,
}) => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
          <h4 className="font-extrabold text-slate-800 text-lg">Distribución de Servicios</h4>
        </div>
        <p className="text-xs text-slate-500">Categorías más solicitadas del mes</p>
      </div>

      <div className="my-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Donut Chart Container */}
        <div className="h-48 w-48 relative flex items-center justify-center shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                formatter={(val: any) => [`${val}%`, 'Participación']}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '10px',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12px',
                }}
              />
              <Pie
                data={data}
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none">
            <span className="text-2xl font-black text-slate-800">100%</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Servicios</span>
          </div>
        </div>

        {/* Custom Legend List */}
        <div className="flex flex-col gap-2.5 w-full text-xs">
          {data.map((item, idx) => {
            const pct = Math.round((item.value / (total || 1)) * 100);
            return (
              <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100/80">
                <div className="flex items-center gap-2.5 truncate">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                  <span className="font-medium text-slate-700 truncate">{item.name}</span>
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

export default CategoryDistributionChart;
