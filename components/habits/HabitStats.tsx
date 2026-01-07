import React, { useMemo, useState, useEffect } from 'react';
import {
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend
} from 'recharts';
import { supabase } from '../../services/supabaseClient';
import { createRecurringHabitEvent } from '../../services/habitCalendarService';
import { HabitCategory, Habit } from '../../types';
import { Loader2, TrendingUp, Calendar as CalendarIcon, Info, Grid, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import HabitInsights from './HabitInsights';

interface HabitStatsProps {
    userId: string;
    categories: HabitCategory[];
    googleAccessToken?: string | null;
}

export default function HabitStats({ userId, categories, googleAccessToken }: HabitStatsProps) {
    const [loading, setLoading] = useState(true);
    const [statsData, setStatsData] = useState<any>(null);
    const [missingCalendarHabits, setMissingCalendarHabits] = useState<any[]>([]);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            if (!userId) return;
            setLoading(true);

            // 1. Fetch historical completions (last 365 days for year view)
            const yearAgo = new Date();
            yearAgo.setDate(yearAgo.getDate() - 365);

            const { data: completions, error: compError } = await supabase
                .from('habit_completions')
                .select(`
          target_date,
          completed_at,
          value,
          habit:habits ( name, category_id, cognitive_load )
        `)
                .gte('target_date', yearAgo.toISOString().split('T')[0]);

            // 2. Fetch daily logs (last 365 days)
            const { data: logs, error: logError } = await supabase
                .from('daily_logs')
                .select('date, mood_score, energy_score')
                .gte('date', yearAgo.toISOString().split('T')[0])
                .order('date');

            // 3. Check for unsynced habits (Active but no google_event_id)
            const { data: unsyncedHabits } = await supabase
                .from('habits')
                .select('*')
                .eq('user_id', userId)
                .eq('active', true)
                .is('google_event_id', null);

            if (unsyncedHabits) {
                setMissingCalendarHabits(unsyncedHabits);
            }

            if (!compError && !logError && completions && logs) {
                setStatsData({ completions, logs });
            }
            setLoading(false);
        };

        fetchStats();
    }, [userId]);

    const handleSyncMissingEvents = async () => {
        if (!googleAccessToken || missingCalendarHabits.length === 0) return;
        setSyncing(true);
        let successCount = 0;

        for (const habit of missingCalendarHabits) {
            // Prepare data for service
            const habitData = {
                id: habit.id,
                name: habit.name,
                icon: habit.icon || '📌',
                estimatedDuration: habit.estimated_duration,
                scheduleType: habit.schedule_type,
                preferredBlock: habit.preferred_block,
                fixedTime: habit.fixed_time,
                frequency: habit.frequency
            };

            const result = await createRecurringHabitEvent(habitData, googleAccessToken);
            if (result.success && result.event?.id) {
                await supabase
                    .from('habits')
                    .update({ google_event_id: result.event.id })
                    .eq('id', habit.id);
                successCount++;
            }
        }

        setSyncing(false);
        if (successCount > 0) {
            alert(`Sincronizados ${successCount} hábitos con Google Calendar exisotasemente.`);
            setMissingCalendarHabits(prev => prev.filter(h => h.google_event_id === null)); // Optimistic clear? 
            // Better re-fetch but for now clear logic
            setMissingCalendarHabits([]);
        } else {
            alert('No se pudieron sincronizar. Verifica que estés conectado a Google Calendar en la pestaña Calendario.');
        }
    };

    // Transform Data for Radar Chart (Balance by Sphere)
    const radarData = useMemo(() => {
        if (!statsData?.completions) return [];

        const counts: Record<number, number> = {};
        categories.forEach(c => counts[c.id] = 0);

        statsData.completions.forEach((c: any) => {
            const catId = c.habit?.category_id;
            if (catId) counts[catId] = (counts[catId] || 0) + 1;
        });

        // Normalize (simple count for now, ideally percentage of possible)
        return categories.map(cat => ({
            subject: cat.name,
            A: counts[cat.id] || 0,
            fullMark: 20 // Arbitrary scale reference
        }));
    }, [statsData, categories]);

    // Year in Pixels Data (Simple Mood Grid)
    const pixelData = useMemo(() => {
        if (!statsData?.logs) return [];
        // Map date -> mood color
        const map: Record<string, string> = {};
        statsData.logs.forEach((l: any) => {
            let color = 'bg-gray-100';
            switch (l.mood_score) {
                case 1: color = 'bg-red-400'; break;
                case 2: color = 'bg-orange-400'; break;
                case 3: color = 'bg-yellow-400'; break;
                case 4: color = 'bg-lime-400'; break;
                case 5: color = 'bg-green-500'; break;
                default: color = 'bg-gray-100';
            }
            map[l.date] = color;
        });
        return map;
    }, [statsData]);

    // Generate Year Grid (Last 365 days)
    const yearGrid = useMemo(() => {
        const days = [];
        const today = new Date();
        for (let i = 364; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            days.push(d.toISOString().split('T')[0]);
        }
        return days;
    }, []);

    // Transform Data for Line Chart (Mood vs Productivity)
    const lineData = useMemo(() => {
        if (!statsData?.logs || !statsData?.completions) return [];

        const dailyCompletions: Record<string, number> = {};
        statsData.completions.forEach((c: any) => {
            dailyCompletions[c.target_date] = (dailyCompletions[c.target_date] || 0) + 1;
        });

        return statsData.logs.map((log: any) => ({
            date: log.date.split('-')[2] + '/' + log.date.split('-')[1], // DD/MM
            mood: log.mood_score,
            energy: log.energy_score,
            habits: dailyCompletions[log.date] || 0
        }));
    }, [statsData]);

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#AA895F]" /></div>;
    }

    if (!statsData || statsData.completions.length === 0) {
        return (
            <div className="bg-white rounded-3xl p-12 shadow-lg border border-[#364649]/5 text-center">
                <div className="w-16 h-16 bg-[#E0D8CC] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="text-[#AA895F]" size={28} />
                </div>
                <h3 className="text-xl font-bold text-[#364649] mb-2">Recopilando Datos...</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-6">
                    Los gráficos de inteligencia artificial aparecerán automáticamente
                    tras <strong>3 a 5 días</strong> de constancia.
                </p>

                {(missingCalendarHabits.length > 0 && googleAccessToken) && (
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 max-w-sm mx-auto">
                        <h4 className="font-bold text-orange-800 flex items-center justify-center gap-2 mb-2">
                            <AlertTriangle size={16} /> Sincronización Incompleta
                        </h4>
                        <p className="text-xs text-orange-700 mb-3">
                            Hay {missingCalendarHabits.length} hábitos que no están en Google Calendar.
                        </p>
                        <button
                            onClick={handleSyncMissingEvents}
                            disabled={syncing}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 mx-auto disabled:opacity-50"
                        >
                            {syncing ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                            Sincronizar Ahora
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Sync Alert Block */}
            {(missingCalendarHabits.length > 0) && (
                <div className="bg-orange-50 p-4 rounded-3xl border border-orange-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shrink-0">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-orange-800 text-sm">Sincronización Pendiente</h4>
                            <p className="text-xs text-orange-700">
                                {missingCalendarHabits.length} hábitos no se reflejan en Google Calendar.
                                {!googleAccessToken && " (Conecta tu calendario para solucionar)"}
                            </p>
                        </div>
                    </div>
                    {googleAccessToken && (
                        <button
                            onClick={handleSyncMissingEvents}
                            disabled={syncing}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-50"
                        >
                            {syncing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                            Sincronizar
                        </button>
                    )}
                </div>
            )}

            {/* 1. Radar Chart: Balance de Esferas */}
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#364649]/5">
                <h3 className="text-lg font-black text-[#364649] mb-4 flex items-center gap-2">
                    <Info size={18} className="text-[#AA895F]" /> Balance de Vida (Esferas)
                </h3>
                <div className="h-[450px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                            <Radar
                                name="Hábitos Completados"
                                dataKey="A"
                                stroke="#364649"
                                fill="#364649"
                                fillOpacity={0.5}
                            />
                            <RechartsTooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-xs text-center text-slate-400 mt-2">Distribución de tu enfoque en los últimos 30 días</p>
            </div>

            {/* 2. Line Chart: Biología vs Performance */}
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#364649]/5">
                <h3 className="text-lg font-black text-[#364649] mb-4 flex items-center gap-2">
                    <ActivityIcon /> Correlación: Energía vs Productividad
                </h3>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={lineData} margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                            <YAxis yAxisId="left" orientation="left" stroke="#364649" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="right" orientation="right" stroke="#AA895F" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                            <RechartsTooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="habits"
                                name="Hábitos"
                                stroke="#364649"
                                strokeWidth={3}
                                dot={{ fill: '#364649', r: 5 }}
                                activeDot={{ r: 7 }}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="energy"
                                name="Energía"
                                stroke="#AA895F"
                                strokeWidth={3}
                                dot={{ fill: '#AA895F', r: 5 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 3. Year in Pixels (Mood Analysis) */}
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#364649]/5">
                <h3 className="text-lg font-black text-[#364649] mb-4 flex items-center gap-2">
                    <Grid size={18} className="text-[#AA895F]" /> Año en Píxeles
                </h3>
                <div className="flex flex-wrap gap-1.5 justify-center max-w-5xl mx-auto py-4">
                    {yearGrid.map(date => (
                        <div
                            key={date}
                            title={`${date}`}
                            className={`w-4 h-4 rounded-md transition-all hover:scale-125 hover:shadow-lg cursor-pointer ${pixelData[date] || 'bg-gray-100'}`}
                        />
                    ))}
                </div>
                <div className="flex justify-center gap-6 mt-6 text-sm font-bold text-slate-500">
                    <span className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-red-400"></div> Mal</span>
                    <span className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-orange-400"></div> Bajo</span>
                    <span className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-yellow-400"></div> Normal</span>
                    <span className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-lime-400"></div> Bien</span>
                    <span className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-green-500"></div> Excelente</span>
                </div>
            </div>

            {/* 4. AI Insights */}
            {statsData && statsData.completions && (
                <HabitInsights
                    completions={statsData.completions}
                    logs={statsData.logs}
                    habits={[]}
                />
            )}

        </div>
    );
}

function ActivityIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#AA895F]">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    )
}
