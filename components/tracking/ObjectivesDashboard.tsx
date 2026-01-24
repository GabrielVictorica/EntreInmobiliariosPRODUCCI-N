
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
    Flag,
    Save,
    BarChart3,
    TrendingUp,
    Activity,
    DollarSign,
    Settings as SettingsIcon,
    AlertCircle,
    CheckCircle2,
    Calculator,
    Users,
    X,
} from 'lucide-react';

// Components
import CaptationProjector from './CaptationProjector';
import { DEFAULT_GOALS } from '../../store/slices/types';
import { DebouncedInput } from '../DebouncedInput';
import { calculateWeeks } from '../../utils/dateUtils';

import { useBusinessStore } from '../../store/useBusinessStore';
import { useShallow } from 'zustand/react/shallow';

interface ObjectivesDashboardProps {
    onNavigate: (view: any, params?: any) => void;
    availableYears: number[];
    currentYear: number;
    onSelectYear: (year: number) => void;
    targetUserId?: string;
    token?: string;
}

function ObjectivesDashboard({
    onNavigate,
    availableYears = [2024, 2025, 2026, 2027, 2028],
    targetUserId,
    token
}: ObjectivesDashboardProps) {
    const {
        currentYear,
        onSelectYear,
        goalsByYear,
        fetchFinancialGoals,
        fetchGoalsHistory,
        goalsHistory,
        updateFinancialGoals,
        saveFinancialGoals,
        loadingGoals,
        hasUnsavedGoals,
        getPlanAnalysis
    } = useBusinessStore(useShallow(state => ({
        currentYear: state.selectedYear,
        onSelectYear: state.setSelectedYear,
        goalsByYear: state.goalsByYear,
        fetchFinancialGoals: state.fetchFinancialGoals,
        fetchGoalsHistory: state.fetchGoalsHistory,
        goalsHistory: state.goalsHistory,
        updateFinancialGoals: state.updateFinancialGoals,
        saveFinancialGoals: state.saveFinancialGoals,
        loadingGoals: state.loadingGoals,
        hasUnsavedGoals: state.hasUnsavedGoals,
        getPlanAnalysis: state.getPlanAnalysis
    })));

    const financialGoals = goalsByYear[currentYear] || DEFAULT_GOALS;

    // OPTIMIZATION: Memoize heavy analysis calculation
    const analysis = React.useMemo(() =>
        getPlanAnalysis(currentYear, financialGoals),
        [currentYear, financialGoals, getPlanAnalysis]
    );

    useEffect(() => {
        // OPTIMIZATION: App.tsx already manages fetching on year change.
    }, [currentYear, targetUserId]);

    const isGlobalView = !targetUserId;

    // OPTIMIZATION: Memoize handlers to prevent child re-renders
    const handleGoalChange = React.useCallback((val: number, name?: string) => {
        if (name) updateFinancialGoals({ [name]: val }, currentYear);
    }, [updateFinancialGoals, currentYear]);

    const updateGoal = React.useCallback((key: string, value: any) => {
        updateFinancialGoals({ [key]: value }, currentYear);
    }, [updateFinancialGoals, currentYear]);

    const [historyOpen, setHistoryOpen] = useState(false);
    const historyData = goalsHistory || [];

    const loadHistory = async () => {
        setHistoryOpen(true);
        if (targetUserId) {
            await fetchGoalsHistory(targetUserId, currentYear);
        }
    };

    const {
        annualBilling: annualBillingTarget,
        commissionSplit,
        monthlyNeed,
        averageTicket,
        commercialWeeks,
        manualRatio,
        isManualRatio,
        isManualTicket,
        captationGoalQty,
        captationGoalPeriod,
        manualCaptationRatio,
        isManualCaptationRatio,
        captationStartDate,
        captationEndDate
    } = financialGoals;

    const {
        transactionsNeeded,
        realCriticalNumber,
        isGoalSufficient,
        isPerformanceGood,
        projectedNetIncome,
        effectiveAverageTicket,
        effectiveRatio,
        isEffectivenessReliable,
        isCaptationReliable,
        effectiveCaptationRatio,
        weeksOfData,
        actualCaptations,
        realCaptationRatio,
        pocketFeesTarget
    } = analysis;

    const annualLifestyleCost = monthlyNeed * 12;
    const isSufficientGeneralData = weeksOfData >= 16;
    const isSufficientCaptationData = isSufficientGeneralData && actualCaptations >= 5;


    const captationWeeksDuration = calculateWeeks(captationStartDate, captationEndDate);
    const usedCaptationRatio = isManualCaptationRatio ? manualCaptationRatio : realCaptationRatio;
    const totalPreListingsNeeded = (captationGoalQty || 0) * (usedCaptationRatio || 2.5);
    const weeklyPreListingsNeededForCaptation = totalPreListingsNeeded / captationWeeksDuration;

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    const formatNumber = (val: number, decimals: number = 1) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(val);

    // SegmentedToggle moved OUTSIDE component (see bottom of file)

    return (
        <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
            {/* Header / Year Select */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-[#364649] rounded-xl text-white shadow-lg">
                            <Flag size={20} />
                        </div>
                        <h1 className="text-3xl font-black text-[#364649] tracking-tight">Objetivos {currentYear}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white p-1.5 rounded-2xl border border-[#364649]/10 shadow-sm">
                    <div className="flex items-center bg-gray-50 rounded-xl p-1 px-2 border border-gray-100">
                        {availableYears.map(year => (
                            <button
                                key={year}
                                onClick={() => onSelectYear(year)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-black transition-all ${currentYear === year
                                    ? 'bg-white text-[#364649] shadow-sm'
                                    : 'text-[#364649]/30 hover:text-[#364649]/60'
                                    }`}
                            >
                                {year}
                            </button>
                        ))}
                    </div>
                    <div className="w-px h-6 bg-[#364649]/10 mx-1"></div>
                    <button
                        onClick={loadHistory}
                        className="flex items-center gap-2 px-4 py-2 text-[#364649]/60 hover:text-[#364649] font-bold text-sm transition-colors"
                    >
                        <BarChart3 size={16} /> Historial
                    </button>

                    <button
                        onClick={() => saveFinancialGoals(targetUserId!, currentYear)}
                        disabled={!hasUnsavedGoals || loadingGoals || isGlobalView}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-black transition-all ${(!hasUnsavedGoals || isGlobalView)
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-emerald-500 text-white shadow-lg hover:bg-emerald-600'
                            }`}
                    >
                        <Save size={16} /> {loadingGoals ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>

            {/* MAIN GRID: 2 COLUMNS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LEFT COLUMN */}
                <div className="flex flex-col gap-8">
                    {/* METAS FINANCIERAS */}
                    <div className="bg-white border border-[#364649]/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                        <h2 className="text-sm font-black flex items-center text-[#364649] uppercase tracking-widest mb-6 border-b border-gray-100 pb-4">
                            <Calculator className="mr-3 text-[#AA895F]" size={18} /> Metas Financieras
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-[#364649]/40 mb-2 tracking-widest">Facturación Bruta Anual</label>
                                <div className="relative group">
                                    <DollarSign size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AA895F]" />
                                    <DebouncedInput
                                        id="annualBilling"
                                        name="annualBilling"
                                        value={annualBillingTarget || 0}
                                        onChange={handleGoalChange}
                                        className="w-full bg-[#364649]/5 border-2 border-transparent focus:bg-white focus:border-[#AA895F] rounded-2xl pl-12 pr-4 py-4 text-[#364649] font-black text-2xl transition-all shadow-inner focus:shadow-lg disabled:opacity-50"
                                        disabled={isGlobalView}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex-1">
                                    <label className="block text-[10px] font-black uppercase text-[#364649]/40 mb-2 tracking-widest">Split (%)</label>
                                    <div className="relative">
                                        <DebouncedInput
                                            id="commissionSplit"
                                            name="commissionSplit"
                                            value={commissionSplit || 0}
                                            onChange={handleGoalChange}
                                            className="w-full bg-gray-100 border-none rounded-xl px-4 py-3 text-lg text-[#364649] font-black disabled:opacity-50"
                                            disabled={isGlobalView}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-bold">%</span>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-[10px] font-black uppercase text-[#364649]/40 mb-2 tracking-widest">Costo Vida Mensual</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-bold">$</span>
                                        <DebouncedInput
                                            id="monthlyNeed"
                                            name="monthlyNeed"
                                            value={monthlyNeed || 0}
                                            onChange={handleGoalChange}
                                            className="w-full bg-gray-100 border-none rounded-xl pl-8 pr-4 py-3 text-lg text-[#364649] font-black disabled:opacity-50"
                                            disabled={isGlobalView}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* VARIABLES DE CALIBRACIÓN */}
                    <div className="bg-white border border-[#364649]/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                        <h2 className="text-sm font-black flex items-center text-[#364649] uppercase tracking-widest mb-6 border-b border-gray-100 pb-4">
                            <SettingsIcon className="mr-3 text-[#AA895F]" size={18} /> Variables de Calibración
                        </h2>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* TICKET PROMEDIO */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-[10px] font-black uppercase text-[#364649]/40 tracking-widest">Ticket Promedio</label>
                                        <SegmentedToggle
                                            value={isManualTicket}
                                            onChange={(val: boolean) => updateGoal('isManualTicket', val)}
                                        />
                                    </div>
                                    <div className="relative">
                                        <DebouncedInput
                                            id="averageTicket"
                                            name="averageTicket"
                                            value={Math.round(isManualTicket ? (averageTicket || 0) : (effectiveAverageTicket || 0))}
                                            onChange={handleGoalChange}
                                            className={`w-full border-2 rounded-xl px-4 py-3 text-xl font-black transition-all ${isManualTicket ? 'bg-white border-[#AA895F] text-[#364649] shadow-sm' : 'bg-gray-100 border-transparent text-gray-500'}`}
                                            disabled={!isManualTicket || isGlobalView}
                                        />
                                        <DollarSign size={16} className={`absolute right-4 top-1/2 -translate-y-1/2 ${isManualTicket ? 'text-[#AA895F]' : 'text-gray-400'}`} />
                                    </div>
                                    <p className="mt-1 text-[9px] font-bold uppercase text-blue-600">PROMEDIO GLOBAL REAL</p>
                                </div>

                                {/* EFECTIVIDAD */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-[10px] font-black uppercase text-[#364649]/40 tracking-widest">Efectividad (x : 1)</label>
                                        <SegmentedToggle
                                            value={isManualRatio}
                                            onChange={(val: boolean) => updateGoal('isManualRatio', val)}
                                        />
                                    </div>
                                    <div className="relative">
                                        <DebouncedInput
                                            id="manualRatio"
                                            name="manualRatio"
                                            value={isManualRatio ? (manualRatio || 0) : effectiveRatio}
                                            onChange={handleGoalChange}
                                            className={`w-full border-2 rounded-xl px-4 py-3 text-xl font-black text-center transition-all ${isManualRatio ? 'bg-white border-[#AA895F] text-[#364649] shadow-sm' : 'bg-gray-100 border-transparent text-gray-500'}`}
                                            disabled={!isManualRatio || isGlobalView}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">a 1</span>
                                    </div>
                                    <div className="mt-1">
                                        {!isManualRatio ? (
                                            isEffectivenessReliable ? (
                                                <span className="text-[9px] font-black uppercase text-emerald-600">HISTÓRICO REAL</span>
                                            ) : (
                                                <span className="text-[9px] font-black uppercase text-blue-600">ESTÁNDAR 6:1 (CARGA DATOS)</span>
                                            )
                                        ) : (
                                            <span className="text-[9px] font-black uppercase text-amber-600">MANUAL</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* SEMANAS COMERCIALES */}
                            <div>
                                <label className="block text-[10px] font-black uppercase text-[#364649]/40 mb-2 tracking-widest">Semanas Comerciales / Año</label>
                                <div className="relative">
                                    <Users size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                    <DebouncedInput
                                        id="commercialWeeks"
                                        name="commercialWeeks"
                                        value={commercialWeeks || 0}
                                        onChange={handleGoalChange}
                                        className="w-full bg-[#364649]/5 border-2 border-transparent focus:bg-white focus:border-[#AA895F] rounded-xl pl-12 pr-4 py-3 text-[#364649] font-black text-lg transition-all shadow-inner disabled:opacity-50"
                                        disabled={isGlobalView}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">sem</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="flex flex-col gap-8">
                    {/* PROYECTOR DE CAPTACIONES */}
                    <div className="bg-white border border-[#364649]/10 rounded-3xl overflow-hidden shadow-xl">
                        <CaptationProjector
                            captationRatio={effectiveCaptationRatio}
                            isSufficientData={isCaptationReliable}
                            goalQty={captationGoalQty || 2}
                            goalPeriod={captationGoalPeriod || 'month'}
                            captationStartDate={captationStartDate}
                            captationEndDate={captationEndDate}
                            manualCaptationRatio={manualCaptationRatio || 2.5}
                            isManualRatio={isManualCaptationRatio || false}
                            onUpdate={updateGoal}
                            realCriticalNumber={realCriticalNumber}
                            SegmentedToggle={SegmentedToggle}
                        />
                    </div>

                    {/* MISIÓN CAPTACIÓN (Tarjeta Oscura) */}
                    <div className="bg-[#364649] text-white rounded-3xl p-8 shadow-2xl flex flex-col justify-center relative overflow-hidden">
                        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-6">
                            <span className="text-[10px] text-white/50 uppercase font-black tracking-widest">Meta Campaña (Solo PL)</span>
                            <span className="text-5xl font-black text-white">{totalPreListingsNeeded.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-[#AA895F] font-black uppercase tracking-widest">Semanales Objetivo</span>
                            <span className="text-6xl font-black text-[#AA895F]">{weeklyPreListingsNeededForCaptation.toFixed(1)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTTOM ROW: RITMO + VALIDACIÓN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* RITMO SEMANAL */}
                <div className={`bg-white border rounded-3xl p-8 shadow-xl relative overflow-hidden flex flex-col justify-center ${isPerformanceGood ? 'border-emerald-100' : 'border-orange-100'}`}>
                    <div className={`absolute top-0 left-0 w-full h-1.5 ${isPerformanceGood ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                    <div className="flex items-center gap-2 mb-6">
                        {isPerformanceGood ? <TrendingUp className="text-emerald-600" size={20} /> : <AlertCircle className="text-orange-600" size={20} />}
                        <h3 className="text-xs font-black text-[#364649] uppercase tracking-widest">Ritmo Semanal</h3>
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <span className={`text-6xl font-black ${isPerformanceGood ? 'text-[#364649]' : 'text-orange-600'}`}>{formatNumber(realCriticalNumber)}</span>
                            <span className="block text-[10px] font-black text-[#364649]/40 uppercase tracking-widest mt-2">PL / PB NECESARIOS</span>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-black text-[#364649]">{formatNumber(transactionsNeeded, 1)}</span>
                            <span className="block text-[10px] font-black text-[#364649]/60 uppercase tracking-widest">Puntas Año</span>
                        </div>
                    </div>
                </div>

                {/* VALIDACIÓN PLAN */}
                <div className={`rounded-3xl p-8 border shadow-xl flex flex-col justify-center ${isGoalSufficient ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
                    <div className="flex items-center gap-4 mb-6">
                        <Calculator size={24} className={isGoalSufficient ? 'text-emerald-600' : 'text-rose-600'} />
                        <h3 className={`text-xs font-black uppercase tracking-widest ${isGoalSufficient ? 'text-emerald-900' : 'text-rose-900'}`}>Validación Plan</h3>
                    </div>
                    <div className="flex justify-between items-end">
                        <div>
                            <span className="block text-[10px] font-black uppercase text-black/30 mb-1">Target Neto (Pocket)</span>
                            <span className={`text-4xl font-black ${isGoalSufficient ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCurrency(pocketFeesTarget)}</span>
                        </div>
                        <div className="text-right">
                            <span className="block text-[10px] font-black uppercase text-black/50 mb-1">vs Costos Anuales</span>
                            <span className="text-2xl font-black text-[#364649]">{formatCurrency(annualLifestyleCost)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* History Modal Overlay */}
            {historyOpen && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#364649]/20 backdrop-blur-[3px]" onClick={() => setHistoryOpen(false)}>
                    <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-[#364649] flex items-center gap-2">
                                <Activity size={20} className="text-[#AA895F]" /> Historial de Objetivos
                            </h3>
                            <button onClick={() => setHistoryOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {loadingGoals ? <div className="text-center py-10 opacity-50">Cargando...</div> :
                                historyData.length === 0 ? <div className="text-center py-10 text-gray-400">Sin historial.</div> :
                                    historyData.map((record, idx) => (
                                        <div key={record.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50 flex justify-between items-center">
                                            <div>
                                                <div className="text-xs font-bold text-[#AA895F] uppercase mb-1">{new Date(record.created_at).toLocaleDateString()}</div>
                                                <div className="text-sm font-semibold text-[#364649]">Billing: {formatCurrency(record.annual_billing)}</div>
                                            </div>
                                            {idx === 0 && <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full">ACTUAL</span>}
                                        </div>
                                    ))}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

// OPTIMIZATION: Component defined outside mainly render cycle
const SegmentedToggle = React.memo(({ value, onChange, options = ['AUTO', 'MANUAL'], disabled }: any) => (
    <div className={`flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        {options.map((opt: string) => {
            const isSelected = (value && opt === 'MANUAL') || (!value && opt === 'AUTO');
            return (
                <button
                    key={opt}
                    type="button"
                    onClick={() => onChange(opt === 'MANUAL')}
                    className={`flex-1 px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-md transition-all ${isSelected
                        ? 'bg-white text-[#364649] shadow-sm'
                        : 'text-[#364649]/40 hover:text-[#364649]/60'
                        }`}
                >
                    {opt}
                </button>
            );
        })}
    </div>
));

export default React.memo(ObjectivesDashboard);
