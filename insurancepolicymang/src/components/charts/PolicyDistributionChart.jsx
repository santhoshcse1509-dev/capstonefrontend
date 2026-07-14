import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const data = [
  { name: 'Active Policies', value: 400 },
  { name: 'Pending Policies', value: 80 },
  { name: 'Expired Policies', value: 50 },
];

const COLORS = ['#3b82f6', '#fbbf24', '#ef4444'];

const PolicyDistributionChart = () => {
  return (
    <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm h-80 flex flex-col gap-4">
      <h3 className="text-lg font-bold text-slate-900">Policy Distribution Status</h3>
      <div className="w-full h-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PolicyDistributionChart;
