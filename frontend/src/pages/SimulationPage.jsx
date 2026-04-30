import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  TrendingUp, Users, MapPin, ShieldCheck, 
  Activity, Settings, FileDown, Zap, Clock, Info 
} from 'lucide-react';
import MapVisualizer from '../components/MapVisualizer';
import { useLanguage } from '../context/LanguageContext';

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
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const { t, lang } = useLanguage();
  const [timeScale, setTimeScale] = useState(1);
  const [currentTime, setCurrentTime] = useState(new Date(2026, 3, 30, 8, 0, 0));
  const simTimeRef = useRef(new Date(2026, 3, 30, 8, 0, 0));

  useEffect(() => {
    const interval = setInterval(() => {
      simTimeRef.current = new Date(simTimeRef.current.getTime() + 1000 * timeScale);
      setCurrentTime(new Date(simTimeRef.current));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeScale]);

  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      const flowsStr = localStorage.getItem('passengerFlows');
      let flows = flowsStr ? JSON.parse(flowsStr) : DEFAULT_FLOWS;
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/simulation';
      
      const payload = {
        flows: flows.map(f => ({ timePeriod: f.time, passengersPerHour: f.count || 0 })),
        bus: { capacity: 71, gamma: 0.8, speedKmH: 25, stopTimeSeconds: 30 }
      };

      const response = await axios.post(apiUrl, payload, { timeout: 15000 });
      if (response.data) {
        setResult(response.data);
      } else {
        throw new Error("No data");
      }
    } catch (err) {
      setError(err.message || "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, []);

  const formatTime = (dateObj) => dateObj.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-[#0f172a] min-h-[70vh] rounded-[2rem] border border-slate-800 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
        <Zap className="w-12 h-12 text-blue-500 animate-pulse mb-6" />
        <h3 className="text-xl font-black text-white uppercase tracking-[0.3em]">{t?.loadingStatus || 'Initializing Engine...'}</h3>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-500/5 p-16 rounded-[2.5rem] border border-red-500/20 text-center max-w-3xl mx-auto mt-20">
        <Info className="w-12 h-12 text-red-500 mx-auto mb-6" />
        <h3 className="text-2xl font-black text-white mb-4 uppercase">{t?.sysOffline || 'System Offline'}</h3>
        <p className="text-slate-400 mb-10">{error}</p>
        <button onClick={runSimulation} className="bg-blue-600 text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">Restart Engine</button>
      </div>
    );
  }

  const trips = result?.schedule?.trips || result?.Schedule?.Trips || [];
  const analytics = result?.analytics || result?.Analytics || {};
  const timeMinutes = currentTime.getHours() * 60 + currentTime.getMinutes() + (currentTime.getSeconds() / 60);

  const units = trips.reduce((acc, trip) => {
    const bId = trip.busId || trip.BusId;
    const dep = new Date(trip.departure || trip.Departure);
    const arr = new Date(trip.arrival || trip.Arrival);
    const depMins = dep.getHours() * 60 + dep.getMinutes();
    const arrMins = arr.getHours() * 60 + arr.getMinutes();
    if (!acc.find(u => u.id === bId)) acc.push({ id: bId, out: depMins, inTime: arrMins });
    return acc;
  }, []);

  return (
    <div className="space-y-8 pb-20 text-slate-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900/50 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
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

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t?.peakTrains, val: analytics.maxRequiredBuses || 0, sub: analytics.peakHour, icon: TrendingUp, col: 'blue' },
          { label: t?.totalPass, val: (analytics.totalPassengers || 0).toLocaleString(), icon: Users, col: 'emerald' },
          { label: t?.totalMileage, val: Math.round(analytics.totalMileageKm || 0), sub: t?.km, icon: MapPin, col: 'amber' },
          { label: t?.systemReliability, val: `${analytics.systemReliability || 100}%`, icon: ShieldCheck, col: 'purple' }
        ].map((kpi, idx) => {
          const IconComp = kpi.icon;
          return (
            <div key={idx} className={`bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden group hover:border-${kpi.col}-500/50 transition-all`}>
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-2 bg-${kpi.col}-500/20 rounded-lg text-${kpi.col}-400`}>
                  {IconComp && <IconComp className="w-5 h-5" />}
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{kpi.label || 'Metric'}</p>
              </div>
              <div className="flex items-baseline space-x-2">
                <h3 className="text-4xl font-black text-white">{kpi.val}</h3>
                {kpi.sub && <span className={`text-${kpi.col}-400 text-[10px] font-bold font-mono ml-2 uppercase`}>{kpi.sub}</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-900 rounded-3xl border border-slate-800 h-[650px] relative overflow-hidden shadow-2xl">
        <MapVisualizer timeMinutes={timeMinutes} units={units} />
        <div className="absolute bottom-6 left-6 right-6 flex items-center space-x-6 bg-black/40 backdrop-blur-xl p-6 rounded-2xl border border-white/5">
           <span className="text-white font-black text-xs uppercase tracking-widest">Time Scale:</span>
           <input type="range" min="1" max="60" value={timeScale} onChange={(e) => setTimeScale(parseInt(e.target.value))} className="flex-grow accent-blue-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer" />
           <span className="text-blue-400 font-mono font-black text-lg">{timeScale}x</span>
        </div>
      </div>
    </div>
  );
}
