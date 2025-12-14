
import React, { useState, useEffect } from 'react';
import { Target, Flag, TrendingUp, Calculator, DollarSign, Users, HelpCircle, CheckCircle2, TrendingDown, BarChart3, Activity, Briefcase, Wallet, Percent, AlertCircle, Settings } from 'lucide-react';

interface ObjectivesDashboardProps {
    currentBilling: number; // Facturación Actual (Annual)
    currentActivities: number; // PL + PB Realizados (Annual)
    currentRatio: number; // Ratio Histórico Real
    pipelineValue?: number; // New: Latent Revenue
}

const ObjectivesDashboard: React.FC<ObjectivesDashboardProps> = ({ currentBilling, currentActivities, currentRatio, pipelineValue = 0 }) => {
  // --- STATE: INPUTS ---
  const [annualBillingTarget, setAnnualBillingTarget] = useState<number>(40000); 
  const [monthlyNeed, setMonthlyNeed] = useState<number>(800); 
  const [commissionSplit, setCommissionSplit] = useState<number>(45); 
  const [averageTicket, setAverageTicket] = useState<number>(43000); 
  
  // Market Defaults
  const [commercialWeeks, setCommercialWeeks] = useState<number>(48); 

  // Ratio Override
  const [isManualRatio, setIsManualRatio] = useState<boolean>(false);
  const [manualRatio, setManualRatio] = useState<number>(6);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('objectives_settings');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            setAnnualBillingTarget(parsed.annualBillingTarget || 40000);
            setMonthlyNeed(parsed.monthlyNeed || 800);
            setCommissionSplit(parsed.commissionSplit || 45);
            setAverageTicket(parsed.averageTicket || 43000);
            setCommercialWeeks(parsed.commercialWeeks || 48);
            setIsManualRatio(parsed.isManualRatio || false);
            setManualRatio(parsed.manualRatio || 6);
        } catch (e) { console.error("Error loading objectives", e); }
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    const settings = { 
        annualBillingTarget, 
        monthlyNeed, 
        commissionSplit, 
        averageTicket, 
        commercialWeeks,
        isManualRatio,
        manualRatio
    };
    localStorage.setItem('objectives_settings', JSON.stringify(settings));
  }, [annualBillingTarget, monthlyNeed, commissionSplit, averageTicket, commercialWeeks, isManualRatio, manualRatio]);


  // --- CALCULATIONS ---

  // 1. Financial Goals
  const annualLifestyleCost = monthlyNeed * 12;
  const projectedNetIncome = annualBillingTarget * (commissionSplit / 100); 
  const currentNetIncome = currentBilling * (commissionSplit / 100);
  const isGoalSufficient = projectedNetIncome >= annualLifestyleCost;

  // 2. Transaction Volume Needed
  const commissionPerSale = averageTicket * 0.03; // Avg 3% per side
  const transactionsNeeded = commissionPerSale > 0 ? annualBillingTarget / commissionPerSale : 0;

  // 3. THEORETICAL PLAN (Based on Market Standard 6:1)
  const theoreticalPLPBNeeded = transactionsNeeded * 6; // The 6-1 Rule
  const theoreticalCriticalNumber = commercialWeeks > 0 ? theoreticalPLPBNeeded / commercialWeeks : 0;

  // 4. REALITY ADJUSTED PLAN (Based on Historical User Ratio OR Manual Override)
  // Logic: If Manual is ON, use Manual. Else, use Historical if > 0. Else fallback to 6.
  const effectiveRatio = isManualRatio 
      ? manualRatio 
      : (currentRatio > 0 ? currentRatio : 6);
  
  const realPLPBNeeded = transactionsNeeded * effectiveRatio;
  const realCriticalNumber = commercialWeeks > 0 ? realPLPBNeeded / commercialWeeks : 0;

  // Gap Analysis
  const workLoadIncrease = realCriticalNumber - theoreticalCriticalNumber;
  const isPerformanceGood = effectiveRatio <= 6;

  // Progress Tracking (Annual)
  const billingProgress = (currentBilling / annualBillingTarget) * 100;
  const incomeProgress = (currentNetIncome / projectedNetIncome) * 100;
  const lifestyleCoverage = (currentNetIncome / annualLifestyleCost) * 100;

  const currentWeek = getWeekNumber(new Date());
  const weeksPassed = currentWeek; 
  const actualWeeklyAvg = weeksPassed > 0 ? (currentActivities / weeksPassed) : 0;

  // Dynamic status color
  const getStatusColor = () => {
      if (actualWeeklyAvg >= realCriticalNumber) return 'text-emerald-500';
      if (actualWeeklyAvg >= theoreticalCriticalNumber) return 'text-amber-500';
      return 'text-rose-500';
  };

  // --- FORMATTERS ---
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  const formatNumber = (val: number, decimals: number = 1) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(val);

  return (
    <div className="space-y-8 pb-20 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#364649] tracking-tight">Objetivos y Proyección</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[#364649]/60 text-sm font-medium">Planificación Anual Dinámica</p>
          </div>
        </div>
        
        {/* Top Level Summary Badge */}
        <div className="bg-[#364649] text-white px-5 py-2 rounded-xl shadow-lg flex items-center gap-4">
            <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-white/50">Meta Anual (Bruta)</p>
                <p className="text-xl font-bold text-[#AA895F]">{formatCurrency(annualBillingTarget)}</p>
            </div>
            <div className="h-8 w-px bg-white/20"></div>
            <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-white/50">Tu Ingreso (Est.)</p>
                <p className="text-xl font-bold text-white">{formatCurrency(projectedNetIncome)}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COL: CONFIGURATION PANEL */}
          <div className="lg:col-span-4 space-y-6">
              
              {/* Config Form */}
              <div className="bg-white border border-[#364649]/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                  <h2 className="text-lg font-bold mb-4 flex items-center text-[#364649]">
                      <SettingsIcon className="mr-2" size={20}/> Variables del Negocio
                  </h2>
                  
                  <div className="space-y-5 relative z-10">
                      <div>
                          <label className="block text-xs font-bold uppercase text-[#364649]/50 mb-1">Facturación Objetivo (Bruta)</label>
                          <div className="relative">
                              <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AA895F]"/>
                              <input 
                                type="number" 
                                value={annualBillingTarget || ''}
                                onChange={(e) => setAnnualBillingTarget(Number(e.target.value))}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-[#364649] font-bold text-xl focus:outline-none focus:border-[#AA895F] focus:ring-1 focus:ring-[#AA895F]"
                              />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-[10px] font-bold uppercase text-[#364649]/50 mb-1">Split Agente (%)</label>
                              <div className="relative">
                                <input type="number" value={commissionSplit || ''} onChange={(e) => setCommissionSplit(Number(e.target.value))} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#364649] font-bold"/>
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#364649]/40">%</span>
                              </div>
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold uppercase text-[#364649]/50 mb-1">Costo Vida Mes</label>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#364649]/40">$</span>
                                <input type="number" value={monthlyNeed || ''} onChange={(e) => setMonthlyNeed(Number(e.target.value))} className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-5 pr-3 py-2 text-sm text-[#364649] font-bold"/>
                              </div>
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-[10px] font-bold uppercase text-[#364649]/50 mb-1">Ticket Promedio</label>
                              <input type="number" value={averageTicket || ''} onChange={(e) => setAverageTicket(Number(e.target.value))} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#364649]"/>
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold uppercase text-[#364649]/50 mb-1">Sem. Comerciales</label>
                              <input type="number" value={commercialWeeks || ''} onChange={(e) => setCommercialWeeks(Number(e.target.value))} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#364649]"/>
                          </div>
                      </div>

                      {/* Manual Ratio Override */}
                      <div className="bg-[#364649]/5 rounded-xl p-3 border border-[#364649]/10">
                          <div className="flex justify-between items-center mb-2">
                              <label className="text-[10px] font-bold uppercase text-[#364649]/60">Calibración Efectividad</label>
                              <div 
                                className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${isManualRatio ? 'bg-[#AA895F]' : 'bg-gray-300'}`}
                                onClick={() => setIsManualRatio(!isManualRatio)}
                              >
                                  <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${isManualRatio ? 'translate-x-4' : 'translate-x-0'}`}></div>
                              </div>
                          </div>
                          {isManualRatio ? (
                              <div className="flex items-center gap-2">
                                  <input 
                                    type="number" 
                                    value={manualRatio} 
                                    onChange={(e) => setManualRatio(Number(e.target.value))} 
                                    className="w-full bg-white border border-[#AA895F] rounded-lg px-3 py-1.5 text-sm font-bold text-[#364649] text-center"
                                  />
                                  <span className="text-xs font-bold text-[#364649]/60">a 1</span>
                              </div>
                          ) : (
                              <div className="text-xs text-[#364649]/60 italic text-center py-1">
                                  Usando histórico real ({currentRatio > 0 ? currentRatio.toFixed(1) : 'Sin datos'})
                              </div>
                          )}
                      </div>

                      <div className="pt-4 border-t border-[#364649]/10">
                          <div className="flex justify-between items-center text-sm">
                              <span className="text-[#364649]/60">Transacciones Nec.:</span>
                              <span className="font-bold text-[#AA895F] text-lg">{formatNumber(transactionsNeeded, 1)}</span>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Lifestyle Validation */}
              <div className={`rounded-3xl p-6 border shadow-sm ${isGoalSufficient ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                  <h3 className={`text-xs font-bold uppercase mb-4 flex items-center ${isGoalSufficient ? 'text-emerald-800' : 'text-rose-800'}`}>
                      <Calculator size={14} className="mr-2"/> Validación Financiera
                  </h3>
                  <div className="flex justify-between items-center mb-2 text-sm">
                      <span className="text-black/50">Tu Ingreso Neto ({commissionSplit}%):</span>
                      <span className="font-bold">{formatCurrency(projectedNetIncome)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-black/5 pt-2 mt-2">
                      <span className="text-black/50">Costo de Vida Anual:</span>
                      <span className="font-bold">{formatCurrency(annualLifestyleCost)}</span>
                  </div>
                  {!isGoalSufficient && (
                      <div className="mt-3 text-xs text-rose-600 bg-rose-100 p-2 rounded-lg text-center font-bold">
                          ⚠️ Tu meta no cubre tus costos. Aumenta la facturación.
                      </div>
                  )}
              </div>
          </div>

          {/* RIGHT COL: MAIN DASHBOARD */}
          <div className="lg:col-span-8 flex flex-col gap-8">
              
              {/* SECTION 1: WORK PLAN (THEORETICAL VS REALITY) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* CARD 1: THEORETICAL */}
                  <div className="bg-white border border-[#364649]/10 rounded-3xl p-6 shadow-sm opacity-60 hover:opacity-100 transition-opacity flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-4">
                          <div>
                              <h3 className="text-sm font-bold text-[#364649] uppercase">Plan Estándar</h3>
                              <p className="text-xs text-[#364649]/50">Ratio Mercado (6:1)</p>
                          </div>
                          <div className="bg-gray-100 p-2 rounded-lg text-[#364649]"><Activity size={20}/></div>
                      </div>
                      <div className="text-center py-2">
                          <span className="text-4xl font-bold text-[#364649]">{formatNumber(theoreticalCriticalNumber)}</span>
                          <p className="text-xs font-bold text-[#364649]/40 uppercase mt-1">Gestiones Semanales (PL/PB)</p>
                      </div>
                  </div>

                  {/* CARD 2: REALITY (Adjusted) */}
                  <div className={`bg-white border-2 rounded-3xl p-6 shadow-xl relative overflow-hidden ${isPerformanceGood ? 'border-emerald-500/30' : 'border-orange-500/30'}`}>
                      <div className={`absolute top-0 left-0 w-full h-1 ${isPerformanceGood ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                      <div className="flex justify-between items-start mb-4">
                          <div>
                              <h3 className="text-lg font-bold text-[#364649] uppercase">Tu Plan Personal</h3>
                              <p className="text-xs text-[#364649]/60">
                                  {isManualRatio ? 'Ajustado Manualmente' : 'Ajustado por tu Efectividad Real'}
                              </p>
                          </div>
                          <div className={`p-2 rounded-lg text-white ${isPerformanceGood ? 'bg-emerald-500' : 'bg-orange-500'}`}>
                              <TrendingUp size={24}/>
                          </div>
                      </div>

                      <div className="text-center py-2 relative">
                          <span className={`text-6xl font-black ${isPerformanceGood ? 'text-[#364649]' : 'text-orange-600'}`}>
                              {formatNumber(realCriticalNumber)}
                          </span>
                          <p className="text-sm font-bold text-[#364649]/60 uppercase mt-1">Gestiones Semanales (PL/PB)</p>
                          
                          {!isPerformanceGood && (
                              <div className="mt-2 inline-block bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-full border border-orange-200">
                                  Debes hacer +{formatNumber(workLoadIncrease)} vs mercado para compensar ratio.
                              </div>
                          )}
                      </div>
                  </div>
              </div>

              {/* SECTION 2: EFFECTIVENESS MONITOR */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#364649]/10">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="bg-[#364649] p-2 rounded-lg text-white"><Target size={20}/></div>
                      <h3 className="text-lg font-bold text-[#364649]">Monitor de Efectividad y Actividad</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* GAUGE: RATIO */}
                      <div>
                          <div className="flex justify-between items-end mb-2">
                              <span className="text-xs font-bold uppercase text-[#364649]/50">
                                  {isManualRatio ? 'Tu Efectividad (Manual)' : 'Tu Efectividad Histórica'}
                              </span>
                              <span className={`text-2xl font-bold ${isPerformanceGood ? 'text-emerald-600' : 'text-orange-500'}`}>
                                  {effectiveRatio.toFixed(1)} <span className="text-sm text-[#364649]/40">: 1</span>
                              </span>
                          </div>
                          <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden relative">
                              {/* Market Benchmark Marker */}
                              <div className="absolute top-0 bottom-0 w-0.5 bg-[#364649] z-10" style={{left: '60%'}} title="Mercado (6)"></div>
                              
                              {/* The Bar */}
                              <div 
                                className={`h-full transition-all duration-1000 ${isPerformanceGood ? 'bg-emerald-500' : 'bg-orange-500'}`}
                                style={{ width: `${Math.min((effectiveRatio / 10) * 100, 100)}%` }} // Scale to 10
                              ></div>
                          </div>
                          <div className="flex justify-between text-[10px] text-[#364649]/40 mt-1">
                              <span>0 (Ideal)</span>
                              <span className="text-[#364649]">Mercado (6:1)</span>
                              <span>10+ (Alerta)</span>
                          </div>
                      </div>

                      {/* BAR: WEEKLY ACTIVITY */}
                      <div>
                          <div className="flex justify-between items-end mb-2">
                              <span className="text-xs font-bold uppercase text-[#364649]/50">Ritmo de Actividad (PL/PB)</span>
                              <span className={`text-2xl font-bold ${getStatusColor()}`}>
                                  {formatNumber(actualWeeklyAvg)} <span className="text-sm text-[#364649]/40">/sem</span>
                              </span>
                          </div>
                          <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden relative">
                              {/* Target Marker */}
                              <div className="absolute top-0 bottom-0 w-0.5 bg-[#AA895F] z-10" style={{left: `${Math.min((realCriticalNumber / (realCriticalNumber * 1.5)) * 100, 100)}%`}} title="Tu Meta"></div>
                              
                              <div 
                                className={`h-full transition-all duration-1000 ${actualWeeklyAvg >= realCriticalNumber ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                style={{ width: `${Math.min((actualWeeklyAvg / (realCriticalNumber * 1.5)) * 100, 100)}%` }}
                              ></div>
                          </div>
                          <div className="flex justify-between text-[10px] text-[#364649]/40 mt-1">
                              <span>0</span>
                              <span className="text-[#AA895F]">Meta: {formatNumber(realCriticalNumber)}</span>
                          </div>
                      </div>
                  </div>
              </div>

              {/* SECTION 3: FINANCIAL MONITOR (SPLIT GROSS vs NET) */}
              <div className="bg-[#364649] text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5"><Wallet size={140} /></div>
                  
                  <div className="flex items-center gap-3 mb-8 relative z-10">
                      <BarChart3 className="text-[#AA895F]" size={24}/>
                      <h3 className="text-xl font-bold">Ejecución Financiera Anual</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                      
                      {/* A) GROSS BILLING (Facturacion Total) */}
                      <div>
                          <div className="flex justify-between items-end mb-2">
                              <span className="text-xs font-bold uppercase text-white/50 flex items-center">
                                  <DollarSign size={14} className="mr-1"/> Facturación Bruta
                              </span>
                              <span className="text-2xl font-bold text-white">{formatCurrency(currentBilling)}</span>
                          </div>
                          <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden mb-1">
                              <div 
                                className="h-full bg-gradient-to-r from-white/40 to-white"
                                style={{ width: `${Math.min(billingProgress, 100)}%` }}
                              ></div>
                          </div>
                          <div className="flex justify-between text-[10px] text-white/40">
                              <span>0</span>
                              <span>Meta: {formatCurrency(annualBillingTarget)}</span>
                          </div>
                      </div>

                      {/* B) NET INCOME (Honorarios / Bolsillo) */}
                      <div>
                          <div className="flex justify-between items-end mb-2">
                              <span className="text-xs font-bold uppercase text-[#AA895F] flex items-center">
                                  <Wallet size={14} className="mr-1"/> Tus Honorarios (Neto)
                              </span>
                              <span className="text-2xl font-bold text-[#AA895F]">{formatCurrency(currentNetIncome)}</span>
                          </div>
                          <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden mb-1">
                              <div 
                                className="h-full bg-gradient-to-r from-[#AA895F] to-[#d4b483]"
                                style={{ width: `${Math.min(incomeProgress, 100)}%` }}
                              ></div>
                          </div>
                          <div className="flex justify-between text-[10px] text-white/40">
                              <span>Costo Vida: {lifestyleCoverage.toFixed(0)}% Cubierto</span>
                              <span>Meta: {formatCurrency(projectedNetIncome)}</span>
                          </div>
                      </div>

                  </div>
              </div>

              {/* SECTION 4: PIPELINE / LATENT REVENUE (LAG SOLUTION) */}
              <div className="bg-white border border-[#364649]/10 rounded-3xl p-8 shadow-lg flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5"><Briefcase size={120} /></div>
                  
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 relative z-10 gap-4">
                      <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Briefcase size={24}/></div>
                          <div>
                              <h3 className="text-lg font-bold text-[#364649]">Valor Latente del Negocio</h3>
                              <p className="text-xs text-[#364649]/50">Lag de facturación (Pipeline Ponderado)</p>
                          </div>
                      </div>
                      <div className="text-right">
                          <div className="text-4xl font-black text-[#364649]">{formatCurrency(pipelineValue)}</div>
                      </div>
                  </div>

                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 relative z-10 flex gap-4 items-start">
                      <HelpCircle size={20} className="text-blue-400 shrink-0 mt-0.5"/>
                      <div className="space-y-2">
                          <p className="text-sm text-blue-900 leading-snug font-medium">
                              Dinero "en camino" basado en tu stock activo y búsquedas calificadas.
                          </p>
                          <p className="text-xs text-blue-800/70 leading-relaxed">
                              Aunque no hayas facturado esta semana, mantener este número alto garantiza cierres en los próximos 90 días.
                              Cálculo: Stock Activo (30% prob.) + Búsquedas Activas (20% prob.).
                          </p>
                      </div>
                  </div>
              </div>

          </div>
      </div>
    </div>
  );
};

function getWeekNumber(d: Date) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

const SettingsIcon = ({ size, className }: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);

export default ObjectivesDashboard;
