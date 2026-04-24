const defaultBars = [18, 28, 22, 36, 40, 30, 44]

export function ActivityBars({ bars = defaultBars }: { bars?: number[] }) {
  return (
    <div className="grid grid-cols-7 items-end gap-2" aria-hidden="true">
      {bars.map((value, index) => (
        <div
          key={`${value}-${index}`}
          className="flex h-14 items-end rounded-[var(--radius-sm)] bg-[var(--bg-soft)] p-1"
        >
          <span
            className="block w-full rounded-[var(--radius-sm)] bg-[var(--accent)] animate-rise-in"
            style={{ height: `${value}px`, animationDelay: `${index * 60}ms` }}
          />
        </div>
      ))}
    </div>
  )
}
