
import React, { useMemo, useState } from 'react';
import {
    XAxis, YAxis, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import {
    TrendingUp, Users, Home, CheckCircle, ArrowUpRight,
    MoreHorizontal, ArrowDownRight, Filter, Megaphone, Link as LinkIcon,
    Clock, MessageCircle, Target, Star, Search, ChevronDown, Check, Building2, AlertTriangle
} from 'lucide-react';
import { ClientRecord, PropertyRecord, VisitRecord, MarketingLog, BuyerClientRecord, ActivityRecord } from '../../types';

// ... imports
import { supabase } from '../../services/supabaseClient';

interface DashboardHomeProps {
    clients: ClientRecord[];
    properties: PropertyRecord[];
    visits: VisitRecord[];
    marketingLogs: MarketingLog[];
    buyers: BuyerClientRecord[];
    activities: ActivityRecord[]; // Added from parent
    // Pre-calculated stats from App.tsx/MetricsWrapper
    displayMetrics?: {
        transactionsNeeded: number;
        transactionsDone: number;
        transactionsDoneHistorical?: number; // Added for Historical Comparison
        greenMeetingsTarget: number;
        greenMeetingsDone: number;
        greenMeetingsDoneHistorical?: number; // Added for Historical Comparison
        pocketFees: number;
        pocketFeesTarget: number;
        criticalNumberTarget: number;
        criticalNumberDone: number;
        criticalNumberDoneHistorical?: number; // Added for Historical Comparison
        activeProperties: number;
        greenMeetingsWeeklyTotal: number; // Suma total de actividades de la semana
        honorariosPromedio?: number;
        productividadActividad?: number;
        isDataReliable?: boolean;
    };
    displayBilling?: number; // Actual Billing
    billingGoal?: number; // Goal Billing
    pipelineValue?: number;
    captationGoals?: {
        weeklyPLTarget: number;
        weeklyPLDone: number;
    };
    currentYear: number;
    isHistoricalView?: boolean;
    googleEvents?: any[]; // Added for agenda connection
    targetUserId?: string; // ID for fetching habits
}

// --- COMPONENTS ---

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#364649] text-white text-xs p-3 rounded-lg shadow-xl border border-white/10">
                <p className="font-bold mb-1">{label ? label : payload[0].name}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} style={{ color: entry.color || entry.fill }}>
                        {entry.name}: <span className="font-bold ml-1">{entry.value}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// Google Colors Helper for agenda synchronization
const getGoogleColor = (colorId: string) => {
    const colors: any = {
        '1': '#7986cb', // Lavender
        '2': '#33b679', // Sage
        '3': '#8e24aa', // Grape
        '4': '#e67c73', // Flamingo
        '5': '#f6bf26', // Banana
        '6': '#f4511e', // Tangerine
        '7': '#039be5', // Peacock
        '8': '#616161', // Graphite
        '9': '#3f51b5', // Blueberry
        '10': '#0b8043', // Basil
        '11': '#d50000'  // Tomato
    };
    return colors[colorId] || '#039be5'; // Default Blue
};


