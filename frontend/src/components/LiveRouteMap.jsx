import React, { useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';

const MAP_STOPS = [
  { id: '1',  name: 'Вишенка',           km: 0.00, x: 120, y: 150, align: 'right' },
  { id: '2',  name: 'Стадион',           km: 1.00, x: 120, y: 220, align: 'left' },
  { id: '3',  name: 'Яна Скрыгана',      km: 1.80, x: 160, y: 240, align: 'right' },
  { id: '4',  name: 'Свислочская',       km: 2.60, x: 160, y: 320, align: 'left' },
  { id: '5',  name: 'посёлок Монтажник', km: 3.60, x: 240, y: 400, align: 'right' },
  { id: '6',  name: 'Ледное',            km: 4.50, x: 300, y: 460, align: 'left' },
  { id: '7',  name: 'Энергетиков',       km: 5.20, x: 320, y: 530, align: 'right' },
  { id: '8',  name: 'пл. Свободы',       km: 6.50, x: 320, y: 590, align: 'left' },
  { id: '9',  name: 'Водоканал',         km: 7.50, x: 360, y: 640, align: 'right' },
  { id: '10', name: 'Октябрьское депо',  km: 8.70, x: 360, y: 700, align: 'left' },
  { id: '11', name: 'Петруся Бровки',    km: 9.87, x: 360, y: 760, align: 'right' },
];

const DEPOT_STOPS = [
  { id: '15', name: 'Индустриальная',    x: 190, y: 210, align: 'right' },
  { id: '14', name: 'Кинотеатр "Салют"', x: 230, y: 170, align: 'right' },
  { id: '13', name: 'Великий Бор',       x: 270, y: 130, align: 'right' },
  { id: '12', name: 'Полярная',          x: 300, y: 100, align: 'right' },
];

const V_TECH    = 19.87;
const DWELL     = 28 / 60;
const T_WAIT_A  = 4;
const T_WAIT_B  = 0;
const Q_H       = 71;
const Q_PEAK    = 100;
const GAMMA     = 1.0;
const I_MAX_DAY   = 15;
const I_MAX_NIGHT = 25;

function buildTAB() {
  const t = [0];
  for (let i = 1; i < MAP_STOPS.length; i++) {
    const d = MAP_STOPS[i].km - MAP_STOPS[i-1].km;
    t.push(t[i-1] + (d/V_TECH)*60 + (i < MAP_STOPS.length-1 ? DWELL : 0));
  }
  return t;
}
const T_AB      = buildTAB();
const T_ONE_WAY = T_AB[T_AB.length - 1];
const T_OB      = Math.round(T_ONE_WAY * 2 + T_WAIT_A + T_WAIT_B);
const TOTAL_KM  = MAP_STOPS[MAP_STOPS.length-1].km;

function calcBuses(flow, hour) {
  if (!flow || flow <= 0) return Math.floor(T_OB / I_MAX_DAY + 0.84);
  const iMax = hour >= 21 ? I_MAX_NIGHT : I_MAX_DAY;
  const Ai   = Math.floor((flow * T_OB) / (Q_H * GAMMA * 60) + 0.89);
  const Amin = Math.floor(T_OB / iMax + 0.84);
  return Math.max(Ai, Amin, 1);
}

function isPeak(h) { return (h >= 7 && h <= 9) || (h >= 17 && h <= 19); }

function kmAtTime(t) {
  if (t <= 0) return 0;
  if (t >= T_ONE_WAY) return TOTAL_KM;
  for (let i = 0; i < MAP_STOPS.length-1; i++) {
    if (t >= T_AB[i] && t < T_AB[i+1]) {
      const f = (t - T_AB[i]) / (T_AB[i+1] - T_AB[i]);
      return MAP_STOPS[i].km + f*(MAP_STOPS[i+1].km - MAP_STOPS[i].km);
    }
  }
  return TOTAL_KM;
}

function busState(phase, flow) {
  const p = ((phase % T_OB) + T_OB) % T_OB;
  const capacity = isPeak(0) ? Q_PEAK : Q_H;
  const load = flow > 0 ? Math.min(flow / capacity, 1) : 0.4;

  if (p < T_ONE_WAY) {
    return { km: kmAtTime(p), dir: 'AB', load };
  } else if (p < T_ONE_WAY + T_WAIT_B) {
    return { km: TOTAL_KM, dir: 'AB', load: load * 0.1 };
  } else if (p < 2*T_ONE_WAY + T_WAIT_B) {
    const t = p - T_ONE_WAY - T_WAIT_B;
    return { km: kmAtTime(T_ONE_WAY - t), dir: 'BA', load: load * 0.6 };
  } else {
    return { km: 0, dir: 'BA', load: 0 };
  }
}

function getCoords(km, dir) {
  if (km <= 0) return { x: MAP_STOPS[0].x, y: MAP_STOPS[0].y, angle: 0 };
  if (km >= TOTAL_KM) return { x: MAP_STOPS[MAP_STOPS.length-1].x, y: MAP_STOPS[MAP_STOPS.length-1].y, angle: 0 };
  for (let i = 0; i < MAP_STOPS.length - 1; i++) {
    if (km >= MAP_STOPS[i].km && km <= MAP_STOPS[i+1].km) {
      const f = (km - MAP_STOPS[i].km) / (MAP_STOPS[i+1].km - MAP_STOPS[i].km);
      let x = MAP_STOPS[i].x + f * (MAP_STOPS[i+1].x - MAP_STOPS[i].x);
      let y = MAP_STOPS[i].y + f * (MAP_STOPS[i+1].y - MAP_STOPS[i].y);
      const dx = MAP_STOPS[i+1].x - MAP_STOPS[i].x;
      const dy = MAP_STOPS[i+1].y - MAP_STOPS[i].y;
      const len = Math.hypot(dx, dy);
      const nx = -dy / len;
      const ny = dx / len;
      const offset = dir === 'AB' ? -5 : 5;
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      return { 
        x: x + nx * offset, 
        y: y + ny * offset, 
        angle: dir === 'AB' ? angle : angle + 180 
      };
    }
  }
  return { x: MAP_STOPS[MAP_STOPS.length-1].x, y: MAP_STOPS[MAP_STOPS.length-1].y, angle: 0 };
}

export default function LiveRouteMap({ flows, timeMinutes }) {
  const { t } = useLanguage();
  const W = 500, H = 850;
  
  const hour = Math.floor(timeMinutes / 60);
  const flowEntry = useMemo(() => flows.find((_, i) => 6 + i === hour), [flows, hour]);
  const flow    = flowEntry?.count ?? 0;
  const N       = useMemo(() => calcBuses(flow, hour), [flow, hour]);
  const peak    = isPeak(hour);
  const interval = T_OB / N;
  const capacity = peak ? Q_PEAK : Q_H;
  const loadPct  = flow > 0 ? Math.min((flow / N / capacity) * 100, 100) : 35;

  const buses = useMemo(() => {
    return Array.from({ length: N }, (_, k) => {
      const phase = (timeMinutes + k * interval) % T_OB;
      return { id: k+1, ...busState(phase, flow / N) };
    });
  }, [N, timeMinutes, flow, interval]);

  const abBuses = buses.filter(b => b.dir === 'AB');
  const baBuses = buses.filter(b => b.dir === 'BA');

  const CityStreets = () => (
    <g stroke="#0f172a" strokeWidth="1.5" fill="none" opacity="0.8">
      {/* Random high-tech city grid lines */}
      <path d="M -50 150 L 150 100 L 250 250 L 550 200" />
      <path d="M 50 -50 L 100 300 L 300 450 L 350 850" />
      <path d="M -50 350 L 200 400 L 300 600 L 550 550" />
      <path d="M 150 850 L 250 650 L 450 650 L 550 750" />
      <path d="M 200 -50 L 250 200 L 400 350 L 550 300" stroke="#1e293b" strokeWidth="2" />
      <path d="M -50 550 L 150 500 L 250 650 L 300 850" stroke="#1e293b" strokeWidth="2" />
      <path d="M 350 -50 L 300 250 L 450 500 L 550 600" />
      <path d="M 50 850 L 100 650 L -50 500" />
      {/* Some subtle radar circles in the background */}
      <circle cx="250" cy="400" r="150" stroke="#1e293b" strokeDasharray="5,15" strokeWidth="1" />
      <circle cx="100" cy="200" r="80" stroke="#1e293b" strokeDasharray="2,8" strokeWidth="0.5" />
      <circle cx="400" cy="650" r="120" stroke="#1e293b" strokeDasharray="10,20" strokeWidth="1" />
    </g>
  );

  return (
    <div className="bg-[#020617] rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col font-mono" style={{ color: '#cbd5e1' }}>
      
      {/* HUD Headers */}
      <div className="absolute top-0 left-0 w-full p-5 flex justify-between items-start pointer-events-none z-10">
        <div>
          <div className="text-[#00f6ff] text-xs font-black tracking-widest flex items-center gap-2">
            {t.mapNav}
            <div className="flex gap-1">
              <span className="w-1 h-1 bg-[#00f6ff]"></span>
              <span className="w-1 h-1 bg-[#00f6ff] opacity-50"></span>
              <span className="w-1 h-1 bg-[#00f6ff] opacity-20"></span>
            </div>
          </div>
          <div className="mt-2 text-slate-500 text-[9px] uppercase tracking-widest">{t.sysStatus}</div>
        </div>
        <div className="flex gap-6 text-[9px] uppercase tracking-widest text-right">
          <div>
            <div className="text-slate-500 mb-0.5">{t.location}</div>
            <div className="text-[#00f6ff] font-bold">53.9006° N</div>
          </div>
          <div>
            <div className="text-slate-500 mb-0.5">{t.destination}</div>
            <div className="text-[#00f6ff] font-bold">27.5590° E</div>
          </div>
        </div>
      </div>

      <div className="w-full flex justify-center items-center py-8">
        <svg width="100%" height="550" viewBox={`0 0 ${W} ${H}`} style={{ background: 'transparent', maxWidth: '450px' }}>
          <defs>
            <filter id="glow-route" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-bus-ab">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodColor="#00f6ff" />
              <feComposite in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-bus-ba">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodColor="#f59e0b" />
              <feComposite in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Map Grid */}
          <CityStreets />

          {/* Subtle connections / tracking lines */}
          <g stroke="#b45309" strokeWidth="0.5" strokeDasharray="4,6" opacity="0.4">
            <line x1={MAP_STOPS[0].x} y1={MAP_STOPS[0].y} x2={MAP_STOPS[4].x} y2={MAP_STOPS[4].y} />
            <line x1={MAP_STOPS[4].x} y1={MAP_STOPS[4].y} x2={MAP_STOPS[10].x} y2={MAP_STOPS[10].y} />
          </g>

          {/* Main Route Line */}
          <polyline
            points={MAP_STOPS.map(s => `${s.x},${s.y}`).join(' ')}
            fill="none" stroke="#ffffff" strokeWidth="4"
            filter="url(#glow-route)"
          />

          {/* Route Distance Text */}
          <text x={MAP_STOPS[5].x + 40} y={MAP_STOPS[5].y - 10} fill="#00f6ff" fontSize="14" fontWeight="bold">
            12.5 km
          </text>

          {/* Depot Nodes */}
          {DEPOT_STOPS.map(s => (
            <g key={s.id}>
              <circle cx={s.x} cy={s.y} r={4} fill="#020617" stroke="#475569" strokeWidth="2" />
              <text 
                x={s.align === 'right' ? s.x + 10 : s.x - 10} 
                y={s.y + 3} 
                textAnchor={s.align === 'right' ? "start" : "end"} 
                fill="#64748b" 
                fontSize={9} 
                fontWeight="normal" 
                fontFamily="sans-serif"
              >
                {s.name}
              </text>
            </g>
          ))}

          {/* Normal Stop Nodes */}
          {MAP_STOPS.slice(1, -1).map(s => (
            <g key={s.id}>
              <circle cx={s.x} cy={s.y} r={4} fill="#020617" stroke="#ffffff" strokeWidth="2" />
              <text 
                x={s.align === 'right' ? s.x + 10 : s.x - 10} 
                y={s.y + 3} 
                textAnchor={s.align === 'right' ? "start" : "end"} 
                fill="#94a3b8" 
                fontSize={10} 
                fontWeight="normal" 
                fontFamily="sans-serif"
              >
                {s.name}
              </text>
            </g>
          ))}

          {/* Start Point (A) - Location Pin */}
          <g transform={`translate(${MAP_STOPS[0].x}, ${MAP_STOPS[0].y})`}>
            {/* Pulsing rings */}
            <circle r="25" stroke="#00f6ff" strokeWidth="1" fill="none">
              <animate attributeName="r" values="5;25" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle r="12" stroke="#00f6ff" strokeWidth="1.5" fill="none" opacity="0.6" />
            {/* Pin Icon */}
            <path d="M0 -24 C -8 -24, -14 -18, -14 -10 C -14 0, 0 10, 0 10 C 0 10, 14 0, 14 -10 C 14 -18, 8 -24, 0 -24 Z" fill="#00f6ff" />
            <circle cx="0" cy="-11" r="4" fill="#020617" />
            <text x="20" y="5" fill="#00f6ff" fontSize="11" fontWeight="bold">Вишенка (A)</text>
          </g>

          {/* End Point (B) - Radar Arrow */}
          <g transform={`translate(${MAP_STOPS[10].x}, ${MAP_STOPS[10].y})`}>
            {/* Radar dashed ring */}
            <circle r="35" stroke="#00f6ff" strokeWidth="1" strokeDasharray="4,6" fill="none">
               <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="10s" repeatCount="indefinite" />
            </circle>
            <circle r="25" stroke="#00f6ff" strokeWidth="0.5" fill="none" opacity="0.5" />
            {/* Target Arrow */}
            <polygon points="-8,-8 12,0 -8,8 -4,0" fill="#00f6ff" transform="rotate(90)" />
            {/* Central tracking dot */}
            <circle r="3" fill="#ffffff" />
            <text x="30" y="5" fill="#00f6ff" fontSize="11" fontWeight="bold">Петруся Бровки (B)</text>
          </g>

          {/* Live Buses A->B */}
          {abBuses.map(b => {
            const p = getCoords(b.km, b.dir);
            return (
              <g key={`ab-${b.id}`} transform={`translate(${p.x}, ${p.y}) rotate(${p.angle})`}>
                <polygon points="-12,-8 14,0 -12,8 -6,0" fill="#ffffff" filter="url(#glow-bus-ab)" />
                <text transform="rotate(-90)" x="0" y="-14" textAnchor="middle" fontSize="12" fill="#00f6ff" fontWeight="bold">
                  {b.id}
                </text>
              </g>
            );
          })}

          {/* Live Buses B->A */}
          {baBuses.map(b => {
            const p = getCoords(b.km, b.dir);
            return (
              <g key={`ba-${b.id}`} transform={`translate(${p.x}, ${p.y}) rotate(${p.angle})`}>
                <polygon points="-12,-8 14,0 -12,8 -6,0" fill="#fcd34d" filter="url(#glow-bus-ba)" />
                <text transform="rotate(-90)" x="0" y="20" textAnchor="middle" fontSize="12" fill="#fcd34d" fontWeight="bold">
                  {b.id}
                </text>
              </g>
            );
          })}

        </svg>
      </div>
      
      {/* Bottom Status Bar */}
      <div className="flex justify-between items-center p-4 bg-[#020617] border-t border-slate-800 rounded-b-xl z-10 relative">
         <div className="flex gap-6">
           <div className="flex items-center gap-2 text-[10px] text-slate-300 uppercase tracking-widest">
             <span className="w-2 h-2 rounded-sm bg-[#00f6ff] shadow-[0_0_8px_#00f6ff]"></span> 
             {t.targetAB} <span className="text-[#00f6ff] font-bold">[{abBuses.length}]</span>
           </div>
           <div className="flex items-center gap-2 text-[10px] text-slate-300 uppercase tracking-widest">
             <span className="w-2 h-2 rounded-sm bg-[#fcd34d] shadow-[0_0_8px_#fcd34d]"></span> 
             {t.returnBA} <span className="text-[#fcd34d] font-bold">[{baBuses.length}]</span>
           </div>
         </div>
         <div className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-3">
            <span>{t.volume}: <strong className="text-white">{flow} {t.unitPassH}</strong></span>
            <span className="w-px h-3 bg-slate-700"></span>
            <span>{t.units}: <strong className="text-white">{N}</strong></span>
         </div>
      </div>
    </div>
  );
}
