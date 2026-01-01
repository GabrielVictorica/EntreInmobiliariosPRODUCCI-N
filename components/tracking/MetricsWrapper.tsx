import React, { useState, useMemo } from 'react';
import { differenceInWeeks, parseISO, isValid } from 'date-fns';
import { LayoutDashboard, PieChart } from 'lucide-react';
import DashboardHome from '../home/DashboardHome';
import BusinessControl from './BusinessControl';
import { PropertyRecord, VisitRecord, ActivityRecord, ClosingRecord, ClientRecord, BuyerClientRecord, MarketingLog } from '../../types';

interface MetricsWrapperProps {
    currentBilling: number;
    currentActivities: number;
    currentRatio: number;
    pipelineValue: number;
    weeksOfData: number;
    totalClosings: number;
    totalSides: number; // Added totalSides
    captationStats: {
        preListings: number;
        listings: number;
    };
    historicalAverageTicket: number;
    properties: PropertyRecord[];
    activities: ActivityRecord[];
    visits: VisitRecord[];
    closingLogs?: ClosingRecord[]; // Para contar puntas en reuniones verdes
    onNavigate: (view: any, params?: any) => void;

    // Props for DashboardHome
    clients: ClientRecord[];
    buyers: BuyerClientRecord[];
    marketingLogs?: MarketingLog[];
    selectedTab?: 'home' | 'control';
    financialGoals?: any;
    onUpdateGoals?: (newGoals: any) => void;

    // Year Props
    availableYears: number[];
    currentYear: number;
    onSelectYear: (year: number) => void;
    isHistoricalView: boolean;
    onToggleHistorical: (isHistorical: boolean) => void;

