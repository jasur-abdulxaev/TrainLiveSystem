import React, { useRef, useEffect, useMemo } from 'react';

// ── Route 83 stops with cumulative km from A ─────────────────────────────────
const STOPS = [
  { id: 'S1',  name: 'Вишенка (А)',        km: 0.00 },
  { id: 'S2',  name: 'Стадион',             km: 1.00 },
  { id: 'S3',  name: 'Яна Скрыгана',        km: 1.80 },
  { id: 'S4',  name: 'Свислочская',         km: 2.60 },
  { id: 'S5',  name: 'пос. Монтажник',      km: 3.60 },
  { id: 'S6',  name: 'Ледное',              km: 4.50 },
  { id: 'S7',  name: 'Энергетиков',         km: 5.20 },
  { id: 'S8',  name: 'пл. Свободы',         km: 6.50 },
  { id: 'S9',  name: 'Водоканал',           km: 7.50 },
  { id: 'S10', name: 'Октябрьское депо',    km: 8.70 },
  { id: 'S11', name: 'Петруся Бровки (В)',  km: 9.87 },
];

// Tech speed = 19.87 km/h, stop dwell = 28s = 0.467 min
const V_TECH = 19.87; // km/h
const DWELL  = 28 / 60; // min

// Cumulative minutes from A for each stop (A→B direction)
function buildTimes() {
  const t = [0];
  for (let i = 1; i < STOPS.length; i++) {
    const dist = STOPS[i].km - STOPS[i - 1].km;
    const travel = (dist / V_TECH) * 60; // minutes
    t.push(t[i - 1] + travel + (i < STOPS.length - 1 ? DWELL : 0));
  }
  return t;
}

const T_AB = buildTimes(); // minutes from A to each stop
const T_ONE_WAY = T_AB[T_AB.length - 1]; // ~34 min A→B
const T_WAIT_A  = 4;   // min wait at A
const T_WAIT_B  = 0;   // min wait at B
const T_OB      = Math.round(T_ONE_WAY * 2 + T_WAIT_A + T_WAIT_B); // ~72 min

// MAZ-303 constants
const Q_H          = 71;
const GAMMA        = 1.0;
const I_MAX_DAY    = 15;
const I_MAX_NIGHT  = 25;

function calcBuses(flow, hour) {
  const iMax = hour >= 21 ? I_MAX_NIGHT : I_MAX_DAY;
  const Ai   = Math.floor((flow * T_OB) / (Q_H * GAMMA * 60) + 0.89);
  const Amin = Math.floor(T_OB / iMax + 0.84);
  return Math.max(Ai, Amin, 1);
}

// Weekend buses (выпуски 71-74) — zero run ≈15 min, so add 15 to depot departure
const WEEKEND_BUSES = [
  { id: '71', color: '#f472b6', depotDep: 4*60+38, shiftChange: 14*60+41, depotRet: 21*60+51, trips1: 10, trips2: 7,  lunch1: 53, lunch2: 41 },
  { id: '72', color: '#a78bfa', depotDep: 4*60+58, shiftChange: 14*60+54, depotRet: 24*60+56, trips1: 10, trips2: 10, lunch1: 52, lunch2: 61 },
  { id: '73', color: '#34d399', depotDep: 8*60+13, shiftChange: 15*60+7,  depotRet: 25*60+17, trips1:  7, trips2: 10, lunch1: 28, lunch2: 62 },
  { id: '74', color: '#fbbf24', depotDep: 5*60+17, shiftChange: 15*60+20, depotRet: 22*60+30, trips1: 10, trips2: 7,  lunch1: 56, lunch2: 42 },
];

const ZERO_RUN_TIME = 15; // minutes from depot D to station A

// Generate trip points for one bus on the schedule graph
// Returns array of {t, km} for the full day path
function generateBusPath(firstDepFromA) {
  const points = [];
  let t = firstDepFromA;

  while (t < 24 * 60) {
    // A → B
    for (let i = 0; i < STOPS.length; i++) {
      points.push({ t: t + T_AB[i], km: STOPS[i].km });
    }
    t += T_ONE_WAY + T_WAIT_B;

    // B → A
    for (let i = STOPS.length - 1; i >= 0; i--) {
      points.push({ t: t + (T_ONE_WAY - T_AB[i]), km: STOPS[i].km });
    }
    t += T_ONE_WAY + T_WAIT_A;
  }
  return points;
}

