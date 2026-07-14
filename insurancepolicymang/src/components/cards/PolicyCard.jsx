import React from 'react';
import Button from '../common/Button';

const PolicyCard = ({ policy, onPurchase }) => {
  return (
    <div className="bg-white border border-slate-100 shadow-lg rounded-2xl p-6 flex flex-col justify-between h-full gap-5 hover:border-blue-100 transition-all">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {policy.policyTypeName}
          </span>
          <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
            Risk: {policy.riskCategory}
          </span>
        </div>
        <h3 className="text-xl font-bold text-slate-950 mt-1">{policy.name}</h3>
        <p className="text-sm text-slate-500 line-clamp-3">{policy.description}</p>
      </div>

      <div className="flex flex-col gap-4 border-t border-slate-50 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-semibold uppercase">Premium</span>
            <span className="text-lg font-bold text-slate-900">₹{Number(policy?.premiumAmount || 0).toLocaleString()} / yr</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-xs text-slate-400 font-semibold uppercase">Coverage</span>
            <span className="text-lg font-bold text-slate-900">₹{Number(policy?.coverageAmount || 0).toLocaleString()}</span>
          </div>
        </div>

        <Button onClick={() => onPurchase(policy)} variant="primary" className="w-full">
          Purchase Policy
        </Button>
      </div>
    </div>
  );
};

export default PolicyCard;