    // Pre-calculated display metrics (optional - when provided, use these instead of internal calcs)
    displayMetrics?: {
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
    displayBilling?: number;
    displayTicket?: number;
    displayClosingRate?: string;
    displayClosingRatioDisplay?: string;
    displayIsStandardRate?: boolean;
    googleEvents?: any[]; // Added for agenda connection
}

export default function MetricsWrapper({
    currentBilling,
    currentActivities,
    currentRatio,
    pipelineValue,
    weeksOfData,
    totalClosings,
    totalSides, // Destructure totalSides
    captationStats,
    historicalAverageTicket,
    properties,
    activities,
    visits,
    closingLogs = [],
    onNavigate,
    clients,
    buyers,
    marketingLogs = [],
    financialGoals,
    selectedTab,
    availableYears,
    currentYear,
    onSelectYear,
    isHistoricalView,
    onToggleHistorical,
    // New pre-calculated props
    displayMetrics,
    displayBilling,
    displayTicket,
    displayClosingRate,
    displayClosingRatioDisplay,
    displayIsStandardRate,
    googleEvents = [] // Added for agenda connection
}: MetricsWrapperProps) {
    const [internalTab, setInternalTab] = useState<'home' | 'control'>('home');

    // Use prop if provided, otherwise internal state
    const activeTab = selectedTab || internalTab;

    const currentTotalPLPB = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return activities.filter(a => {
            if (!a.date) return false;
            const activityYear = new Date(a.date).getFullYear();
            return activityYear === currentYear && ['act_verde', 'pre_listing', 'pre_buying', 'acm', 'captacion', 'visita', 'reserva', 'referido'].includes(a.type);
        }).length;
    }, [activities]);

    // --- Data Prep for Business Control ---
    // Calcular reuniones verdes de la semana actual (TODAS las actividades de Mi Semana + puntas de cierres)
    const greenMeetingsDone = useMemo(() => {
        const today = new Date();
        // Lunes de la semana actual
        const dayOfWeek = today.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() + mondayOffset);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // Usar formato local para evitar desfase de zona horaria
        const formatLocalDate = (d: Date) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const startStr = formatLocalDate(startOfWeek);
        const endStr = formatLocalDate(endOfWeek);

        // Tipos de actividades que cuentan (excluye cierre porque viene de closingLogs)
        const greenActivityTypes = ['act_verde', 'pre_listing', 'pre_buying', 'acm', 'captacion', 'visita', 'reserva', 'referido'];

        const activitiesCount = activities.filter(a => {
            if (!a.date) return false;
            const d = new Date(a.date);
            if (isNaN(d.getTime())) return false;
            const actDate = d.toISOString().split('T')[0];
            return actDate >= startStr && actDate <= endStr && greenActivityTypes.includes(a.type);
        }).length;

        // Sumar puntas de cierres de la semana
        const closingSidesCount = closingLogs.filter(c => {
            if (!c.date) return false;
            const d = new Date(c.date);
            if (isNaN(d.getTime())) return false;
            const closingDate = d.toISOString().split('T')[0];
            return closingDate >= startStr && closingDate <= endStr;
        }).reduce((sum, c) => sum + c.sides, 0);

        return activitiesCount + closingSidesCount;
    }, [activities, closingLogs]);


    const activePropertiesCount = properties.filter(p => p.status === 'disponible' || p.status === 'reservada').length;

    // SHARED STATE / DEFAULTS for Control
    // Use financialGoals from props with fallbacks to avoid crashes
    const goals = financialGoals || {
        annualBilling: 120000,
        averageTicket: 4000,
        commissionSplit: 45,
        commercialWeeks: 48
    };

    const annualBillingTarget = goals.annualBilling;
    const averageTicket = goals.averageTicket;
    const commissionSplit = goals.commissionSplit;
    const commercialWeeks = goals.commercialWeeks;
    const isManualTicket = goals.isManualTicket;

    // AUTO-CALCULATION FIX: Use live historical data when in Auto mode
    const effectiveAverageTicket = isManualTicket
        ? (goals.averageTicket || 4000)
        : (historicalAverageTicket > 0 ? historicalAverageTicket : (goals.averageTicket || 4000));

    // Calculations based on Shared Goals
    const transactionsNeeded = effectiveAverageTicket > 0 ? annualBillingTarget / (effectiveAverageTicket * 0.03) : 0;

    // Calibrating Ratio (Same Logic as ObjectivesDashboard)
    const effectiveRatio = goals.isManualRatio
        ? goals.manualRatio
        : (currentRatio > 0 ? currentRatio : 6);

    const realPLPBNeeded = transactionsNeeded * effectiveRatio;
    const realCriticalNumber = commercialWeeks > 0 ? realPLPBNeeded / commercialWeeks : 0;

    const projectedNetIncome = currentBilling * (commissionSplit / 100);
    const targetNetIncome = annualBillingTarget * (commissionSplit / 100);

    const actualWeeklyAvg = weeksOfData > 0 ? currentActivities / weeksOfData : 0;

    // --- Captation Goals Calculation ---
    // Get captation settings from financialGoals
    const captationGoalQty = goals.captationGoalQty || 2;
    const captationGoalPeriod = goals.captationGoalPeriod || 'month';
    const manualCaptationRatio = goals.manualCaptationRatio || 2.5;
    const isManualCaptationRatio = goals.isManualCaptationRatio || false;

    // Calculate captation ratio (similar to CaptationProjector)
    const captationRatioFromData = captationStats.listings > 0
        ? captationStats.preListings / captationStats.listings
        : 2.5;
    const effectiveCaptationRatio = isManualCaptationRatio ? manualCaptationRatio : captationRatioFromData;

    // Calculate weekly PL target using actual dates from settings
    const captationStartDate = goals.captationStartDate || new Date().toISOString().split('T')[0];
    const captationEndDate = goals.captationEndDate || new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0];

    // Calculate weeks from dates
    const calculateWeeksFromDates = (start: string, end: string) => {
        try {
            const startDate = parseISO(start);
            const endDate = parseISO(end);
            if (!isValid(startDate) || !isValid(endDate)) return 4;
            const diff = differenceInWeeks(endDate, startDate);
            return Math.max(diff, 1);
        } catch {
            return 4;
        }
    };

    const captationWeeksDuration = calculateWeeksFromDates(captationStartDate, captationEndDate);
    const preListingsNeeded = captationGoalQty * effectiveCaptationRatio;
    const weeklyPLTarget = captationWeeksDuration > 0 ? preListingsNeeded / captationWeeksDuration : 0;

    // Calculate weekly PL done (PLs from current week)
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyPLDone = useMemo(() => {
        return activities.filter(a => {
            if (!a.date) return false;
            const actDate = new Date(a.date);
            if (isNaN(actDate.getTime())) return false;
            return actDate >= startOfWeek;
        }).length;
    }, [activities, startOfWeek.toISOString()]);

    // --- Closing Rate Calculation (Tasa de Cierre) ---
    // Requires: minimum 4 months of data (≈17 weeks) AND 5 closings
    // Formula: (closings / PL-PB activities) * 100 = 1/ratio * 100
    // Standard: 6:1 ratio = 16.67% rate (mathematically precise: 100/6)
    const MIN_WEEKS_FOR_RATE = 17; // ~4 months
    const MIN_CLOSINGS_FOR_RATE = 5;
    const STANDARD_RATIO = 6; // 6:1 standard

    const hasEnoughDataForRate = weeksOfData >= MIN_WEEKS_FOR_RATE && totalClosings >= MIN_CLOSINGS_FOR_RATE;

    let closingRate: string;
    let closingRatioDisplay: string;

    if (hasEnoughDataForRate && currentActivities > 0) {
        // Calculate actual rate: closings / PL-PB activities
        const actualRate = (totalClosings / currentActivities) * 100;
        const actualRatio = currentActivities / totalClosings;
        closingRate = actualRate.toFixed(1);
        closingRatioDisplay = `${actualRatio.toFixed(1)}:1`;
    } else {
        // Standard: 6:1 ratio = 16.67% rate (100/6 = 16.666...)
        closingRate = (100 / STANDARD_RATIO).toFixed(1); // = "16.7"
        closingRatioDisplay = `${STANDARD_RATIO}:1 (estándar)`;
    }


    return (
        <div className="space-y-6 pb-20">
            {/* Header / Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#364649] tracking-tight">
                        Métricas
                    </h1>
                    <p className="text-[#364649]/60 text-sm font-medium">
                        {activeTab === 'home' ? 'Resumen general de tu actividad.' : 'Monitorea tus KPIs y agenda diaria.'}
                    </p>
                </div>

                {!selectedTab && (
                    <div className="bg-white p-1 rounded-xl shadow-sm border border-[#364649]/10 flex">
                        <button
                            onClick={() => setInternalTab('home')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'home' ? 'bg-[#364649] text-white shadow-md' : 'text-[#364649]/60 hover:bg-gray-50'}`}
                        >
                            <div className="flex items-center gap-2">
                                <LayoutDashboard size={16} /> Resumen
                            </div>
                        </button>
                        <button
                            onClick={() => setInternalTab('control')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'control' ? 'bg-[#AA895F] text-white shadow-md' : 'text-[#364649]/60 hover:bg-gray-50'}`}
                        >
                            <div className="flex items-center gap-2">
                                <PieChart size={16} /> Control Negocio
                            </div>
                        </button>
                    </div>
                )}
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'home' && (
                <DashboardHome
                    clients={clients}
                    properties={properties}
                    visits={visits}
                    marketingLogs={marketingLogs}
                    buyers={buyers}
                    activities={activities}
                    displayMetrics={displayMetrics ? {
                        ...displayMetrics,
                        greenMeetingsWeeklyTotal: greenMeetingsDone
                    } : {
                        transactionsNeeded,
                        transactionsDone: totalSides,
                        greenMeetingsTarget: 15,
                        greenMeetingsDone: greenMeetingsDone,
                        pocketFees: projectedNetIncome,
                        pocketFeesTarget: targetNetIncome,
                        criticalNumberTarget: realCriticalNumber,
                        criticalNumberDone: actualWeeklyAvg,
                        activeProperties: activePropertiesCount,
                        greenMeetingsWeeklyTotal: greenMeetingsDone
                    }}
                    displayBilling={displayBilling !== undefined ? displayBilling : currentBilling}
                    billingGoal={annualBillingTarget}
                    pipelineValue={pipelineValue}
                    captationGoals={{
                        weeklyPLTarget: weeklyPLTarget,
                        weeklyPLDone: weeklyPLDone
                    }}
                    currentYear={currentYear}
                    isHistoricalView={isHistoricalView}
                    googleEvents={googleEvents}
                />
            )}

            {activeTab === 'control' && (
                <BusinessControl
                    currentBilling={displayBilling !== undefined ? displayBilling : currentBilling}
                    annualBillingTarget={annualBillingTarget}
                    averageTicket={displayTicket !== undefined ? displayTicket : effectiveAverageTicket}
                    pipelineValue={pipelineValue || 0}
                    metrics={displayMetrics || {
                        transactionsNeeded,
                        transactionsDone: totalSides,
                        greenMeetingsTarget: 15,
                        greenMeetingsDone: greenMeetingsDone,
                        pocketFees: projectedNetIncome,
                        pocketFeesTarget: targetNetIncome,
                        criticalNumberTarget: realCriticalNumber,
                        criticalNumberDone: actualWeeklyAvg,
                        activeProperties: activePropertiesCount,
                        honorariosPromedio: totalSides > 0 ? projectedNetIncome / totalSides : 0,
                        productividadActividad: currentActivities > 0 ? projectedNetIncome / currentActivities : 0,
                        isDataReliable: weeksOfData >= 16 && totalSides >= 5
                    }}
                    captationGoals={{
                        goalQty: captationGoalQty,
                        startDate: captationStartDate,
                        endDate: captationEndDate,
                        weeksDuration: captationWeeksDuration,
                        weeklyPLTarget: weeklyPLTarget,
                        weeklyPLDone: weeklyPLDone
                    }}
                    closingRate={displayClosingRate || closingRate}
                    closingRatioDisplay={displayClosingRatioDisplay || closingRatioDisplay}
                    isStandardRate={displayIsStandardRate}
                    onNavigateToWeek={() => onNavigate('my-week', { action: 'register-activity' })}
                    onNavigateToCalendar={() => onNavigate('calendar')}
                    // Year Props
                    availableYears={availableYears}
                    currentYear={currentYear}
                    onSelectYear={onSelectYear}
                    isHistoricalView={isHistoricalView}
                    onToggleHistorical={onToggleHistorical}
                />
            )}
        </div>
    );
}
