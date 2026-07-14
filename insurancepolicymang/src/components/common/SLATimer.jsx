import { useEffect, useState, useCallback } from 'react';

/**
 * SLATimer — displays a live countdown pill for SLA deadlines.
 *
 * Props:
 *   deadline — ISO date string (e.g. "2024-01-15T18:00:00.000Z")
 *   label    — descriptive label shown beside the timer (e.g. "Response SLA")
 */
export default function SLATimer({ deadline, label = 'SLA Deadline' }) {
  const [remaining, setRemaining] = useState(null);

  const calcRemaining = useCallback(() => {
    const now = Date.now();
    const end = new Date(deadline).getTime();
    return end - now; // ms, can be negative
  }, [deadline]);

  useEffect(() => {
    if (!deadline) return;
    setRemaining(calcRemaining());
    const interval = setInterval(() => setRemaining(calcRemaining()), 60_000);
    return () => clearInterval(interval);
  }, [deadline, calcRemaining]);

  if (!deadline || remaining === null) return null;

  const isOverdue = remaining <= 0;
  const totalSeconds = Math.abs(remaining) / 1000;
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  // Determine urgency tier
  const totalHoursLeft = remaining / 3_600_000;
  let colorClasses, dotColor, badgeText;

  if (isOverdue) {
    colorClasses = 'bg-rose-100 text-rose-700 border border-rose-300';
    dotColor = 'bg-rose-500';
    badgeText = 'OVERDUE';
  } else if (totalHoursLeft < 24) {
    colorClasses = 'bg-rose-50 text-rose-600 border border-rose-200';
    dotColor = 'bg-rose-500';
    const hDisplay = hours > 0 ? `${hours}h ` : '';
    badgeText = `${hDisplay}${minutes}m remaining`;
  } else if (totalHoursLeft <= 72) {
    colorClasses = 'bg-amber-50 text-amber-700 border border-amber-200';
    dotColor = 'bg-amber-500';
    badgeText = `${days}d ${hours}h remaining`;
  } else {
    colorClasses = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    dotColor = 'bg-emerald-500';
    badgeText = `${days}d ${hours}h remaining`;
  }

  const showPulse = !isOverdue && totalHoursLeft < 24;

  return (
    <div className="inline-flex items-center gap-2">
      {label && (
        <span className="text-xs font-medium text-slate-500">{label}:</span>
      )}
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${colorClasses}`}
      >
        {/* Pulsing dot for urgent / overdue */}
        {(showPulse || isOverdue) && (
          <span className="relative flex h-2 w-2 shrink-0">
            {showPulse && (
              <span
                className={`absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-60 animate-ping`}
              />
            )}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${dotColor}`} />
          </span>
        )}
        {badgeText}
      </span>
    </div>
  );
}
