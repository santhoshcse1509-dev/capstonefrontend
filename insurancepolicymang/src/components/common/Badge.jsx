import React from 'react';

const Badge = ({ children, variant = 'neutral' }) => {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold';
  
  const variants = {
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/20',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400 dark:border dark:border-amber-500/20',
    error: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-400 dark:border dark:border-rose-500/20',
    info: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-400 dark:border dark:border-sky-500/20',
    neutral: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:border dark:border-slate-700/55'
  };

  return <span className={`${baseStyles} border border-transparent ${variants[variant]}`}>{children}</span>;
};

export default Badge;
