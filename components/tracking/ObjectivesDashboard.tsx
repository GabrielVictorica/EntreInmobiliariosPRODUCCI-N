
import React, { useState, useEffect } from 'react';
import {
    Flag,
    Target,
    BarChart3,
    TrendingUp,
    Activity,
    DollarSign,
    Settings as SettingsIcon,
    AlertCircle,
    CheckCircle2,
    Calculator,
    Users,

} from 'lucide-react';
import { PropertyRecord, VisitRecord, ActivityRecord } from '../../types';


// Components
import CaptationProjector from './CaptationProjector';

interface ObjectivesDashboardProps {
    currentBilling: number;
    currentActivities: number; // PL + PB
    currentRatio: number; // e.g. 6.0 meaning 6:1
    pipelineValue: number;
    weeksOfData: number;
    totalClosings: number;
    captationStats: {
        preListings: number;
        listings: number;
    };
    historicalAverageTicket: number;
    // New Props
    properties: PropertyRecord[];
    activities: ActivityRecord[]; // All activities for calculation
    visits: VisitRecord[]; // All visits for alerts
    onNavigate: (view: any, params?: any) => void;
}

// Helper: Get Week Number
const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
};

const DebouncedInput = ({
    value,
    onChange,
    className,
    id,
    disabled,
    ...props
}: {
    value: number;
    onChange: (val: number) => void;
    className?: string;
    id?: string;
    disabled?: boolean;
    [key: string]: any;
}) => {
    const [localValue, setLocalValue] = useState<string>(value.toString());

    useEffect(() => {
        setLocalValue(value.toString());
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Allow strictly numeric input (digits and one decimal point)
        if (val === '' || /^\d*\.?\d*$/.test(val)) {
            setLocalValue(val);
        }
    };

    const handleBlur = () => {
        let num = parseFloat(localValue);
        if (localValue === '' || isNaN(num)) {
            // Revert to original value if empty or invalid
            setLocalValue(value.toString());
        } else {
            onChange(num);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleBlur();
            (e.target as HTMLInputElement).blur();
        }
    };

    return (
        <input
            {...props}
            id={id}
            type="text"
            inputMode="decimal"
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={className}
        />
    );
};

function ObjectivesDashboard({
    currentBilling,
    currentActivities,
    currentRatio,
    pipelineValue,
    weeksOfData,
    totalClosings,
    captationStats,
    historicalAverageTicket,
    properties = [],
    activities = [],
    visits = [],
    onNavigate,
    financialGoals,
    onUpdateGoals
}: ObjectivesDashboardProps & {
    financialGoals: any;
    onUpdateGoals: (goals: any) => void;
}) {

    // --- SHARED STATE FROM PROPS ---
    const {
        annualBilling: annualBillingTarget,
        commissionSplit,
        monthlyNeed,
        averageTicket,
        commercialWeeks,
        manualRatio,
        isManualRatio,
        isManualTicket
    } = financialGoals;

    // Handlers for updates
    const updateGoal = (key: string, value: any) => {
        onUpdateGoals({ [key]: value });
    };

    // 1. Annual Billing Target
    const monthlyGoal = monthlyNeed / (commissionSplit / 100);
    const projectedNetIncome = currentBilling * (commissionSplit / 100);
    const annualLifestyleCost = monthlyNeed * 12;
    const isGoalSufficient = (annualBillingTarget * (commissionSplit / 100)) >= annualLifestyleCost;

    // 2. Transaction Volume Needed
    const commissionPerSale = averageTicket * 0.03; // Avg 3% per side.
    const transactionsNeeded = commissionPerSale > 0 ? annualBillingTarget / commissionPerSale : 0;

    // 3. THEORETICAL PLAN (Based on Market Standard 6:1)
    const theoreticalPLPBNeeded = transactionsNeeded * 6; // The 6-1 Rule
    const theoreticalCriticalNumber = commercialWeeks > 0 ? theoreticalPLPBNeeded / commercialWeeks : 0;

    // 4. REALITY ADJUSTED PLAN
    const effectiveRatio = isManualRatio
        ? manualRatio
        : (currentRatio > 0 ? currentRatio : 6);

    const realPLPBNeeded = transactionsNeeded * effectiveRatio;
    const realCriticalNumber = commercialWeeks > 0 ? realPLPBNeeded / commercialWeeks : 0;

    // Gap Analysis
    const workLoadIncrease = realCriticalNumber - theoreticalCriticalNumber;
    const isPerformanceGood = effectiveRatio <= 6;

    // --- SUFFICIENCY CHECKS ---
    const isSufficientGeneralData = weeksOfData >= 17 && totalClosings >= 5;
    const isSufficientCaptationData = weeksOfData >= 17 && captationStats.preListings >= 5;

    // --- AUTO-UPDATES BASED ON SUFFICIENCY ---
    useEffect(() => {
        if (isSufficientGeneralData) {
            if (isManualRatio) updateGoal('isManualRatio', false);
            if (historicalAverageTicket > 0 && isManualTicket) {
                updateGoal('averageTicket', historicalAverageTicket);
                updateGoal('isManualTicket', false);
            }
        }
    }, [isSufficientGeneralData, historicalAverageTicket, isManualTicket, isManualRatio]);

    // Metrics for Charts
    const generalConversionPercent = effectiveRatio > 0 ? (1 / effectiveRatio) * 100 : 0;
    const captationRatio = captationStats.listings > 0 ? captationStats.preListings / captationStats.listings : 0;
    const captationConversionPercent = captationStats.preListings > 0 ? (captationStats.listings / captationStats.preListings) * 100 : 0;

    // --- FORMATTERS ---
    const billingProgress = annualBillingTarget > 0 ? (currentBilling / annualBillingTarget) * 100 : 0;
    const targetNetIncome = annualBillingTarget * (commissionSplit / 100);
    const realIncomeProgress = targetNetIncome > 0 ? (projectedNetIncome / targetNetIncome) * 100 : 0;

    // Calculate actual weekly average
    const actualWeeklyAvg = weeksOfData > 0 ? currentActivities / weeksOfData : 0;

    const getStatusColor = () => {
        if (actualWeeklyAvg >= realCriticalNumber) return 'text-emerald-500';
        if (actualWeeklyAvg >= theoreticalCriticalNumber) return 'text-amber-500';
        return 'text-rose-500';
    };

    // --- FORMATTERS ---
    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    const formatNumber = (val: number, decimals: number = 1) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(val);

    return (
        <div className="space-y-6 pb-20">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#364649] tracking-tight">Planificación Anual</h1>
                    <p className="text-[#364649]/60 text-sm font-medium">Define tus metas y ajusta tu plan.</p>
                </div>
            </div>


            {/* TAB CONTENT: PLANNING (Existing Dashboard) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in-up">

                {/* LEFT COL: PLANNING TOOLS (Inputs) */}
                <div className="lg:col-span-4 space-y-6">

                    {/* 1. CONFIGURATION */}
                    <div className="bg-white border border-[#364649]/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                        <h2 className="text-lg font-bold mb-4 flex items-center text-[#364649]">
                            <SettingsIcon className="mr-2" size={20} /> Variables del Negocio
                        </h2>

                        <div className="space-y-5 relative z-10">
                            <div>
                                <label htmlFor="annualBilling" className="block text-xs font-bold uppercase text-[#364649]/50 mb-1">Facturación Objetivo (Bruta)</label>
                                <div className="relative">
                                    <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AA895F]" />
                                    <DebouncedInput
                                        id="annualBilling"
                                        value={annualBillingTarget || 0}
                                        onChange={(val) => updateGoal('annualBilling', val)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-[#364649] font-bold text-xl focus:outline-none focus:border-[#AA895F] focus:ring-1 focus:ring-[#AA895F]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="commissionSplit" className="block text-[10px] font-bold uppercase text-[#364649]/50 mb-1">Split Agente (%)</label>
                                    <div className="relative">
                                        <DebouncedInput
                                            id="commissionSplit"
                                            value={commissionSplit || 0}
                                            onChange={(val) => updateGoal('commissionSplit', val)}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#364649] font-bold"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#364649]/40">%</span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="monthlyNeed" className="block text-[10px] font-bold uppercase text-[#364649]/50 mb-1">Costo Vida Mes</label>
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#364649]/40">$</span>
                                        <DebouncedInput
                                            id="monthlyNeed"
                                            value={monthlyNeed || 0}
                                            onChange={(val) => updateGoal('monthlyNeed', val)}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-5 pr-3 py-2 text-sm text-[#364649] font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label htmlFor="averageTicket" className="block text-[10px] font-bold uppercase text-[#364649]/50">Ticket Promedio</label>
                                        <button
                                            onClick={() => updateGoal('isManualTicket', !isManualTicket)}
                                            className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider transition-colors ${isManualTicket ? 'bg-[#AA895F] text-white' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                                        >
                                            {isManualTicket ? 'Manual' : 'Auto'}
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <DebouncedInput
                                            id="averageTicket"
                                            value={averageTicket || 0}
                                            onChange={(val) => updateGoal('averageTicket', val)}
                                            className={`w-full border rounded-lg px-3 py-2 text-sm text-[#364649] transition-colors ${isManualTicket ? 'bg-white border-gray-200' : 'bg-gray-100 border-transparent text-gray-500'}`}
                                            disabled={!isManualTicket}
                                        />
                                        {!isManualTicket && <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 size={10} /> Histórico</div>}
                                    </div>
                                    {isManualTicket && isSufficientGeneralData && (
                                        <p className="text-[9px] text-amber-600 mt-1 leading-tight">⚠️ Tienes datos suficientes. Se recomienda usar 'Auto'.</p>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="commercialWeeks" className="block text-[10px] font-bold uppercase text-[#364649]/50 mb-1">Sem. Comerciales</label>
                                    <DebouncedInput
                                        id="commercialWeeks"
                                        value={commercialWeeks || 0}
                                        onChange={(val) => updateGoal('commercialWeeks', val)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#364649]"
                                    />
                                </div>
                            </div>

                            {/* Manual Ratio Override */}
                            <div className="bg-[#364649]/5 rounded-xl p-3 border border-[#364649]/10">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] font-bold uppercase text-[#364649]/60">Calibración Efectividad</label>
                                    <div
                                        className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${isManualRatio ? 'bg-[#AA895F]' : 'bg-gray-300'}`}
                                        onClick={() => updateGoal('isManualRatio', !isManualRatio)}
                                    >
                                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${isManualRatio ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                    </div>
                                </div>
                                {isManualRatio ? (
                                    <div className="flex items-center gap-2">
                                        <DebouncedInput
                                            id="manualRatio"
                                            value={manualRatio || 0}
                                            onChange={(val) => updateGoal('manualRatio', val)}
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

                    {/* 2. CAPTATION GOAL PROJECTOR (Moves Here) */}
                    <CaptationProjector
                        captationRatio={captationRatio > 0 ? captationRatio : 2.5}
                        isSufficientData={isSufficientCaptationData}
                    />

                    {/* 3. LIFESTYLE CHECKS */}
                    <div className={`rounded-3xl p-6 border shadow-sm ${isGoalSufficient ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                        <h3 className={`text-xs font-bold uppercase mb-4 flex items-center ${isGoalSufficient ? 'text-emerald-800' : 'text-rose-800'}`}>
                            <Calculator size={14} className="mr-2" /> Validación Financiera
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
                            <div className="mt-3 text-xs text-rose-600 bg-rose-100 p-2 rounded-lg text-center font-bold animate-pulse">
                                ⚠️ Tu meta no cubre tus costos. Aumenta la facturación.
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COL: EXECUTION & RESULTS */}
                <div className="lg:col-span-8 flex flex-col gap-10">

                    {/* A. WEEKLY MISSION (Consolidated) */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-[#AA895F] p-2 rounded-lg text-white shadow-md"><Flag size={20} /></div>
                            <h3 className="text-xl font-bold text-[#364649]">Tu Misión Semanal</h3>
                        </div>

                        {/* Single Consolidated Card */}
                        <div className={`bg-white border text-center rounded-3xl p-8 shadow-xl relative overflow-hidden transition-all ${isPerformanceGood ? 'border-[#364649]/10' : 'border-orange-500/30'}`}>
                            {/* Status Bar */}
                            <div className={`absolute top-0 left-0 w-full h-1.5 ${isPerformanceGood ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>

                            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                {/* Main Target */}
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-[#364649] uppercase tracking-wider mb-2">Objetivo Semanal (PL/PB)</h3>
                                    <div className="flex items-center justify-center gap-4">
                                        <span className={`text-6xl font-black ${isPerformanceGood ? 'text-[#364649]' : 'text-orange-600'}`}>
                                            {formatNumber(realCriticalNumber)}
                                        </span>
                                        <div className="text-left">
                                            <div className="text-xs font-bold text-[#364649]/40 uppercase">Benchmark Mercado</div>
                                            <div className="text-lg font-bold text-[#364649]/60">{formatNumber(theoreticalCriticalNumber)}</div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-[#364649]/50 mt-2">
                                        {isManualRatio ? 'Calculado con Ratio Manual' : (isSufficientGeneralData ? 'Calculado con tus Datos Históricos' : 'Calculado con Estimación de Mercado')}
                                    </p>
                                </div>

                                {/* Insight / Warning */}
                                <div className="flex-1 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 pl-0 md:pl-6">
                                    {!isPerformanceGood ? (
                                        <>
                                            <div className="bg-orange-50 p-3 rounded-full mb-3 text-orange-600"><AlertCircle size={24} /></div>
                                            <p className="text-sm font-bold text-orange-800 leading-tight mb-1">Carga de Trabajo Elevada</p>
                                            <p className="text-xs text-orange-700/80 max-w-[200px]">
                                                Debes hacer <span className="font-bold">+{formatNumber(workLoadIncrease)} gestiones</span> extra vs el estándar para compensar la efectividad actual.
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="bg-emerald-50 p-3 rounded-full mb-3 text-emerald-600"><TrendingUp size={24} /></div>
                                            <p className="text-sm font-bold text-emerald-800 leading-tight mb-1">Ritmo Saludable</p>
                                            <p className="text-xs text-emerald-700/80 max-w-[200px]">
                                                Tu efectividad te permite trabajar de manera inteligente dentro de los estándares del mercado.
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* B. EXECUTION MONITOR */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-[#364649] p-2 rounded-lg text-white shadow-md"><Target size={20} /></div>
                            <h3 className="text-xl font-bold text-[#364649]">Monitor de Ejecución</h3>
                        </div>

                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#364649]/10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* GAUGE: GENERAL RATIO */}
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-xs font-bold uppercase text-[#364649]/50">
                                            {isManualRatio ? 'Tu Efectividad (Manual)' : 'Efectividad de Cierre'}
                                        </span>
                                    </div>

                                    {!isSufficientGeneralData && !isManualRatio ? (
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 h-[88px]">
                                            <AlertCircle className="text-amber-500 shrink-0" size={24} />
                                            <div>
                                                <p className="text-sm font-bold text-amber-800">Datos Insuficientes</p>
                                                <p className="text-xs text-amber-700/70 leading-tight mt-1">
                                                    4 meses + 5 cierres.
                                                    <span className="block font-semibold mt-0.5">Act: {weeksOfData} sem / {totalClosings} cierres.</span>
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-baseline gap-2 mb-2">
                                                <span className={`text-3xl font-bold ${isPerformanceGood ? 'text-emerald-600' : 'text-orange-500'}`}>
                                                    {effectiveRatio.toFixed(1)} <span className="text-sm text-[#364649]/40">: 1</span>
                                                </span>
                                                <span className="text-sm font-medium text-[#364649]/60 bg-gray-100 px-2 py-0.5 rounded-lg">
                                                    {generalConversionPercent.toFixed(1)}% Conv.
                                                </span>
                                            </div>

                                            <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden relative">
                                                <div className="absolute top-0 bottom-0 w-0.5 bg-[#364649] z-10" style={{ left: '60%' }} title="Mercado (6)"></div>
                                                <div
                                                    className={`h-full transition-all duration-1000 ${isPerformanceGood ? 'bg-emerald-500' : 'bg-orange-500'}`}
                                                    style={{ width: `${Math.min((effectiveRatio / 10) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between text-[10px] text-[#364649]/40 mt-1">
                                                <span>0 (Ideal)</span>
                                                <span className="text-[#364649]">Mercado (6:1)</span>
                                                <span>10+ (Alerta)</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* ACTIVITY PACE */}
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-xs font-bold uppercase text-[#364649]/50">Ritmo de Actividad (PL/PB)</span>
                                        <span className={`text-2xl font-bold ${getStatusColor()}`}>
                                            {formatNumber(actualWeeklyAvg)} <span className="text-sm text-[#364649]/40">/sem</span>
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden relative">
                                        <div className="absolute top-0 bottom-0 w-0.5 bg-[#AA895F] z-10" style={{ left: `${Math.min((realCriticalNumber / (realCriticalNumber * 1.5)) * 100, 100)}%` }} title="Tu Meta"></div>
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

                                {/* CAPTATION EFFECTIVENESS */}
                                <div className="md:col-span-2 border-t border-[#364649]/5 pt-6 mt-2">
                                    <div className="flex justify-between items-end mb-4">
                                        <span className="text-xs font-bold uppercase text-[#364649]/50 flex items-center gap-2">
                                            <Users size={14} /> Efectividad de Captación (Conversión de PL)
                                        </span>
                                    </div>

                                    {!isSufficientCaptationData ? (
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                                            <AlertCircle className="text-amber-500 shrink-0" size={24} />
                                            <div>
                                                <p className="text-sm font-bold text-amber-800">Datos Insuficientes</p>
                                                <p className="text-xs text-amber-700/70 leading-tight">
                                                    Necesitas 4 meses (17 sem) y 5 Pre-Listings.
                                                    <span className="block font-semibold mt-0.5">Actual: {captationStats.preListings} PLs.</span>
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-6">
                                            <div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-3xl font-bold text-[#364649]">
                                                        {captationRatio.toFixed(1)} <span className="text-sm text-[#364649]/40">: 1</span>
                                                    </span>
                                                    <span className="text-sm font-medium text-[#364649]/60 bg-gray-100 px-2 py-0.5 rounded-lg">
                                                        {captationConversionPercent.toFixed(1)}% Conv.
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-[#364649]/40 mt-1">Ratio PL : Captación</p>
                                            </div>
                                            <div className="flex-1">
                                                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden relative">
                                                    <div
                                                        className="h-full bg-blue-500 transition-all duration-1000"
                                                        style={{ width: `${Math.min(captationConversionPercent, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* C. RESULTS (Financials) */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-[#364649] p-2 rounded-lg text-white shadow-md"><BarChart3 size={20} /></div>
                            <h3 className="text-xl font-bold text-[#364649]">Resultados</h3>
                        </div>

                        <div className="bg-[#364649] text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden mb-6">
                            {/* Background Pattern */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                                <div>
                                    <h4 className="text-sm font-bold uppercase text-white/50 mb-2">Facturación Bruta</h4>
                                    <div className="flex items-end gap-3 mb-4">
                                        <span className="text-4xl font-black text-[#AA895F]">{formatCurrency(currentBilling)}</span>
                                        <span className="text-sm font-medium text-white/40 mb-1">/ {formatCurrency(annualBillingTarget)}</span>
                                    </div>
                                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#AA895F] transition-all duration-1000" style={{ width: `${Math.min(billingProgress, 100)}%` }}></div>
                                    </div>
                                    <p className="text-xs text-white/40 mt-2 text-right">{billingProgress.toFixed(1)}% de la meta</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold uppercase text-white/50 mb-2">Ingreso Neto (Tú)</h4>
                                    <div className="flex items-end gap-3 mb-4">
                                        <span className="text-4xl font-black text-emerald-400">{formatCurrency(projectedNetIncome)}</span>
                                        <span className="text-sm font-medium text-white/40 mb-1">/ {formatCurrency(targetNetIncome)}</span>
                                    </div>
                                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${Math.min(realIncomeProgress, 100)}%` }}></div>
                                    </div>
                                    <p className="text-xs text-white/40 mt-2 text-right">{realIncomeProgress.toFixed(1)}%</p>
                                </div>
                            </div>
                        </div>

                        {/* D. PIPELINE VALUE (Latent Business Value) */}
                        <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-3xl p-8 shadow-xl relative overflow-hidden text-white">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

                            <div className="flex items-center gap-3 mb-4 relative z-10">
                                <div className="bg-blue-500/20 p-2 rounded-lg text-blue-300"><DollarSign size={20} /></div>
                                <h3 className="text-lg font-bold">Valor Latente del Negocio</h3>
                            </div>

                            <div className="relative z-10">
                                <p className="text-4xl font-black text-blue-300 mb-1">{formatCurrency(pipelineValue)}</p>
                                <p className="text-xs text-blue-200/50 uppercase tracking-wider font-bold">
                                    Pipeline Ponderado (30% Stock + 20% Búsquedas)
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>



        </div>
    );
}

export default React.memo(ObjectivesDashboard);
