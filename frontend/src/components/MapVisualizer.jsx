import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const STATIONS = [
  { id: 'S1', name: 'Вишенка', type: 'main', x: 50, y: 150 },
  { id: 'S2', name: 'Стадион', type: 'main', x: 50, y: 230 },
  { id: 'S3', name: 'Яна Скрыгана', type: 'main', x: 100, y: 240 },
  { id: 'S4', name: 'Свислочская', type: 'main', x: 100, y: 330 },
  { id: 'S5', name: 'посёлок Монтажник', type: 'main', x: 170, y: 390 },
  { id: 'S6', name: 'Ледное', type: 'main', x: 250, y: 450 },
  { id: 'S7', name: 'Энергетиков', type: 'main', x: 260, y: 490 },
  { id: 'S8', name: 'пл. Свободы', type: 'main', x: 260, y: 560 },
  { id: 'S9', name: 'Водоканал', type: 'main', x: 310, y: 600 },
  { id: 'S10', name: 'Октябрьское депо', type: 'main', x: 310, y: 650 },
  { id: 'S11', name: 'Петруся Бровки', type: 'main', x: 310, y: 680 },
  
  { id: 'S12', name: 'Полярная', type: 'depot', x: 250, y: 110 },
  { id: 'S13', name: 'Великий Бор', type: 'depot', x: 230, y: 140 },
  { id: 'S14', name: 'Кинотеатр "Салют"', type: 'depot', x: 190, y: 190 },
  { id: 'S15', name: 'Индустриальная', type: 'depot', x: 140, y: 230 },
];

const CONNECTIONS = [
  ['S1', 'S2'], ['S2', 'S3'], ['S3', 'S4'], ['S4', 'S5'], ['S5', 'S6'], 
  ['S6', 'S7'], ['S7', 'S8'], ['S8', 'S9'], ['S9', 'S10'], ['S10', 'S11'],
  ['S12', 'S13'], ['S13', 'S14'], ['S14', 'S15'], ['S15', 'S3']
];

const calculateTrainPosition = (timeMin, unitData) => {
  const { out, shift, inTime, trips1, trips2 } = unitData;
  if (timeMin < out || timeMin > inTime) return null;
  const roundTripTime = 55;
  let state = '';
  let progress = 0;
  let isZeroTrip = false;
  if (timeMin >= out && timeMin < out + 20) {
    isZeroTrip = true;
    state = 'depot_out';
    progress = (timeMin - out) / 20;
  } else if (timeMin >= out + 20 && timeMin < out + 20 + (trips1 * roundTripTime)) {
    isZeroTrip = false;
    const shiftTime = timeMin - (out + 20);
    progress = (shiftTime % roundTripTime) / roundTripTime;
  } else if (timeMin >= shift && timeMin < shift + (trips2 * roundTripTime)) {
    isZeroTrip = false;
    const shiftTime = timeMin - shift;
    progress = (shiftTime % roundTripTime) / roundTripTime;
  } else if (timeMin >= inTime - 20 && timeMin <= inTime) {
    isZeroTrip = true;
    state = 'depot_in';
    progress = 1 - ((timeMin - (inTime - 20)) / 20);
  } else { return null; }
  return { progress, isZeroTrip, state };
};

