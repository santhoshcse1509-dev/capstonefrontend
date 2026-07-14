import React from 'react';

const Input = ({ label, type = 'text', name, value, onChange, placeholder, error, className = '', required = false, ...props }) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        {...props}
        className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all bg-white text-slate-900 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-950 dark:disabled:text-slate-600 ${
          error 
            ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500 dark:border-rose-500' 
            : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-slate-800 dark:focus:ring-indigo-500/20'
        }`}
      />
      {error && <span className="text-xs text-rose-500 mt-0.5">{error}</span>}
    </div>
  );
};

export default Input;
