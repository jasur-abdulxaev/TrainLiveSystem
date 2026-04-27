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
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      // For Belarus/Minsk timezone consistency
      const minskTime = new Date(new Date().toLocaleString("en-US", {timeZone: "Europe/Minsk"}));
      setCurrentTime(minskTime);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
        bus: { capacity: 100, gamma: 0.36, speedKmH: 19.87, stopTimeSeconds: 28 }
      };

      const response = await axios.post('http://localhost:5001/api/simulation', payload, { timeout: 8000 });
      if (response.data) {
        setResult(response.data);
      } else {
        throw new Error("No data received");
      }
    } catch (err) {
      console.error("Simulation error:", err);
      if (retries > 0) {
        setTimeout(() => runSimulation(retries - 1), 1500);
        return;
      }
      setError(err.message || "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-20 h-20 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
        <h3 className="mt-8 text-xl font-bold text-white tracking-widest uppercase">{t.loadingStatus}</h3>
        <p className="text-slate-400 mt-2">{t.loadingDesc}</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="bg-red-500/10 p-12 rounded-2xl border border-red-500/30 text-center max-w-2xl mx-auto mt-20 backdrop-blur-md">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-white mb-2">{t.sysOffline}</h3>
        <p className="text-red-300 mb-8">{error || t.sysOfflineDesc}</p>
        <button
          onClick={() => runSimulation()}
          className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)]"
        >
          {lang === 'ru' ? 'Попробовать снова' : 'Retry Connection'}
        </button>
      </div>
    );
  }

  const analytics = result.analytics || { maxRequiredBuses: 0, totalPassengers: 0, totalMileageKm: 0, avgEfficiency: 0, peakHour: '-', systemReliability: 0, totalTripsGenerated: 0 };
  const timeMinutes = currentTime.getHours() * 60 + currentTime.getMinutes() + (currentTime.getSeconds() / 60);
  const formatTime = (dateObj) => dateObj.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatMinutesToHHMM = (mins) => {
    const h = Math.floor(mins / 60) % 24;
    const m = Math.floor(mins % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const units = [
    { id: '71', out: 4*60+38, shift: 14*60+41, inTime: 21*60+51 },
    { id: '72', out: 4*60+58, shift: 14*60+54, inTime: 24*60+56 },
    { id: '73', out: 8*60+13, shift: 15*60+7,  inTime: 25*60+17 },
    { id: '74', out: 5*60+17, shift: 15*60+20, inTime: 22*60+30 },
  ];

  const handlePrint = () => {
    window.print();
  };

  const chartData = {
    labels: result.hourlyBusCounts?.map(h => h.timePeriod) || [],
    datasets: [{
      label: t.unit,
      data: result.hourlyBusCounts?.map(h => h.requiredBuses) || [],
      backgroundColor: 'rgba(52, 211, 153, 0.8)',
      borderColor: 'rgb(16, 185, 129)',
      borderWidth: 1,
    }],
  };

  return (
    <div className="space-y-6 pb-12 print:p-0">
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 shadow-xl no-print">
        <div className="flex items-center space-x-6">
          <div className="bg-[#0f172a] px-8 py-3 rounded-xl border border-slate-700 flex flex-col items-center shadow-inner">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center">
              <span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></span> Live Real-Time
            </span>
            <span className="text-4xl font-mono text-emerald-400 font-bold tracking-widest">{formatTime(currentTime)}</span>
          </div>
          <div className="hidden lg:block border-l border-slate-700 pl-6">
             <h2 className="text-xl font-bold text-white tracking-tight">RailwaySimPro</h2>
             <p className="text-xs text-slate-400 uppercase tracking-widest">Analytics Dashboard v2.3</p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <button 
            onClick={handlePrint} 
            className="export-btn group flex items-center px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.5)] active:scale-95"
          >
            <FileDown className="w-5 h-5 mr-2 group-hover:translate-y-0.5 transition-transform" /> {t.exportPdf}
          </button>
        </div>
      </div>

      {/* KPI Section - Visible in Print */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><TrendingUp className="w-5 h-5" /></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.peakTrains}</p>
          </div>
          <div className="flex items-baseline space-x-2">
            <h3 className="text-4xl font-black text-white">{analytics.maxRequiredBuses}</h3>
            <span className="text-blue-400 text-[10px] font-bold font-mono ml-2">{analytics.peakHour}</span>
          </div>
        </div>
        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400"><Users className="w-5 h-5" /></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.totalPass}</p>
          </div>
          <div className="flex items-baseline space-x-2">
            <h3 className="text-4xl font-black text-white">{analytics.totalPassengers.toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400"><Route className="w-5 h-5" /></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.totalMileage}</p>
          </div>
          <div className="flex items-baseline space-x-2">
            <h3 className="text-4xl font-black text-white">{Math.round(analytics.totalMileageKm)}</h3>
            <span className="text-amber-500 text-xs font-bold">{t.km}</span>
          </div>
        </div>
        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden group hover:border-purple-500/50 transition-all">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400"><ShieldCheck className="w-5 h-5" /></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.systemReliability}</p>
          </div>
          <div className="flex items-baseline space-x-2">
            <h3 className="text-4xl font-black text-white">{analytics.systemReliability}%</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-slate-800/80 rounded-2xl border border-slate-700 shadow-xl overflow-hidden flex flex-col min-h-[600px]">
          <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
            <h3 className="font-bold text-white flex items-center"><Activity className="w-5 h-5 mr-2 text-emerald-400" /> {t.liveRadar}</h3>
          </div>
          <div className="flex-grow"><MapVisualizer timeMinutes={timeMinutes} /></div>
        </div>
        <div className="flex flex-col space-y-6">
          <div className="bg-[#0f172a] rounded-2xl border border-slate-700 shadow-xl p-6 flex flex-col">
            <h3 className="font-bold text-white flex items-center text-xl mb-4 border-b border-slate-700 pb-4">
              <Settings className="w-6 h-6 mr-2 text-amber-400" /> {t.unitDispatch}
            </h3>
            <div className="space-y-2">
              {units.map((u, idx) => {
                let status = t.statusParked, statusColor = "text-slate-500", dest = "Depot";
                if (timeMinutes >= u.out && timeMinutes <= u.inTime) {
                  if (timeMinutes < u.out + 20) { status = t.statusZero; statusColor = "text-slate-400 animate-pulse"; dest = "Вишенка"; }
                  else if (timeMinutes > u.inTime - 20) { status = t.statusRet; statusColor = "text-amber-500"; dest = "Депо"; }
                  else { status = t.statusOnLine; statusColor = "text-emerald-400"; dest = "Route 83"; }
                }
                return (
                  <div key={idx} className="grid grid-cols-12 gap-2 px-2 py-3 bg-[#111827]/50 border border-slate-800 rounded-xl font-mono hover:bg-slate-800 transition-all items-center">
                    <div className="col-span-3 text-blue-400 font-bold text-lg">{u.id}</div>
                    <div className="col-span-4 text-slate-300 font-bold text-xs">{formatMinutesToHHMM(u.out)} - {formatMinutesToHHMM(u.inTime)}</div>
                    <div className={`col-span-5 text-right text-[10px] font-bold ${statusColor}`}>{status}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-slate-800/80 rounded-2xl border border-slate-700 shadow-xl p-6 flex-grow min-h-[300px] flex flex-col">
            <h3 className="font-bold text-white flex items-center mb-6"><BarChart3 className="w-5 h-5 mr-2 text-blue-400" /> {t.capReq}</h3>
            <div className="flex-grow"><Bar data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }, x: { grid: { display: false }, ticks: { color: '#94a3b8' } } } }} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
