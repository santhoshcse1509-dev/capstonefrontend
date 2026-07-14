import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Health', value: 2400 },
  { name: 'Life', value: 1398 },
  { name: 'Motor', value: 9800 },
  { name: 'Travel', value: 3908 },
  { name: 'Home', value: 4800 },
];

const ClaimsChart = () => {
  return (
    <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm h-80 flex flex-col gap-4">
      <h3 className="text-lg font-bold text-slate-900">Claims by Category</h3>
      <div className="w-full h-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#60a5fa" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ClaimsChart;
