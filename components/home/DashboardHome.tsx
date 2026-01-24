
import React, { useMemo, useState } from 'react';
import {
    XAxis, YAxis, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import {
    TrendingUp, Users, Home, Clock, Target, ChevronDown,
    Circle, CheckCircle2, Pin
} from 'lucide-react';
import { ClientRecord, PropertyRecord, VisitRecord, MarketingLog, BuyerClientRecord, ActivityRecord } from '../../types';
import { useHabitStore } from '../../store/useHabitStore';
import { useBusinessStore } from '../../store/useBusinessStore';
import { useShallow } from 'zustand/react/shallow';

interface DashboardHomeProps {
    googleEvents?: any[];
    targetUserId?: string;
}

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

const getGoogleColor = (colorId: string) => {
    const colors: any = {
        '1': '#7986cb', '2': '#33b679', '3': '#8e24aa', '4': '#e67c73',
        '5': '#f6bf26', '6': '#f4511e', '7': '#039be5', '8': '#616161',
        '9': '#3f51b5', '10': '#0b8043', '11': '#d50000'
    };
    return colors[colorId] || '#039be5';
};

const DashboardHome: React.FC<DashboardHomeProps> = ({
    googleEvents: propGoogleEvents = [],
    targetUserId: propTargetUserId
}) => {
    const { currentYear, isHistoricalView } = useBusinessStore(useShallow(state => ({
        currentYear: state.selectedYear,
        isHistoricalView: state.isHistoricalView
    })));
    const [isAgendaExpanded, setIsAgendaExpanded] = useState(false);
    const hasFetchedHabitData = React.useRef(false);
    const hasFetchedCompletions = React.useRef(false);

    // Atomic Store Subscriptions
    const { clients, properties, visits, marketingLogs, buyers, goalsByYear, pipelineValue, authSession, targetUserId: storeTargetUserId, googleEvents: storeGoogleEvents } = useBusinessStore(useShallow(state => ({
        clients: state.clients,
        properties: state.properties,
        visits: state.visits,
        marketingLogs: state.marketingLogs,
        buyers: state.buyers,
        goalsByYear: state.goalsByYear,
        pipelineValue: state.getPipelineValue(),
        authSession: state.authSession,
        targetUserId: state.targetUserId,
        googleEvents: state.googleEvents
    })));

    const targetUserId = propTargetUserId || storeTargetUserId || authSession?.user?.id;
    // Use store events if prop not provided (prop has precedence if passed, though usually empty here)
    const googleEvents = propGoogleEvents.length > 0 ? propGoogleEvents : storeGoogleEvents;

    const billingGoal = goalsByYear[currentYear]?.annualBilling || 0;

    // Check if viewing other profile to protect privacy
    const isViewingOtherProfile = useMemo(() => {
        if (!targetUserId || !authSession?.user?.id) return false;
        return targetUserId !== authSession.user.id;
    }, [targetUserId, authSession]);

    // Filtered Google Events (Empty if viewing other profile)
    const effectiveGoogleEvents = useMemo(() => {
        return isViewingOtherProfile ? [] : googleEvents;
    }, [googleEvents, isViewingOtherProfile]);

    // Memoize displayMetrics to ensure it only updates when currentYear changes OR store metrics change
    const displayMetrics = useBusinessStore(useShallow(state => state.getHomeDisplayMetrics(currentYear)));

    const displayBilling = displayMetrics?.pocketFees || 0;
    const captationGoals = {
        weeklyPLTarget: displayMetrics?.criticalNumberTarget || 0,
        weeklyPLDone: displayMetrics?.weeklyPLDone || 0
    };

    const habits = useHabitStore(s => s.habits);
    const rangeCompletions = useHabitStore(s => s.rangeCompletions);
    const genericCompletions = useHabitStore(s => s.genericCompletions);
    const storeToggleHabit = useHabitStore(s => s.toggleHabit);
    const storeToggleGeneric = useHabitStore(s => s.toggleGenericEvent);
    const fetchCompletionsByRange = useHabitStore(s => s.fetchCompletionsByRange);
    const fetchInitialData = useHabitStore(s => s.fetchInitialData);
    const matchEventToHabit = useHabitStore(s => s.matchEventToHabit);


    // 2. Efficiently compute completed events
    const completedEventIds = React.useMemo(() => {
        const newSet = new Set<string>();
        if (!effectiveGoogleEvents.length) return newSet;

        // Add generic completions first
        genericCompletions.forEach(c => newSet.add(c.eventId));

        // Index completions by date for O(1) access
        const completionsByDate = new Map<string, string[]>();
        rangeCompletions.forEach(c => {
            const list = completionsByDate.get(c.targetDate) || [];
            list.push(c.habitId);
            completionsByDate.set(c.targetDate, list);
        });

        // Single pass over Google Events
        effectiveGoogleEvents.forEach(ev => {
            const evDate = ev.start.dateTime ? new Date(ev.start.dateTime).toISOString().split('T')[0] : ev.start.date;
            const habitIdsForDate = completionsByDate.get(evDate);
            if (!habitIdsForDate || habitIdsForDate.length === 0) return;

            const matchedHabit = matchEventToHabit(ev.summary || '');
            if (matchedHabit && habitIdsForDate.includes(matchedHabit.id)) {
                newSet.add(ev.id);
            }
        });

        return newSet;
    }, [rangeCompletions, genericCompletions, effectiveGoogleEvents, matchEventToHabit]);

    const weekDaysMetaData = React.useMemo(() => {
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
            return { day, dayStr };
        });
    }, []);

    const weeklyAgendaData = React.useMemo(() => {
        return weekDaysMetaData.map(({ day, dayStr }) => {
            const isToday = new Date().toISOString().split('T')[0] === dayStr;
            const dayEvents = effectiveGoogleEvents.filter((e: any) => {
                const eventDate = e.start.dateTime || e.start.date;
                const target = new Date(eventDate);
                return day.getDate() === target.getDate() &&
                    day.getMonth() === target.getMonth() &&
                    day.getFullYear() === target.getFullYear();
            }).reduce((acc, e) => {
                const startDate = new Date(e.start.dateTime || e.start.date);
                const eventTime = e.start.dateTime ? startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Todo el día';
                const title = e.summary || 'Sin título';

                // Deduplicate: If an event with same title and time exists, don't add it
                const exists = acc.find((item: any) => item.title === title && item.time === eventTime);
                if (!exists) {
                    acc.push({
                        id: e.id,
                        time: eventTime,
                        title,
                        date: dayStr,
                        type: 'google',
                        color: getGoogleColor(e.colorId),
                        timestamp: startDate.getTime()
                    });
                }
                return acc;
            }, [] as any[]).sort((a: any, b: any) => a.timestamp - b.timestamp);
            return { day, dayStr, isToday, dayEvents };
        });
    }, [effectiveGoogleEvents, completedEventIds, weekDaysMetaData]);

    React.useEffect(() => {
        if (targetUserId && googleEvents.length > 0) {
            // Guard: Only fetch if we haven't fetched or if key props strictly changed (handled by effect deps, but ref adds safety)
            // Actually, we want to fetch once per mount/user session.

            if (habits.length === 0 && !hasFetchedHabitData.current) {
                fetchInitialData(targetUserId);
                hasFetchedHabitData.current = true;
            }

            const eventDates = googleEvents
                .map(ev => ev.start.dateTime ? new Date(ev.start.dateTime).toISOString().split('T')[0] : ev.start.date)
                .filter(Boolean).sort();

            if (eventDates.length > 0 && !hasFetchedCompletions.current) {
                // We should probably check if range is already covered, but for now just debouncing/guarding is hard without ranges.
                // Assuming fetchCompletionsByRange is idempotent and safe, but let's prevent loop if it triggers render.
                // We'll rely on useHabitStore to check 'isRangeLoading'.
                fetchCompletionsByRange(targetUserId, eventDates[0], eventDates[eventDates.length - 1]);
                hasFetchedCompletions.current = true;
            }
        }
    }, [targetUserId, googleEvents.length]); // Keep deps, but Ref prevents re-execution of specific action if desired, though here we want to handle updates.

    // Better fix: Move fetchInitialData to a separate effect with strict dependency
    React.useEffect(() => {
        if (targetUserId && habits.length === 0 && !hasFetchedHabitData.current) {
            fetchInitialData(targetUserId);
            hasFetchedHabitData.current = true;
        }
    }, [targetUserId, habits.length]);

    const toggleEventCompletion = async (eventId: string, eventTitle: string, eventDate: string) => {
        if (!eventId || !targetUserId) return;
        const matchedHabit = matchEventToHabit(eventTitle);
        if (matchedHabit) {
            await storeToggleHabit(matchedHabit.id, matchedHabit.name, eventDate);
        } else {
            await storeToggleGeneric(eventId, eventDate);
        }
    };

    const isEventCompleted = (eventId: string): boolean => completedEventIds.has(eventId);

    const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');
    const isGlobal = selectedPropertyId === 'all';
    const activeProperties = useMemo(() => properties.filter(p => p.status === 'disponible' || p.status === 'reservada'), [properties]);
    const filteredLogs = useMemo(() => isGlobal ? marketingLogs : marketingLogs.filter(l => l.propertyId === selectedPropertyId), [marketingLogs, selectedPropertyId, isGlobal]);
    const filteredVisits = useMemo(() => isGlobal ? visits : visits.filter(v => v.propertyId === selectedPropertyId), [visits, selectedPropertyId, isGlobal]);
    const filteredProperties = useMemo(() => isGlobal ? properties : properties.filter(p => p.id === selectedPropertyId), [properties, selectedPropertyId, isGlobal]);

    const totalInquiries = filteredLogs.reduce((acc, l) => acc + l.marketplace.inquiries + l.social.inquiries + l.ads.inquiries, 0);
    const visitCount = filteredVisits.length;
    const totalSales = filteredProperties.filter(p => p.status === 'vendida').length;

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

    const redZoneProps = useMemo(() => {
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
        return activeProperties.filter(p => {
            const propVisits = visits.filter(v => v.propertyId === p.id);
            if (propVisits.length === 0) return true;
            const lastVisitDate = new Date(Math.max(...propVisits.map(v => new Date(v.date).getTime())));
            return lastVisitDate < fifteenDaysAgo;
        });
    }, [activeProperties, visits]);

    const ProgressBar = ({ value, max, color = "bg-[#AA895F]", label }: { value: number, max: number, color?: string, label?: string }) => {
        const percentage = max > 0 ? (value / max) * 100 : 0;
        const progressWidth = Math.min(percentage, 100);
        return (
            <div className="w-full">
                <div className="flex justify-between items-end mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
                    <span className="text-xs font-black text-[#364649]">{percentage.toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${progressWidth}%` }}></div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 pb-10">
            {/* ROW 1: STRATEGIC NUMBERS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                <div className="bg-[#364649] rounded-3xl p-8 shadow-lg text-white relative overflow-hidden flex flex-col justify-between min-h-[240px] border border-white/5">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp size={140} /></div>
                    <div className="relative z-10">
                        <p className="text-xs font-black uppercase text-[#AA895F] mb-2 tracking-[0.2em]">Facturación {isHistoricalView ? 'Histórica' : currentYear}</p>
                        <h3 className="text-5xl font-black mb-1">USD {Math.round(displayBilling).toLocaleString()}</h3>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#AA895F] rounded-lg mt-2 shadow-sm">
                            <Target size={14} className="text-white" />
                            <p className="text-xs font-black text-white uppercase tracking-wider">Meta: {billingGoal?.toLocaleString() || '0'}</p>
                        </div>
                    </div>
                    <div className="mt-6 relative z-10">
                        <ProgressBar value={displayBilling} max={billingGoal} color="bg-[#AA895F]" label="Progreso del Objetivo Anual" />
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col justify-between min-h-[240px] hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-black uppercase text-slate-400 tracking-[0.15em] mb-2">Reuniones Verdes</p>
                            <h3 className="text-5xl font-black text-[#364649] mb-1">{displayMetrics?.greenMeetingsDone || 0}</h3>
                            <div className="flex items-center gap-1.5 mt-2">
                                <Users size={16} className="text-[#AA895F]" />
                                <span className="text-sm font-black text-[#AA895F]">META: 15 REUNIONES</span>
                            </div>
                        </div>
                        <div className="bg-[#AA895F]/10 p-4 rounded-2xl text-[#AA895F]"><Users size={24} /></div>
                    </div>
                    <div className="mt-6">
                        <ProgressBar value={displayMetrics?.greenMeetingsDone || 0} max={15} color="bg-[#AA895F]" label="Cumplimiento Estándar" />
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col justify-between min-h-[240px] hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-black uppercase text-slate-400 tracking-[0.15em] mb-2">Número Crítico</p>
                            <h3 className="text-5xl font-black text-[#364649] mb-1">{displayMetrics?.criticalNumberDone?.toFixed(1) || '0.0'}</h3>
                            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider mt-1">Objetivo: {displayMetrics?.criticalNumberTarget?.toFixed(1) || '0.0'}</p>
                        </div>
                        <div className="bg-[#708F96]/10 p-4 rounded-2xl text-[#708F96]"><Target size={24} /></div>
                    </div>
                    <div className="mt-6 space-y-4">
                        <ProgressBar value={displayMetrics?.criticalNumberDone || 0} max={displayMetrics?.criticalNumberTarget || 1} color="bg-[#708F96]" label="Tracción de Negocio" />
                        <div className="flex justify-between items-center bg-[#AA895F]/10 px-4 py-3 rounded-2xl border border-[#AA895F]/20">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#364649]">Pre-listings</span>
                            <span className="text-[#AA895F] font-black text-sm">{captationGoals?.weeklyPLDone?.toFixed(1)} / {captationGoals?.weeklyPLTarget?.toFixed(1)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ROW 2: WEEKLY AGENDA */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 transition-all duration-500">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-black text-[#364649]">Agenda Semanal</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 text-left">Reuniones y Compromisos Programados</p>
                    </div>
                    <button onClick={() => setIsAgendaExpanded(!isAgendaExpanded)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#364649] transition-colors group">
                        <span className="text-xs font-black uppercase tracking-wider">{isAgendaExpanded ? 'Colapsar' : 'Ver Todo'}</span>
                        <ChevronDown size={16} className={`text-[#AA895F] transition-transform duration-300 ${isAgendaExpanded ? 'rotate-180' : ''}`} />
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-start">
                    {weeklyAgendaData.map((dayData, i) => {
                        const { day, dayStr, isToday, dayEvents } = dayData;
                        return (
                            <div key={i} className={`flex flex-col rounded-3xl p-4 transition-all duration-300 ${isToday ? 'bg-[#AA895F]/5 ring-2 ring-[#AA895F]/20' : 'bg-slate-50 border border-slate-100'} ${isAgendaExpanded ? 'min-h-[280px]' : 'h-[280px]'}`}>
                                <div className="mb-3 border-b border-slate-200/50 pb-2">
                                    <p className={`text-[10px] font-black uppercase tracking-tighter ${isToday ? 'text-[#AA895F]' : 'text-slate-400'}`}>{day.toLocaleDateString('es-AR', { weekday: 'long' })}</p>
                                    <p className={`text-lg font-black ${isToday ? 'text-[#AA895F]' : 'text-[#364649]'}`}>{day.getDate()}</p>
                                </div>
                                <div className={`space-y-2 flex-grow pr-1 ${isAgendaExpanded ? '' : 'overflow-y-auto custom-scrollbar'}`}>
                                    {dayEvents.length > 0 ? (
                                        dayEvents.map((ev: any, idx) => (
                                            <AgendaItem
                                                key={ev.id || idx}
                                                ev={ev}
                                                isCompleted={isEventCompleted(ev.id)}
                                                toggleEventCompletion={toggleEventCompletion}
                                            />
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full opacity-20 grayscale"><Clock size={16} className="text-slate-400" /></div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ROW 3: PROPERTIES & FUNNEL */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 text-left bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-black text-[#364649] flex items-center gap-2"><Home size={22} className="text-[#AA895F]" />Cartera Activa ({activeProperties.length})</h3>
                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-3 py-1.5 bg-slate-50 rounded-xl">Listado</div>
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
                                {redZoneProps.some(rz => rz.id === p.id) && <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse shadow-sm shadow-rose-200" title="Zona Roja: Sin visitas"></div>}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-1 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col">
                    <div className="mb-4">
                        <h3 className="text-lg font-black text-[#364649] text-left">Embudo de Conversión</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider text-left mt-1">{isGlobal ? 'Global' : 'Individual'}</p>
                    </div>
                    <div className="relative w-full mb-4">
                        <select value={selectedPropertyId} onChange={(e) => setSelectedPropertyId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-[10px] font-black uppercase tracking-wider text-[#364649] px-4 py-3 rounded-xl outline-none appearance-none cursor-pointer">
                            <option value="all">🌐 TODA LA CARTERA</option>
                            <optgroup label="Propiedades">
                                {activeProperties.map(p => <option key={p.id} value={p.id}>{p.address.street} {p.address.number}</option>)}
                            </optgroup>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    <div className="flex-1 min-h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={funnelStats} margin={{ top: 0, left: 0, right: 10, bottom: 0 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={70} tick={{ fill: '#364649', fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                                    {funnelStats.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 4. ATOMIC SUB-COMPONENT ---
const AgendaItem = React.memo(({
    ev,
    isCompleted,
    toggleEventCompletion
}: {
    ev: any;
    isCompleted: boolean;
    toggleEventCompletion: (id: string, title: string, date: string) => void;
}) => (
    <div
        onClick={() => ev.id && toggleEventCompletion(ev.id, ev.title, ev.date)}
        className={`bg-white p-2 rounded-xl shadow-sm border flex flex-col items-start text-left transition-all duration-300 cursor-pointer hover:ring-2 hover:ring-[#AA895F]/50 hover:shadow-md ${isCompleted ? 'opacity-30 border-slate-100 bg-slate-50/50 grayscale' : 'border-slate-100'}`}
    >
        <div className="flex items-center justify-between w-full gap-2">
            <span
                className={`text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-sm ${isCompleted ? 'bg-slate-200 text-slate-500' : 'text-white'}`}
                style={{ backgroundColor: isCompleted ? undefined : ev.color }}
            >
                {ev.time}
            </span>
            <span className={`transition-all duration-300 ${isCompleted ? 'text-slate-400 opacity-50' : 'text-[#AA895F]'}`}>
                {isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} className="opacity-40" />}
            </span>
        </div>
        <p className={`text-[10px] font-bold leading-tight line-clamp-2 mt-1 flex items-center gap-1.5 ${isCompleted ? 'text-slate-400 line-through' : 'text-[#364649]'}`}>
            {!isCompleted && !/[\u{1F300}-\u{1F9FF}]/u.test(ev.title) && <Pin size={10} className="text-[#AA895F] shrink-0" />}
            {ev.title}
        </p>
    </div>
));

export default React.memo(DashboardHome);
