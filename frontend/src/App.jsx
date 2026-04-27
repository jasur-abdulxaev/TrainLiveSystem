import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import RoutePage from './pages/RoutePage';
import FlowPage from './pages/FlowPage';
import SimulationPage from './pages/SimulationPage';
import { Train, Map, Users, LayoutDashboard, Globe } from 'lucide-react';
import { useLanguage } from './context/LanguageContext';

function Navigation() {
  const location = useLocation();
  const { t, lang, setLang } = useLanguage();
  
  const navItems = [
    { path: '/', label: t.navRoute, icon: Map },
    { path: '/flow', label: t.navFlow, icon: Users },
    { path: '/simulation', label: t.navCommand, icon: LayoutDashboard },
  ];

  return (
    <nav className="bg-slate-900 text-white shadow-xl border-b border-slate-800 relative z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/30">
              <Train className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              {t.appName}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      isActive 
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-inner' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
            
            <div className="border-l border-slate-700 pl-4 flex items-center space-x-2">
              <Globe className="w-4 h-4 text-slate-400" />
              <button 
                onClick={() => setLang('ru')} 
                className={`text-xs font-bold px-2 py-1 rounded ${lang === 'ru' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                RU
              </button>
              <button 
                onClick={() => setLang('en')} 
                className={`text-xs font-bold px-2 py-1 rounded ${lang === 'en' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#0f172a]">
        <Navigation />
        <main className="flex-grow max-w-7xl w-full mx-auto p-6 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[120px] pointer-events-none rounded-full" />
          <div className="relative z-10">
            <Routes>
              <Route path="/" element={<RoutePage />} />
              <Route path="/flow" element={<FlowPage />} />
              <Route path="/simulation" element={<SimulationPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
