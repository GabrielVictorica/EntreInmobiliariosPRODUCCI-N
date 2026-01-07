import React, { useMemo } from 'react';
import {
    Lightbulb,
    Zap,
    Clock,
    AlertTriangle,
    TrendingUp,
    BrainCircuit,
    Lock
} from 'lucide-react';
import { Habit, HabitCompletion, DailyLog } from '../../types';

interface HabitInsightsProps {
    completions: any[];
    logs: DailyLog[];
    habits: Habit[];
}

export default function HabitInsights({ completions, logs, habits }: HabitInsightsProps) {

    // Algoritmo 1: Hora Dorada (Golden Hour)
    // Momento del día con más completaciones de hábitos de alta carga cognitiva
    const goldenHour = useMemo(() => {
        if (completions.length < 10) return null;

        const hours: Record<number, number> = {};
        completions.forEach(c => {
            const habit = c.habit; // Asumiendo que viene populado
            if (habit?.cognitive_load === 'high') {
                // Usar completed_at para extraer la hora real
                const hour = new Date(c.completed_at).getHours();
                hours[hour] = (hours[hour] || 0) + 1;
            }
        });

        const bestHour = Object.keys(hours).reduce((a, b) => hours[Number(a)] > hours[Number(b)] ? a : b, null as string | null);

        if (!bestHour) return null;

        const h = Number(bestHour);
        const period = h < 12 ? 'Mañana' : h < 18 ? 'Tarde' : 'Noche';
        return { hour: `${h}:00`, period };
    }, [completions]);


    // Algoritmo 2: Vampiro de Energía
    // Hábito que frecuentemente precede a un registro de baja energía
    const energyVampire = useMemo(() => {
        if (logs.length < 5) return null;
        // Lógica simplificada: Buscar hábitos completados días con energía < 4
        // Esto es más complejo en la realidad, requeriría timestamps exactos vs logs, 
        // pero haremos una aproximación "Hábito correlacionado con días bajos".

        const lowEnergyDays = logs.filter(l => (l.energyScore || 0) <= 4).map(l => l.date);
        if (lowEnergyDays.length === 0) return null;

        const habitCounts: Record<string, number> = {};
        completions.forEach(c => {
            if (lowEnergyDays.includes(c.target_date)) {
                const hName = c.habit?.name || 'Desconocido';
                habitCounts[hName] = (habitCounts[hName] || 0) + 1;
            }
        });

        const vampire = Object.keys(habitCounts).reduce((a, b) => habitCounts[a] > habitCounts[b] ? a : b, null as string | null);
        return vampire;
    }, [completions, logs]);


    // Algoritmo 3: Día Kriptonita
    // Día de la semana con menor tasa de completación
    const kryptoniteDay = useMemo(() => {
        if (completions.length < 20) return null;

        const dayCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }; // 0 = Sun
        completions.forEach(c => {
            const day = new Date(c.target_date).getDay();
            dayCounts[day]++;
        });

        // Encontrar el min que no sea 0 (asumiendo que al menos un día se trackea)
        // O mejor, el día con promedio más bajo si tuvieramos el total de intentos posibles.
        // Simplificación: Día con menos completaciones absolutas (puede estar sesgado si el hábito no toca ese día)

        const entries = Object.entries(dayCounts);
        entries.sort((a, b) => a[1] - b[1]);

        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        return dayNames[Number(entries[0][0])];
    }, [completions]);


    const renderPlaceholder = (title: string, icon: React.ReactNode, desc: string) => (
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 opacity-70 relative overflow-hidden group">
            <div className="absolute top-2 right-2 text-slate-300">
                <Lock size={16} />
            </div>
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white rounded-lg text-slate-400 shadow-sm">
                    {icon}
                </div>
                <h4 className="font-bold text-slate-500 text-sm">{title}</h4>
            </div>
            <p className="text-xs text-slate-400">{desc}</p>
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs font-bold text-[#364649] bg-white px-3 py-1 rounded-full shadow-sm">
                    Faltan datos
                </span>
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-black text-[#364649] flex items-center gap-2">
                <BrainCircuit className="text-[#AA895F]" /> Insights de IA
            </h3>

            <div className="grid md:grid-cols-3 gap-4">

                {/* Card 1: Golden Hour */}
                {goldenHour ? (
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white rounded-lg text-amber-500 shadow-sm">
                                <Clock size={20} />
                            </div>
                            <h4 className="font-bold text-[#364649] text-sm">Hora Dorada</h4>
                        </div>
                        <p className="text-2xl font-black text-[#364649] mb-1">{goldenHour.hour}</p>
                        <p className="text-xs text-slate-600">
                            Tu pico de productividad cognitiva es durante la {goldenHour.period.toLowerCase()}.
                        </p>
                    </div>
                ) : (
                    renderPlaceholder("Hora Dorada", <Clock size={20} />, "Descubre tu momento de máxima productividad cognitiva.")
                )}

                {/* Card 2: Energy Vampire */}
                {energyVampire ? (
                    <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-4 border border-red-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white rounded-lg text-red-500 shadow-sm">
                                <Zap size={20} />
                            </div>
                            <h4 className="font-bold text-[#364649] text-sm">Vampiro de Energía</h4>
                        </div>
                        <p className="text-lg font-black text-[#364649] mb-1 truncate" title={energyVampire}>{energyVampire}</p>
                        <p className="text-xs text-slate-600">
                            Este hábito suele coincidir con tus días de baja energía.
                        </p>
                    </div>
                ) : (
                    renderPlaceholder("Vampiro de Energía", <Zap size={20} />, "Detecta qué hábitos drenan tu vitalidad diaria.")
                )}

                {/* Card 3: Kryptonite */}
                {kryptoniteDay ? (
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-4 border border-indigo-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white rounded-lg text-indigo-500 shadow-sm">
                                <AlertTriangle size={20} />
                            </div>
                            <h4 className="font-bold text-[#364649] text-sm">Día Kriptonita</h4>
                        </div>
                        <p className="text-xl font-black text-[#364649] mb-1">{kryptoniteDay}</p>
                        <p className="text-xs text-slate-600">
                            Tus completaciones caen drásticamente este día. ¡Planifica con cuidado!
                        </p>
                    </div>
                ) : (
                    renderPlaceholder("Día Kriptonita", <AlertTriangle size={20} />, "Identifica el día de la semana que rompe tus rachas.")
                )}

            </div>
        </div>
    );
}
