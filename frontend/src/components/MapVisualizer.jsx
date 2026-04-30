import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const MAIN_STATIONS = [
  { id: 'S1', name: 'Вишенка', x: 50, y: 150 },
  { id: 'S2', name: 'Стадион', x: 50, y: 230 },
  { id: 'S3', name: 'Яна Скрыгана', x: 100, y: 240 },
  { id: 'S4', name: 'Свислочская', x: 100, y: 330 },
  { id: 'S5', name: 'посёлок Монтажник', x: 170, y: 390 },
  { id: 'S6', name: 'Ледное', x: 250, y: 450 },
  { id: 'S7', name: 'Энергетиков', x: 260, y: 490 },
  { id: 'S8', name: 'пл. Свободы', x: 260, y: 560 },
  { id: 'S9', name: 'Водоканал', x: 310, y: 600 },
  { id: 'S10', name: 'Октябрьское депо', x: 310, y: 650 },
  { id: 'S11', name: 'Петруся Бровки', x: 310, y: 680 },
];

const DEPOT_NODES = [
  { id: 'S12', name: 'Депо D', x: 250, y: 110 },
  { id: 'S13', name: 'Великий Бор', x: 230, y: 140 },
  { id: 'S14', name: 'Кинотеатр "Салют"', x: 190, y: 190 },
  { id: 'S15', name: 'Индустриальная', x: 140, y: 230 },
  { id: 'S3', name: 'Яна Скрыгана', x: 100, y: 240 },
];

const ALL_STATIONS = [...MAIN_STATIONS, ...DEPOT_NODES.filter(d => d.id !== 'S3')];

const CONNECTIONS = [
  ['S1', 'S2'], ['S2', 'S3'], ['S3', 'S4'], ['S4', 'S5'], ['S5', 'S6'], 
  ['S6', 'S7'], ['S7', 'S8'], ['S8', 'S9'], ['S9', 'S10'], ['S10', 'S11'],
  ['S12', 'S13'], ['S13', 'S14'], ['S14', 'S15'], ['S15', 'S3']
];

const calculateTrainPosition = (timeMin, unitData) => {
  const { out, inTime } = unitData;
  if (!out || !inTime || timeMin < out || timeMin > inTime) return null;
  
  const roundTripTime = 60;
  let state = '', progress = 0, isZeroTrip = false;

  if (timeMin >= out && timeMin < out + 15) {
    isZeroTrip = true; state = 'depot_out'; progress = (timeMin - out) / 15;
  } else if (timeMin >= out + 15 && timeMin < inTime - 15) {
    isZeroTrip = false; progress = ((timeMin - (out + 15)) % roundTripTime) / roundTripTime;
  } else if (timeMin >= inTime - 15 && timeMin <= inTime) {
    isZeroTrip = true; state = 'depot_in'; progress = 1 - ((timeMin - (inTime - 15)) / 15);
  } else { return null; }

  const hour = Math.floor(timeMin / 60) % 24;
  const isPeak = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
  const passengers = isZeroTrip ? 0 : Math.floor((isPeak ? 45 : 20) + (Math.sin(progress * Math.PI) * 25));

  return { progress, isZeroTrip, state, passengers };
};