const DashboardHome: React.FC<DashboardHomeProps> = ({
    clients, properties, visits, marketingLogs, buyers, activities,
    displayMetrics, displayBilling = 0, billingGoal = 0, pipelineValue = 0,
    captationGoals, currentYear, isHistoricalView,
    googleEvents = [], targetUserId
}) => {
    // Agenda Expand State
    const [isAgendaExpanded, setIsAgendaExpanded] = useState(false);

    // ========== COMPLETION STATE ==========
    const [habits, setHabits] = useState<{ id: string; name: string }[]>([]);
    const [dailyLogId, setDailyLogId] = useState<string | null>(null);
    // Track ALL completed events by Google Event ID (unique per event instance)
    const [completedEventIds, setCompletedEventIds] = useState<Set<string>>(new Set());

    // Load habits and completed events
    const fetchCompletionData = async () => {
        if (!targetUserId) return;
        const today = new Date().toISOString().split('T')[0];

        // 1. Fetch active habits (for Supabase sync)
        const { data: habitsData } = await supabase
            .from('habits')
            .select('id, name')
            .eq('user_id', targetUserId)
            .eq('active', true);

        if (habitsData) setHabits(habitsData);

        // 2. Get daily log for today (for habit sync)
        const { data: dailyLog } = await supabase
            .from('daily_logs')
            .select('id')
            .eq('user_id', targetUserId)
            .eq('date', today)
            .maybeSingle();

        if (dailyLog) setDailyLogId(dailyLog.id);

        // 3. Load completed event IDs from localStorage
        const stored = localStorage.getItem(`completedEvents_${targetUserId}`);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed.date === today && Array.isArray(parsed.ids)) {
                    setCompletedEventIds(new Set(parsed.ids));
                }
            } catch (e) { }
        }
    };

    React.useEffect(() => {
        fetchCompletionData();
    }, [targetUserId]);

    // Auto-refresh when tab becomes visible (for cross-tab sync)
    React.useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchCompletionData();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', () => fetchCompletionData());

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', () => { });
        };
    }, [targetUserId]);

    // Save completed events to localStorage
    React.useEffect(() => {
        if (targetUserId && completedEventIds.size > 0) {
            const today = new Date().toISOString().split('T')[0];
            localStorage.setItem(`completedEvents_${targetUserId}`, JSON.stringify({
                date: today,
                ids: Array.from(completedEventIds)
            }));
        }
    }, [completedEventIds, targetUserId]);

    // Toggle event completion
    const toggleEventCompletion = async (eventId: string, eventTitle: string, eventDate: string) => {
        if (!eventId || !targetUserId) return;
        const today = new Date().toISOString().split('T')[0];
        const isToday = eventDate === today;
        const isCompleted = completedEventIds.has(eventId);

        // 1. Update visual state immediately (by unique event ID)
        setCompletedEventIds(prev => {
            const newSet = new Set(prev);
            if (isCompleted) {
                newSet.delete(eventId);
            } else {
                newSet.add(eventId);
            }
            return newSet;
        });

        // 2. If it's a habit event for TODAY, also sync to Supabase
        if (isToday) {
            // Normalize: remove emojis and extra whitespace for better matching
            const normalizedTitle = eventTitle.replace(/[^\w\sáéíóúñü]/gi, '').trim().toLowerCase();

            const matchedHabit = habits.find(h => {
                const normalizedName = h.name.toLowerCase();
                return normalizedTitle.includes(normalizedName) || normalizedName.includes(normalizedTitle);
            });

            console.log('[Habit Sync Debug]', {
                eventTitle,
                normalizedTitle,
                habits: habits.map(h => h.name),
                matchedHabit: matchedHabit?.name || 'NONE',
                isToday,
                isCompleted
            });

            if (matchedHabit) {
                try {
                    let currentLogId = dailyLogId;

                    // Ensure daily log exists
                    if (!currentLogId) {
                        const { data: newLog, error: logError } = await supabase
                            .from('daily_logs')
                            .insert({ user_id: targetUserId, date: today })
                            .select()
                            .single();

                        if (logError) {
                            console.error('[Habit Sync] Error creating daily log:', logError);
                            return;
                        }

                        if (newLog) {
                            currentLogId = newLog.id;
                            setDailyLogId(newLog.id);
                        }
                    }

                    if (isCompleted) {
                        // UNMARK from Supabase
                        const { error: deleteError } = await supabase
                            .from('habit_completions')
                            .delete()
                            .eq('daily_log_id', currentLogId)
                            .eq('habit_id', matchedHabit.id);

                        if (deleteError) {
                            console.error('[Habit Sync] Error deleting completion:', deleteError);
                        } else {
                            console.log('[Habit Sync] Successfully UNMARKED habit:', matchedHabit.name);
                            // Dispatch custom event for instant cross-component sync
                            window.dispatchEvent(new CustomEvent('habitCompletionChanged', {
                                detail: { habitId: matchedHabit.id, completed: false }
                            }));
                        }
                    } else {
                        // MARK in Supabase
                        const { error: insertError } = await supabase
                            .from('habit_completions')
                            .insert({
                                habit_id: matchedHabit.id,
                                daily_log_id: currentLogId,
                                target_date: today,
                                completed_at: new Date().toISOString()
                            });

                        if (insertError) {
                            console.error('[Habit Sync] Error inserting completion:', insertError);
                        } else {
                            console.log('[Habit Sync] Successfully MARKED habit:', matchedHabit.name);
                            // Dispatch custom event for instant cross-component sync
                            window.dispatchEvent(new CustomEvent('habitCompletionChanged', {
                                detail: { habitId: matchedHabit.id, completed: true }
                            }));
                        }
                    }
                } catch (error) {
                    console.error('[Habit Sync] Exception:', error);
                }
            }
        }
    };

    // Helper to check if event is completed
    const isEventCompleted = (eventId: string): boolean => {
        return completedEventIds.has(eventId);
    };

    const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');
    const isGlobal = selectedPropertyId === 'all';

    // --- 1. PROPERTY SELECTOR LOGIC ---
    const activeProperties = useMemo(() => properties.filter(p => p.status === 'disponible' || p.status === 'reservada'), [properties]);

    const getSelectedLabel = () => {
        if (selectedPropertyId === 'all') return 'Todas las Propiedades (Global)';
        const p = properties.find(i => i.id === selectedPropertyId);
        return p ? `${p.address.street} ${p.address.number}` : 'Seleccionar Propiedad...';
    };

    // --- 2. DATA FILTERING ---
    const filteredLogs = useMemo(() => isGlobal ? marketingLogs : marketingLogs.filter(l => l.propertyId === selectedPropertyId), [marketingLogs, selectedPropertyId, isGlobal]);
    const filteredVisits = useMemo(() => isGlobal ? visits : visits.filter(v => v.propertyId === selectedPropertyId), [visits, selectedPropertyId, isGlobal]);
    const filteredProperties = useMemo(() => isGlobal ? properties : properties.filter(p => p.id === selectedPropertyId), [properties, selectedPropertyId, isGlobal]);

    // --- 3. METRICS CALCULATIONS ---
    const totalInquiries = filteredLogs.reduce((acc, l) => acc + l.marketplace.inquiries + l.social.inquiries + l.ads.inquiries, 0);
    const visitCount = filteredVisits.length;
    const totalSales = filteredProperties.filter(p => p.status === 'vendida').length;

    // Funnel Data
    const funnelStats = useMemo(() => {
        const imps = filteredLogs.reduce((acc, l) => acc + l.marketplace.impressions + l.social.impressions + l.ads.impressions, 0);
        const clicks = filteredLogs.reduce((acc, l) => acc + l.marketplace.clicks + l.social.clicks + l.ads.clicks, 0);
        const offers = filteredVisits.filter(v => v.nextSteps?.action === 'ofertar').length;

        return [
            { name: 'Impresiones', value: imps, fill: '#708F96' },
            { name: 'Clicks', value: clicks, fill: '#364649' },
            { name: 'Consultas', value: totalInquiries, fill: '#AA895F' },
            { name: 'Visitas', value: visitCount, fill: '#708F96' },
            { name: 'Ofertas', value: offers, fill: '#AA895F' },
            { name: 'Ventas', value: totalSales, fill: '#364649' }
        ];
    }, [filteredLogs, filteredVisits, totalInquiries, visitCount, totalSales]);

    // Today's Agenda (Simplified based on app data)
    const today = new Date().toISOString().split('T')[0];
    const todayAgenda = useMemo(() => {
        const todVisits = visits.filter(v => v.date === today).map(v => ({
            time: v.time || '00:00',
            title: `Visita: ${properties.find(p => p.id === v.propertyId)?.address.street || 'Propiedad'}`,
            type: 'visita'
        }));
        const todActivities = activities.filter(a => a.date === today).map(a => ({
            time: a.time || '00:00',
            title: `Actividad: ${a.type}`,
            type: 'actividad'
        }));
        return [...todVisits, ...todActivities].sort((a, b) => a.time.localeCompare(b.time));
    }, [visits, activities, properties, today]);

    // Red Zone Properties (No visits in last 15 days)
    const redZoneProps = useMemo(() => {
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

        return activeProperties.filter(p => {
            const propVisits = visits.filter(v => v.propertyId === p.id);
            if (propVisits.length === 0) return true; // Never visited
            const lastVisitDate = new Date(Math.max(...propVisits.map(v => new Date(v.date).getTime())));
            return lastVisitDate < fifteenDaysAgo;
        });
    }, [activeProperties, visits]);

    // --- HELPER RENDERS ---
    const ProgressBar = ({ value, max, color = "bg-[#AA895F]", label }: { value: number, max: number, color?: string, label?: string }) => {
        const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
        return (
            <div className="w-full">
                <div className="flex justify-between items-end mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
                    <span className="text-xs font-black text-[#364649]">{percentage.toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
                </div>
            </div>
        );
    };



    return (
        <div className="space-y-8 pb-10">
            {/* FIRST LINE: STRATEGIC NUMBERS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 1. ANNUAL BILLING */}
                <div className="bg-[#364649] rounded-3xl p-8 shadow-lg text-white relative overflow-hidden flex flex-col justify-between min-h-[240px] border border-white/5">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp size={140} /></div>
                    <div className="relative z-10">
                        <p className="text-xs font-black uppercase text-[#AA895F] mb-2 tracking-[0.2em]">Facturación {isHistoricalView ? 'Histórica' : currentYear}</p>
                        <h3 className="text-5xl font-black mb-1">USD {Math.round(displayBilling).toLocaleString()}</h3>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#AA895F] rounded-lg mt-2 shadow-sm">
                            <Target size={14} className="text-white" />
                            <p className="text-xs font-black text-white uppercase tracking-wider">Meta: {billingGoal.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="mt-6 relative z-10">
                        <ProgressBar value={displayBilling} max={billingGoal} color="bg-[#AA895F]" label="Progreso del Objetivo Anual" />
                    </div>
                </div>

                {/* 2. WEEKLY ACTIVITY (TARGET 15) */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col justify-between min-h-[240px] hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-black uppercase text-slate-400 tracking-[0.15em] mb-2">Actividades de la Semana</p>
                            <h3 className="text-5xl font-black text-[#364649] mb-1">{displayMetrics?.greenMeetingsWeeklyTotal || 0}</h3>
                            <div className="flex items-center gap-1.5 mt-2">
                                <Users size={16} className="text-[#AA895F]" />
                                <span className="text-sm font-black text-[#AA895F]">META: 15 REUNIONES</span>
                            </div>
                        </div>
                        <div className="bg-[#AA895F]/10 p-4 rounded-2xl text-[#AA895F]"><Users size={24} /></div>
                    </div>
                    <div className="mt-6">
                        <ProgressBar value={displayMetrics?.greenMeetingsWeeklyTotal || 0} max={15} color="bg-[#AA895F]" label="Cumplimiento Estándar" />
                    </div>
                </div>

                {/* 3. CRITICAL NUMBER (WEEKLY PL/PB) */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col justify-between min-h-[240px] hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-black uppercase text-slate-400 tracking-[0.15em] mb-2">Número Crítico Semanal</p>
                            <h3 className="text-5xl font-black text-[#364649] mb-1">{displayMetrics?.criticalNumberDone.toFixed(1) || '0.0'}</h3>
                            <div className="flex items-center gap-2 mt-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Objetivo PL/PB: {displayMetrics?.criticalNumberTarget.toFixed(1) || '0.0'}</span>
                            </div>
                        </div>
                        <div className="bg-[#708F96]/10 p-4 rounded-2xl text-[#708F96]"><Target size={24} /></div>
                    </div>

                    <div className="mt-6 space-y-4">
                        <ProgressBar value={displayMetrics?.criticalNumberDone || 0} max={displayMetrics?.criticalNumberTarget || 1} color="bg-[#708F96]" label="Tracción de Negocio" />

                        <div className="flex justify-between items-center bg-[#AA895F]/10 px-4 py-3 rounded-2xl border border-[#AA895F]/20">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#364649]">Pre-listings</span>
                            <span className="text-[#AA895F] font-black text-sm">{captationGoals?.weeklyPLDone.toFixed(1)} / {captationGoals?.weeklyPLTarget.toFixed(1)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECOND LINE: WEEKLY AGENDA (MON-SUN) */}
            <div className={`bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 transition-all duration-500 ease-in-out ${isAgendaExpanded ? '' : ''}`}>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-black text-[#364649]">Agenda Semanal</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 text-left">Reuniones y Compromisos Programados</p>
                    </div>

                    <button
                        onClick={() => setIsAgendaExpanded(!isAgendaExpanded)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#364649] transition-colors group"
                    >
                        <span className="text-xs font-black uppercase tracking-wider">{isAgendaExpanded ? 'Colapsar' : 'Ver Todo'}</span>
                        <ChevronDown size={16} className={`text-[#AA895F] transition-transform duration-300 ${isAgendaExpanded ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-start">
                    {(() => {
                        const start = new Date();
                        const dayOfWeek = start.getDay();
                        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                        const monday = new Date(start);
                        monday.setDate(start.getDate() + mondayOffset);
                        monday.setHours(0, 0, 0, 0);

                        return Array.from({ length: 7 }, (_, i) => {
                            const day = new Date(monday);
                            day.setDate(monday.getDate() + i);
                            const dayStr = day.toISOString().split('T')[0];
                            const isToday = new Date().toISOString().split('T')[0] === dayStr;

                            // Filter Google Events for this day
                            const dayEvents = googleEvents.filter((e: any) => {
                                const eventDate = e.start.dateTime || e.start.date;
                                const target = new Date(eventDate);
                                return day.getDate() === target.getDate() &&
                                    day.getMonth() === target.getMonth() &&
                                    day.getFullYear() === target.getFullYear();
                            }).map(e => {
                                const startDate = new Date(e.start.dateTime || e.start.date);
                                const eventTime = e.start.dateTime ? startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Todo el día';
                                return {
                                    id: e.id,
                                    time: eventTime,
                                    title: e.summary || 'Sin título',
                                    date: dayStr, // Add date for habit sync
                                    type: 'google',
                                    color: getGoogleColor(e.colorId),
                                    timestamp: startDate.getTime()
                                };
                            }).sort((a, b) => a.timestamp - b.timestamp);

                            const visibleEvents = isAgendaExpanded ? dayEvents : dayEvents.slice(0, 3);
                            const hiddenCount = dayEvents.length - visibleEvents.length;

                            return (
                                <div key={i} className={`flex flex-col rounded-3xl p-4 transition-all duration-300 ${isToday ? 'bg-[#AA895F]/5 ring-2 ring-[#AA895F]/20' : 'bg-slate-50 border border-slate-100'} ${isAgendaExpanded ? 'min-h-[180px]' : 'h-[180px]'}`}>
                                    <div className="mb-3 border-b border-slate-200/50 pb-2">
                                        <p className={`text-[10px] font-black uppercase tracking-tighter ${isToday ? 'text-[#AA895F]' : 'text-slate-400'}`}>
                                            {day.toLocaleDateString('es-AR', { weekday: 'long' })}
                                        </p>
                                        <p className={`text-lg font-black ${isToday ? 'text-[#AA895F]' : 'text-[#364649]'}`}>{day.getDate()}</p>
                                    </div>
                                    <div className={`space-y-2 flex-grow ${isAgendaExpanded ? '' : 'overflow-hidden'}`}>
                                        {visibleEvents.length > 0 ? (
                                            <>
                                                {visibleEvents.map((ev: any, idx) => {
                                                    // Check if this event is completed (by unique event ID)
                                                    const isCompleted = isEventCompleted(ev.id);

                                                    return (
                                                        <div
                                                            key={ev.id || idx}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (ev.id) {
                                                                    toggleEventCompletion(ev.id, ev.title, ev.date);
                                                                }
                                                            }}
                                                            className={`bg-white p-2 rounded-xl shadow-sm border flex flex-col items-start text-left animate-fade-in-up transition-all duration-300 cursor-pointer hover:ring-2 hover:ring-[#AA895F]/50 hover:shadow-md ${isCompleted ? 'opacity-60 border-green-400 bg-green-50' : 'border-slate-100'}`}
                                                            style={{ animationDelay: `${idx * 50}ms` }}
                                                            title={isCompleted ? 'Click para desmarcar' : 'Click para marcar como completado'}
                                                        >
                                                            <div className="flex items-center justify-between w-full gap-2">
                                                                <span
                                                                    className={`text-[9px] font-black text-white px-1.5 py-0.5 rounded-md shadow-sm`}
                                                                    style={{ backgroundColor: isCompleted ? '#22c55e' : ev.color }}
                                                                >
                                                                    {ev.time}
                                                                </span>
                                                                {/* CHECKBOX VISUAL - siempre visible */}
                                                                <span className={`text-sm ${isCompleted ? 'text-green-500' : 'text-slate-300'}`}>
                                                                    {isCompleted ? '✅' : '⬜'}
                                                                </span>
                                                            </div>
                                                            <p className={`text-[10px] font-bold leading-tight line-clamp-2 mt-1 ${isCompleted ? 'text-green-600 line-through' : 'text-[#364649]'}`}>
                                                                {ev.title}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                                {hiddenCount > 0 && !isAgendaExpanded && (
                                                    <div
                                                        className="text-[10px] font-black text-slate-400 text-center py-1 bg-slate-100/50 rounded-lg cursor-pointer hover:bg-slate-200/50 hover:text-[#AA895F] transition-colors"
                                                        onClick={() => setIsAgendaExpanded(true)}
                                                    >
                                                        +{hiddenCount} más...
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full opacity-20 grayscale">
                                                <Clock size={16} className="text-slate-400" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        });
                    })()}
                </div>
            </div>

            {/* THIRD LINE: PROPERTIES & FUNNEL */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1. ACTIVE PROPERTIES - NOW LARGER (2 cols) */}
                <div className="lg:col-span-2 text-left">
                    {/* Active Properties Summary */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-[#364649] flex items-center gap-2">
                                <Home size={22} className="text-[#AA895F]" />
                                Cartera Activa ({activeProperties.length})
                            </h3>
                            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-3 py-1.5 bg-slate-50 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors">Listado</div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                            {activeProperties.slice(0, 8).map(p => (
                                <div key={p.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-all group cursor-pointer border border-transparent hover:border-slate-100" onClick={() => setSelectedPropertyId(p.id)}>
                                    <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden shadow-sm shrink-0 border border-slate-200">
                                        {p.files.photos[0] ? <img src={p.files.photos[0]} className="w-full h-full object-cover" /> : <Home size={18} className="m-auto mt-3 text-slate-300" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-black text-[#364649] truncate group-hover:text-[#AA895F] transition-colors uppercase tracking-tight">{p.address.street} {p.address.number}</p>
                                        <p className="text-[11px] text-slate-400 font-bold">{p.address.neighborhood} • {p.price} {p.currency}</p>
                                    </div>
                                    {redZoneProps.some(rz => rz.id === p.id) && (
                                        <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse shadow-sm shadow-rose-200" title="Zona Roja: Sin visitas"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. PROPERTY FUNNEL - NOW SMALLER (1 col) */}
                <div className="lg:col-span-1 bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex flex-col">
                    <div className="mb-4">
                        <h3 className="text-lg font-black text-[#364649] text-left">Embudo de Conversión</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider text-left mt-1">{isGlobal ? 'Global' : 'Individual'}</p>
                    </div>

                    {/* Property Selector for Funnel */}
                    <div className="relative w-full mb-4">
                        <select
                            value={selectedPropertyId}
                            onChange={(e) => setSelectedPropertyId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-[10px] font-black uppercase tracking-wider text-[#364649] px-4 py-3 rounded-xl focus:ring-2 focus:ring-[#AA895F]/30 outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-colors shadow-sm"
                        >
                            <option value="all">🌐 TODA LA CARTERA</option>
                            <optgroup label="Propiedades">
                                {activeProperties.map(p => (
                                    <option key={p.id} value={p.id}>{p.address.street} {p.address.number}</option>
                                ))}
                            </optgroup>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    {/* THE FUNNEL CHART - Compact */}
                    <div className="flex-1 min-h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={funnelStats} margin={{ top: 0, left: 0, right: 10, bottom: 0 }}>
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={70}
                                    tick={{ fill: '#364649', fontSize: 9, fontWeight: 900 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                                    {funnelStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Sub-component for Channel Stats (Small Version)
const ChannelDetailSmall = ({ name, color, barColor, stats, totalImp }: any) => {
    const percentImp = totalImp > 0 ? (stats.imp / totalImp) * 100 : 0;

    return (
        <div className="flex items-center gap-4">
            <div className="w-24 text-xs font-bold text-slate-600 truncate">{name}</div>
            <div className="flex-1">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full`} style={{ width: `${percentImp}%` }}></div>
                </div>
            </div>
            <div className="text-xs text-slate-500 w-28 text-right">
                <span className="font-bold text-slate-700">{stats.inq}</span> Cons. <span className="text-slate-300">|</span> <span className="font-bold text-slate-700">{stats.click}</span> Clicks
            </div>
        </div>
    );
};

export default DashboardHome;
