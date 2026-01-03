import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Target, TrendingUp, Award, CheckCircle2 } from 'lucide-react';
import { Habit } from './HabitCard';

interface HabitAnalysisProps {
    habits: Habit[];
    selectedDate: Date;
    session: any;
    isMother: boolean;
    selectedTeamUser: string | null;
    refreshTrigger?: number;
}

export default function HabitAnalysis({ habits, selectedDate, session, isMother, selectedTeamUser, refreshTrigger }: HabitAnalysisProps) {
    const [monthlyLogs, setMonthlyLogs] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    const monthName = selectedDate.toLocaleDateString('es-AR', { month: 'long' });
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    const effectiveUserEmail = isMother && selectedTeamUser ? selectedTeamUser : session?.user?.email;

    const SUPABASE_URL = 'https://whfoflccshoztjlesnhh.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZm9mbGNjc2hvenRqbGVzbmhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzUwMzEsImV4cCI6MjA4MTMxMTAzMX0.rPQdO1qCovC9WP3ttlDOArvTI7I15lg7fnOPkJseDos';

    // Fetch all logs for the selected month
    React.useEffect(() => {
        if (!session?.user?.id) return;
        fetchMonthlyData();
    }, [selectedDate, effectiveUserEmail, refreshTrigger, habits]);

    const fetchMonthlyData = async () => {
        if (!Array.isArray(habits) || habits.length === 0) {
            setMonthlyLogs([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
            const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];
            const habitIdsString = habits.map(h => h.id).join(',');

            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/habit_logs?habit_id=in.(${habitIdsString})&date=gte.${firstDay}&date=lte.${lastDay}&select=*`,
                {
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${session.access_token}`
                    }
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Supabase error fetching logs:", errorData);
                setMonthlyLogs([]);
                return;
            }

            const data = await response.json();
            setMonthlyLogs(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching monthly habit logs:", error);
            setMonthlyLogs([]);
        } finally {
            setIsLoading(false);
        }
    };

    // 1. Calculate Monthly Summary (KPIs)
    const metrics = useMemo(() => {
        if (!Array.isArray(habits) || habits.length === 0 || isLoading || !Array.isArray(monthlyLogs)) {
            return { completionRate: 0, totalPlanned: 0, totalActual: 0, habitMetrics: [] };
        }

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let totalPlanned = 0;
        let totalActual = 0;

        const habitMetrics = habits.map(habit => {
            // Filter logs for this specific habit
            const logs = monthlyLogs.filter(l => l.habit_id === habit.id);

            // Calculate planned executions based on frequency and duration
            const weeklyFreq = habit.frequency.length;
            const plannedMonthly = Math.round((weeklyFreq / 7) * daysInMonth);

            // Real execution from logs
            let actualMonthly = 0;
            if (habit.type === 'binary') {
                actualMonthly = logs.filter(l => l.completed).length;
            } else {
                actualMonthly = logs.reduce((acc, l) => acc + (l.current_value || 0), 0);
            }

            totalPlanned += plannedMonthly;
            totalActual += actualMonthly;

            return {
                id: habit.id,
                name: habit.name,
                icon: habit.icon,
                planned: plannedMonthly,
                actual: actualMonthly,
                percentage: plannedMonthly > 0 ? (actualMonthly / plannedMonthly) * 100 : 0
            };
        });

        const completionRate = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0;

        return {
            completionRate,
            totalPlanned,
            totalActual,
            habitMetrics
        };
    }, [habits, monthlyLogs, isLoading, year, month]);

    // 2. Generate Chart Data (Real Trend)
    const chartData = useMemo(() => {
        if (isLoading) return [];
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const data = [];

        for (let i = 1; i <= daysInMonth; i++) {
            const currentLoopDate = new Date(year, month, i);
            const dayOfWeek = currentLoopDate.getDay(); // 0-6 (Sun-Sat)
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const dayLogs = monthlyLogs.filter(l => l.date === dateStr);

            // Filter habits scheduled for this specific day of the week
            const scheduledHabits = habits.filter(h => {
                if (!h.frequency || !Array.isArray(h.frequency) || h.frequency.length === 0) {
                    return true;
                }
                return h.frequency.includes(dayOfWeek);
            });

            const scheduledTotal = scheduledHabits.length;
            if (scheduledTotal === 0) {
                data.push({ day: i, value: 0 }); // Or 0 if nothing scheduled
                continue;
            }

            const completedToday = dayLogs.filter(l => {
                const habit = scheduledHabits.find(h => h.id === l.habit_id);
                return habit && l.completed;
            }).length;

            data.push({
                day: i,
                value: Math.round((completedToday / scheduledTotal) * 100)
            });
        }
        return data;
    }, [monthlyLogs, habits, isLoading, year, month]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* 1. Monthly Summary KPI */}
            <div className="bg-gradient-to-br from-[#364649] to-[#1a2527] rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Award size={120} />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 text-white/60">
                        <Target size={18} />
                        <span className="text-xs font-bold uppercase tracking-[0.2em]">Rendimiento Mensual</span>
                    </div>

                    <div className="flex items-end gap-4">
                        <h2 className="text-6xl font-black">{metrics.completionRate}%</h2>
                        <div className="mb-2">
                            <div className="flex items-center gap-1 text-emerald-400 font-bold text-sm">
                                <TrendingUp size={16} />
                                <span>+5% vs mes anterior</span>
                            </div>
                            <p className="text-white/40 text-xs">Progreso acumulado en {monthName}</p>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">Total Ejecutado</p>
                            <p className="text-xl font-bold">{metrics.totalActual} <span className="text-sm font-normal opacity-40">acciones</span></p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">Meta Propuesta</p>
                            <p className="text-xl font-bold">{metrics.totalPlanned} <span className="text-sm font-normal opacity-40">acciones</span></p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Trend Chart */}
            <div className="bg-white/80 backdrop-blur-md border border-white/50 rounded-[32px] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-[#364649] flex items-center gap-2">
                        <TrendingUp size={20} className="text-[#AA895F]" />
                        Consistencia Diaria
                    </h3>
                    <div className="text-[10px] font-bold text-[#364649]/40 uppercase tracking-widest bg-[#364649]/5 px-3 py-1 rounded-full">
                        % Completado por día
                    </div>
                </div>

                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#AA895F" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#AA895F" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#36464910" />
                            <XAxis
                                dataKey="day"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#36464960' }}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                                labelStyle={{ color: '#36464940' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#AA895F"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 3. Habit Breakdown (Comparative Bars) */}
            <div className="bg-white/80 backdrop-blur-md border border-white/50 rounded-[32px] p-6 shadow-sm">
                <h3 className="font-bold text-[#364649] mb-6 flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-emerald-500" />
                    Desglose por Hábito
                </h3>

                <div className="space-y-6">
                    {metrics.habitMetrics.map(habit => (
                        <div key={habit.id} className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-bold text-[#364649] flex items-center gap-2">
                                    <span className="opacity-60">{habit.icon}</span>
                                    {habit.name}
                                </span>
                                <span className="font-bold text-[#364649]/60">
                                    {habit.actual}<span className="opacity-40 font-normal">/{habit.planned}</span>
                                </span>
                            </div>

                            {/* Comparative Bar Container */}
                            <div className="relative h-3 bg-[#364649]/10 rounded-full overflow-hidden">
                                {/* Planned Goal (Background Bar - implied by the container color, but let's make it more explicit if needed) */}

                                {/* Actual Progress (Foreground Bar) */}
                                <div
                                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out`}
                                    style={{
                                        width: `${habit.percentage}%`,
                                        background: `linear-gradient(to right, #AA895F, #c4a574)`
                                    }}
                                />
                            </div>

                            <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] font-bold text-[#364649]/40 uppercase tracking-tighter">
                                    Meta: {habit.planned} ejecuciones
                                </span>
                                <span className={`text-[10px] font-bold uppercase ${habit.percentage >= 100 ? 'text-emerald-500' : 'text-[#AA895F]/60'}`}>
                                    {Math.round(habit.percentage)}% logrado
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
