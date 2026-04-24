// frontend/src/components/Stats/SolveHeatmap.jsx
//
// A GitHub-style contribution heatmap showing solve activity.
// Each cell = one day. Color intensity = number of problems solved.
// Shows the last 26 weeks (6 months).

export default function SolveHeatmap({ progression }) {
  if (!progression?.recentEvents) return null;

  // Build a map of date → solve count from recentEvents
  const countByDate = {};
  for (const event of progression.recentEvents) {
    if (event.type !== 'solve') continue;
    const date = new Date(event.ts).toISOString().slice(0, 10);
    countByDate[date] = (countByDate[date] ?? 0) + 1;
  }

  // Generate the last 26 weeks of days
  const today    = new Date();
  const WEEKS    = 26;
  const DAYS     = WEEKS * 7;

  // Start from Sunday of the week 26 weeks ago
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - DAYS + 1);
  // Align to Sunday
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const cells = [];
  for (let i = 0; i < WEEKS * 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const key   = d.toISOString().slice(0, 10);
    const count = countByDate[key] ?? 0;
    cells.push({ date: key, count, future: d > today });
  }

  // Group into weeks (columns)
  const weeks = [];
  for (let w = 0; w < WEEKS; w++) {
    weeks.push(cells.slice(w * 7, w * 7 + 7));
  }

  // Color intensity: 0 = empty, 1-2 = light, 3-4 = mid, 5+ = full
  function cellColor(count, future) {
    if (future) return 'transparent';
    if (count === 0) return '#1a1826';
    if (count <= 1)  return '#3b1d6e';
    if (count <= 2)  return '#5b2d9e';
    if (count <= 4)  return '#7c3aed';
    return '#a78bfa';
  }

  const CELL_SIZE = 11;
  const GAP       = 2;
  const DOW_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  // Month labels: track where month changes in the week columns
  const monthLabels = [];
  weeks.forEach((week, wi) => {
    const firstDay = week.find(c => !c.future);
    if (!firstDay) return;
    const d     = new Date(firstDay.date);
    const month = d.toLocaleString('default', { month: 'short' });
    const prevWeek = weeks[wi - 1];
    if (!prevWeek) { monthLabels.push({ wi, label: month }); return; }
    const prevFirst = prevWeek.find(c => !c.future);
    if (!prevFirst) return;
    const prevMonth = new Date(prevFirst.date).toLocaleString('default', { month: 'short' });
    if (month !== prevMonth) monthLabels.push({ wi, label: month });
  });

  const SVG_W = WEEKS * (CELL_SIZE + GAP) + 28;
  const SVG_H = 7  * (CELL_SIZE + GAP) + 28;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="pixel text-xs text-slate-500">Solve Activity</p>
        <p className="text-xs text-slate-700">Last 6 months</p>
      </div>

      <div className="overflow-x-auto">
        <svg
          width={SVG_W}
          height={SVG_H}
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {/* Day-of-week labels */}
          {DOW_LABELS.map((label, di) => (
            label ? (
              <text
                key={di}
                x={0}
                y={20 + di * (CELL_SIZE + GAP) + CELL_SIZE / 2}
                fontSize={9}
                fill="#475569"
                dominantBaseline="middle"
              >
                {label}
              </text>
            ) : null
          ))}

          {/* Month labels */}
          {monthLabels.map(({ wi, label }) => (
            <text
              key={`m-${wi}`}
              x={28 + wi * (CELL_SIZE + GAP)}
              y={10}
              fontSize={9}
              fill="#475569"
            >
              {label}
            </text>
          ))}

          {/* Cells */}
          {weeks.map((week, wi) =>
            week.map((cell, di) => (
              <rect
                key={cell.date}
                x={28 + wi * (CELL_SIZE + GAP)}
                y={18 + di * (CELL_SIZE + GAP)}
                width={CELL_SIZE}
                height={CELL_SIZE}
                rx={2}
                fill={cellColor(cell.count, cell.future)}
                opacity={cell.future ? 0 : 1}
              >
                <title>{cell.date}: {cell.count} solved</title>
              </rect>
            ))
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-1 justify-end">
        <span className="text-xs text-slate-700">Less</span>
        {['#1a1826', '#3b1d6e', '#5b2d9e', '#7c3aed', '#a78bfa'].map(c => (
          <div key={c} style={{ width: 10, height: 10, background: c, borderRadius: 2 }} />
        ))}
        <span className="text-xs text-slate-700">More</span>
      </div>
    </div>
  );
}