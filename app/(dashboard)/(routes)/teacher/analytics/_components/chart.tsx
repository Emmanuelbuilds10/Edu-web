'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatPrice } from '@/lib/format';

interface ChartProps {
  data: {
    name: string;
    total: number;
  }[];
}

const Chart = ({ data }: ChartProps) => {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center">
        <p className="text-sm font-semibold text-slate-700">No confirmed sales yet</p>
        <p className="mt-1 text-xs text-slate-500">Revenue will appear here after your first paid enrolment.</p>
      </div>
    );
  }

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="earningsBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d9488" />
              <stop offset="100%" stopColor="#5eead4" />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 6" stroke="#e2e8f0" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            dy={8}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={76}
            tickFormatter={(value) => `₦${value}`}
          />
          <Tooltip
            cursor={{ fill: '#f1f5f9' }}
            contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }}
            labelStyle={{ color: '#334155', fontWeight: 600 }}
            formatter={(value) => [formatPrice(Number(value)), 'Revenue']}
          />
          <Bar dataKey="total" fill="url(#earningsBar)" radius={[6, 6, 0, 0]} maxBarSize={56} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;
