import React from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    DollarSign,
    Users,
    Briefcase,
    Activity,
    TrendingUp,
    Calendar,
    CheckCircle2,
    Clock,
    LayoutGrid,
    ArrowRight,
    Target,
    Building2
} from 'lucide-react';
import { VisitRecord, ActivityRecord } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface BusinessControlProps {
    currentBilling: number;
    annualBillingTarget: number;
    averageTicket: number;
    pipelineValue: number;
    metrics: {
        transactionsNeeded: number;
        transactionsDone: number;
        greenMeetingsTarget: number;
        greenMeetingsDone: number;
        pocketFees: number;
        pocketFeesTarget: number;
        criticalNumberTarget: number;
        criticalNumberDone: number;
        activeProperties: number;
        honorariosPromedio: number;
        productividadActividad: number;
        isDataReliable: boolean;
    };
    captationGoals: {
        goalQty: number;
        startDate: string; // ISO date
        endDate: string;   // ISO date
        weeksDuration: number;
        weeklyPLTarget: number;
        weeklyPLDone: number;
    };
    onNavigateToWeek: () => void;
    onNavigateToCalendar: () => void;
    closingRate: string;
    closingRatioDisplay: string;
    isStandardRate?: boolean;
    // Year Props
    availableYears: number[];
    currentYear: number;
    onSelectYear: (year: number) => void;
    isHistoricalView: boolean;
    onToggleHistorical: (isHistorical: boolean) => void;
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
    currentBilling,
    annualBillingTarget,
    averageTicket,
    pipelineValue,
    metrics,
    captationGoals,
    onNavigateToWeek,
    onNavigateToCalendar,
    closingRate,
    closingRatioDisplay,
    isStandardRate = false,
    availableYears,
    currentYear,
    onSelectYear,
    isHistoricalView,
    onToggleHistorical
}: BusinessControlProps) {

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    const formatNumber = (val: number) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(val);

    const billingProgress = (currentBilling / annualBillingTarget) * 100;
    const transactionsProgress = (metrics.transactionsDone / metrics.transactionsNeeded) * 100;

    return (
        <div className="space-y-6">

            {/* Year Selector Header */}
            <div className="flex items-center justify-between mb-4 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 ml-2 uppercase tracking-wide">Vista:</span>
                    <button
                        onClick={() => onToggleHistorical(true)}
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
                                onToggleHistorical(false);
                                onSelectYear(year);
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
                                Facturación {isHistoricalView ? 'Histórica' : currentYear}
                            </p>
                            <p className="text-3xl font-black text-gray-800">{formatCurrency(currentBilling)}</p>
                            <p className="text-sm text-gray-400 mt-1">Meta: {formatCurrency(annualBillingTarget)}</p>
                        </div>
                        <DonutProgress value={billingProgress} color={COLORS.gold} />
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400">Ingresos Netos</p>
                            <p className="text-lg font-bold text-emerald-600">{formatCurrency(metrics.pocketFees)}</p>
                            <p className="text-[10px] text-gray-400">Meta: {formatCurrency(metrics.pocketFeesTarget)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400">Ticket Promedio</p>
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
                                <p className="text-3xl font-black text-gray-800">{metrics.transactionsDone}</p>
                                <p className="text-sm text-gray-400 mt-1">Meta: {metrics.transactionsNeeded.toFixed(1)} puntas</p>
                            </div>
                            <DonutProgress value={transactionsProgress} color={COLORS.blue} />
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div>
                                <p className="text-[10px] font-bold uppercase text-gray-400">Cartera Activa</p>
                                <p className="text-lg font-bold text-gray-700">{metrics.activeProperties} props.</p>
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

            {/* ROW 2: Weekly Activity Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Weekly Activity Goal - Enhanced with Closing Rate */}
                <div
                    onClick={onNavigateToWeek}
                    className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm cursor-pointer hover:shadow-lg transition-all group"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg text-white" style={{ backgroundColor: COLORS.purple }}><Activity size={18} /></div>
                            <div>
                                <p className="text-xs font-bold uppercase text-gray-500">Gestión Semanal</p>
                                <p className="text-[10px] text-gray-400">PL/PB</p>
                            </div>
                        </div>
                        <ArrowRight size={16} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <span className="text-3xl font-black" style={{ color: COLORS.purple }}>{Math.round(metrics.criticalNumberDone)}</span>
                            <span className="text-lg font-bold text-gray-300 ml-1">/ {Math.round(metrics.criticalNumberTarget)}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-400">{Math.round(Math.min((metrics.criticalNumberDone / metrics.criticalNumberTarget) * 100, 100))}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-3">
                        <div
                            className="h-full transition-all duration-500 rounded-full"
                            style={{ width: `${Math.min((metrics.criticalNumberDone / metrics.criticalNumberTarget) * 100, 100)}%`, backgroundColor: COLORS.purple }}
                        ></div>
                    </div>
                    {/* Tasa de Cierre Info */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400">Tasa de Cierre</p>
                            <p className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                                {closingRate}%
                                <span className="text-[8px] text-gray-400 font-normal">{isStandardRate ? '(estándar)' : isHistoricalView ? '(Hist)' : '(Año)'}</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold uppercase text-gray-400">Ratio</p>
                            <p className="text-sm font-bold text-gray-600">{closingRatioDisplay}</p>
                        </div>
                    </div>
                </div>

                {/* Green Meetings */}
                <ActivityCard
                    title="Actividades Semana"
                    subtitle="Semanales"
                    done={metrics.greenMeetingsDone}
                    target={metrics.greenMeetingsTarget}
                    color={COLORS.emerald}
                    icon={<Users size={18} />}
                    onClick={onNavigateToWeek}
                />

                {/* Captation Goal */}
                {(() => {
                    // Format dates for display
                    const formatDate = (isoDate: string) => {
                        try {
                            const date = parseISO(isoDate);
                            if (!isValid(date)) return '';
                            return format(date, 'dd MMM', { locale: es });
                        } catch {
                            return '';
                        }
                    };
                    const startFormatted = formatDate(captationGoals.startDate);
                    const endFormatted = formatDate(captationGoals.endDate);
                    const periodLabel = startFormatted && endFormatted
                        ? `${startFormatted} - ${endFormatted}`
                        : 'Sin período definido';
                    const weeksLabel = captationGoals.weeksDuration > 0
                        ? `${captationGoals.weeksDuration} ${captationGoals.weeksDuration === 1 ? 'Semana' : 'Semanas'}`
                        : '';
                    const progressPercent = captationGoals.weeklyPLTarget > 0
                        ? Math.min((captationGoals.weeklyPLDone / captationGoals.weeklyPLTarget) * 100, 100)
                        : 0;

                    return (
                        <div
                            onClick={onNavigateToWeek}
                            className="bg-[#364649] border border-[#364649]/80 rounded-2xl p-5 cursor-pointer hover:shadow-xl hover:shadow-[#364649]/20 transition-all group"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="bg-[#AA895F] p-2 rounded-lg text-white"><Target size={18} /></div>
                                    <div>
                                        <p className="text-xs font-bold uppercase text-white">Meta Captaciones</p>
                                        <p className="text-[10px] text-white/60">{periodLabel}</p>
                                    </div>
                                </div>
                                {weeksLabel && (
                                    <span className="text-[9px] uppercase font-bold text-[#AA895F] bg-[#AA895F]/20 px-2 py-1 rounded-full">
                                        {weeksLabel}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-3xl font-black text-white">{captationGoals.goalQty}</p>
                                    <p className="text-[10px] text-white/50 mt-1">captaciones objetivo</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-[#AA895F]">
                                        {captationGoals.weeklyPLDone}/{Math.ceil(captationGoals.weeklyPLTarget)}
                                    </p>
                                    <p className="text-[10px] text-white/50">PLs esta semana</p>
                                </div>
                            </div>
                            <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden mt-3">
                                <div
                                    className="h-full bg-[#AA895F] transition-all duration-500 rounded-full"
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* ROW: Productivity Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#AA895F]/5 border border-[#AA895F]/20 rounded-3xl p-6 shadow-sm">
                    <p className="text-[10px] font-bold uppercase text-[#AA895F] tracking-wider mb-2">Honorario Promedio (NCI)</p>
                    <div className="flex items-center gap-3">
                        <div className="bg-[#AA895F]/10 p-2 rounded-xl text-[#AA895F]"><DollarSign size={20} /></div>
                        <div>
                            <p className="text-2xl font-black text-gray-800">
                                {metrics.isDataReliable ? formatCurrency(metrics.honorariosPromedio) : 'Datos insuficientes'}
                            </p>
                            <p className="text-[10px] text-gray-400">
                                {metrics.isDataReliable ? 'Ingreso neto promedio por punta' : 'Requiere 4 meses y 5 cierres'}
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
                                {metrics.isDataReliable ? formatCurrency(metrics.productividadActividad) : 'Datos insuficientes'}
                            </p>
                            <p className="text-[10px] text-gray-400">
                                {metrics.isDataReliable ? 'Valor de cada registro en Mi Semana' : 'Sin datos suficientes'}
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

// Activity Card Component
const ActivityCard = ({ title, subtitle, done, target, color, icon, onClick }: {
    title: string;
    subtitle: string;
    done: number;
    target: number;
    color: string;
    icon: React.ReactNode;
    onClick: () => void;
}) => {
    const progress = Math.min((done / target) * 100, 100);

    return (
        <div
            onClick={onClick}
            className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm cursor-pointer hover:shadow-lg transition-all group"
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg text-white" style={{ backgroundColor: color }}>{icon}</div>
                    <div>
                        <p className="text-xs font-bold uppercase text-gray-500">{title}</p>
                        <p className="text-[10px] text-gray-400">{subtitle}</p>
                    </div>
                </div>
                <ArrowRight size={16} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-end justify-between">
                <div>
                    <span className="text-3xl font-black" style={{ color }}>{done}</span>
                    <span className="text-lg font-bold text-gray-300 ml-1">/ {target}</span>
                </div>
                <span className="text-xs font-bold text-gray-400">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-3">
                <div
                    className="h-full transition-all duration-500 rounded-full"
                    style={{ width: `${progress}%`, backgroundColor: color }}
                ></div>
            </div>
        </div>
    );
};
