"use client";

import { useState } from "react";

const bars = [
  { day: "Mon", exercises: 18, height: 28, spent: "2h 05m" },
  { day: "Tue", exercises: 25, height: 56, spent: "3h 42m" },
  { day: "Wed", exercises: 11, height: 22, spent: "1h 10m" },
  { day: "Thu", exercises: 19, height: 36, spent: "2h 18m" },
  { day: "Fri", exercises: 24, height: 48, spent: "2h 54m" },
  { day: "Sat", exercises: 7, height: 12, spent: "36m" },
  { day: "Sun", exercises: 21, height: 38, spent: "1h 51m" },
];

export function ActivityBars() {
  const [activeIndex, setActiveIndex] = useState(1);
  const active = bars[activeIndex] ?? bars[1];

  return (
    <div className="space-y-5" aria-label="Weekly activity">
      <div className="grid h-[86px] grid-cols-7 items-end gap-3">
        {bars.map((bar, index) => {
          const activeBar = index === activeIndex;

          return (
            <button
              key={bar.day}
              type="button"
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              className="group relative flex h-full items-end justify-center rounded-[var(--radius-sm)] outline-none"
              aria-label={`${bar.day}: ${bar.exercises} exercises, ${bar.spent} spent`}
            >
              {activeBar ? (
                <span className="absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-[7px] bg-[var(--text)] px-3 py-2 text-[12px] font-medium text-[var(--accent-ink)]">
                  {bar.exercises} exercises · {bar.day}
                  <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[var(--text)]" />
                </span>
              ) : null}
              <span
                className={`block w-full rounded-[3px] transition-all duration-[900ms] ease-[var(--ease-signature)] ${
                  activeBar ? "bg-[var(--accent)]" : "bg-[var(--bg-soft)] group-hover:bg-[var(--bg-elev-2)]"
                }`}
                style={{ height: `${bar.height}px` }}
              />
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-7 gap-3 text-center text-[12px] text-[var(--text-faint)]">
        {bars.map((bar, index) => (
          <button
            key={bar.day}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`transition-colors duration-200 ${
              index === activeIndex ? "text-[var(--text)]" : "hover:text-[var(--text-dim)]"
            }`}
          >
            {bar.day}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 text-[13px] text-[var(--text-dim)]">
        <div>
          <p className="text-[var(--text)] [font-feature-settings:'tnum','ss01'] [font-variant-numeric:tabular-nums]">
            {active.exercises} exercises
          </p>
        </div>
        <div>
          <p className="text-[var(--text)] [font-feature-settings:'tnum','ss01'] [font-variant-numeric:tabular-nums]">
            {active.spent} spent
          </p>
        </div>
        <div>
          <p className="text-[var(--text)]">+14% vs last week</p>
        </div>
      </div>
    </div>
  );
}
