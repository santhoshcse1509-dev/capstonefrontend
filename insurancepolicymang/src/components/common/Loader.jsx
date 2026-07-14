import React from 'react';

const Loader = ({ fullPage = false }) => {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-blue-600" />
      <span className="text-sm font-medium text-slate-500">Loading details...</span>
    </div>
  );

  if (fullPage) {
    return <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">{spinner}</div>;
  }

  return <div className="py-8 w-full flex items-center justify-center">{spinner}</div>;
};

export default Loader;
