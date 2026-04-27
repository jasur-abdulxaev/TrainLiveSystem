import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Train, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const STATE_APPROVED_STATIONS = [
  { id: 'S1', name: 'Вишенка', type: 'main' },
  { id: 'S2', name: 'Стадион', type: 'main' },
  { id: 'S3', name: 'Яна Скрыгана', type: 'main' },
  { id: 'S4', name: 'Свислочская', type: 'main' },
  { id: 'S5', name: 'посёлок Монтажник', type: 'main' },
  { id: 'S6', name: 'Ледное', type: 'main' },
  { id: 'S7', name: 'Энергетиков', type: 'main' },
  { id: 'S8', name: 'пл. Свободы', type: 'main' },
  { id: 'S9', name: 'Водоканал', type: 'main' },
  { id: 'S10', name: 'Октябрьское депо', type: 'main' },
  { id: 'S11', name: 'Петруся Бровки', type: 'main' },
  { id: 'S12', name: 'Полярная', type: 'depot' },
  { id: 'S13', name: 'Великий Бор', type: 'depot' },
  { id: 'S14', name: 'Кинотеатр "Салют"', type: 'depot' },
  { id: 'S15', name: 'Индустриальная', type: 'depot' }
];

export default function RoutePage() {
  const navigate = useNavigate();
  const [selectedRoute, setSelectedRoute] = useState('83');
  const { t } = useLanguage();

  const handleNext = () => {
    localStorage.setItem('routeStops', JSON.stringify(STATE_APPROVED_STATIONS));
    navigate('/flow');
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
      <div className="p-8 border-b border-slate-700 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center">
              <ShieldCheck className="w-8 h-8 mr-3 text-emerald-400" />
              {t.routeTitle}
            </h2>
            <p className="text-slate-400 mt-2 text-lg">{t.routeSubtitle}</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-lg flex items-center">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2"></div>
            <span className="text-emerald-400 font-medium text-sm">{t.routeVerified}</span>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-xl font-semibold text-white mb-4">{t.availLines}</h3>
            
            <div 
              className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                selectedRoute === '83' 
                  ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                  : 'bg-slate-800 border-slate-700 hover:border-slate-600'
              }`}
              onClick={() => setSelectedRoute('83')}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-blue-400 font-bold text-2xl">{t.line83}</span>
                {selectedRoute === '83' && <CheckCircle2 className="w-6 h-6 text-blue-500" />}
              </div>
              <p className="text-slate-400 text-sm">Вишенка ⇄ Петруся Бровки</p>
              <div className="mt-4 flex items-center text-xs font-medium text-slate-500 space-x-4">
                <span className="flex items-center"><Train className="w-4 h-4 mr-1" /> {t.mainStops}</span>
                <span className="flex items-center bg-slate-700/50 px-2 py-1 rounded text-slate-300">{t.depotStops}</span>
              </div>
            </div>

            <div className="p-5 rounded-xl border-2 border-slate-700 bg-slate-800/50 opacity-50 cursor-not-allowed">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-500 font-bold text-2xl">Line 42</span>
              </div>
              <p className="text-slate-500 text-sm">{t.maintMode}</p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-xl font-semibold text-white mb-4">{t.archView}</h3>
            <div className="bg-slate-900 rounded-xl p-6 border border-slate-700 shadow-inner h-[400px] overflow-y-auto custom-scrollbar">
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.mainLine}</div>
                {STATE_APPROVED_STATIONS.filter(s => s.type === 'main').map((stop, index) => (
                  <div key={stop.id} className="flex items-center group">
                    <div className="w-12 text-right mr-4 text-slate-500 font-mono text-sm">{stop.id}</div>
                    <div className="relative flex flex-col items-center justify-center mr-4">
                      <div className={`w-3 h-3 rounded-full z-10 ${index === 0 || index === 10 ? 'bg-red-500 scale-125' : 'bg-slate-400 group-hover:bg-blue-400 transition-colors'}`}></div>
                      {index !== 10 && <div className="absolute top-3 w-0.5 h-full bg-slate-700 -z-0"></div>}
                    </div>
                    <div className="bg-slate-800 px-4 py-2 rounded-lg flex-grow border border-slate-700 group-hover:border-slate-600 transition-colors">
                      <p className="text-slate-200 font-medium">{stop.name}</p>
                    </div>
                  </div>
                ))}

                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-8 mb-2">{t.zeroTripLine}</div>
                {STATE_APPROVED_STATIONS.filter(s => s.type === 'depot').map((stop, index) => (
                  <div key={stop.id} className="flex items-center opacity-80 group">
                    <div className="w-12 text-right mr-4 text-slate-600 font-mono text-sm">{stop.id}</div>
                    <div className="relative flex flex-col items-center justify-center mr-4">
                      <div className="w-2.5 h-2.5 rounded-sm bg-slate-600 z-10"></div>
                      {index !== 3 && <div className="absolute top-2.5 w-0.5 h-full bg-slate-700/50 -z-0"></div>}
                    </div>
                    <div className="bg-slate-800/50 px-4 py-2 rounded-lg flex-grow border border-slate-700/50">
                      <p className="text-slate-400 font-medium">{stop.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="bg-slate-900/80 px-8 py-5 border-t border-slate-700 flex justify-end">
        <button
          onClick={handleNext}
          className="group relative inline-flex items-center justify-center px-8 py-3 font-bold text-white transition-all duration-200 bg-blue-600 rounded-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 focus:ring-offset-slate-900"
        >
          <span>{t.confirmBtn}</span>
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
