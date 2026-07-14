import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Apr', value: 4780 },
  { name: 'May', value: 5890 },
  { name: 'Jun', value: 4390 },
  { name: 'Jul', value: 6490 },
];

const RevenueChart = () => {
  const gridColor = '#f1f5f9';
  const labelColor = '#94a3b8';
  const areaColor = '#4f46e5';

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-slate-200/50 p-6 rounded-2xl shadow-sm h-80 flex flex-col gap-4 transition-all duration-300">
      <h3 className="text-lg font-bold text-slate-900">Premium Revenue Trends</h3>
      <div className="w-full h-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={areaColor} stopOpacity={0.25}/>
                <stop offset="95%" stopColor={areaColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <XAxis dataKey="name" stroke={labelColor} fontSize={12} tickLine={false} />
            <YAxis stroke={labelColor} fontSize={12} tickLine={false} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#ffffff', 
                border: '1px solid #e2e8f0', 
                borderRadius: '12px',
                color: '#0f172a'
              }}
            />
            <Area type="monotone" dataKey="value" stroke={areaColor} strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;
