import React from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    DollarSign,
    TrendingUp,
    Building2
} from 'lucide-react';
import { ClosingRecord } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useBusinessStore } from '../../store/useBusinessStore';
import { useShallow } from 'zustand/react/shallow';

interface BusinessControlProps {
    onNavigateToCalendar: () => void;
    availableYears?: number[]; // Now optional if using store but kept for compatibility
}

const COLORS = {
    gold: '#AA895F',
    dark: '#364649',
    emerald: '#10b981',
    blue: '#3b82f6',
    purple: '#8b5cf6',
    amber: '#f59e0b'
};

export default function BusinessControl({
    onNavigateToCalendar,
    availableYears = [2024, 2025, 2026, 2027, 2028]
}: BusinessControlProps) {
    // Atomic Store Subscriptions
    const {
        metrics, pipelineValue, billingGoal, planAnalysis,
        currentYear, isHistoricalView, setSelectedYear, setIsHistoricalView
    } = useBusinessStore(useShallow(state => {
        const year = state.selectedYear;
        const goals = state.goalsByYear[year];
        return {
            metrics: state.getHomeDisplayMetrics(year),
            pipelineValue: state.getPipelineValue(),
            billingGoal: goals?.annualBilling || 0,
            planAnalysis: state.getPlanAnalysis(year, goals),
            currentYear: year,
            isHistoricalView: state.isHistoricalView,
            setSelectedYear: state.setSelectedYear,
            setIsHistoricalView: state.setIsHistoricalView
        };
    }));

    // ROBUSTNESS: Guard against missing metrics (during year switching)
    // ROBUSTNESS: Guard against missing metrics (during year switching)
    const currentBilling = metrics?.totalGCI || 0; // Display GCI (Gross)
    const annualBillingTarget = billingGoal || 1; // Avoid div by 0
    const averageTicket = metrics?.avgTicketUSD || 0; // Display Property Price

    // Effectiveness Logic: "effectiveRatio" is (Meetings / Closings) e.g. 6.
    const rawRatio = planAnalysis?.effectiveRatio || 6;
    // Percentage: 1 closing / 6 meetings = 16.6%
    const closingRate = rawRatio > 0 ? ((1 / rawRatio) * 100).toFixed(1) : '0';
    // Ratio Display: "6:1"
    const closingRatioDisplay = rawRatio > 0 ? `${rawRatio.toFixed(0)}:1` : '6:1';
    const isStandardRate = !planAnalysis?.isEffectivenessReliable;

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    const formatNumber = (val: number) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(val);

    // ROBUSTNESS: Safe progress calculations
    const billingProgress = Math.min(100, (currentBilling / annualBillingTarget) * 100);
    const transactionsTarget = metrics?.transactionsNeeded || 1;
    const transactionsProgress = Math.min(100, ((metrics?.transactionsDone || 0) / transactionsTarget) * 100);

    return (
        <div className="space-y-6">

            {/* Year Selector Header */}
            <div className="flex items-center justify-between mb-4 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 ml-2 uppercase tracking-wide">Vista:</span>
                    <button
                        onClick={() => setIsHistoricalView(true)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${isHistoricalView
                            ? 'bg-[#364649] text-white shadow-md'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                        HISTÓRICO
                    </button>
                    <div className="h-4 w-px bg-gray-300 mx-1"></div>
                    {availableYears.map(year => (
                        <button
                            key={year}
                            onClick={() => {
                                setIsHistoricalView(false);
                                setSelectedYear(year);
                            }}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${!isHistoricalView && currentYear === year
                                ? 'bg-[#AA895F] text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            {year}
                        </button>
                    ))}
                </div>
            </div>

            {/* ROW 1: Main Financial KPIs with Donut Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Billing Progress */}
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">
                                Facturación Bruta (GCI) {isHistoricalView ? 'Histórica' : currentYear}
                            </p>
                            <p className="text-3xl font-black text-gray-800">{formatCurrency(currentBilling)}</p>
                            <p className="text-sm text-gray-400 mt-1">Meta: {formatCurrency(annualBillingTarget)}</p>
                        </div>
                        <DonutProgress value={billingProgress} color={COLORS.gold} />
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400">Ingresos Netos</p>
                            <p className="text-lg font-bold text-emerald-600">{formatCurrency(metrics?.pocketFees || 0)}</p>
                            <p className="text-[10px] text-gray-400">Meta: {formatCurrency(metrics?.pocketFeesTarget || 0)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400">Ticket Promedio (Venta)</p>
                            <p className="text-lg font-bold text-gray-700">{formatCurrency(averageTicket)}</p>
                            <p className="text-[9px] text-gray-400 font-medium">{isHistoricalView ? '(Histórico)' : `(Año ${currentYear})`}</p>
                        </div>
                    </div>
                </div>

                {/* Two-column layout: Transactions + Pipeline Projection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Transactions Progress - Left Side */}
                    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">
                                    Transacciones {isHistoricalView ? 'Totales' : currentYear}
                                </p>
                                <p className="text-3xl font-black text-gray-800">{metrics?.transactionsDone || 0}</p>
                                <p className="text-sm text-gray-400 mt-1">Meta: {(metrics?.transactionsNeeded || 0).toFixed(1)} puntas</p>
                            </div>
                            <DonutProgress value={transactionsProgress} color={COLORS.blue} />
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div>
                                <p className="text-[10px] font-bold uppercase text-gray-400">Cartera Activa</p>
                                <p className="text-lg font-bold text-gray-700">{metrics?.activeProperties || 0} props.</p>
                            </div>
                        </div>
                    </div>

                    {/* Facturación Proyectada - Right Side */}
                    <div className="bg-gradient-to-br from-[#364649] to-[#242f31] rounded-3xl p-6 shadow-xl text-white relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute -right-6 -bottom-6 opacity-5">
                            <Building2 size={120} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase text-[#AA895F] mb-1 tracking-[0.2em]">
                                Facturación Proyectada
                            </p>
                            <p className="text-[9px] font-medium text-white/40 uppercase tracking-wider mb-3">
                                Pipeline Probable
                            </p>
                            <h3 className="text-4xl font-black">
                                USD {Math.round(pipelineValue).toLocaleString()}
                            </h3>
                        </div>
                        <div className="relative z-10 mt-4 grid grid-cols-2 gap-3">
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/5">
                                <p className="text-[9px] text-[#AA895F] font-bold uppercase tracking-wide">Inventario</p>
                                <p className="text-sm font-black text-white">40%</p>
                                <p className="text-[8px] text-white/40 uppercase">Prob. Media</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/5">
                                <p className="text-[9px] text-[#AA895F] font-bold uppercase tracking-wide">Compradores</p>
                                <p className="text-sm font-black text-white">10%</p>
                                <p className="text-[8px] text-white/40 uppercase">Prob. Temprana</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* ROW: Effectiveness Metrics */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-500/10 p-3 rounded-2xl text-emerald-600">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Efectividad de Venta</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-black text-gray-800">{closingRate}%</h3>
                                <span className="text-sm font-bold text-gray-400">efectividad</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-px md:h-12 w-full md:w-px bg-gray-100"></div>

                    <div className="flex items-center gap-4">
                        <div className="bg-blue-500/10 p-3 rounded-2xl text-blue-600">
                            <TrendingUp size={24} className="rotate-90" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Ratio de Conversión</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-black text-gray-800">{closingRatioDisplay}</h3>
                                {isStandardRate ? (
                                    <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Estándar</span>
                                ) : (
                                    <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{isHistoricalView ? 'Historial Real' : 'Año Actual'}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:block flex-1"></div>

                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Info</p>
                        <p className="text-[11px] text-gray-600 leading-relaxed max-w-[200px]">
                            {isStandardRate
                                ? "Se utiliza el promedio estándar de la industria (6:1) por falta de historial suficiente."
                                : "Datos basados en tu desempeño histórico real cargado en el sistema."}
                        </p>
                    </div>
                </div>
            </div>

            {/* ROW: Productivity Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#AA895F]/5 border border-[#AA895F]/20 rounded-3xl p-6 shadow-sm">
                    <p className="text-[10px] font-bold uppercase text-[#AA895F] tracking-wider mb-2">Honorario Promedio (NCI)</p>
                    <div className="flex items-center gap-3">
                        <div className="bg-[#AA895F]/10 p-2 rounded-xl text-[#AA895F]"><DollarSign size={20} /></div>
                        <div>
                            <p className="text-2xl font-black text-gray-800">
                                {metrics?.isDataReliable ? formatCurrency(metrics?.honorariosPromedio || 0) : 'Datos insuficientes'}
                            </p>
                            <p className="text-[10px] text-gray-400">
                                {metrics?.isDataReliable ? 'Ingreso neto promedio por punta' : 'Requiere 4 meses y 5 cierres'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#364649]/5 border border-[#364649]/20 rounded-3xl p-6 shadow-sm">
                    <p className="text-[10px] font-bold uppercase text-[#364649] tracking-wider mb-2">Ingreso por Actividad</p>
                    <div className="flex items-center gap-3">
                        <div className="bg-[#364649]/10 p-2 rounded-xl text-[#364649]"><TrendingUp size={20} /></div>
                        <div>
                            <p className="text-2xl font-black text-gray-800">
                                {metrics?.isDataReliable ? formatCurrency(metrics?.productividadActividad || 0) : 'Datos insuficientes'}
                            </p>
                            <p className="text-[10px] text-gray-400">
                                {metrics?.isDataReliable ? 'Valor de cada registro en Mi Semana' : 'Sin datos suficientes'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        </div >
    );
}

// Donut Progress Component
const DonutProgress = ({ value, color }: { value: number; color: string }) => {
    const data = [
        { name: 'Done', value: value },
        { name: 'Remaining', value: Math.max(0, 100 - value) }
    ];

    return (
        <div className="relative w-20 h-20">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={28}
                        outerRadius={38}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        stroke="none"
                    >
                        <Cell fill={color} />
                        <Cell fill="#f3f4f6" />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-black text-gray-700">{Math.round(value)}%</span>
            </div>
        </div>
    );
};

