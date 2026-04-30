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
  
  { id: 'S12', name: 'Депо D', type: 'depot', x: 250, y: 110 },
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
  const { out, inTime } = unitData;
  if (timeMin < out || timeMin > inTime) return null;
  
  const roundTripTime = 60; // 60 mins for a full loop
  let state = '';
  let progress = 0;
  let isZeroTrip = false;

  if (timeMin >= out && timeMin < out + 15) {
    isZeroTrip = true;
    state = 'depot_out';
    progress = (timeMin - out) / 15;
  } else if (timeMin >= out + 15 && timeMin < inTime - 15) {
    isZeroTrip = false;
    const shiftTime = timeMin - (out + 15);
    progress = (shiftTime % roundTripTime) / roundTripTime;
  } else if (timeMin >= inTime - 15 && timeMin <= inTime) {
    isZeroTrip = true;
    state = 'depot_in';
    progress = 1 - ((timeMin - (inTime - 15)) / 15);
  } else { return null; }

  // Simulate passenger count based on time of day and progress
  const hour = Math.floor(timeMin / 60) % 24;
  const isPeak = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
  const basePass = isPeak ? 45 : 20;
  const passengers = isZeroTrip ? 0 : Math.floor(basePass + (Math.sin(progress * Math.PI) * 25));

  return { progress, isZeroTrip, state, passengers };
};

