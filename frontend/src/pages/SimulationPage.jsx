import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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

  if (loading) return <div className="p-20 text-center text-white font-bold animate-pulse">LOADING SIMULATION ENGINE v2.6...</div>;
  
  if (error) return (
    <div className="p-10 bg-red-900/20 border border-red-500 rounded-xl text-center">
      <h2 className="text-red-500 font-bold mb-4">CONNECTION ERROR</h2>
      <p className="text-white mb-6">{error}</p>
      <button onClick={runSimulation} className="bg-red-600 text-white px-6 py-2 rounded-lg">RETRY</button>
    </div>
  );

  const trips = result?.schedule?.trips || result?.Schedule?.Trips || [];
  const timeMinutes = currentTime.getHours() * 60 + currentTime.getMinutes() + (currentTime.getSeconds() / 60);

  const units = trips.reduce((acc, trip) => {
    const bId = trip.busId || trip.BusId;
    const dep = new Date(trip.departure || trip.Departure);
    const arr = new Date(trip.arrival || trip.Arrival);
    const depMins = dep.getHours() * 60 + dep.getMinutes();
    const arrMins = arr.getHours() * 60 + arr.getMinutes();
    
    if (!acc.find(u => u.id === bId)) {
      acc.push({ id: bId, out: depMins, inTime: arrMins });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900/80 p-6 rounded-xl border border-slate-700">
        <div>
          <h1 className="text-2xl font-black text-white">MAZ-303 LIVE MONITOR</h1>
          <p className="text-xs text-blue-400 font-bold tracking-widest">STABILITY MODE ACTIVE</p>
        </div>
        <div className="text-4xl font-mono text-emerald-400 font-bold">
          {currentTime.toLocaleTimeString('en-US', { hour12: false })}
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 h-[600px] relative overflow-hidden">
        <MapVisualizer timeMinutes={timeMinutes} units={units} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
           <h3 className="text-slate-500 text-xs font-bold mb-2 uppercase">Status</h3>
           <p className="text-2xl font-bold text-white">{units.length} Units Online</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 col-span-2 flex items-center space-x-4">
           <span className="text-white font-bold text-xs">SPEED:</span>
           <input type="range" min="1" max="60" value={timeScale} onChange={(e) => setTimeScale(parseInt(e.target.value))} className="flex-grow accent-blue-500" />
           <span className="text-blue-400 font-bold">{timeScale}x</span>
        </div>
      </div>
    </div>
  );
}