export default function MapVisualizer({ timeMinutes = 0, units = [] }) {
  const [trains, setTrains] = useState([]);
  const { t = {} } = useLanguage();
  
  useEffect(() => {
    const getAngle = (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
    const newTrains = [];
    
    (units || []).forEach((unit) => {
      const pos = calculateTrainPosition(timeMinutes, unit);
      if (!pos) return;
      
      const { progress, isZeroTrip, state, passengers } = pos;
      let x = 0, y = 0, angle = 0, nextStopIn = 0;
      
      try {
        if (!isZeroTrip) {
          const isForward = progress < 0.5;
          const lp = isForward ? progress * 2 : (1 - progress) * 2;
          const sFloat = lp * (MAIN_STATIONS.length - 1);
          const sIdx = Math.min(Math.floor(sFloat), MAIN_STATIONS.length - 2);
          const sp = sFloat - sIdx;
          
          const n1 = MAIN_STATIONS[sIdx];
          const n2 = MAIN_STATIONS[sIdx + 1];
          
          if (n1 && n2) {
            x = n1.x + (n2.x - n1.x) * sp;
            y = n1.y + (n2.y - n1.y) * sp;
            angle = getAngle(n1.x, n1.y, n2.x, n2.y) + (!isForward ? 180 : 0);
            nextStopIn = Math.ceil((1 - sp) * 3);
          }
        } else {
          const dsFloat = progress * (DEPOT_NODES.length - 1);
          const dsIdx = Math.min(Math.floor(dsFloat), DEPOT_NODES.length - 2);
          const dsp = dsFloat - dsIdx;
          
          const d1 = DEPOT_NODES[dsIdx];
          const d2 = DEPOT_NODES[dsIdx + 1];
          
          if (d1 && d2) {
            x = d1.x + (d2.x - d1.x) * dsp;
            y = d1.y + (d2.y - d1.y) * dsp;
            angle = getAngle(d1.x, d1.y, d2.x, d2.y) + (state === 'depot_in' ? 180 : 0);
          }
        }
        
        if (x !== 0) {
          newTrains.push({ id: `U-${unit.id}`, number: unit.id, x, y, angle, isZeroTrip, passengers, nextStopIn });
        }
      } catch (e) { console.error("Train calc error", e); }
    });
    setTrains(newTrains);
  }, [timeMinutes, units]);

  return (
    <div className="relative w-full h-full min-h-[600px] bg-[#0f172a] flex justify-center items-center overflow-hidden">
      <svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid meet" className="z-10 relative">
        <rect x="5" y="5" width="390" height="790" fill="none" stroke="#1e293b" strokeWidth="1" />
        
        {CONNECTIONS.map(([id1, id2], i) => {
          const s1 = ALL_STATIONS.find(s => s.id === id1) || MAIN_STATIONS.find(s => s.id === id1);
          const s2 = ALL_STATIONS.find(s => s.id === id2) || MAIN_STATIONS.find(s => s.id === id2);
          if (!s1 || !s2) return null;
          const isD = id1.startsWith('S12') || id1.startsWith('S13') || id1.startsWith('S14') || id1.startsWith('S15');
          return <line key={i} x1={s1.x} y1={s1.y} x2={s2.x} y2={s2.y} stroke={isD ? "#1e293b" : "#1e3a8a"} strokeWidth="2" strokeDasharray={isD ? "4 4" : ""} />;
        })}

        {ALL_STATIONS.map((s) => (
          <g key={s.id}>
            <circle cx={s.x} cy={s.y} r="4" fill="#0f172a" stroke="#475569" strokeWidth="1" />
            <text x={s.x + 8} y={s.y + 4} fontSize="8" fill="#64748b" className="select-none font-bold">{s.id}</text>
          </g>
        ))}

        {trains.map((t) => (
          <g key={t.id} transform={`translate(${t.x}, ${t.y}) rotate(${t.angle})`}>
            <rect x="-10" y="-5" width="20" height="10" rx="1" fill={t.isZeroTrip ? "#475569" : "#10b981"} stroke="#0f172a" />
            <g transform={`rotate(${-t.angle})`}>
              <text x="0" y="-12" fontSize="8" fontWeight="bold" fill="white" textAnchor="middle">{t.number}</text>
              <text x="0" y="-22" fontSize="6" fill="#94a3b8" textAnchor="middle">{t.passengers}/71</text>
            </g>
          </g>
        ))}
      </svg>
      
      <div className="absolute bottom-4 left-4 bg-slate-900/80 p-3 rounded-lg border border-slate-700 text-[8px] font-mono uppercase tracking-tighter text-slate-500">
        Engine v2.5 Visualizer
      </div>
    </div>
  );
}
