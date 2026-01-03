
import React, { useState, useEffect } from 'react';
import {
    Flag,
    Save, // Added Save Icon
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
import { DebouncedInput } from '../DebouncedInput';
import { differenceInWeeks, parseISO, isValid } from 'date-fns';

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
    // Year Props
    availableYears: number[];
    currentYear: number;
    onSelectYear: (year: number) => void;
}

// ... imports ...
import { supabase } from '../../services/supabaseClient'; // Ensure imported or passed

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
    onUpdateGoals,
    onSaveGoals,
    availableYears = [2024, 2025, 2026],
    currentYear,
    onSelectYear,
    isLoading = false,
    hasUnsavedChanges = false
}: ObjectivesDashboardProps & {
    financialGoals: any;
    onUpdateGoals: (goals: any) => void;
    onSaveGoals: (goals: any) => void;
    isLoading?: boolean;
    hasUnsavedChanges?: boolean;
}) {

    // History State
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const loadHistory = async () => {
        setLoadingHistory(true);
        setHistoryOpen(true);

        try {
            const SUPABASE_URL = 'https://whfoflccshoztjlesnhh.supabase.co';
            const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZm9mbGNjc2hvenRqbGVzbmhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzUwMzEsImV4cCI6MjA4MTMxMTAzMX0.rPQdO1qCovC9WP3ttlDOArvTI7I15lg7fnOPkJseDos';

            // Get session from localStorage
            const sessionStr = localStorage.getItem('sb-whfoflccshoztjlesnhh-auth-token');
            let accessToken = SUPABASE_KEY;
            let userId = '';

            if (sessionStr) {
                try {
                    const sessionData = JSON.parse(sessionStr);
                    accessToken = sessionData.access_token || SUPABASE_KEY;
                    userId = sessionData.user?.id || '';
                } catch (e) {
                    console.error('[DEBUG] Error parsing session:', e);
                }
            }

            if (!userId) {
                console.error('[DEBUG] No user ID found for history');
                setLoadingHistory(false);
                return;
            }

            const url = `${SUPABASE_URL}/rest/v1/agent_objectives?year=eq.${currentYear}&user_id=eq.${userId}&order=created_at.desc`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setHistoryData(data || []);
            } else {
                console.error('[DEBUG] History fetch failed:', response.status, await response.text());
            }
        } catch (e) {
            console.error('[DEBUG] Error loading history:', e);
        }

        setLoadingHistory(false);
    };


    // --- SHARED STATE FROM PROPS ---
    const {
        annualBilling: annualBillingTarget,
        commissionSplit,
        monthlyNeed,
        averageTicket,
        commercialWeeks,
        manualRatio,
        isManualRatio,
        isManualTicket,
        // Captation
        captationGoalQty,
        captationGoalPeriod,
        manualCaptationRatio,
        isManualCaptationRatio,
        captationStartDate,
        captationEndDate
    } = financialGoals;

    // Handlers for updates
    const updateGoal = React.useCallback((key: string, value: any) => {
        onUpdateGoals({ [key]: value });
    }, [onUpdateGoals]);

    // STABLE HANDLER FOR INPUTS to prevent re-renders unique to each render
    const handleGoalChange = React.useCallback((val: number, name?: string) => {
        if (name) updateGoal(name, val);
    }, [updateGoal]);

    // 1. Annual Billing Target
    const monthlyGoal = monthlyNeed / (commissionSplit / 100);
    const projectedNetIncome = currentBilling * (commissionSplit / 100);
    const annualLifestyleCost = monthlyNeed * 12;
    const isGoalSufficient = (annualBillingTarget * (commissionSplit / 100)) >= annualLifestyleCost;

    // 2. Transaction Volume Needed
    // AUTO-CALCULATION FIX: Use live historical data when in Auto mode
    const effectiveAverageTicket = isManualTicket
        ? averageTicket
        : (historicalAverageTicket > 0 ? historicalAverageTicket : averageTicket);

    const transactionsNeeded = effectiveAverageTicket > 0 ? annualBillingTarget / (effectiveAverageTicket * 0.03) : 0;

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
    const isSufficientGeneralData = weeksOfData >= 17 && totalClosings >= 8;
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

    // Sync critical number to localStorage for WeeklyDashboard
    useEffect(() => {
        if (realCriticalNumber > 0) {
            localStorage.setItem('critical_number', realCriticalNumber.toString());
        }
    }, [realCriticalNumber]);

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

    // --- CAPTATION CALCULATIONS (Lifted from Projector) ---
    const calculateWeeks = (start: string, end: string) => {
        try {
            const startDate = parseISO(start);
            const endDate = parseISO(end);
            if (!isValid(startDate) || !isValid(endDate)) return 4;
            const diff = differenceInWeeks(endDate, startDate);
            return Math.max(diff, 1);
        } catch (e) { return 4; }
    };

    const captationWeeksDuration = calculateWeeks(captationStartDate, captationEndDate);
    const finalCaptationRatio = isManualCaptationRatio ? manualCaptationRatio : captationRatio;
    const preListingsNeededForCaptation = captationGoalQty * finalCaptationRatio;
    const weeklyPreListingsNeededForCaptation = preListingsNeededForCaptation / captationWeeksDuration;

    // Alert Logic
    const isCaptationGoalDesaligned = weeklyPreListingsNeededForCaptation > realCriticalNumber;

    // --- FORMATTERS ---
    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    const formatNumber = (val: number, decimals: number = 1) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(val);

    return (
        <div className="space-y-6 pb-20 relative">
            {/* HISTORY MODAL overlay */}
            {historyOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setHistoryOpen(false)}>
                    <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-[#364649] flex items-center gap-2">
                                <Activity size={20} className="text-[#AA895F]" />
                                Historial de Objetivos {currentYear}
                            </h3>
                            <button onClick={() => setHistoryOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <Users size={20} /> {/* Close Icon proxy */}
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {loadingHistory ? (
                                <div className="text-center py-10 opacity-50">Cargando historial...</div>
                            ) : historyData.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">No hay historial para este año.</div>
                            ) : (
                                historyData.map((record, idx) => (
                                    <div key={record.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50 flex justify-between items-center hover:bg-white hover:shadow-sm transition-all">
                                        <div>
                                            <div className="text-xs font-bold text-[#AA895F] uppercase mb-1">
                                                {new Date(record.created_at).toLocaleDateString()} {new Date(record.created_at).toLocaleTimeString()}
                                            </div>
                                            <div className="text-sm font-semibold text-[#364649]">
                                                Billing: {formatCurrency(record.annual_billing)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Income: {formatCurrency(record.monthly_need)}/mo • Ticket: {formatCurrency(record.average_ticket)}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {idx === 0 && <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full">ACTUAL</span>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#364649] tracking-tight">Planificación Anual</h1>
                    <div className="flex items-center gap-3 mt-1">
                        <div className="flex bg-white rounded-lg p-1 border border-gray-200">
                            {availableYears.map(year => (
                                <button
                                    key={year}
                                    onClick={() => onSelectYear(year)}
                                    className={`px-3 py-1 text-sm font-bold rounded-md transition-all ${currentYear === year ? 'bg-[#364649] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                        <button onClick={loadHistory} className="text-xs font-bold text-[#AA895F] hover:underline flex items-center gap-1">
                            <Activity size={14} /> Historial
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => onSaveGoals(financialGoals)}
                    className={`flex items-center gap-2 bg-[#AA895F] text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-[#AA895F]/20 hover:bg-[#997a53] transition-all transform hover:scale-105 active:scale-95 ${hasUnsavedChanges ? 'animate-bounce ring-4 ring-red-500 ring-offset-2 scale-110' : ''}`}
                >
                    <Save size={18} />
                    Guardar Planificación {currentYear}
                </button>
            </div>


            {/* TAB CONTENT: PLANNING (Existing Dashboard) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in-up">

                {/* --- ROW 1: CALCULATORS --- */}

                {/* 1. LEFT CALCULATOR (Business Variables) */}
                <div className="lg:col-span-5 flex flex-col gap-4">

                    {/* A. Business Variables */}
                    <div className="bg-white border border-[#364649]/10 rounded-3xl p-6 shadow-xl relative overflow-hidden h-full">
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
                                        name="annualBilling"
                                        value={annualBillingTarget || 0}
                                        onChange={handleGoalChange}
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
                                            name="commissionSplit"
                                            value={commissionSplit || 0}
                                            onChange={handleGoalChange}
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
                                            name="monthlyNeed"
                                            value={monthlyNeed || 0}
                                            onChange={handleGoalChange}
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
                                            name="averageTicket"
                                            value={Math.round(isManualTicket ? (averageTicket || 0) : (effectiveAverageTicket || 0))}
                                            onChange={handleGoalChange}
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
                                        name="commercialWeeks"
                                        value={commercialWeeks || 0}
                                        onChange={handleGoalChange}
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
                                            name="manualRatio"
                                            value={manualRatio || 0}
                                            onChange={handleGoalChange}
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


                        </div>
                    </div>


                </div>

                {/* 2. RIGHT CALCULATOR (Captation Projector - Inputs Only) */}
                <div className="lg:col-span-7 h-full">
                    <CaptationProjector
                        captationRatio={captationRatio}
                        isSufficientData={isSufficientCaptationData}
                        // Persistence Props
                        goalQty={captationGoalQty || 2}
                        goalPeriod={captationGoalPeriod || 'month'}
                        captationStartDate={captationStartDate}
                        captationEndDate={captationEndDate}
                        manualCaptationRatio={manualCaptationRatio || 2.5}
                        isManualRatio={isManualCaptationRatio || false}
                        onUpdate={updateGoal}
                        realCriticalNumber={realCriticalNumber}
                    />
                </div>


                {/* --- ROW 2: RESULTS --- */}

                {/* 3. LEFT RESULT (Weekly Mission + Validation) */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    {/* Weekly Mission Card */}
                    {/* Weekly Mission Card */}
                    <div className={`bg-white border text-center rounded-3xl p-5 shadow-xl relative overflow-hidden transition-all h-[200px] flex flex-col justify-center ${isPerformanceGood ? 'border-[#364649]/10' : 'border-orange-500/30'}`}>
                        {/* Status Bar */}
                        <div className={`absolute top-0 left-0 w-full h-1.5 ${isPerformanceGood ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>

                        <div className="flex flex-col items-center justify-center h-full pt-1">
                            <div className="flex items-center gap-2 mb-3">
                                {isPerformanceGood ? (
                                    <TrendingUp className="text-emerald-600" size={20} />
                                ) : (
                                    <AlertCircle className="text-orange-600" size={20} />
                                )}
                                <h3 className="text-sm font-bold text-[#364649] uppercase tracking-wider">Ritmo Saludable</h3>
                            </div>

                            <div className="flex items-center justify-center gap-12 w-full px-4">
                                {/* Metric 1: PL/PB */}
                                <div className="text-center">
                                    <div className={`text-6xl font-black mb-1 ${isPerformanceGood ? 'text-[#364649]' : 'text-orange-600'}`}>
                                        {formatNumber(realCriticalNumber)}
                                    </div>
                                    <div className="text-xs font-bold text-[#364649]/60 uppercase tracking-tight">
                                        PL/PB Semanales
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-12 w-px bg-gray-200"></div>

                                {/* Metric 2: Transactions (Puntas) */}
                                <div className="text-center">
                                    <div className="text-4xl font-black text-[#364649] mb-1">
                                        {formatNumber(transactionsNeeded, 1)}
                                    </div>
                                    <div className="text-xs font-bold text-[#364649]/60 uppercase tracking-tight">
                                        Puntas Anuales
                                    </div>
                                </div>
                            </div>

                            {/* Optional Status Text (Small) */}
                            {!isPerformanceGood && (
                                <div className="mt-6 flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                                    <AlertCircle size={14} />
                                    <span className="text-xs font-bold">Carga Elevada (+{formatNumber(workLoadIncrease)})</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Financial Validation (Moved Bottom Left) */}
                    <div className={`rounded-2xl p-4 border shadow-sm ${isGoalSufficient ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg ${isGoalSufficient ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    <Calculator size={16} />
                                </div>
                                <div>
                                    <h3 className={`text-xs font-bold uppercase ${isGoalSufficient ? 'text-emerald-800' : 'text-rose-800'}`}>
                                        Validación Financiera
                                    </h3>
                                    {!isGoalSufficient && <p className="text-[10px] text-rose-600 font-bold">⚠️ Meta insuficiente.</p>}
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <span className="block text-[9px] uppercase text-black/50 font-bold">Ingreso Neto</span>
                                    <span className="block text-sm font-black text-[#364649]">{formatCurrency(targetNetIncome)}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-[9px] uppercase text-black/50 font-bold">Costo Vida</span>
                                    <span className="block text-sm font-bold text-[#364649]/60">{formatCurrency(annualLifestyleCost)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. RIGHT RESULT (Captation Result + Alert) */}
                <div className="lg:col-span-7 space-y-4">
                    {/* Result Card */}
                    <div className="bg-[#364649] text-white rounded-3xl p-5 shadow-xl flex flex-col justify-center h-[200px]">
                        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
                            <span className="text-sm text-white/70 uppercase font-bold">Pre-Listings Totales (Campaña)</span>
                            <span className="text-3xl font-bold text-white">{preListingsNeededForCaptation.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-[#AA895F] font-bold uppercase">Meta Semanal (Solo PL)</span>
                            <span className="text-4xl font-black text-[#AA895F]">{weeklyPreListingsNeededForCaptation.toFixed(1)}</span>
                        </div>
                    </div>

                    {/* Alert Card */}
                    {isCaptationGoalDesaligned && (
                        <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl animate-pulse flex items-start gap-3">
                            <AlertCircle size={20} className="text-orange-600 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-orange-800 mb-1">¡Alerta de Coherencia!</p>
                                <p className="text-xs text-orange-700/90 leading-relaxed">
                                    Tu meta de captación requiere <strong>{weeklyPreListingsNeededForCaptation.toFixed(1)} PLs/sem</strong>, pero tu facturación
                                    solo proyecta necesaria <strong>{realCriticalNumber.toFixed(1)} PL/PB/sem</strong>.
                                    <br />
                                    <span className="opacity-75">Estás planificando captar más de lo que necesitas vender.</span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default React.memo(ObjectivesDashboard);
