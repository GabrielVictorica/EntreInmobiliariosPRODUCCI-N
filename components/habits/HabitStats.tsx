import React, { useMemo, useState } from 'react';
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
import { useHabitStore } from '../../store/useHabitStore';
import { Loader2, TrendingUp, Info, Grid, RefreshCw, AlertTriangle, Calendar as CalendarIcon, Clock, Zap } from 'lucide-react';
import HabitInsights from './HabitInsights';

interface HabitStatsProps {
    googleAccessToken?: string | null;
}

export default function HabitStats({ googleAccessToken }: HabitStatsProps) {
    const habits = useHabitStore(s => s.habits);
    const isHistoricalLoading = useHabitStore(s => s.isHistoricalLoading);
    const analysisRange = useHabitStore(s => s.analysisRange);
    const setAnalysisRange = useHabitStore(s => s.setAnalysisRange);
    const getRadarData = useHabitStore(s => s.getRadarData);
    const getProMetrics = useHabitStore(s => s.getProMetrics);
    const getYearInPixels = useHabitStore(s => s.getYearInPixels);
    const getCorrelationData = useHabitStore(s => s.getCorrelationData);
    const getAnalysisSufficiency = useHabitStore(s => s.getAnalysisSufficiency);

    const [syncing, setSyncing] = useState(false);

    const radarData = useMemo(() => getRadarData(), [getRadarData, analysisRange]);
    const proMetrics = useMemo(() => getProMetrics(), [getProMetrics, analysisRange]);
    const pixelData = useMemo(() => getYearInPixels(), [getYearInPixels]);
    const correlationData = useMemo(() => getCorrelationData(), [getCorrelationData, analysisRange]);
    const sufficiency = useMemo(() => getAnalysisSufficiency(), [getAnalysisSufficiency]);

    // Optimized lookup for Year in Pixels
    const pixelMap = useMemo(() => {
        const map = new Map<string, any>();
        pixelData.forEach(d => map.set(d.date, d));
        return map;
    }, [pixelData]);

    // UI Date Helper
    const yearGridData = useMemo(() => {
        const data = [];
        const today = new Date();
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        for (let i = 364; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            data.push({
                date: d.toISOString().split('T')[0],
                month: months[d.getMonth()],
                isFirstOfMonth: d.getDate() === 1
            });
        }
        return data;
    }, []);

    // Calendar Sync Logic
    const missingCalendarHabits = useMemo(() => {
        return habits.filter(h => h.active && !h.googleEventId);
    }, [habits]);

    const handleSyncMissingEvents = async () => {
        if (!googleAccessToken || missingCalendarHabits.length === 0) return;
        setSyncing(true);
        let successCount = 0;
        for (const habit of missingCalendarHabits) {
            const result = await createRecurringHabitEvent(habit as any, googleAccessToken);
            if (result.success && result.event?.id) {
                await supabase.from('habits').update({ google_event_id: result.event.id }).eq('id', habit.id);
                successCount++;
            }
        }
        setSyncing(false);
        if (successCount > 0) alert(`Sincronizados ${successCount} eventos.`);
    };

    if (isHistoricalLoading && !radarData.length) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <Loader2 className="animate-spin text-[#AA895F]" size={40} />
                <p className="text-slate-500 font-medium animate-pulse">Analizando rendimiento...</p>
            </div>
        );
    }

    const renderEmptyState = (title: string, desc: string) => (
        <div className="h-[400px] flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-4">
                <TrendingUp className="text-slate-300" size={24} />
            </div>
            <h4 className="font-bold text-[#364649] mb-1">{title}</h4>
            <p className="text-xs text-slate-500 max-w-[250px]">
                {desc} {sufficiency.msg && <span className="block mt-2 font-bold text-[#AA895F]">{sufficiency.msg}</span>}
            </p>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Sync Alert Block */}
            {missingCalendarHabits.length > 0 && googleAccessToken && (
                <div className="bg-orange-50 p-4 rounded-3xl border border-orange-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="text-orange-500" size={20} />
                        <p className="text-xs text-orange-800 font-medium">Hay {missingCalendarHabits.length} hábitos sin sincronizar con Google Calendar.</p>
                    </div>
                    <button onClick={handleSyncMissingEvents} disabled={syncing} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-orange-600 transition-colors disabled:opacity-50">
                        {syncing ? <Loader2 className="animate-spin" size={14} /> : 'Sincronizar'}
                    </button>
                </div>
            )}

            {/* Range Selector */}
            <div className="flex bg-slate-100 p-1 rounded-2xl self-start w-fit ml-auto">
                {[30, 90, 180, 365].map((r) => (
                    <button
                        key={r}
                        onClick={() => setAnalysisRange(r)}
                        className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${analysisRange === r ? 'bg-white text-[#364649] shadow-sm' : 'text-slate-500'}`}
                    >
                        {r === 30 ? '30 Días' : r === 90 ? '3 Meses' : r === 180 ? '6 Meses' : '1 Año'}
                    </button>
                ))}
            </div>

            {/* Radar Mastery Chart */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#364649]/5">
                <div className="mb-8">
                    <h3 className="text-xl font-black text-[#364649] flex items-center gap-2">
                        <TrendingUp size={22} className="text-[#AA895F]" /> Balance de Maestría
                    </h3>
                    <p className="text-xs text-slate-500">Consistencia real vs potencial por esferas de vida</p>
                </div>

                <div className="h-[450px]">
                    {!sufficiency.ok ? renderEmptyState("Cargando Balance...", "Necesitamos más datos para trazar tu maestría.") : (
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 13, fontWeight: 700 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                                <Radar name="Consistencia %" dataKey="A" stroke="#364649" strokeWidth={3} fill="#364649" fillOpacity={0.3} />
                                <RechartsTooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            <HabitInsights />
            <HabitHeatmap />

            {/* Performance Correlation */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#364649]/5">
                <div className="mb-8">
                    <h3 className="text-xl font-black text-[#364649] flex items-center gap-2">
                        <Grid size={22} className="text-[#AA895F]" /> Rendimiento vs Energía
                    </h3>
                    <p className="text-xs text-slate-500">Correlación entre tu energía biológica y ejecución de hábitos</p>
                </div>
                <div className="h-[300px]">
                    {!sufficiency.ok ? renderEmptyState("Analizando Correlación...", "Tu curva de bio-rendimiento aparecerá pronto.") : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={correlationData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" hide />
                                <YAxis domain={[0, 100]} />
                                <RechartsTooltip />
                                <Legend />
                                <Line type="monotone" dataKey="performance" name="Rendimiento" stroke="#364649" strokeWidth={3} dot={false} />
                                <Line type="monotone" dataKey="energy" name="Energía" stroke="#AA895F" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Year in Pixels */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#364649]/5">
                <div className="mb-6">
                    <h3 className="text-xl font-black text-[#364649] flex items-center gap-2">
                        <CalendarIcon size={22} className="text-[#AA895F]" /> Mapa de Vida (365 días)
                    </h3>
                </div>
                <div className="flex flex-wrap gap-1 justify-center">
                    {yearGridData.map(day => {
                        const info = pixelMap.get(day.date);
                        let color = 'bg-slate-100';
                        if (info) {
                            const score = info.moodScore || 0;
                            if (score === 5) color = 'bg-emerald-600';
                            else if (score === 4) color = 'bg-emerald-400';
                            else if (score === 3) color = 'bg-yellow-400';
                            else if (score === 2) color = 'bg-orange-400';
                            else if (score === 1) color = 'bg-rose-500';
                        }
                        return (
                            <div
                                key={day.date}
                                className={`w-3 h-3 rounded-sm ${color} transition-colors cursor-help`}
                                title={`${day.date}: Mood ${info?.moodScore || '?'}`}
                            />
                        );
                    })}
                </div>
                <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 bg-rose-500 rounded-sm"></div> Crítico</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-400 rounded-sm"></div> Neutro</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-600 rounded-sm"></div> Épico</div>
                </div>
            </div>
        </div>
    );
}

function HabitHeatmap() {
    const { habits, getHabitHistory } = useHabitStore();
    const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

    // Default to first habit
    React.useEffect(() => {
        if (!selectedHabitId && habits.length > 0) {
            setSelectedHabitId(habits[0].id);
        }
    }, [habits, selectedHabitId]);

    const historyData = useMemo(() => {
        return selectedHabitId ? getHabitHistory(selectedHabitId) : null;
    }, [getHabitHistory, selectedHabitId]);

    if (habits.length === 0) return null;

    return (
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#364649]/5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h3 className="text-xl font-black text-[#364649] flex items-center gap-2">
                        <Zap size={22} className="text-[#AA895F]" /> Disciplina por Hábito
                    </h3>
                    <p className="text-xs text-slate-500">Visualiza tu constancia individual y cumplimiento del plan.</p>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide max-w-full md:max-w-[400px]">
                    {habits.map(h => (
                        <button
                            key={h.id}
                            onClick={() => setSelectedHabitId(h.id)}
                            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${selectedHabitId === h.id ? 'bg-[#364649] text-white shadow-md scale-110' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                            title={h.name}
                        >
                            <span className="text-lg">{h.icon}</span>
                        </button>
                    ))}
                </div>
            </div>

            {!historyData ? (
                <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm italic">
                    Selecciona un hábito...
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Adherencia</p>
                            <p className="text-2xl font-black text-[#364649]">{historyData.stats.adherence}%</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Logrados</p>
                            <p className="text-2xl font-black text-emerald-600">{historyData.stats.completedTotal}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Meta Periodo</p>
                            <p className="text-2xl font-black text-[#364649]">{historyData.stats.scheduledTotal}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Hábito</p>
                            <p className="text-sm font-bold text-[#364649] truncate">{historyData.stats.name}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-1 justify-center bg-slate-50/50 p-6 rounded-2xl border border-dashed border-slate-200">
                        {historyData.history.map((day: any) => {
                            let color = 'bg-slate-200/50';
                            if (day.status === 'blank') color = 'bg-transparent border border-slate-100/50';
                            else if (day.status === 'completed') color = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.2)]';
                            else if (day.status === 'missed') color = 'bg-rose-400/80';
                            else if (day.status === 'neutral') color = day.isCompleted ? 'bg-emerald-400/40' : 'bg-slate-100';

                            return (
                                <div
                                    key={day.date}
                                    title={`${day.date}: ${day.status}`}
                                    className={`w-3 h-3 rounded-[2px] transition-colors ${color}`}
                                />
                            );
                        })}
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></div> Logrado</div>
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-rose-400 rounded-sm"></div> Fallido</div>
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-slate-100 rounded-sm"></div> Descanso</div>
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 border border-slate-300/30 rounded-sm"></div> Pre-Creación</div>
                    </div>
                </div>
            )}
        </div>
    );
}
