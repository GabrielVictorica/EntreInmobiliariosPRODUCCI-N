import React, { useState, useMemo } from 'react';
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
    captationStats: {
        preListings: number;
        listings: number;
    };
    historicalAverageTicket: number;
    properties: PropertyRecord[];
    activities: ActivityRecord[];
    visits: VisitRecord[];
    onNavigate: (view: any, params?: any) => void;

    // Props for DashboardHome
    clients: ClientRecord[];
    buyers: BuyerClientRecord[];
    marketingLogs?: MarketingLog[];
    selectedTab?: 'home' | 'control';
    financialGoals?: any;
    onUpdateGoals?: (newGoals: any) => void;
}

export default function MetricsWrapper({
    currentBilling,
    currentActivities,
    currentRatio,
    pipelineValue,
    weeksOfData,
    totalClosings,
    captationStats,
    historicalAverageTicket,
    properties,
    activities,
    visits,
    onNavigate,
    clients,
    buyers,
    marketingLogs = [],
    financialGoals,
    selectedTab
}: MetricsWrapperProps) {
    const [internalTab, setInternalTab] = useState<'home' | 'control'>('home');

    // Use prop if provided, otherwise internal state
    const activeTab = selectedTab || internalTab;

    // --- Data Prep for Business Control ---
    const greenMeetingsDone = useMemo(() => activities.filter(a => a.type === 'reunion_verde').length, [activities]);

    const todayStr = new Date().toISOString().split('T')[0];
    const todayAlerts = useMemo(() => ({
        visits: visits.filter(v => v.date === todayStr && v.status === 'pendiente'),
        activities: activities.filter(a => a.date === todayStr)
    }), [visits, activities]);

    const activePropertiesCount = properties.filter(p => p.status === 'disponible').length;

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

    // Calculations based on Shared Goals
    const commissionPerSale = averageTicket * 0.03;
    const transactionsNeeded = commissionPerSale > 0 ? annualBillingTarget / commissionPerSale : 0;

    // Calibrating Ratio (Same Logic as ObjectivesDashboard)
    const effectiveRatio = goals.isManualRatio
        ? goals.manualRatio
        : (currentRatio > 0 ? currentRatio : 6);

    const realPLPBNeeded = transactionsNeeded * effectiveRatio;
    const realCriticalNumber = commercialWeeks > 0 ? realPLPBNeeded / commercialWeeks : 0;

    const projectedNetIncome = currentBilling * (commissionSplit / 100);
    const targetNetIncome = annualBillingTarget * (commissionSplit / 100);

    const actualWeeklyAvg = weeksOfData > 0 ? currentActivities / weeksOfData : 0;


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
                />
            )}

            {activeTab === 'control' && (
                <BusinessControl
                    currentBilling={currentBilling}
                    annualBillingTarget={annualBillingTarget}
                    averageTicket={averageTicket}
                    metrics={{
                        transactionsNeeded,
                        transactionsDone: totalClosings,
                        greenMeetingsTarget: 15,
                        greenMeetingsDone: greenMeetingsDone,
                        pocketFees: projectedNetIncome,
                        pocketFeesTarget: targetNetIncome,
                        criticalNumberTarget: realCriticalNumber,
                        criticalNumberDone: actualWeeklyAvg,
                        activeProperties: activePropertiesCount
                    }}
                    todayAlerts={todayAlerts}
                    onNavigateToWeek={() => onNavigate('my-week', { action: 'register-activity' })}
                    onNavigateToCalendar={() => onNavigate('calendar')}
                />
            )}
        </div>
    );
}