export default function MapVisualizer({ timeMinutes, units = [] }) {
  const [trains, setTrains] = useState([]);
  const { t } = useLanguage();
  
  useEffect(() => {
    const getAngle = (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
    const newTrains = [];
    
    units.forEach((unit) => {
      const pos = calculateTrainPosition(timeMinutes, unit);
      if (!pos) return;
      
      const { progress, isZeroTrip, state, passengers } = pos;
      let x = 0, y = 0, angle = 0, nextStopIn = 0;
      
      if (!isZeroTrip) {
        const isForward = progress < 0.5;
        const linearProgress = isForward ? progress * 2 : (1 - progress) * 2;
        const totalMainNodes = 11;
        const segmentFloat = linearProgress * (totalMainNodes - 1);
        const segmentIndex = Math.min(Math.floor(segmentFloat), totalMainNodes - 2);
        const rawSegmentProgress = segmentFloat - segmentIndex;
        
        let segmentProgress = 0;
        if (rawSegmentProgress > 0.1) {
          segmentProgress = Math.min(1, (rawSegmentProgress - 0.1) / 0.8);
        }
        
        const node1 = STATIONS[segmentIndex];
        const node2 = STATIONS[segmentIndex + 1];
        
        if (node1 && node2) {
          x = node1.x + (node2.x - node1.x) * segmentProgress;
          y = node1.y + (node2.y - node1.y) * segmentProgress;
          angle = getAngle(node1.x, node1.y, node2.x, node2.y);
          if (!isForward) angle += 180;
          
          // Estimate time to next stop (assuming 3 mins per segment)
          nextStopIn = Math.ceil((1 - rawSegmentProgress) * 3);
        }
      } else {
        const depotNodes = [STATIONS.find(s=>s.id==='S12'), STATIONS.find(s=>s.id==='S13'), STATIONS.find(s=>s.id==='S14'), STATIONS.find(s=>s.id==='S15'), STATIONS.find(s=>s.id==='S3')];
        const depotSegmentFloat = progress * 4;
        const depotSegmentIndex = Math.min(Math.floor(depotSegmentFloat), 3);
        const rawDepotSegmentProgress = depotSegmentFloat - depotSegmentIndex;
        
        const dNode1 = depotNodes[depotSegmentIndex];
        const dNode2 = depotNodes[depotSegmentIndex + 1];
        
        if (dNode1 && dNode2) {
          x = dNode1.x + (dNode2.x - dNode1.x) * rawDepotSegmentProgress;
          y = dNode1.y + (dNode2.y - dNode1.y) * rawDepotSegmentProgress;
          angle = getAngle(dNode1.x, dNode1.y, dNode2.x, dNode2.y);
          if (state === 'depot_in') angle += 180;
          nextStopIn = 0;
        }
      }
      
      if (x !== 0) {
        newTrains.push({ id: `Unit-${unit.id}`, number: unit.id, x, y, angle, isZeroTrip, passengers, nextStopIn });
      }
    });
    setTrains(newTrains);
  }, [timeMinutes]);

  return (
    <div className="relative w-full h-[600px] lg:h-[800px] bg-[#0f172a] rounded-b-xl overflow-hidden shadow-2xl flex justify-center items-center p-4">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20" style={{ backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.2) 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />
      
      <svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid meet" className="z-10 relative bg-[#0f172a]/50 border-2 border-slate-700/50 rounded shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Technical Drawing Border */}
        <rect x="5" y="5" width="390" height="790" fill="none" stroke="#334155" strokeWidth="1" />
        <rect x="10" y="10" width="380" height="780" fill="none" stroke="#475569" strokeWidth="0.5" strokeDasharray="10 5" />

        {/* Title Block (Bottom Right) */}
        <g transform="translate(250, 720)">
          <rect x="0" y="0" width="140" height="60" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          <line x1="0" y1="20" x2="140" y2="20" stroke="#334155" />
          <line x1="0" y1="40" x2="140" y2="40" stroke="#334155" />
          <text x="5" y="14" fontSize="6" fill="#64748b" fontWeight="bold">PROJECT: RAILWAYSIM PRO v2.3</text>
          <text x="5" y="34" fontSize="6" fill="#64748b" fontWeight="bold">FORMAT: A3 STANDART</text>
          <text x="5" y="54" fontSize="6" fill="#64748b" fontWeight="bold">SCALE: 1:25000</text>
        </g>

        {CONNECTIONS.map(([id1, id2], i) => {
          const s1 = STATIONS.find(s => s.id === id1);
          const s2 = STATIONS.find(s => s.id === id2);
          const isDepot = s1.type === 'depot' || s2.type === 'depot';
          return (
            <g key={`edge-${i}`}>
              <line x1={s1.x} y1={s1.y} x2={s2.x} y2={s2.y} stroke={isDepot ? "#1e293b" : "#1e3a8a"} strokeWidth="6" strokeLinecap="round" opacity="0.6" />
              <line x1={s1.x} y1={s1.y} x2={s2.x} y2={s2.y} stroke={isDepot ? "#334155" : "#3b82f6"} strokeWidth="1.5" strokeDasharray={isDepot ? "4 4" : ""} />
            </g>
          );
        })}

        {STATIONS.map((station) => (
          <g key={station.id}>
            <circle cx={station.x} cy={station.y} r={station.type === 'depot' ? 4 : 6} fill="#0f172a" stroke={station.type === 'depot' ? "#475569" : "#f8fafc"} strokeWidth="1.5" filter={station.type !== 'depot' ? "url(#glow)" : ""} />
            <text x={station.x + 12} y={station.y + 4} fontSize="9" fontWeight="bold" fill={station.type === 'depot' ? "#475569" : "#e2e8f0"} className="select-none" style={{ textShadow: '0 0 5px rgba(0,0,0,1)' }}>{station.id}</text>
            <text x={station.x + 12} y={station.y + 14} fontSize="7" fill={station.type === 'depot' ? "#334155" : "#94a3b8"} className="select-none">{station.name}</text>
          </g>
        ))}

        {trains.map((train) => (
          <g key={train.id} transform={`translate(${train.x}, ${train.y}) rotate(${train.angle})`} className="transition-all duration-300 ease-linear">
            {/* Bus Body */}
            <rect x="-14" y="-7" width="28" height="14" rx="2" fill={train.isZeroTrip ? "#475569" : "#10b981"} stroke="#0f172a" strokeWidth="1" filter="url(#glow)" />
            <rect x="6" y="-5" width="6" height="10" rx="1" fill="rgba(255,255,255,0.2)" />
            
            {/* Info Overlay (Counter-rotated to stay horizontal) */}
            <g transform={`rotate(${-train.angle})`}>
              <rect x="-22" y="-38" width="44" height="28" rx="4" fill="rgba(15,23,42,0.95)" stroke="rgba(59,130,246,0.3)" strokeWidth="0.5" />
              
              {/* Passenger Count */}
              <text x="0" y="-26" fontSize="9" fontWeight="900" fill={train.passengers > 60 ? "#ef4444" : "#f8fafc"} textAnchor="middle" className="font-mono">
                {train.passengers}/71
              </text>
              
              {/* Next Stop Time */}
              {!train.isZeroTrip && (
                <text x="0" y="-15" fontSize="7" fill="#94a3b8" textAnchor="middle" className="font-bold">
                  ARR: {train.nextStopIn}m
                </text>
              )}
              {train.isZeroTrip && (
                <text x="0" y="-15" fontSize="6" fill="#fbbf24" textAnchor="middle" className="font-black uppercase tracking-tighter">
                  DEPOT D
                </text>
              )}

              {/* Unit ID Label */}
              <g transform="translate(0, 15)">
                 <rect x="-10" y="-5" width="20" height="10" rx="2" fill="#3b82f6" />
                 <text x="0" y="2.5" fontSize="7" fontWeight="900" fill="white" textAnchor="middle">{train.number}</text>
              </g>
            </g>
          </g>
        ))}
      </svg>

      <div className="absolute bottom-4 left-4 right-4 flex justify-between no-print px-6">
        <div className="bg-slate-900/95 backdrop-blur-md px-6 py-4 rounded-xl border border-slate-700/50 shadow-2xl">
          <h4 className="text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest border-b border-slate-800 pb-2">Technical Legend</h4>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-3"><div className="w-8 h-1 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div><span className="text-[10px] font-bold text-slate-400">Main Transport Line</span></div>
            <div className="flex items-center space-x-3"><div className="w-8 h-1 border-t-2 border-dashed border-slate-600"></div><span className="text-[10px] font-bold text-slate-400">Depot Access Route</span></div>
          </div>
        </div>
        <div className="bg-slate-900/95 backdrop-blur-md px-6 py-4 rounded-xl border border-slate-700/50 shadow-2xl">
          <h4 className="text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest border-b border-slate-800 pb-2">Fleet Status</h4>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3"><div className="w-4 h-3 bg-emerald-500 rounded-sm shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div><span className="text-[10px] font-bold text-slate-400">Maz-303 Active</span></div>
            <div className="flex items-center space-x-3"><div className="w-4 h-3 bg-slate-600 rounded-sm"></div><span className="text-[10px] font-bold text-slate-400">In-Depot / Off-Duty</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
