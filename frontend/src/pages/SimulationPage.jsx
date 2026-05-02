import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import GrafikDvizheniya from '../components/GrafikDvizheniya';
import LiveRouteMap from '../components/LiveRouteMap';
import {
  Clock, Bus, Users, TrendingUp, AlertTriangle,
  BarChart3, Table2, Zap, FileDown
} from 'lucide-react';

// ─── MAZ 303 constants ───────────────────────────────────────────────────────
const Q_H = 71;        // nominal capacity (5 pass/m²)
const Q_PEAK = 100;    // peak capacity (8 pass/m²)
const T_OB = 60;       // full round-trip minutes (adjust as needed)
const GAMMA = 1.0;     // peak utilization coefficient
const I_MAX_DAY = 15;  // max interval minutes (until 21:00)
const I_MAX_NIGHT = 25;// max interval minutes (after 21:00)
const ROUTE_LENGTH_KM = 12.5;

const DEFAULT_FLOWS = [
  { time: '06:00', count: 140 },
  { time: '07:00', count: 430 },
  { time: '08:00', count: 720 },
  { time: '09:00', count: 500 },
  { time: '10:00', count: 500 },
  { time: '11:00', count: 360 },
  { time: '12:00', count: 430 },
  { time: '13:00', count: 430 },
  { time: '14:00', count: 290 },
  { time: '15:00', count: 360 },
  { time: '16:00', count: 500 },
  { time: '17:00', count: 650 },
  { time: '18:00', count: 580 },
  { time: '19:00', count: 430 },
  { time: '20:00', count: 360 },
  { time: '21:00', count: 360 },
  { time: '22:00', count: 220 },
  { time: '23:00', count: 140 },
];

// Formula 3.2 from textbook: Ai = floor( Fi * t_ob / (Q_H * gamma * 60) + 0.89 )
function calcBuses(flow, hour) {
  const iMax = hour >= 21 ? I_MAX_NIGHT : I_MAX_DAY;
  const Ai = Math.floor((flow * T_OB) / (Q_H * GAMMA * 60) + 0.89);
  const Amin = Math.floor(T_OB / iMax + 0.84);
  return Math.max(Ai, Amin, 1);
}

function calcInterval(buses) {
  return buses > 0 ? Math.round(T_OB / buses) : 60;
}

function isPeak(hour) {
  return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
}

function padZ(n) { return String(n).padStart(2, '0'); }

function hhmm(totalMins) {
  const h = Math.floor(totalMins / 60) % 24;
  const m = Math.floor(totalMins % 60);
  return `${padZ(h)}:${padZ(m)}`;
}

// Build departure schedule for a given hour
function buildDepartures(flows) {
  const rows = [];
  flows.forEach((f, idx) => {
    const hour = 6 + idx;
    const buses = calcBuses(f.count, hour);
    const interval = calcInterval(buses);
    for (let b = 0; b < buses; b++) {
      const depMin = hour * 60 + b * interval;
      if (depMin >= 24 * 60) return;
      rows.push({
        id: `А-${String(idx * 10 + b + 1).padStart(3, '0')}`,
        hour,
        depMin,
        time: hhmm(depMin),
        arrMin: depMin + T_OB,
        buses,
        interval,
        peak: isPeak(hour),
        flow: f.count,
      });
    }
  });
  return rows;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div style={{ background: 'rgba(15,23,42,0.85)', border: `1px solid rgba(${color},0.25)` }}
      className="rounded-2xl p-5 flex flex-col gap-2 shadow-xl">
      <div className="flex items-center gap-2">
        <div style={{ background: `rgba(${color},0.15)`, borderRadius: 8, padding: 6 }}>
          <Icon size={16} style={{ color: `rgb(${color})` }} />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black text-white">{value}</span>
        {sub && <span className="text-xs font-bold text-slate-500 uppercase">{sub}</span>}
      </div>
    </div>
  );
}

