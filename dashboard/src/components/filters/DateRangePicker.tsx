import { useState, useRef } from 'react';

interface DateRangePickerProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

const PRESETS = [
  { label: 'Today', days: 0 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

export function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-edge-900/50 border border-edge-800 rounded-lg px-3 py-2 text-sm font-mono text-edge-500 hover:border-edge-800 transition-colors focus:outline-none focus:ring-2 focus:ring-edge-700"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span aria-hidden="true">&#128197;</span>
        {from} &mdash; {to}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 bg-edge-900 border border-edge-800 rounded-xl p-4 shadow-2xl z-50 min-w-[280px]"
          role="dialog"
          aria-label="Date range picker"
        >
          {/* Preset buttons */}
          <div className="flex gap-2 mb-4">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  onChange(p.days === 0 ? today : daysAgo(p.days), today);
                  setOpen(false);
                }}
                className="flex-1 bg-edge-950 border border-edge-800 rounded-lg px-2 py-1.5 text-xs font-mono text-edge-600 hover:text-edge-400 hover:border-edge-700 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom range */}
          <div className="space-y-3">
            <div>
              <label htmlFor="date-from" className="block text-xs font-mono text-edge-700 mb-1">
                From
              </label>
              <input
                id="date-from"
                type="date"
                value={from}
                onChange={(e) => onChange(e.target.value, to)}
                max={to}
                className="w-full bg-edge-950 border border-edge-800 rounded-lg px-3 py-2 text-sm font-mono text-edge-400 focus:outline-none focus:ring-2 focus:ring-edge-700"
              />
            </div>
            <div>
              <label htmlFor="date-to" className="block text-xs font-mono text-edge-700 mb-1">
                To
              </label>
              <input
                id="date-to"
                type="date"
                value={to}
                onChange={(e) => onChange(from, e.target.value)}
                min={from}
                max={today}
                className="w-full bg-edge-950 border border-edge-800 rounded-lg px-3 py-2 text-sm font-mono text-edge-400 focus:outline-none focus:ring-2 focus:ring-edge-700"
              />
            </div>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="w-full mt-3 bg-edge-700 hover:bg-edge-600 text-edge-950 font-mono text-xs py-2 rounded-lg transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
