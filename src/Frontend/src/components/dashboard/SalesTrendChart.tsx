import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export interface SalesDataPoint {
  label: string;
  amount: number;
}

interface SalesTrendChartProps {
  dataWeekly?: SalesDataPoint[];
  dataMonthly?: SalesDataPoint[];
}

const defaultWeeklyData: SalesDataPoint[] = [
  { label: 'Vie 24', amount: 450 },
  { label: 'Sáb 25', amount: 820 },
  { label: 'Dom 26', amount: 610 },
  { label: 'Lun 27', amount: 950 },
  { label: 'Mar 28', amount: 1200 },
  { label: 'Mié 29', amount: 780 },
  { label: 'Jue 30', amount: 1450 },
];

const defaultMonthlyData: SalesDataPoint[] = [
  { label: 'Feb', amount: 4200 },
  { label: 'Mar', amount: 5100 },
  { label: 'Abr', amount: 6800 },
  { label: 'May', amount: 12400 },
  { label: 'Jun', amount: 9800 },
  { label: 'Jul', amount: 14540 },
];

export const SalesTrendChart: React.FC<SalesTrendChartProps> = ({
  dataWeekly = defaultWeeklyData,
  dataMonthly = defaultMonthlyData,
}) => {
  const [period, setPeriod] = useState<'7d' | '6m'>('7d');
  const chartData = period === '7d' ? dataWeekly : dataMonthly;

  const totalAmount = chartData.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
            <h4 className="font-extrabold text-slate-800 text-lg">Tendencia de Ingresos</h4>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Acumulado período: <span className="font-bold text-amber-700">S/ {totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setPeriod('7d')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              period === '7d' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Últimos 7 días
          </button>
          <button
            onClick={() => setPeriod('6m')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              period === '6m' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            6 Meses
          </button>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d97706" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#d97706" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `S/${v >= 1000 ? `${v / 1000}k` : v}`}
            />
            <Tooltip
              formatter={(value: any) => [`S/ ${Number(value).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 'Ingreso']}
              contentStyle={{
                backgroundColor: '#1e293b',
                borderRadius: '12px',
                border: 'none',
                color: '#fff',
                fontSize: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
              }}
              itemStyle={{ color: '#f59e0b', fontWeight: 'bold' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#d97706"
              strokeWidth={3}
              dot={{ r: 4, fill: '#d97706', strokeWidth: 2, stroke: '#ffffff' }}
              activeDot={{ r: 6, fill: '#b45309', strokeWidth: 2, stroke: '#ffffff' }}
              fillOpacity={1}
              fill="url(#amberGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesTrendChart;
