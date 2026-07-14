import React from 'react';
import { motion } from 'framer-motion';

const Button = ({ children, onClick, type = 'button', variant = 'primary', size = 'md', loading = false, disabled = false, className = '' }) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 shadow-md shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20 dark:shadow-none dark:hover:bg-indigo-500',
    secondary: 'bg-slate-200 hover:bg-slate-300 text-slate-800 focus:ring-slate-500 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200',
    outline: 'border border-slate-300 hover:bg-slate-50 text-slate-700 focus:ring-indigo-500 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-md shadow-red-500/10 hover:shadow-lg hover:shadow-red-500/20 dark:shadow-none dark:hover:bg-red-500',
    ghost: 'hover:bg-slate-100 text-slate-600 focus:ring-slate-500 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : null}
      {children}
    </motion.button>
  );
};

export default Button;