// Generate all trip lines from flow schedule (weekday)
function generateFlowTrips(flows) {
  const trips = []; // each trip: [{t, km}]

  flows.forEach((f, idx) => {
    const hour   = 6 + idx;
    const buses  = calcBuses(f.count, hour);
    const interval = T_OB / buses;

    for (let b = 0; b < buses; b++) {
      const depA = hour * 60 + b * interval;
      if (depA >= 24 * 60) return;

      // A→B trip
      const abPts = STOPS.map((s, i) => ({ t: depA + T_AB[i], km: s.km }));
      trips.push({ pts: abPts, dir: 'AB' });

      // Corresponding B→A return
      const retStart = depA + T_ONE_WAY + T_WAIT_B;
      if (retStart < 24 * 60) {
        const baPts = STOPS.map((s, i) => ({
          t: retStart + (T_ONE_WAY - T_AB[i]),
          km: s.km,
        })).reverse();
        trips.push({ pts: baPts, dir: 'BA' });
      }
    }
  });

  return trips;
}

// Generate weekend bus paths
function generateWeekendTrips() {
  return WEEKEND_BUSES.flatMap(bus => {
    const firstDep = bus.depotDep + ZERO_RUN_TIME + T_WAIT_A;
    const paths = [];
    let t = firstDep;

    // Shift 1 trips
    for (let i = 0; i < bus.trips1 && t < bus.shiftChange; i++) {
      const abPts = STOPS.map((s, si) => ({ t: t + T_AB[si], km: s.km }));
      paths.push({ pts: abPts, dir: 'AB', color: bus.color, busId: bus.id });
      t += T_ONE_WAY + T_WAIT_B;
      const baPts = STOPS.map((s, i) => ({
        t: t + (T_ONE_WAY - T_AB[i]), km: s.km,
      })).reverse();
      paths.push({ pts: baPts, dir: 'BA', color: bus.color, busId: bus.id });
      t += T_ONE_WAY + T_WAIT_A;
    }

    // Lunch break
    t += bus.lunch1;

    // Shift 2 trips
    for (let i = 0; i < bus.trips2 && t < bus.depotRet; i++) {
      const abPts = STOPS.map((s, si) => ({ t: t + T_AB[si], km: s.km }));
      paths.push({ pts: abPts, dir: 'AB', color: bus.color, busId: bus.id });
      t += T_ONE_WAY + T_WAIT_B;
      const baPts = [...STOPS].reverse().map((s, si) => ({ t: t + T_AB[si], km: s.km }));
      paths.push({ pts: baPts, dir: 'BA', color: bus.color, busId: bus.id });
      t += T_ONE_WAY + T_WAIT_A;
    }

    return paths;
  });
}

