import React, { createContext, useState, useContext } from 'react';

const LanguageContext = createContext();

export const translations = {
  en: {
    // Navigation
    navRoute: 'Railway Route',
    navFlow: 'Passenger Flow',
    navCommand: 'Command Center',
    appName: 'RailwaySimPro',

    // RoutePage
    routeTitle: 'State Approved Routes',
    routeSubtitle: 'Select a pre-configured railway infrastructure',
    routeVerified: 'System Locked & Verified',
    availLines: 'Available Lines',
    line83: 'Line 83',
    mainStops: '11 Main Stops',
    depotStops: '4 Depot Stops',
    maintMode: 'Maintenance Mode',
    archView: 'Route Architecture View',
    mainLine: 'Main Railway Line',
    zeroTripLine: 'Zero Trip / Depot Access',
    confirmBtn: 'Confirm Configuration & Continue',

    // FlowPage
    flowTitle: 'Passenger Flow Projection',
    flowSubtitle: 'Input estimated hourly commuter volumes to optimize train schedules.',
    flowDesc: 'These values represent the limiting segment traffic (passengers/hr). The simulation engine uses this data along with the Capacity (~100) and Utilization Coefficient (γ=0.36) to compute the exact number of active units required per hour.',
    timePeriod: 'Time Period',
    estVolume: 'Est. Commuter Volume',
    passHr: 'passengers / hr',
    backBtn: '← Back to Route Selection',
    initBtn: 'Initialize Simulation Engine',

    // SimulationPage
    loadingStatus: 'LOADING SCHEDULE',
    loadingDesc: 'Processing passenger flows and route efficiency...',
    sysOffline: 'System Offline',
    sysOfflineDesc: 'Failed to connect to the simulation server. Ensure backend is running.',
    cmdCenter: 'Command Center',
    liveSimLabel: 'Live simulation running for Route 83',
    exportPdf: 'Export PDF Report',
    peakTrains: 'Peak Trains Needed',
    max: 'Max',
    totalPass: 'Total Passengers',
    perDay: '/ day',
    avgInt: 'Avg Interval',
    mins: 'mins',
    sysEff: 'System Efficiency',
    liveRadar: 'Live Radar: March 2025 Schedule',
    sysActive: 'System Active',
    unitDispatch: 'Unit Dispatch Status',
    outputUnits: 'Output Units',
    unit: 'Unit',
    out: 'Out',
    in: 'In',
    loc: 'Loc',
    status: 'Status',
    statusZero: 'ZERO TRIP',
    statusRet: 'RETURNING',
    statusOnLine: 'ON LINE',
    statusParked: 'PARKED',
    capReq: 'Capacity Requirements',
    depBoard: 'Departure Board',
    station: 'Station',
    boardTrain: 'Train',
    boardTime: 'Time',
    boardDest: 'Destination',
    boardStatus: 'Status',
    statDeparted: 'DEPARTED',
    statBoarding: 'BOARDING',
    statOnTime: 'ON TIME',
    statSched: 'SCHEDULED',

    // Analytics
    totalMileage: 'Total Daily Mileage',
    peakHour: 'Peak Demand Hour',
    systemReliability: 'System Reliability',
    efficiencyRating: 'Efficiency Rating',
    tripsCount: 'Total Trips',
    km: 'km',

    // MapVisualizer
    radarLegend: 'Radar Legend',
    mainRouteLeg: 'Main Route 83',
    depotRouteLeg: 'Depot Access Line',
    unitStatLeg: 'Unit Status',
    mazActiveLeg: 'MAZ-303 (Active)',
    mazZeroLeg: 'Zero-trip (Empty)'
  },
  ru: {
    // Navigation
    navRoute: 'Маршрут ЖД',
    navFlow: 'Пассажиропоток',
    navCommand: 'Диспетчерский центр',
    appName: 'RailwaySimPro',

    // RoutePage
    routeTitle: 'Утвержденные маршруты',
    routeSubtitle: 'Выберите предварительно настроенную инфраструктуру',
    routeVerified: 'Система защищена',
    availLines: 'Доступные линии',
    line83: 'Линия 83',
    mainStops: '11 Осн. остановок',
    depotStops: '4 Остан. депо',
    maintMode: 'Техобслуживание',
    archView: 'Архитектура маршрута',
    mainLine: 'Основная линия маршрута',
    zeroTripLine: 'Нулевой рейс / Доступ в депо',
    confirmBtn: 'Подтвердить и продолжить',

    // FlowPage
    flowTitle: 'Прогноз пассажиропотока',
    flowSubtitle: 'Введите расчетные объемы пассажиропотока.',
    flowDesc: 'Эти значения представляют собой пропускную способность лимитирующего перегона (пасс./ч). Симуляция использует эти данные (вместимость ~100, γ=0.36) для расчета количества поездов.',
    timePeriod: 'Период времени',
    estVolume: 'Объем пассажиров',
    passHr: 'пасс. / час',
    backBtn: '← Назад к выбору',
    initBtn: 'Запустить симуляцию',

    // SimulationPage
    loadingStatus: 'ЗАГРУЗКА РАСПИСАНИЯ',
    loadingDesc: 'Обработка пассажиропотока и эффективности...',
    sysOffline: 'Система отключена',
    sysOfflineDesc: 'Не удалось подключиться к серверу. Убедитесь, что бэкенд работает.',
    cmdCenter: 'Диспетчерский центр',
    liveSimLabel: 'Живая симуляция для Линии 83',
    exportPdf: 'Экспорт PDF отчета',
    peakTrains: 'Макс. поездов',
    max: 'Макс',
    totalPass: 'Всего пассажиров',
    perDay: '/ день',
    avgInt: 'Ср. интервал',
    mins: 'мин',
    sysEff: 'Эффективность',
    liveRadar: 'Радар: Расписание Март 2025',
    sysActive: 'Система активна',
    unitDispatch: 'Статус отправки составов',
    outputUnits: 'Выпуски',
    unit: 'Состав',
    out: 'Выезд',
    in: 'Заезд',
    loc: 'Локация',
    status: 'Статус',
    statusZero: 'НУЛЕВОЙ РЕЙС',
    statusRet: 'ВОЗВРАЩЕНИЕ',
    statusOnLine: 'НА ЛИНИИ',
    statusParked: 'В ПАРКЕ',
    capReq: 'Требования к вместимости',
    depBoard: 'Табло отправления',
    station: 'Станция',
    boardTrain: 'Поезд',
    boardTime: 'Время',
    boardDest: 'Назначение',
    boardStatus: 'Статус',
    statDeparted: 'ОТПРАВЛЕН',
    statBoarding: 'ПОСАДКА',
    statOnTime: 'ВОВРЕМЯ',
    statSched: 'ПО РАСПИСАНИЮ',

    // Analytics
    totalMileage: 'Общий пробег за день',
    peakHour: 'Час пикового спроса',
    systemReliability: 'Надежность системы',
    efficiencyRating: 'Рейтинг эффективности',
    tripsCount: 'Всего рейсов',
    km: 'км',

    // MapVisualizer
    radarLegend: 'Легенда радара',
    mainRouteLeg: 'Основной маршрут 83',
    depotRouteLeg: 'Доступ в депо',
    unitStatLeg: 'Статус составов',
    mazActiveLeg: 'МАЗ-303 (Активен)',
    mazZeroLeg: 'Нулевой рейс (Пустой)'
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('sim_lang') || 'ru');

  const toggleLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('sim_lang', newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: toggleLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
