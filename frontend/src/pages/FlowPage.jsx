import React, { useState } from 'react';
import { Users, AlertCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const defaultFlows = [
  { id: 1, time: '06:00-07:00', count: 140 },
  { id: 2, time: '07:00-08:00', count: 430 },
  { id: 3, time: '08:00-09:00', count: 720 },
  { id: 4, time: '09:00-10:00', count: 500 },
  { id: 5, time: '10:00-11:00', count: 500 },
  { id: 6, time: '11:00-12:00', count: 360 },
  { id: 7, time: '12:00-13:00', count: 430 },
  { id: 8, time: '13:00-14:00', count: 430 },
  { id: 9, time: '14:00-15:00', count: 290 },
  { id: 10, time: '15:00-16:00', count: 360 },
  { id: 11, time: '16:00-17:00', count: 500 },
  { id: 12, time: '17:00-18:00', count: 650 },
  { id: 13, time: '18:00-19:00', count: 580 },
  { id: 14, time: '19:00-20:00', count: 430 },
  { id: 15, time: '20:00-21:00', count: 360 },
  { id: 16, time: '21:00-22:00', count: 360 },
  { id: 17, time: '22:00-23:00', count: 220 },
  { id: 18, time: '23:00-24:00', count: 140 },
];

export default function FlowPage() {
  const navigate = useNavigate();
  const [flows, setFlows] = useState(defaultFlows);
  const { t } = useLanguage();

  const handleFlowChange = (id, newCount) => {
    let val = newCount;
    if (newCount !== '') {
      val = parseInt(newCount, 10);
      if (isNaN(val)) val = 0;
    }
    setFlows(flows.map(f => f.id === id ? { ...f, count: val } : f));
  };

  const handleNext = () => {
    localStorage.setItem('passengerFlows', JSON.stringify(flows));
    navigate('/simulation');
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
      <div className="p-8 border-b border-slate-700 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center">
              <Users className="w-8 h-8 mr-3 text-blue-400" />
              {t.flowTitle}
            </h2>
            <p className="text-slate-400 mt-2 text-lg">{t.flowSubtitle}</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="bg-blue-900/20 border border-blue-500/20 p-5 rounded-xl flex items-start mb-8 shadow-inner">
          <AlertCircle className="w-6 h-6 text-blue-400 mt-0.5 mr-4 flex-shrink-0" />
          <p className="text-sm text-blue-200 leading-relaxed">{t.flowDesc}</p>
        </div>

        <div className="bg-slate-900/50 border border-slate-700 rounded-xl overflow-hidden shadow-inner">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-800/80">
              <tr>
                <th scope="col" className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {t.timePeriod}
                </th>
                <th scope="col" className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {t.estVolume}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {flows.map((flow) => (
                <tr key={flow.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-8 py-5 whitespace-nowrap text-md font-mono text-slate-300">
                    {flow.time}
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={flow.count}
                        onChange={(e) => handleFlowChange(flow.id, e.target.value)}
                        className="w-32 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg transition-all"
                      />
                      <span className="ml-3 text-slate-500 text-sm font-medium">{t.passHr}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-900/80 px-8 py-5 border-t border-slate-700 flex justify-between items-center">
        <button
          onClick={() => navigate('/')}
          className="text-slate-400 hover:text-white font-medium transition-colors"
        >
          {t.backBtn}
        </button>
        <button
          onClick={handleNext}
          className="group relative inline-flex items-center justify-center px-8 py-3 font-bold text-white transition-all duration-200 bg-emerald-600 rounded-lg hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 focus:ring-offset-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
        >
          <span>{t.initBtn}</span>
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
