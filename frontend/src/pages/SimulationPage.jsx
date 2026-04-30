import React, { useState, useEffect, useRef } from 'react';
import { Train, Clock, BarChart3, AlertCircle, Activity, Zap, Users, Info, Settings, FileDown, ShieldCheck, TrendingUp, Route } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import MapVisualizer from '../components/MapVisualizer';
import { useLanguage } from '../context/LanguageContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const DEFAULT_FLOWS = [
  { time: '06:00-07:00', count: 140 }, { time: '07:00-08:00', count: 430 },
  { time: '08:00-09:00', count: 720 }, { time: '09:00-10:00', count: 500 },
  { time: '10:00-11:00', count: 500 }, { time: '11:00-12:00', count: 360 },
  { time: '12:00-13:00', count: 430 }, { time: '13:00-14:00', count: 430 },
  { time: '14:00-15:00', count: 290 }, { time: '15:00-16:00', count: 360 },
  { time: '16:00-17:00', count: 500 }, { time: '17:00-18:00', count: 650 },
  { time: '18:00-19:00', count: 580 }, { time: '19:00-20:00', count: 430 },
  { time: '20:00-21:00', count: 360 }, { time: '21:00-22:00', count: 360 }
];

export default function SimulationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const { t, lang } = useLanguage();
  
  // Use a fixed base date to match backend: 2026-04-30
  const getBaseDate = () => {
    const d = new Date(2026, 3, 30); // Month is 0-indexed
    const now = new Date();
    d.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    return d;
  };

  const [currentTime, setCurrentTime] = useState(getBaseDate());
  const [timeScale, setTimeScale] = useState(1);
  const simTimeRef = useRef(getBaseDate());

  useEffect(() => {
    const interval = setInterval(() => {
      simTimeRef.current = new Date(simTimeRef.current.getTime() + 1000 * timeScale);
      setCurrentTime(new Date(simTimeRef.current));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeScale]);

  const runSimulation = async (retries = 3) => {
    setLoading(true);
    setError(null);
    try {
      const flowsStr = localStorage.getItem('passengerFlows');
      let flows = flowsStr ? JSON.parse(flowsStr) : DEFAULT_FLOWS;
      if (!Array.isArray(flows) || flows.length === 0) flows = DEFAULT_FLOWS;

      const payload = {
        route: { id: 1, name: 'Route 83', stops: [] },
        flows: flows.map(f => ({ timePeriod: f.time, passengersPerHour: f.count || 0 })),
        bus: { 
          capacity: 71, 
          gamma: 0.8, 
          speedKmH: 25, 
          stopTimeSeconds: 30,
          length: 12.5,
          outerRadius: 12.5,
          innerRadius: 5.3
        },
        timestamp: new Date().getTime() // Cache busting
      };

      let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/simulation';
      
      // Safety check for production
      if (apiUrl.includes('localhost') && window.location.hostname !== 'localhost') {
        console.warn("API URL points to localhost in production!");
      }

      const response = await axios.post(apiUrl, payload, { timeout: 15000 });
      const data = response.data;
      const schedule = data.schedule || data.Schedule;
      if (data && schedule) {
        setResult(data);
      } else {
        throw new Error("Invalid backend response structure");
      }
    } catch (err) {
      console.error("Simulation engine error:", err);
      if (retries > 0) {
        setTimeout(() => runSimulation(retries - 1), 2000);
        return;
      }
      setError(err.message || "Engine initialization failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-[#0f172a] min-h-[70vh] rounded-[2rem] border border-slate-800 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="w-8 h-8 text-blue-400 animate-pulse" />
          </div>
        </div>
        <h3 className="mt-10 text-2xl font-black text-white tracking-[0.3em] uppercase">{t.loadingStatus}</h3>
        <p className="text-slate-500 mt-4 font-bold tracking-widest text-xs uppercase">Initializing Maz-303 Engine v2.5...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="bg-red-500/5 p-16 rounded-[2.5rem] border border-red-500/20 text-center max-w-3xl mx-auto mt-20 backdrop-blur-2xl shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
        <div className="w-24 h-24 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-10 border border-red-500/30 rotate-12">
          <AlertCircle className="w-12 h-12 text-red-500 -rotate-12" />
        </div>
        <h3 className="text-4xl font-black text-white mb-6 tracking-tighter">{t.sysOffline}</h3>
        <p className="text-slate-400 mb-10 text-lg leading-relaxed">{error || t.sysOfflineDesc}</p>
        <div className="bg-black/40 p-6 rounded-2xl mb-12 text-left border border-slate-800 shadow-inner">
          <div className="flex items-center text-amber-500 mb-4 font-black uppercase tracking-widest text-[10px]">
             <Info className="w-3 h-3 mr-2" /> Connection Debugger
          </div>
          <div className="space-y-2 font-mono text-[11px]">
            <p className="text-slate-500">Current Endpoint: <span className="text-blue-400">{import.meta.env.VITE_API_URL || 'NOT_SET (using localhost)'}</span></p>
            <p className="text-slate-500">Local Hostname: <span className="text-slate-300">{window.location.hostname}</span></p>
          </div>
        </div>
        <button
          onClick={() => runSimulation()}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-[0_20px_50px_rgba(37,99,235,0.4)] active:scale-95"
        >
          {lang === 'ru' ? 'Перезапустить Систему' : 'Restart Simulation'}
        </button>
      </div>
    );
  }

  const schedule = result.schedule || result.Schedule || { trips: [] };
  const trips = schedule.trips || schedule.Trips || [];
  const schedule = result?.schedule || result?.Schedule || { trips: [] };
  const trips = schedule.trips || schedule.Trips || [];
  const analytics = result?.analytics || result?.Analytics || { 
    maxRequiredBuses: 0, 
    totalPassengers: 0, 
    totalMileageKm: 0, 
    avgEfficiency: 0, 
    peakHour: '-', 
    systemReliability: 0, 
    totalTripsGenerated: 0 
  };
  
  const timeMinutes = currentTime.getHours() * 60 + currentTime.getMinutes() + (currentTime.getSeconds() / 60);
  const formatTime = (dateObj) => dateObj.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  const formatMinutesToHHMM = (mins) => {
    const h = Math.floor(mins / 60) % 24;
    const m = Math.floor(mins % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const units = React.useMemo(() => {
    if (!trips.length) return [];
    try {
      const busMap = new Map();
      trips.forEach(trip => {
        const depStr = trip.departure || trip.Departure;
        const arrStr = trip.arrival || trip.Arrival;
        const bId = trip.busId || trip.BusId;
        const rName = trip.routeName || trip.RouteName;

        if (!depStr || !arrStr || !bId) return;
        const dep = new Date(depStr);
        const arr = new Date(arrStr);
        if (isNaN(dep.getTime()) || isNaN(arr.getTime())) return;

        const depMins = dep.getHours() * 60 + dep.getMinutes();
        const arrMins = arr.getHours() * 60 + arr.getMinutes();
        
        if (!busMap.has(bId)) {
          busMap.set(bId, { id: bId, out: depMins, inTime: arrMins, type: rName });
        } else {
          const bus = busMap.get(bId);
          if (bus) {
            bus.out = Math.min(bus.out, depMins);
            bus.inTime = Math.max(bus.inTime, arrMins);
          }
        }
      });
      return Array.from(busMap.values());
    } catch (e) {
      console.error("Units memo error", e);
      return [];
    }
  }, [trips]);

  const chartData = {
    labels: (result?.hourlyBusCounts || result?.HourlyBusCounts || []).map(h => h.timePeriod || h.TimePeriod || ''),
    datasets: [{
      label: t?.unit || 'Unit',
      data: (result?.hourlyBusCounts || result?.HourlyBusCounts || []).map(h => h.requiredBuses || h.RequiredBuses || 0),
      backgroundColor: 'rgba(52, 211, 153, 0.8)',
      borderColor: 'rgb(16, 185, 129)',
      borderWidth: 1,
    }],
  };

  return (
    <div className="space-y-8 pb-20 print:p-0 min-h-screen text-slate-300">
      <div className="flex justify-center no-print">
         <div className="bg-blue-600/10 border border-blue-500/20 px-4 py-1 rounded-full">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Maz-303 Engine v2.5 Stable</span>
         </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900/50 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl no-print relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] pointer-events-none" />
        <div className="flex items-center space-x-8 relative z-10">
          <div className="bg-black/40 px-10 py-5 rounded-2xl border border-slate-700 flex flex-col items-center shadow-inner">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 flex items-center">
              <span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></span> {lang === 'ru' ? 'РЕАЛЬНОЕ ВРЕМЯ' : 'SYSTEM TIME'}
            </span>
            <span className="text-5xl font-mono text-emerald-400 font-black tracking-tighter">{formatTime(currentTime)}</span>
          </div>
          <div className="hidden xl:block border-l border-slate-800 pl-8">
             <h2 className="text-2xl font-black text-white tracking-tight italic">RAILWAYSIM<span className="text-blue-500">PRO</span></h2>
             <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.4em] mt-1">Advanced Logistics Monitoring</p>
          </div>
        </div>
        <div className="mt-6 md:mt-0 flex space-x-4 relative z-10">
          <button onClick={() => window.print()} className="flex items-center px-10 py-4 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl border border-white/10 transition-all active:scale-95 shadow-xl uppercase text-xs tracking-widest">
            <FileDown className="w-4 h-4 mr-3 text-blue-400" /> {t?.exportPdf || 'Export'}
          </button>
        </div>
      </div>

      <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 shadow-xl no-print">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4 flex-grow w-full md:w-auto">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Time Scale (x{timeScale})</span>
            <input type="range" min="1" max="60" step="1" value={timeScale} onChange={(e) => setTimeScale(parseInt(e.target.value))} className="flex-grow h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
          </div>
          <div className="flex space-x-2">
            {[1, 10, 60].map(v => (
              <button key={v} onClick={() => setTimeScale(v)} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded transition-all">{v}x</button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t?.peakTrains, val: analytics.maxRequiredBuses, sub: analytics.peakHour, icon: TrendingUp, col: 'blue' },
          { label: t?.totalPass, val: (analytics.totalPassengers || 0).toLocaleString(), icon: Users, col: 'emerald' },
          { label: t?.totalMileage, val: Math.round(analytics.totalMileageKm || 0), sub: t?.km, icon: Route, col: 'amber' },
          { label: t?.systemReliability, val: `${analytics.systemReliability}%`, icon: ShieldCheck, col: 'purple' }
        ].map((kpi, idx) => (
          <div key={idx} className={`bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden group hover:border-${kpi.col}-500/50 transition-all`}>
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-2 bg-${kpi.col}-500/20 rounded-lg text-${kpi.col}-400`}><kpi.icon className="w-5 h-5" /></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{kpi.label || '---'}</p>
            </div>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-4xl font-black text-white">{kpi.val}</h3>
              {kpi.sub && <span className={`text-${kpi.col}-400 text-[10px] font-bold font-mono ml-2 uppercase`}>{kpi.sub}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-slate-800/80 rounded-3xl border border-slate-700 shadow-xl overflow-hidden flex flex-col min-h-[600px]">
          <div className="px-8 py-5 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
            <h3 className="font-black text-white uppercase tracking-widest flex items-center text-sm"><Activity className="w-5 h-5 mr-3 text-emerald-400" /> {t?.liveRadar || 'Live Monitor'}</h3>
          </div>
          <div className="flex-grow relative">
            {timeMinutes && <MapVisualizer timeMinutes={timeMinutes} units={units} />}
          </div>
        </div>
        <div className="flex flex-col space-y-6">
          <div className="bg-[#0f172a] rounded-3xl border border-slate-700 shadow-xl p-8 flex flex-col">
            <h3 className="font-black text-white flex items-center text-lg mb-6 border-b border-slate-700 pb-4 uppercase tracking-widest">
              <Settings className="w-6 h-6 mr-3 text-amber-400" /> {t?.unitDispatch || 'Dispatch'}
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {units.map((u, idx) => {
                let status = t?.statusParked || 'Parked', color = "text-slate-600";
                if (timeMinutes >= u.out && timeMinutes <= u.inTime) {
                  if (timeMinutes < u.out + 15) { status = t?.statusZero || 'Zero'; color = "text-blue-400 animate-pulse"; }
                  else if (timeMinutes > u.inTime - 15) { status = t?.statusRet || 'Return'; color = "text-amber-500"; }
                  else { status = t?.statusOnLine || 'On-Line'; color = "text-emerald-400"; }
                }
                return (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-all">
                    <div className="flex flex-col">
                       <span className="text-lg font-black text-blue-400 leading-none">{u.id}</span>
                       <span className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">{formatMinutesToHHMM(u.out)} - {formatMinutesToHHMM(u.inTime)}</span>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${color}`}>{status}</span>
                  </div>
                );
              })}
              {units.length === 0 && <p className="text-center text-slate-600 text-xs py-10 uppercase font-black">No Units Active</p>}
            </div>
          </div>
          <div className="bg-slate-800/80 rounded-3xl border border-slate-700 shadow-xl p-8 flex-grow min-h-[350px] flex flex-col">
            <h3 className="font-black text-white flex items-center mb-8 uppercase tracking-widest text-sm"><BarChart3 className="w-5 h-5 mr-3 text-blue-400" /> {t?.capReq || 'Analytics'}</h3>
            <div className="flex-grow">
               {result && <Bar data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { weight: 'bold' } } }, x: { grid: { display: false }, ticks: { color: '#64748b', font: { weight: 'bold' } } } } }} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