// ── Component ────────────────────────────────────────────────────────────────
export default function GrafikDvizheniya({ flows, timeMinutes, mode = 'weekday' }) {
  const containerRef = useRef(null);

  // Layout constants
  const LABEL_W   = 150; // left label column width
  const PAD_TOP   = 20;
  const PAD_BOT   = 40;
  const PAD_RIGHT = 20;
  const H_PER_KM  = 44;  // px per km
  const MIN_START = 6 * 60;   // 06:00
  const MIN_END   = 24 * 60;  // 24:00
  const PX_PER_MIN = 1.6;     // 1.6px per minute → total 1728px

  const totalW = (MIN_END - MIN_START) * PX_PER_MIN + PAD_RIGHT;
  const totalH = STOPS[STOPS.length - 1].km * H_PER_KM + PAD_TOP + PAD_BOT;

  // Convert minute & km to SVG coords
  const tx = (t)  => (t - MIN_START) * PX_PER_MIN;
  const ty = (km) => PAD_TOP + km * H_PER_KM;

  // Generate trips
  const trips = useMemo(() => {
    if (mode === 'weekend') return generateWeekendTrips();
    return generateFlowTrips(flows);
  }, [flows, mode]);

  // Hour grid marks
  const hours = Array.from({ length: 19 }, (_, i) => 6 + i);

  // Scroll to current time on mount
  useEffect(() => {
    if (containerRef.current && timeMinutes > MIN_START) {
      const scrollX = Math.max(0, tx(timeMinutes) - 300);
      containerRef.current.scrollLeft = scrollX;
    }
  }, []); // eslint-disable-line

  const nowX = tx(timeMinutes);

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse inline-block" />
          График движения — Маршрут 83
        </h3>
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-6 h-0.5 inline-block" style={{ background: '#3b82f6' }} /> A→B
          </span>
          <span className="flex items-center gap-1">
            <span className="w-6 h-0.5 inline-block" style={{ background: '#f59e0b' }} /> B→A
          </span>
          <span className="flex items-center gap-1">
            <span className="w-0.5 h-3 inline-block" style={{ background: '#22d3ee' }} /> Hozir
          </span>
          <span className="font-bold text-slate-400">T_об = {T_OB} min · V = {V_TECH} km/h</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="overflow-x-auto custom-scrollbar"
        style={{ maxHeight: totalH + 20 }}
      >
        <div style={{ display: 'flex', width: LABEL_W + totalW }}>
          {/* Stop labels */}
          <div
            style={{
              width: LABEL_W,
              minWidth: LABEL_W,
              paddingTop: PAD_TOP,
              position: 'sticky',
              left: 0,
              zIndex: 10,
              background: '#0f172a',
            }}
          >
            {STOPS.map((s) => (
              <div
                key={s.id}
                style={{
                  position: 'absolute',
                  top: PAD_TOP + s.km * H_PER_KM - 8,
                  right: 8,
                  textAlign: 'right',
                }}
              >
                <span className="text-[9px] font-bold text-blue-300 block leading-none">{s.id}</span>
                <span className="text-[8px] text-slate-500 leading-none">{s.name}</span>
              </div>
            ))}
          </div>

          {/* SVG graph */}
          <svg width={totalW} height={totalH} style={{ display: 'block', flexShrink: 0 }}>
            {/* Hour grid lines */}
            {hours.map(h => {
              const x = tx(h * 60);
              return (
                <g key={h}>
                  <line x1={x} y1={PAD_TOP} x2={x} y2={totalH - PAD_BOT}
                    stroke="#1e293b" strokeWidth={h % 2 === 0 ? 1.5 : 0.8} />
                  <text x={x + 3} y={totalH - PAD_BOT + 14} fontSize={9}
                    fill="#475569" fontFamily="monospace">
                    {String(h).padStart(2,'0')}:00
                  </text>
                </g>
              );
            })}

            {/* Stop horizontal lines */}
            {STOPS.map((s) => {
              const y = ty(s.km);
              const isTerminal = s.id === 'S1' || s.id === 'S11';
              return (
                <line key={s.id}
                  x1={0} y1={y} x2={totalW} y2={y}
                  stroke={isTerminal ? '#334155' : '#1e293b'}
                  strokeWidth={isTerminal ? 1.5 : 0.7}
                  strokeDasharray={isTerminal ? 'none' : '4,4'}
                />
              );
            })}

            {/* Peak hour shading (07-09, 17-19) */}
            {[[7,9],[17,19]].map(([s,e]) => (
              <rect key={s}
                x={tx(s*60)} y={PAD_TOP}
                width={(e-s)*60*PX_PER_MIN}
                height={totalH - PAD_TOP - PAD_BOT}
                fill="rgba(245,158,11,0.04)"
              />
            ))}

            {/* Trip lines */}
            {trips.map((trip, ti) => {
              const pts = trip.pts.filter(p => p.t >= MIN_START && p.t <= MIN_END + 60);
              if (pts.length < 2) return null;
              const d = pts.map((p, i) => `${i===0?'M':'L'}${tx(p.t).toFixed(1)},${ty(p.km).toFixed(1)}`).join(' ');
              const color = trip.color
                ? trip.color
                : trip.dir === 'AB' ? 'rgba(59,130,246,0.55)' : 'rgba(245,158,11,0.45)';
              return (
                <path key={ti} d={d} fill="none"
                  stroke={color}
                  strokeWidth={trip.color ? 1.8 : 0.9}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}

            {/* Current time vertical line */}
            {timeMinutes >= MIN_START && timeMinutes <= MIN_END && (
              <g>
                <line x1={nowX} y1={PAD_TOP} x2={nowX} y2={totalH - PAD_BOT}
                  stroke="#22d3ee" strokeWidth={1.5} strokeDasharray="4,3" opacity={0.9} />
                <rect x={nowX - 20} y={PAD_TOP - 16} width={40} height={14} rx={3}
                  fill="#22d3ee" opacity={0.9} />
                <text x={nowX} y={PAD_TOP - 5} textAnchor="middle"
                  fontSize={8} fill="#000" fontFamily="monospace" fontWeight="bold">
                  {String(Math.floor(timeMinutes/60)).padStart(2,'0')}:{String(Math.floor(timeMinutes%60)).padStart(2,'0')}
                </text>
              </g>
            )}

            {/* Km axis labels on right */}
            {STOPS.map(s => (
              <text key={s.id+'km'}
                x={totalW - PAD_RIGHT}
                y={ty(s.km) + 4}
                textAnchor="end"
                fontSize={8}
                fill="#334155"
                fontFamily="monospace"
              >
                {s.km.toFixed(2)}
              </text>
            ))}
          </svg>
        </div>
      </div>

      {/* Footer info */}
      <div className="mt-3 flex flex-wrap gap-4 text-[9px] text-slate-600 font-mono border-t border-slate-800 pt-3">
        <span>T_об = {T_OB} мин</span>
        <span>T_A→B = {T_ONE_WAY.toFixed(1)} мин</span>
        <span>Стоянка = {(DWELL*60).toFixed(0)} с</span>
        <span>V_тех = {V_TECH} км/ч</span>
        <span>L = {STOPS[STOPS.length-1].km} км</span>
        {mode === 'weekend' && (
          <span className="text-amber-500">Выходной — Выпуски 71·72·73·74</span>
        )}
      </div>
    </div>
  );
}