function IntervalChart({ flows }) {
  const { t } = useLanguage();
  const max = Math.max(...flows.map((_, i) => calcBuses(flows[i].count, 6 + i)));
  const nowHour = new Date().getHours();

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl">
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
        <BarChart3 size={14} className="text-blue-400" /> {t.flowTab}
      </h3>
      <div className="flex items-end gap-1 h-36">
        {flows.map((f, i) => {
          const hour = 6 + i;
          const buses = calcBuses(f.count, hour);
          const interval = calcInterval(buses);
          const peak = isPeak(hour);
          const isNow = nowHour === hour;
          const height = Math.round((buses / max) * 100);
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-0.5 group relative">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10
                bg-slate-800 border border-slate-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap">
                {buses} {t.unitAvt} · {interval} {t.unitMin}
              </div>
              <div
                className="w-full rounded-t-sm transition-all duration-500"
                style={{
                  height: `${Math.max(height, 6)}%`,
                  background: isNow
                    ? 'linear-gradient(to top, #22d3ee, #06b6d4)'
                    : peak
                    ? 'linear-gradient(to top, #f59e0b88, #f59e0b44)'
                    : 'linear-gradient(to top, #3b82f688, #3b82f622)',
                  border: isNow ? '2px solid #22d3ee' : peak ? '1px solid #f59e0b80' : '1px solid #3b82f640',
                }}
              />
              <span className="text-[8px] text-slate-600 font-bold rotate-45 origin-left whitespace-nowrap mt-1">
                {f.time}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3">
        <span className="flex items-center gap-1 text-[9px] text-slate-500"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#22d3ee' }} /> {t.currentHourLegend}</span>
        <span className="flex items-center gap-1 text-[9px] text-slate-500"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#f59e0b88' }} /> {t.peakTimeLegend}</span>
        <span className="flex items-center gap-1 text-[9px] text-slate-500"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#3b82f688' }} /> {t.normalTimeLegend}</span>
      </div>
    </div>
  );
}

function DispatchPanel({ flows, timeMinutes }) {
  const { t } = useLanguage();
  const nowHour = Math.floor(timeMinutes / 60);
  const currentFlow = flows.find((_, i) => 6 + i === nowHour);
  const currentBuses = currentFlow ? calcBuses(currentFlow.count, nowHour) : 1;
  const currentInterval = calcInterval(currentBuses);

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col gap-3">
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
        <Bus size={14} className="text-emerald-400" /> {t.currentDispatch}
      </h3>
      <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar" style={{ maxHeight: 280 }}>
        {flows.map((f, i) => {
          const hour = 6 + i;
          const buses = calcBuses(f.count, hour);
          const interval = calcInterval(buses);
          const peak = isPeak(hour);
          const isNow = nowHour === hour;
          return (
            <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl transition-all"
              style={{
                background: isNow ? 'rgba(34,211,238,0.1)' : 'rgba(255,255,255,0.03)',
                border: isNow ? '1px solid rgba(34,211,238,0.4)' : '1px solid rgba(255,255,255,0.05)'
              }}>
              <span className="font-mono text-sm text-slate-300">{f.time}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500">{f.count} {t.unitPassH}</span>
                <span className="font-black text-sm" style={{ color: peak ? '#f59e0b' : '#3b82f6' }}>
                  {buses} {t.unitAvt}
                </span>
                <span className="text-xs text-slate-500">{interval} {t.unitMin}</span>
                {peak && <span className="text-[9px] font-black text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full">{t.badgePeak}</span>}
                {isNow && <span className="text-[9px] font-black text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded-full animate-pulse">{t.badgeNow}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DepartureBoard({ departures, timeMinutes }) {
  const { t } = useLanguage();
  const nearby = departures.filter(d => Math.abs(d.depMin - timeMinutes) < 90)
    .sort((a, b) => a.depMin - b.depMin)
    .slice(0, 20);

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl">
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
        <Table2 size={14} className="text-purple-400" /> {t.scheduleBoard}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left py-2 px-2 text-slate-500 font-bold uppercase tracking-wider">{t.thBus}</th>
              <th className="text-left py-2 px-2 text-slate-500 font-bold uppercase tracking-wider">{t.thTime}</th>
              <th className="text-left py-2 px-2 text-slate-500 font-bold uppercase tracking-wider">{t.thInterval}</th>
              <th className="text-left py-2 px-2 text-slate-500 font-bold uppercase tracking-wider">{t.thBusCount}</th>
              <th className="text-left py-2 px-2 text-slate-500 font-bold uppercase tracking-wider">{t.thStatus}</th>
            </tr>
          </thead>
          <tbody>
            {nearby.map((d, i) => {
              const diff = d.depMin - timeMinutes;
              let status, color;
              if (diff < -2) { status = t.statDeparted; color = '#64748b'; }
              else if (diff < 3) { status = t.statMoving; color = '#22d3ee'; }
              else if (diff < 15) { status = t.statSoon; color = '#f59e0b'; }
              else { status = t.statScheduled; color = '#3b82f6'; }
              return (
                <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-all">
                  <td className="py-2 px-2 font-mono font-black text-blue-400">{d.id}</td>
                  <td className="py-2 px-2 font-mono font-bold text-white">{d.time}</td>
                  <td className="py-2 px-2 font-mono text-slate-400">{d.interval} {t.unitMin}</td>
                  <td className="py-2 px-2">
                    <span className="font-black" style={{ color: d.peak ? '#f59e0b' : '#3b82f6' }}>{d.buses}</span>
                  </td>
                  <td className="py-2 px-2">
                    <span className="font-black text-[10px] px-2 py-0.5 rounded-full"
                      style={{ color, background: `${color}22`, border: `1px solid ${color}44` }}>
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function SimulationPage() {
  const { t, lang } = useLanguage();
  const getBelarusTime = () => {
    const d = new Date();
    return new Date(d.toLocaleString("en-US", {timeZone: "Europe/Minsk"}));
  };

  const [currentTime, setCurrentTime] = useState(getBelarusTime());
  const [tab, setTab] = useState('dispatch'); // 'dispatch' | 'board' | 'interval' | 'grafik'
  const [grafikMode, setGrafikMode] = useState('weekday');

  useEffect(() => {
    const iv = setInterval(() => setCurrentTime(getBelarusTime()), 1000);
    return () => clearInterval(iv);
  }, []);

  const flows = useMemo(() => {
    try {
      const stored = localStorage.getItem('passengerFlows');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map(f => ({ time: f.time.split('-')[0], count: f.count || 0 }));
      }
    } catch { }
    return DEFAULT_FLOWS;
  }, []);

  const departures = useMemo(() => buildDepartures(flows), [flows]);

  const timeMinutes = currentTime.getHours() * 60 + currentTime.getMinutes() + currentTime.getSeconds() / 60;
  const nowHour = currentTime.getHours();
  const currentFlowEntry = flows.find((_, i) => 6 + i === nowHour);
  const currentFlow = currentFlowEntry?.count ?? 0;
  const currentBuses = calcBuses(currentFlow, nowHour);
  const currentInterval = calcInterval(currentBuses);
  const peakNow = isPeak(nowHour);
  const totalPass = flows.reduce((s, f) => s + f.count, 0);
  const maxBuses = Math.max(...flows.map((f, i) => calcBuses(f.count, 6 + i)));
  const peakHourEntry = flows.reduce((best, f, i) => {
    const b = calcBuses(f.count, 6 + i);
    return b > best.buses ? { buses: b, time: f.time } : best;
  }, { buses: 0, time: '' });

  const formatTime = (d) => d.toLocaleTimeString('ru-RU', { hour12: false });

  const tabs = [
    { id: 'dispatch', label: t.dispatchTab, icon: Bus },
    { id: 'board', label: t.tabloTab, icon: Table2 },
    { id: 'interval', label: t.flowTab, icon: BarChart3 },
    { id: 'grafik', label: t.grafikTab, icon: Table2 },
  ];

  return (
    <div className="space-y-6 pb-20 text-slate-300">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 shadow-2xl gap-4">
        <div className="flex items-center gap-6">
          <div className="bg-black/50 px-8 py-4 rounded-xl border border-slate-700 flex flex-col items-center">
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" /> {t.realTime}
            </span>
            <span className="text-4xl font-mono text-emerald-400 font-black tracking-tighter">{formatTime(currentTime)}</span>
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">MAZ 303 <span className="text-blue-400">{t.busSim}</span></h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">{t.route83Dynamic}</p>
          </div>
        </div>
        <div className="flex gap-3">
          {peakNow && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl animate-pulse">
              <AlertTriangle size={14} className="text-amber-400" />
              <span className="text-xs font-black text-amber-400 uppercase">{t.peakTime}</span>
            </div>
          )}
          <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all text-xs uppercase tracking-widest">
            <FileDown size={14} className="text-blue-400" /> {t.exportPdf}
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Bus} label={t.currentBuses} value={currentBuses} sub={t.bus} color="34,211,238" />
        <KpiCard icon={Clock} label={t.currentInterval} value={currentInterval} sub={t.minute} color="168,85,247" />
        <KpiCard icon={TrendingUp} label={t.maxBusesTitle} value={maxBuses} sub={`${t.hour} ${peakHourEntry.time}`} color="245,158,11" />
        <KpiCard icon={Users} label={t.totalPass} value={totalPass.toLocaleString()} sub={t.perDay} color="34,197,94" />
      </div>

      {/* ── MAZ 303 Info Bar ── */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: t.nomCap, value: `${Q_H} ${t.person}` },
          { label: t.peakCap, value: `${Q_PEAK} ${t.person}` },
          { label: t.turnTime, value: `${T_OB} ${t.mins}` },
          { label: t.coef, value: GAMMA.toFixed(1) },
          { label: t.maxIntDay, value: `${I_MAX_DAY} ${t.mins}` },
          { label: t.maxIntNight, value: `${I_MAX_NIGHT} ${t.mins}` },
        ].map((item, i) => (
          <div key={i} className="bg-slate-900/60 rounded-xl border border-slate-800 px-3 py-2.5 text-center">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">{item.label}</div>
            <div className="text-sm font-black text-blue-300">{item.value}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 border-b border-slate-800 pb-0">
        {tabs.map(tab_ => {
          const Icon = tab_.icon;
          return (
            <button key={tab_.id} onClick={() => setTab(tab_.id)}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-t-xl transition-all border-b-2"
              style={{
                background: tab === tab_.id ? 'rgba(59,130,246,0.1)' : 'transparent',
                borderColor: tab === tab_.id ? '#3b82f6' : 'transparent',
                color: tab === tab_.id ? '#60a5fa' : '#64748b',
              }}>
              <Icon size={13} /> {tab_.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ── */}
      {tab === 'dispatch' && <DispatchPanel flows={flows} timeMinutes={timeMinutes} />}
      {tab === 'board' && <DepartureBoard departures={departures} timeMinutes={timeMinutes} />}
      {tab === 'interval' && <IntervalChart flows={flows} />}
      {tab === 'grafik' && (
        <div className="space-y-3">
          <LiveRouteMap flows={flows} timeMinutes={timeMinutes} />
        </div>
      )}

    </div>
  );
}
