import { CheckCircle2, Circle } from 'lucide-react';

/**
 * Stepper — horizontal (mobile: vertical) step progress indicator.
 *
 * Props:
 *   steps       — array of { label, timestamp, status: 'complete'|'active'|'pending' }
 *   currentStep — zero-based index of the active step
 */
export default function Stepper({ steps = [], currentStep = 0 }) {
  return (
    <div className="w-full">
      {/* ── Desktop / Tablet: horizontal ── */}
      <div className="hidden sm:flex items-start">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center relative">
              {/* Connector line */}
              {idx !== 0 && (
                <div
                  className={`absolute top-4 right-1/2 w-full h-0.5 -translate-y-0.5 ${
                    step.status === 'complete' || step.status === 'active'
                      ? 'bg-blue-500'
                      : 'bg-slate-200'
                  }`}
                />
              )}

              <div className="relative z-10 flex flex-col items-center">
                {step.status === 'complete' && (
                  <span className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 shadow-md">
                    <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </span>
                )}
                {step.status === 'active' && (
                  <span className="relative flex items-center justify-center w-9 h-9">
                    <span className="absolute inline-flex w-full h-full rounded-full bg-blue-400 opacity-40 animate-ping" />
                    <span className="relative flex items-center justify-center w-9 h-9 rounded-full border-2 border-blue-600 bg-white shadow-md">
                      <span className="w-3 h-3 rounded-full bg-blue-600" />
                    </span>
                  </span>
                )}
                {step.status === 'pending' && (
                  <span className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-slate-300 bg-white">
                    <Circle className="w-4 h-4 text-slate-300" />
                  </span>
                )}

                <span
                  className={`mt-2 text-xs font-semibold text-center leading-tight max-w-[72px] ${
                    step.status === 'complete'
                      ? 'text-blue-700'
                      : step.status === 'active'
                      ? 'text-blue-600'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
                {step.timestamp && (
                  <span className="mt-0.5 text-[10px] text-slate-400 text-center leading-tight max-w-[80px]">
                    {step.timestamp}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Mobile: vertical ── */}
      <div className="flex sm:hidden flex-col gap-0">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          return (
            <div key={idx} className="flex items-stretch gap-3">
              <div className="flex flex-col items-center">
                <div className="relative z-10 mt-1">
                  {step.status === 'complete' && (
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 shadow">
                      <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={2.5} />
                    </span>
                  )}
                  {step.status === 'active' && (
                    <span className="relative flex items-center justify-center w-8 h-8">
                      <span className="absolute inline-flex w-full h-full rounded-full bg-blue-400 opacity-40 animate-ping" />
                      <span className="relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-blue-600 bg-white shadow">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      </span>
                    </span>
                  )}
                  {step.status === 'pending' && (
                    <span className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-slate-300 bg-white">
                      <Circle className="w-3 h-3 text-slate-300" />
                    </span>
                  )}
                </div>
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 mt-1 mb-1 min-h-[20px] ${
                      steps[idx + 1]?.status === 'complete' || step.status === 'complete'
                        ? 'bg-blue-400'
                        : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>

              <div className={`flex flex-col justify-start ${isLast ? 'pb-0' : 'pb-4'}`}>
                <span
                  className={`text-sm font-semibold leading-none mt-1 ${
                    step.status === 'complete'
                      ? 'text-blue-700'
                      : step.status === 'active'
                      ? 'text-blue-600'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
                {step.timestamp && (
                  <span className="mt-0.5 text-[11px] text-slate-400">{step.timestamp}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