export default function MapVisualizer({ timeMinutes }) {
  const [trains, setTrains] = useState([]);
  const { t } = useLanguage();
  
  useEffect(() => {
    const units = [
      { id: '71', out: 4*60+38, shift: 14*60+41, inTime: 21*60+51, trips1: 10, trips2: 7 },
      { id: '72', out: 4*60+58, shift: 14*60+54, inTime: 24*60+56, trips1: 10, trips2: 10 },
      { id: '73', out: 8*60+13, shift: 15*60+7,  inTime: 25*60+17, trips1: 7,  trips2: 10 },
      { id: '74', out: 5*60+17, shift: 15*60+20, inTime: 22*60+30, trips1: 10, trips2: 7 },
    ];
    const getAngle = (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
    const newTrains = [];
    units.forEach((unit) => {
      const pos = calculateTrainPosition(timeMinutes, unit);
      if (!pos) return;
      const { progress, isZeroTrip, state } = pos;
      let x = 0, y = 0, angle = 0;
      if (!isZeroTrip) {
        const isForward = progress < 0.5;
        const linearProgress = isForward ? progress * 2 : (1 - progress) * 2;
        const totalMainNodes = 11;
        const segmentFloat = linearProgress * (totalMainNodes - 1);
        const segmentIndex = Math.floor(segmentFloat);
        const rawSegmentProgress = segmentFloat - segmentIndex;
        let segmentProgress = 0;
        if (rawSegmentProgress > 0.15 && rawSegmentProgress < 0.85) {
          segmentProgress = (rawSegmentProgress - 0.15) / 0.7;
        } else if (rawSegmentProgress >= 0.85) {
          segmentProgress = 1;
        }
        const node1 = STATIONS[segmentIndex];
        const node2 = STATIONS[segmentIndex + 1];
        if (node1 && node2) {
          x = node1.x + (node2.x - node1.x) * segmentProgress;
          y = node1.y + (node2.y - node1.y) * segmentProgress;
          angle = getAngle(node1.x, node1.y, node2.x, node2.y);
          if (!isForward) angle += 180;
        }
      } else {
        const depotNodes = [STATIONS.find(s=>s.id==='S12'), STATIONS.find(s=>s.id==='S13'), STATIONS.find(s=>s.id==='S14'), STATIONS.find(s=>s.id==='S15'), STATIONS.find(s=>s.id==='S3')];
        const depotSegmentFloat = progress * 4;
        const depotSegmentIndex = Math.floor(depotSegmentFloat);
        const rawDepotSegmentProgress = depotSegmentFloat - depotSegmentIndex;
        let depotSegmentProgress = 0;
        if (rawDepotSegmentProgress > 0.15 && rawDepotSegmentProgress < 0.85) {
          depotSegmentProgress = (rawDepotSegmentProgress - 0.15) / 0.7;
        } else if (rawDepotSegmentProgress >= 0.85) {
          depotSegmentProgress = 1;
        }
        const dNode1 = depotNodes[depotSegmentIndex];
        const dNode2 = depotNodes[depotSegmentIndex + 1];
        if (dNode1 && dNode2) {
          x = dNode1.x + (dNode2.x - dNode1.x) * depotSegmentProgress;
          y = dNode1.y + (dNode2.y - dNode1.y) * depotSegmentProgress;
          angle = getAngle(dNode1.x, dNode1.y, dNode2.x, dNode2.y);
          if (state === 'depot_in') angle += 180;
        }
      }
      if (x !== 0) {
        newTrains.push({ id: `Unit-${unit.id}`, number: unit.id, x, y, angle, isZeroTrip });
      }
    });
    setTrains(newTrains);
  }, [timeMinutes]);

  return (
    <div className="relative w-full h-[600px] lg:h-[800px] bg-[#0f172a] rounded-b-xl overflow-hidden shadow-inner flex justify-center items-center">
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      <svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid meet" className="z-10 relative px-4">
        <defs><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter></defs>
        {CONNECTIONS.map(([id1, id2], i) => {
          const s1 = STATIONS.find(s => s.id === id1);
          const s2 = STATIONS.find(s => s.id === id2);
          const isDepot = s1.type === 'depot' || s2.type === 'depot';
          return (
            <g key={`edge-${i}`}>
              <line x1={s1.x} y1={s1.y} x2={s2.x} y2={s2.y} stroke={isDepot ? "#334155" : "#1e3a8a"} strokeWidth="8" strokeLinecap="round" opacity="0.8" />
              <line x1={s1.x} y1={s1.y} x2={s2.x} y2={s2.y} stroke={isDepot ? "#475569" : "#3b82f6"} strokeWidth="2" strokeDasharray="6 4" />
            </g>
          );
        })}
        {STATIONS.map((station) => (
          <g key={station.id}>
            <circle cx={station.x} cy={station.y} r={station.type === 'depot' ? 5 : 7} fill="#0f172a" stroke={station.type === 'depot' ? "#94a3b8" : "#f8fafc"} strokeWidth="2" filter={station.type !== 'depot' ? "url(#glow)" : ""} />
            <text x={station.x + 15} y={station.y + 4} fontSize="12" fontWeight="bold" fill={station.type === 'depot' ? "#64748b" : "#e2e8f0"} style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{station.id}</text>
            <text x={station.x + 15} y={station.y + 16} fontSize="10" fill={station.type === 'depot' ? "#475569" : "#94a3b8"}>{station.name}</text>
          </g>
        ))}
        {trains.map((train) => (
          <g key={train.id} transform={`translate(${train.x}, ${train.y}) rotate(${train.angle})`} className="transition-all duration-300 ease-linear">
            <rect x="-16" y="-8" width="32" height="16" rx="4" fill={train.isZeroTrip ? "rgba(148,163,184,0.3)" : "rgba(52,211,153,0.3)"} className="animate-ping" />
            <path d="M 0,-5 L 14,-5 Q 18,-5 18,0 Q 18,5 14,5 L 0,5 Z" fill={train.isZeroTrip ? "#94a3b8" : "#10b981"} />
            <rect x="-13" y="-5" width="11" height="10" rx="1" fill={train.isZeroTrip ? "#64748b" : "#059669"} />
            <rect x="-26" y="-5" width="11" height="10" rx="1" fill={train.isZeroTrip ? "#64748b" : "#059669"} />
            <rect x="10" y="-3" width="4" height="6" rx="1" fill="#0f172a" />
            <rect x="-11" y="-3" width="7" height="6" rx="1" fill="#0f172a" />
            <rect x="-24" y="-3" width="7" height="6" rx="1" fill="#0f172a" />
            <line x1="-2" y1="0" x2="-13" y2="0" stroke="#f8fafc" strokeWidth="1" />
            <line x1="-15" y1="0" x2="-26" y2="0" stroke="#f8fafc" strokeWidth="1" />
            <g transform={`rotate(${-train.angle})`}>
              <rect x="-15" y="-22" width="30" height="12" rx="2" fill="rgba(15,23,42,0.8)" border="1px solid rgba(255,255,255,0.2)"/>
              <text x="0" y="-13" fontSize="8" fontWeight="bold" fill="#f8fafc" textAnchor="middle">{train.number}</text>
            </g>
          </g>
        ))}
      </svg>
      <div className="absolute bottom-4 left-4 right-4 flex justify-between">
        <div className="bg-slate-800/80 backdrop-blur-md px-4 py-3 rounded-xl border border-slate-700 shadow-xl">
          <h4 className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">{t.radarLegend}</h4>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-3"><div className="w-8 h-1.5 bg-blue-500 rounded-full"></div><span className="text-xs text-slate-400">{t.mainRouteLeg}</span></div>
            <div className="flex items-center space-x-3"><div className="w-8 h-1.5 border-t-2 border-dashed border-slate-500"></div><span className="text-xs text-slate-400">{t.depotRouteLeg}</span></div>
          </div>
        </div>
        <div className="bg-slate-800/80 backdrop-blur-md px-4 py-3 rounded-xl border border-slate-700 shadow-xl">
           <h4 className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">{t.unitStatLeg}</h4>
           <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-3"><div className="w-4 h-3 bg-emerald-500 rounded-sm"></div><span className="text-xs text-slate-400">{t.mazActiveLeg}</span></div>
            <div className="flex items-center space-x-3"><div className="w-4 h-3 bg-slate-500 rounded-sm"></div><span className="text-xs text-slate-400">{t.mazZeroLeg}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
