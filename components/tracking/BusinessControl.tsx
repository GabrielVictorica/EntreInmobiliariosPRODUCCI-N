
import React, { useMemo } from 'react';
import {
    DollarSign,
    Users,
    Briefcase,
    Activity,
    TrendingUp,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Clock,
    LayoutGrid,
    ArrowRight
} from 'lucide-react';
import { PropertyRecord, VisitRecord, ActivityRecord } from '../../types';

interface BusinessControlProps {
    currentBilling: number;
    annualBillingTarget: number;
    averageTicket: number;
    pipelineValue: number; // New Prop
    metrics: {
        transactionsNeeded: number;
        transactionsDone: number; // calculated from closings
        greenMeetingsTarget: number;
        greenMeetingsDone: number;
        pocketFees: number; // Net Income
        pocketFeesTarget: number; // Lifestyle Cost
        criticalNumberTarget: number;
        criticalNumberDone: number; // Weekly Activity
        activeProperties: number;
    };
    todayAlerts: {
        visits: VisitRecord[];
        activities: ActivityRecord[];
    };
    onNavigateToWeek: () => void;
    onNavigateToCalendar: () => void;
}

export default function BusinessControl({
    currentBilling,
    annualBillingTarget,
    averageTicket,
    pipelineValue,
    metrics,
    todayAlerts,
    onNavigateToWeek,
    onNavigateToCalendar
}: BusinessControlProps) {

    // Helpers
    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    const formatNumber = (val: number) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(val);

    return (
        <div className="space-y-8 animate-fade-in-up">

            {/* 1. TODAY'S ALERTS (High Priority) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-[#364649] to-[#2C3A3D] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>

                    <h3 className="text-sm font-bold uppercase tracking-wider text-white/60 mb-4 flex items-center">
                        <Clock size={16} className="mr-2 text-[#AA895F]" /> Tu Agenda de Hoy
                    </h3>
                    <div onClick={onNavigateToCalendar} className="absolute top-4 right-4 text-[10px] uppercase font-bold text-[#AA895F] bg-white/10 px-2 py-1 rounded cursor-pointer hover:bg-white/20 transition-colors flex items-center gap-1">
                        <Calendar size={12} /> Ver Calendario
                    </div>

                    <div className="space-y-4">
                        {todayAlerts.visits.length === 0 && todayAlerts.activities.length === 0 ? (
                            <div className="text-center py-6 text-white/40">
                                <p className="text-sm">Sin actividades programadas para hoy.</p>
                            </div>
                        ) : (
                            <>
                                {todayAlerts.visits.map(v => (
                                    <div key={v.id} className="bg-white/10 p-3 rounded-xl flex items-start gap-3 border border-white/5">
                                        <div className="bg-[#AA895F]/20 p-2 rounded-lg text-[#AA895F]"><Users size={16} /></div>
                                        <div>
                                            <p className="font-bold text-sm">Visita: {v.propertyId}</p>
                                            <p className="text-xs text-white/60">{v.time} hs - {v.buyerClientId}</p>
                                        </div>
                                    </div>
                                ))}
                                {todayAlerts.activities.map(a => (
                                    <div key={a.id} className="bg-white/10 p-3 rounded-xl flex items-start gap-3 border border-white/5">
                                        <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400"><Activity size={16} /></div>
                                        <div>
                                            <p className="font-bold text-sm">{a.type === 'reunion_verde' ? 'Reunión Verde' : a.type}</p>
                                            <p className="text-xs text-white/60">{a.contactName}</p>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>

                <div className="bg-white border border-[#364649]/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-[#364649]/60 mb-2">Cartera Activa</h3>
                        <div className="flex items-center gap-4">
                            <span className="text-5xl font-black text-[#364649]">{metrics.activeProperties}</span>
                            <div className="bg-gray-100 p-2 rounded-xl text-[#364649]"><LayoutGrid size={24} /></div>
                        </div>
                        <p className="text-xs text-[#364649]/40 mt-2">Propiedades en stock</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-[#364649]/70">Valor Pipeline (Est.)</span>
                            <span className="font-bold text-[#AA895F]">{formatCurrency(pipelineValue)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. MAIN METRICS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* BILLING */}
                <KpiCard
                    label="Facturación Bruta"
                    value={formatCurrency(currentBilling)}
                    target={formatCurrency(annualBillingTarget)}
                    icon={<DollarSign size={20} />}
                    color="text-[#AA895F]"
                    bg="bg-[#AA895F]"
                    progress={(currentBilling / annualBillingTarget) * 100}
                />

                {/* POCKET FEES */}
                <KpiCard
                    label="Honorarios de Bolsillo"
                    value={formatCurrency(metrics.pocketFees)}
                    target={formatCurrency(metrics.pocketFeesTarget)}
                    icon={<Briefcase size={20} />}
                    color="text-emerald-600"
                    bg="bg-emerald-500"
                    progress={(metrics.pocketFees / metrics.pocketFeesTarget) * 100}
                />

                {/* TRANSACTIONS */}
                <KpiCard
                    label="Transacciones (Puntas)"
                    value={metrics.transactionsDone.toString()}
                    target={metrics.transactionsNeeded.toFixed(1)}
                    icon={<CheckCircle2 size={20} />}
                    color="text-blue-600"
                    bg="bg-blue-500"
                    progress={(metrics.transactionsDone / metrics.transactionsNeeded) * 100}
                />

                {/* WEEKLY ACTIVITY (CRITICAL NUMBER) */}
                <KpiCard
                    label="Gestión Semanal (PL/PB)"
                    value={formatNumber(metrics.criticalNumberDone)}
                    target={formatNumber(metrics.criticalNumberTarget)}
                    icon={<Activity size={20} />}
                    color="text-purple-600"
                    bg="bg-purple-500"
                    progress={(metrics.criticalNumberDone / metrics.criticalNumberTarget) * 100}
                />

                {/* AVERAGE TICKET */}
                <div className="bg-white border border-[#364649]/10 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xs font-bold uppercase text-[#364649]/50">Ticket Promedio</h3>
                        <div className="bg-gray-100 p-2 rounded-lg text-[#364649]"><TrendingUp size={20} /></div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-[#364649]">{formatCurrency(averageTicket)}</span>
                    </div>
                    <p className="text-xs text-[#364649]/40 mt-2">Basado en histórico</p>
                </div>

                {/* GREEN MEETINGS (ACTIONABLE) */}
                <div
                    onClick={onNavigateToWeek}
                    className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 shadow-sm relative overflow-hidden cursor-pointer group hover:shadow-md transition-all"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="text-emerald-600" />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xs font-bold uppercase text-emerald-800">Reuniones Verdes</h3>
                        <div className="bg-emerald-200 p-2 rounded-lg text-emerald-700"><Users size={20} /></div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-emerald-700">{metrics.greenMeetingsDone}</span>
                        <span className="text-sm font-bold text-emerald-600/60">/ {metrics.greenMeetingsTarget}</span>
                    </div>
                    <p className="text-xs text-emerald-700/60 mt-2 font-medium flex items-center">
                        Registrar nueva reunión <ArrowRight size={12} className="ml-1" />
                    </p>
                </div>

            </div>

            {/* 3. LATENT VALUE CARD (Moved from Objectives) */}
            <div className="bg-[#1e293b] text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-white/10 p-2 rounded-lg text-blue-300"><DollarSign size={20} /></div>
                    <h3 className="text-lg font-bold">Valor Latente del Negocio</h3>
                </div>
                <div className="mt-4">
                    <span className="text-5xl font-black text-white block mb-1">{formatCurrency(pipelineValue)}</span>
                    <span className="text-xs font-bold uppercase text-white/40 tracking-wider">Pipeline Ponderado (30% Stock + 20% Búsquedas)</span>
                </div>
            </div>
        </div>
    );
}

const KpiCard = ({ label, value, target, icon, color, bg, progress }: any) => (
    <div className="bg-white border border-[#364649]/10 rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold uppercase text-[#364649]/50">{label}</h3>
            <div className={`p-2 rounded-lg text-white ${bg} shadow-md`}>{icon}</div>
        </div>
        <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black text-[#364649]`}>{value}</span>
            <span className="text-xs font-bold text-[#364649]/40">/ {target}</span>
        </div>
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-4">
            <div className={`h-full ${bg} transition-all duration-1000`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
        </div>
    </div>
);
