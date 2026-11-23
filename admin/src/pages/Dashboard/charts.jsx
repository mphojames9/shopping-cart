import React, { useMemo, useState } from 'react';
import { useElementWidth } from '../../utils/hooks';
import { formatCompact, formatDayLong, formatDayShort, formatRand, formatRandWhole } from '../../utils/format';

export const DONUT_COLORS = ['#1E9BD7', '#17A673', '#7C5CFA', '#E08A00', '#E5484D', '#7B8AA0'];

// Smooth curve through the points that never overshoots (monotone cubic interpolation),
// so a quiet day never dips below zero.
export const monotonePath = (points) => {
  const n = points.length;
  if (n === 0) return '';
  if (n === 1) return `M${points[0][0]},${points[0][1]}`;

  const dx = [];
  const slope = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1][0] - points[i][0];
    slope[i] = (points[i + 1][1] - points[i][1]) / dx[i];
  }
  const tangent = [slope[0]];
  for (let i = 1; i < n - 1; i++) {
    tangent[i] = slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2;
  }
  tangent[n - 1] = slope[n - 2];
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      tangent[i] = 0;
      tangent[i + 1] = 0;
    } else {
      const a = tangent[i] / slope[i];
      const b = tangent[i + 1] / slope[i];
      const s = a * a + b * b;
      if (s > 9) {
        const tau = 3 / Math.sqrt(s);
        tangent[i] = tau * a * slope[i];
        tangent[i + 1] = tau * b * slope[i];
      }
    }
  }

  const r = (v) => Math.round(v * 100) / 100;
  let d = `M${r(points[0][0])},${r(points[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const h = dx[i] / 3;
    d += ` C${r(x0 + h)},${r(y0 + tangent[i] * h)} ${r(x1 - h)},${r(y1 - tangent[i + 1] * h)} ${r(x1)},${r(y1)}`;
  }
  return d;
};

// 1, 2, 5 x 10^n step for the y axis
const niceStep = (value) => {
  if (value <= 0) return 25;
  const exp = Math.pow(10, Math.floor(Math.log10(value)));
  const f = value / exp;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * exp;
};

/* ---------- tiny trend line inside a KPI card ---------- */
export const Sparkline = ({ values }) => {
  const { line, area } = useMemo(() => {
    const w = 100;
    const h = 40;
    const pad = 5;
    const max = Math.max(...values, 0);
    const n = values.length;
    const points = values.map((v, i) => [
      n > 1 ? (i / (n - 1)) * w : w / 2,
      h - pad - (max ? (v / max) * (h - pad * 2) : 0),
    ]);
    const path = monotonePath(points);
    return { line: path, area: `${path} L${w},${h} L0,${h} Z` };
  }, [values]);

  return (
    <svg className="spark" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path className="spark-area" d={area} />
      <path className="spark-line" d={line} vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

/* ---------- main revenue chart (current period vs previous) ---------- */
export const RevenueChart = ({ current, previous, days, showPrevious }) => {
  const [wrapRef, width] = useElementWidth();
  const [hover, setHover] = useState(null);

  const compact = width > 0 && width < 520;
  const height = compact ? 230 : 290;
  const padL = compact ? 42 : 54;
  const padR = 14;
  const padT = 16;
  const padB = 30;

  const geo = useMemo(() => {
    if (!width) return null;
    const n = current.length;
    const innerW = width - padL - padR;
    const innerH = height - padT - padB;
    const maxValue = Math.max(...current.map((b) => b.revenue), ...previous.map((b) => b.revenue), 0);
    const step = niceStep(maxValue / 4);
    const yMax = step * 4;
    const x = (i) => padL + (n > 1 ? (i * innerW) / (n - 1) : innerW / 2);
    const y = (v) => padT + innerH - (v / yMax) * innerH;

    const currentPoints = current.map((b, i) => [x(i), y(b.revenue)]);
    const line = monotonePath(currentPoints);
    const baseY = padT + innerH;
    const area = `${line} L${x(n - 1)},${baseY} L${x(0)},${baseY} Z`;
    const previousLine = showPrevious ? monotonePath(previous.map((b, i) => [x(i), y(b.revenue)])) : '';

    const ticks = [0, 1, 2, 3, 4].map((i) => ({ value: step * i, y: y(step * i) }));
    const every = Math.ceil(n / (compact ? 4 : 7));
    const labels = [];
    for (let i = n - 1; i >= 0; i -= every) labels.push(i);

    return { n, innerW, x, y, line, area, previousLine, ticks, labels };
  }, [width, height, padL, current, previous, showPrevious, compact]);

  const onPointer = (event) => {
    if (!geo || geo.n < 2) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const index = Math.round(((event.clientX - rect.left) - padL) / (geo.innerW / (geo.n - 1)));
    setHover(Math.min(geo.n - 1, Math.max(0, index)));
  };

  const total = current.reduce((sum, b) => sum + b.revenue, 0);
  const hovered = geo && hover !== null ? current[hover] : null;
  const hoveredPrev = geo && hover !== null ? previous[hover] : null;

  return (
    <div
      ref={wrapRef}
      className="chart"
      style={{ height }}
      onPointerMove={onPointer}
      onPointerDown={onPointer}
      onPointerLeave={() => setHover(null)}
    >
      {geo &&
        <>
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={`Daily revenue for the last ${days} days, ${formatRandWhole(total)} in total`}
          >
            {geo.ticks.map((tick) => (
              <g key={tick.value}>
                <line className="grid-line" x1={padL} x2={width - padR} y1={tick.y} y2={tick.y} />
                <text className="axis" x={padL - 10} y={tick.y + 4} textAnchor="end">
                  {tick.value === 0 ? 'R0' : `R${formatCompact(tick.value)}`}
                </text>
              </g>
            ))}

            {geo.labels.map((i) => {
              const x = geo.x(i);
              const anchor = x - 24 < 0 ? 'start' : x + 24 > width ? 'end' : 'middle';
              return (
                <text key={i} className="axis" x={x} y={height - 8} textAnchor={anchor}>
                  {formatDayShort(current[i].date)}
                </text>
              );
            })}

            {showPrevious && <path className="chart-prev" d={geo.previousLine} />}

            <g key={days}>
              <path className="chart-area" d={geo.area} />
              <path className="chart-line" d={geo.line} pathLength="1" />
            </g>

            {hovered &&
              <>
                <line className="guide" x1={geo.x(hover)} x2={geo.x(hover)} y1={padT} y2={height - padB} />
                <circle className="chart-dot" cx={geo.x(hover)} cy={geo.y(hovered.revenue)} r="5.5" />
              </>
            }
          </svg>

          {hovered &&
            <div className="tip" style={{ left: Math.min(Math.max(geo.x(hover), 78), width - 78) }}>
              <span className="tip-date">{formatDayLong(hovered.date)}</span>
              <strong>{formatRand(hovered.revenue)}</strong>
              <span>{hovered.orders} {hovered.orders === 1 ? 'order' : 'orders'}</span>
              {showPrevious &&
                <span className="tip-prev">{formatRand(hoveredPrev.revenue)} on {formatDayShort(hoveredPrev.date)}</span>
              }
            </div>
          }
        </>
      }
    </div>
  );
};

/* ---------- revenue by category ---------- */
export const Donut = ({ data, total, active, onActive }) => {
  const R = 54;
  const C = 2 * Math.PI * R;
  let offset = 0;
  const segments = data.map((item, index) => {
    const share = total ? item.revenue / total : 0;
    const length = Math.max(share * C - (data.length > 1 ? 3 : 0), 0.5);
    const segment = { ...item, index, length, offset };
    offset += share * C;
    return segment;
  });
  const focus = active !== null ? data[active] : null;

  return (
    <div className="donut" onPointerLeave={() => onActive(null)}>
      <svg viewBox="0 0 148 148" role="img" aria-label="Revenue by category">
        <circle className="donut-track" cx="74" cy="74" r={R} />
        <g transform="rotate(-90 74 74)">
          {segments.map((segment) => (
            <circle
              key={segment.name}
              className={`donut-seg${active === segment.index ? ' is-active' : ''}`}
              cx="74"
              cy="74"
              r={R}
              stroke={DONUT_COLORS[segment.index % DONUT_COLORS.length]}
              strokeDasharray={`${segment.length} ${C - segment.length}`}
              strokeDashoffset={-segment.offset}
              onPointerEnter={() => onActive(segment.index)}
            />
          ))}
        </g>
      </svg>
      <div className="donut-center">
        {focus ? (
          <>
            <strong>{Math.round((focus.revenue / total) * 100)}%</strong>
            <span>{focus.name}</span>
          </>
        ) : (
          <>
            <strong>R{formatCompact(total)}</strong>
            <span>in sales</span>
          </>
        )}
      </div>
    </div>
  );
};
