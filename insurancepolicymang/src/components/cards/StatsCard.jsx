import React from 'react';
import { motion } from 'framer-motion';

const variants = {
  blue: {
    container: 'bg-gradient-to-br from-blue-50/70 to-indigo-50/20 border-blue-100/70 hover:border-blue-300 hover:shadow-blue-500/5',
    iconBox: 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-550/20',
    title: 'text-indigo-900/70',
    value: 'text-blue-950',
  },
  emerald: {
    container: 'bg-gradient-to-br from-emerald-50/70 to-teal-50/20 border-emerald-100/70 hover:border-emerald-300 hover:shadow-emerald-500/5',
    iconBox: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-550/20',
    title: 'text-emerald-900/70',
    value: 'text-emerald-950',
  },
  violet: {
    container: 'bg-gradient-to-br from-violet-50/70 to-purple-50/20 border-violet-100/70 hover:border-violet-300 hover:shadow-violet-500/5',
    iconBox: 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-violet-550/20',
    title: 'text-purple-900/70',
    value: 'text-purple-950',
  },
  amber: {
    container: 'bg-gradient-to-br from-amber-50/70 to-orange-50/20 border-amber-100/70 hover:border-amber-300 hover:shadow-amber-500/5',
    iconBox: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-550/20',
    title: 'text-amber-900/70',
    value: 'text-amber-955',
  },
  rose: {
    container: 'bg-gradient-to-br from-rose-50/70 to-red-50/20 border-rose-100/70 hover:border-rose-300 hover:shadow-rose-500/5',
    iconBox: 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md shadow-rose-550/20',
    title: 'text-rose-900/70',
    value: 'text-rose-955',
  },
  default: {
    container: 'bg-white border-slate-100 hover:border-indigo-500/30 hover:shadow-indigo-500/5',
    iconBox: 'bg-blue-50/80 text-blue-600',
    title: 'text-slate-500',
    value: 'text-slate-900',
  }
};

const StatsCard = ({ title, value, icon: Icon, trend, trendType = 'up', variant = 'default' }) => {
  const styles = variants[variant] || variants.default;

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className={`border shadow-sm p-6 rounded-2xl flex items-center justify-between transition-all duration-300 ${styles.container}`}
    >
      <div className="flex flex-col gap-1">
        <span className={`text-xs font-bold uppercase tracking-wider ${styles.title}`}>{title}</span>
        <span className={`text-3xl font-extrabold tracking-tight ${styles.value}`}>{value}</span>
        {trend && (
          <span className={`text-xs font-bold mt-1.5 ${trendType === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trendType === 'up' ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <div className={`p-3.5 rounded-xl transition-all duration-300 ${styles.iconBox}`}>
        <Icon className="w-6 h-6" />
      </div>
    </motion.div>
  );
};

export default StatsCard;
