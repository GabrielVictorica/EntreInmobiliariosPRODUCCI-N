import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';
import { deleteHabitCalendarEvent } from '../../services/habitCalendarService';
import { Habit, HabitCategory, DailyLog, HabitCompletion } from '../../types';
import {
    Plus,
    Calendar,
    TrendingUp,
    CheckCircle2,
    Circle,
    Flame,
    Sun,
    Sunset,
    Moon,
    BarChart3,
    List,
    ShieldCheck,
    Loader2,
    Clock,
    Zap,
    ChevronLeft,
    ChevronRight,
    PlayCircle,
    Edit2,
    Trash2,
    MoreVertical
} from 'lucide-react';
import NewHabitModal from './NewHabitModal';
import DailyPulse from './DailyPulse';
import HabitStats from './HabitStats';
import HabitCatalog from './HabitCatalog';

// Helpers para formato de fecha Argentina
const formatDateAR = (date: Date): string => {
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getArgentinaDate = (): Date => {
    // Argentina es GMT-3
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
};

const getTodayString = (): string => {
    const d = getArgentinaDate();
    return d.toISOString().split('T')[0];
};

// Mapeo DB -> Frontend
const mapHabitFromDB = (db: any, categories: HabitCategory[]): Habit => ({
    id: db.id,
    userId: db.user_id,
    name: db.name,
    categoryId: db.category_id,
    category: categories.find(c => c.id === db.category_id),
    frequency: db.frequency || ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    scheduleType: db.schedule_type || 'flexible',
    preferredBlock: db.preferred_block || 'anytime',
    fixedTime: db.fixed_time,
    estimatedDuration: db.estimated_duration || 15,
    cognitiveLoad: db.cognitive_load || 'medium',
    active: db.active !== false,
    icon: db.icon || '📌',
    currentStreak: db.current_streak || 0,
    longestStreak: db.longest_streak || 0,
    lastCompletedDate: db.last_completed_date,
    createdAt: db.created_at,
    endDate: db.end_date,
    googleEventId: db.google_event_id
});

interface HabitTrackerProps {
    session: any;
    googleAccessToken?: string | null;
    customUserId?: string;
}

export default function HabitTracker({ session, googleAccessToken, customUserId }: HabitTrackerProps) {
    const [categories, setCategories] = useState<HabitCategory[]>([]);
    const [habits, setHabits] = useState<Habit[]>([]);
    const [completions, setCompletions] = useState<HabitCompletion[]>([]);
    const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>(getTodayString()); // Ahora dinámico
    const [activeTab, setActiveTab] = useState<'today' | 'analysis' | 'catalog'>('today');
    const [isNewHabitModalOpen, setIsNewHabitModalOpen] = useState(false);
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
    const [habitToDelete, setHabitToDelete] = useState<string | null>(null);

    // Helpers para navegación
    const changeDate = (days: number) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        setSelectedDate(d.toISOString().split('T')[0]);
    };

    const goToToday = () => setSelectedDate(getTodayString());

    // Fetch todas las categorías
    const fetchCategories = useCallback(async () => {
        const { data, error } = await supabase.from('habit_categories').select('*').order('id');
        if (!error && data) {
            setCategories(data);
        }
        return data || [];
    }, []);

    // Fetch hábitos del usuario
    const fetchHabits = useCallback(async (cats: HabitCategory[]) => {
        const targetUserId = customUserId || session?.user?.id;
        if (!targetUserId) return;
        const { data, error } = await supabase
            .from('habits')
            .select('*')
            .eq('user_id', targetUserId)
            .eq('active', true)
            .order('preferred_block');

        if (!error && data) {
            setHabits(data.map(h => mapHabitFromDB(h, cats)));
        }
    }, [session, customUserId]);

    // Fetch/Crear daily log para hoy
    const fetchOrCreateDailyLog = useCallback(async () => {
        const targetUserId = customUserId || session?.user?.id;
        if (!targetUserId) return null;

        // Intentar obtener el log de hoy
        const { data: existing } = await supabase
            .from('daily_logs')
            .select('*')
            .eq('user_id', targetUserId)
            .eq('date', selectedDate)
            .single();

        if (existing) {
            setDailyLog({
                id: existing.id,
                userId: existing.user_id,
                date: existing.date,
                moodScore: existing.mood_score,
                energyScore: existing.energy_score,
                tags: existing.tags || [],
                notes: existing.notes,
                createdAt: existing.created_at
            });
            return existing;
        }

        // Si no existe, crear uno nuevo
        const { data: newLog, error } = await supabase
            .from('daily_logs')
            .insert({ user_id: targetUserId, date: selectedDate, tags: [] })
            .select()
            .single();

        if (!error && newLog) {
            setDailyLog({
                id: newLog.id,
                userId: newLog.user_id,
                date: newLog.date,
                moodScore: newLog.mood_score,
                energyScore: newLog.energy_score,
                tags: newLog.tags || [],
                notes: newLog.notes,
                createdAt: newLog.created_at
            });
            return newLog;
        }
        return null;
    }, [session, selectedDate, customUserId]);

    // Fetch completions de hoy
    const fetchCompletions = useCallback(async () => {
        const targetUserId = customUserId || session?.user?.id;
        if (!targetUserId || !dailyLog?.id) return;

        const { data, error } = await supabase
            .from('habit_completions')
            .select('*')
            .eq('daily_log_id', dailyLog.id);

        if (!error && data) {
            setCompletions(data.map(c => ({
                id: c.id,
                habitId: c.habit_id,
                dailyLogId: c.daily_log_id,
                targetDate: c.target_date,
                completedAt: c.completed_at,
                value: c.value
            })));
        }
    }, [session, dailyLog]);

    // Delete habit prompt
    const confirmDeleteHabit = (habitId: string) => {
        setHabitToDelete(habitId);
    };

    // Actual delete execution
    const executeDeleteHabit = async () => {
        if (!habitToDelete) return;

        // Recuperar el hábito para ver si tiene evento de calendario
        const habit = habits.find(h => h.id === habitToDelete);

        const { error } = await supabase
            .from('habits')
            .update({ active: false })
            .eq('id', habitToDelete);

        if (!error) {
            // SYNC CALENDAR DELETE
            if (habit?.googleEventId && googleAccessToken) {
                deleteHabitCalendarEvent(habit.googleEventId, googleAccessToken)
                    .catch(err => console.error('Error deleting calendar event:', err));
            }

            await fetchHabits(categories);
            setHabitToDelete(null); // Close modal
        } else {
            alert('Error al eliminar el hábito');
        }
    };

    // Edit habit handler
    const handleEditHabit = (habit: Habit) => {
        setEditingHabit(habit);
        setIsNewHabitModalOpen(true);
    };

    // Toggle habit completion - OPTIMISTIC UPDATE
    const toggleHabit = async (habitId: string) => {
        if (!dailyLog?.id) return;

        const isCompleted = completions.some(c => c.habitId === habitId);

        // 1. Optimistic Update: Actualizar UI inmediatamente
        const previousCompletions = [...completions]; // Backup para rollback

        if (isCompleted) {
            setCompletions(prev => prev.filter(c => c.habitId !== habitId));
        } else {
            // Placeholder temporal mientras se confirma en DB
            const tempCompletion: HabitCompletion = {
                id: `temp-${Date.now()}`,
                habitId,
                dailyLogId: dailyLog.id,
                targetDate: selectedDate,
                completedAt: new Date().toISOString(),
                value: 1
            };
            setCompletions(prev => [...prev, tempCompletion]);
        }

        try {
            if (isCompleted) {
                // Desmarcar: eliminar registro
                const { error } = await supabase
                    .from('habit_completions')
                    .delete()
                    .eq('habit_id', habitId)
                    .eq('daily_log_id', dailyLog.id);

                if (error) throw error;
            } else {
                // Marcar: insertar registro
                const { data, error } = await supabase
                    .from('habit_completions')
                    .insert({
                        habit_id: habitId,
                        daily_log_id: dailyLog.id,
                        target_date: selectedDate,
                        completed_at: new Date().toISOString()
                    })
                    .select()
                    .single();

                if (error) throw error;

                // Reemplazar el tempCompletion con el real (con ID real)
                if (data) {
                    setCompletions(prev => prev.map(c =>
                        c.id.startsWith('temp-') && c.habitId === habitId
                            ? {
                                id: data.id,
                                habitId: data.habit_id,
                                dailyLogId: data.daily_log_id,
                                targetDate: data.target_date,
                                completedAt: data.completed_at,
                                value: data.value
                            }
                            : c
                    ));
                }
            }

            // NOTA: Ya NO hacemos refetch de habits/categories aquí para máxima velocidad.
            // La racha (currentStreak) en UI no se actualizará instantáneamente hasta el próximo reload 
            // o navegación, pero es un compromiso aceptable para la velocidad de interacción "snappy".

        } catch (error) {
            console.error('Error toggling habit:', error);
            // Rollback en caso de error
            setCompletions(previousCompletions);
            alert('No se pudo actualizar el hábito. Revisa tu conexión.');
        }
    };

    // Initial load - Optimizado: queries en paralelo
    useEffect(() => {
        const init = async () => {
            // Ejecutar categorías y dailyLog en paralelo
            const [cats] = await Promise.all([
                fetchCategories(),
                fetchOrCreateDailyLog()
            ]);
            // Habits depende de cats, pero ya tenemos cats
            await fetchHabits(cats);
        };
        init();
    }, [fetchCategories, fetchHabits, fetchOrCreateDailyLog]);

    // Fetch completions when dailyLog changes
    useEffect(() => {
        if (dailyLog?.id) {
            fetchCompletions();
        }
    }, [dailyLog, fetchCompletions]);

    // Auto-refresh completions when tab becomes visible (for cross-tab sync)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && dailyLog?.id) {
                fetchCompletions();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Also listen for focus events (when user clicks on window)
        window.addEventListener('focus', () => {
            if (dailyLog?.id) {
                fetchCompletions();
            }
        });

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', () => { });
        };
    }, [dailyLog?.id, fetchCompletions]);

    // INSTANT sync: listen for custom events from Dashboard/Calendar
    useEffect(() => {
        const handleHabitChange = (event: Event) => {
            const customEvent = event as CustomEvent;
            const { habitId, completed } = customEvent.detail;

            console.log('[HabitTracker] Instant sync received:', { habitId, completed });

            // Update completions state immediately
            setCompletions(prev => {
                if (completed) {
                    // Add completion (if not already exists)
                    if (prev.some(c => c.habitId === habitId)) return prev;
                    return [...prev, {
                        id: `instant-${Date.now()}`,
                        habitId,
                        dailyLogId: dailyLog?.id || '',
                        targetDate: getTodayString(),
                        completedAt: new Date().toISOString(),
                        value: 1
                    }];
                } else {
                    // Remove completion
                    return prev.filter(c => c.habitId !== habitId);
                }
            });
        };

        window.addEventListener('habitCompletionChanged', handleHabitChange);

        return () => {
            window.removeEventListener('habitCompletionChanged', handleHabitChange);
        };
    }, [dailyLog?.id]);

    // Obtener el día de la semana del selectedDate (mon, tue, wed, thu, fri, sat, sun)
    const getDayKey = (dateString: string): string => {
        const date = new Date(dateString + 'T00:00:00');
        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        return days[date.getDay()];
    };

    const selectedDayKey = getDayKey(selectedDate);

    // Filtrar hábitos que aplican para el día seleccionado
    const habitsForSelectedDay = habits.filter(h => h.frequency.includes(selectedDayKey));

    // Agrupar hábitos filtrados por bloque horario
    const groupedHabits = {
        morning: habitsForSelectedDay.filter(h => h.preferredBlock === 'morning'),
        afternoon: habitsForSelectedDay.filter(h => h.preferredBlock === 'afternoon'),
        evening: habitsForSelectedDay.filter(h => h.preferredBlock === 'evening'),
        anytime: habitsForSelectedDay.filter(h => h.preferredBlock === 'anytime')
    };

    const getBlockIcon = (block: string) => {
        switch (block) {
            case 'morning': return <Sun size={18} className="text-amber-500" />;
            case 'afternoon': return <Sunset size={18} className="text-orange-500" />;
            case 'evening': return <Moon size={18} className="text-indigo-500" />;
            default: return <Calendar size={18} className="text-slate-400" />;
        }
    };

    const getBlockName = (block: string) => {
        switch (block) {
            case 'morning': return 'Mañana';
            case 'afternoon': return 'Tarde';
            case 'evening': return 'Noche';
            default: return 'Cualquier momento';
        }
    };

    // Stats - basados en hábitos del día seleccionado
    const totalHabits = habitsForSelectedDay.length;
    const completedCount = completions.filter(c => habitsForSelectedDay.some(h => h.id === c.habitId)).length;
    const completionRate = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

    // Generar días para el carrusel (Semana alrededor de selectedDate)
    const weekDates = React.useMemo(() => {
        const dates = [];
        const current = new Date(selectedDate);
        // Mostrar 3 días antes y 3 días después (Total 7)
        for (let i = -3; i <= 3; i++) {
            const d = new Date(current);
            d.setDate(current.getDate() + i);
            dates.push(d.toISOString().split('T')[0]);
        }
        return dates;
    }, [selectedDate]);

    // Ya no bloqueamos la UI con un loading spinner de pantalla completa
    // Los datos se cargan en background y el contenido aparece gradualmente

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            {/* --- Premium Toolbar Header --- */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-6 bg-white p-4 rounded-3xl shadow-xl shadow-black/5 border border-[#364649]/5 relative overflow-hidden">

                {/* 1. Identity & Actions (Left/Top on mobile) */}
                <div className="flex items-center justify-between w-full xl:w-auto gap-6 z-10">
                    <div>
                        <h1 className="text-2xl font-black text-[#364649] tracking-tight flex items-center gap-2">
                            Mis Hábitos
                        </h1>
                        <p className="text-sm text-slate-400 font-medium">Construye tu mejor versión</p>
                    </div>
                    <button
                        onClick={() => setIsNewHabitModalOpen(true)}
                        className="xl:hidden flex items-center justify-center w-10 h-10 bg-[#364649] text-white rounded-xl shadow-lg"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* 2. Visual Week Navigator (Center) */}
                <div className="flex-1 w-full xl:w-auto flex items-center justify-center gap-2 z-10">
                    <button onClick={() => changeDate(-7)} className="p-2 hover:bg-gray-100 rounded-xl text-slate-300 hover:text-[#364649] transition-colors hidden sm:block">
                        <ChevronLeft size={20} />
                    </button>

                    <div
                        className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 px-2"
                        style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}
                    >
                        {weekDates.map(dateStr => {
                            const isSelected = dateStr === selectedDate;
                            const dateObj = new Date(dateStr + 'T00:00:00');
                            const isToday = dateStr === getTodayString();

                            return (
                                <button
                                    key={dateStr}
                                    onClick={() => setSelectedDate(dateStr)}
                                    className={`
                                        flex flex-col items-center justify-center min-w-[3.5rem] h-16 rounded-2xl transition-all duration-300 relative group
                                        ${isSelected
                                            ? 'bg-[#364649] text-white shadow-lg shadow-[#364649]/20 scale-105 z-10'
                                            : 'bg-transparent hover:bg-gray-50 text-slate-400 hover:text-[#364649]'
                                        }
                                    `}
                                >
                                    <span className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${isSelected ? 'text-[#AA895F]' : ''}`}>
                                        {dateObj.toLocaleDateString('es-AR', { weekday: 'short' }).slice(0, 3)}
                                    </span>
                                    <span className={`text-xl font-black ${isSelected ? 'text-white' : 'text-current'}`}>
                                        {dateObj.getDate()}
                                    </span>
                                    {isToday && !isSelected && (
                                        <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-[#AA895F]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <button onClick={() => changeDate(7)} className="p-2 hover:bg-gray-100 rounded-xl text-slate-300 hover:text-[#364649] transition-colors hidden sm:block">
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* 3. Global Actions (Right/Hidden on mobile) */}
                <div className="hidden xl:flex items-center gap-3 z-10">
                    {selectedDate !== getTodayString() && (
                        <button
                            onClick={goToToday}
                            className="text-xs font-bold text-[#AA895F] px-4 py-2 rounded-xl hover:bg-[#AA895F]/10 transition-colors"
                        >
                            Volver a Hoy
                        </button>
                    )}
                    <button
                        onClick={() => setIsNewHabitModalOpen(true)}
                        className="flex items-center gap-2 bg-[#364649] text-white px-5 py-3 rounded-xl font-bold hover:bg-[#242f31] transition-all shadow-xl shadow-[#364649]/10 transform hover:scale-105 active:scale-95"
                    >
                        <Plus size={18} />
                        <span>Nuevo Hábito</span>
                    </button>
                </div>

                {/* Background Decor */}
                <div className="absolute left-0 top-0 w-full h-full bg-gradient-to-r from-gray-50/50 via-white to-gray-50/50 pointer-events-none -z-0" />
            </div>

            {/* Tabs & Layout Structure */}
            <div className="space-y-6">
                {/* Tabs centrados o alineados al inicio segun preferencia */}
                <div className="flex justify-start gap-6 border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('today')}
                        className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all border-b-2 relative ${activeTab === 'today'
                            ? 'border-[#364649] text-[#364649]'
                            : 'border-transparent text-slate-400 hover:text-[#364649]'
                            }`}
                    >
                        <CheckCircle2 size={18} />
                        Hoy
                    </button>
                    <button
                        onClick={() => setActiveTab('analysis')}
                        className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all border-b-2 relative ${activeTab === 'analysis'
                            ? 'border-[#364649] text-[#364649]'
                            : 'border-transparent text-slate-400 hover:text-[#364649]'
                            }`}
                    >
                        <BarChart3 size={18} />
                        Análisis
                    </button>
                    <button
                        onClick={() => setActiveTab('catalog')}
                        className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all border-b-2 relative ${activeTab === 'catalog'
                            ? 'border-[#364649] text-[#364649]'
                            : 'border-transparent text-slate-400 hover:text-[#364649]'
                            }`}
                    >
                        <List size={18} />
                        Catálogo
                    </button>
                </div>

                {/* Persistent Mount: Today View */}
                <div style={{ display: activeTab === 'today' ? 'block' : 'none' }}>
                    {dailyLog ? (
                        <div className="grid lg:grid-cols-12 gap-8 items-start">
                            {/* Left Column: Habits (Occupies more space) */}
                            <div className="lg:col-span-8 space-y-6">
                                {habits.length === 0 ? (
                                    <div className="bg-white rounded-3xl p-12 shadow-lg border border-[#364649]/5 text-center">
                                        <div className="w-16 h-16 bg-[#E0D8CC] rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Calendar className="text-[#AA895F]" size={28} />
                                        </div>
                                        <h3 className="text-xl font-bold text-[#364649] mb-2">Sin hábitos aún</h3>
                                        <p className="text-slate-500 mb-6">Crea tu primer hábito para comenzar a construir tu rutina</p>
                                        <button
                                            onClick={() => setIsNewHabitModalOpen(true)}
                                            className="bg-[#364649] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#242f31] transition-all"
                                        >
                                            Crear primer hábito
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {(['morning', 'afternoon', 'evening', 'anytime'] as const).map(block => {
                                            const blockHabits = groupedHabits[block];
                                            if (blockHabits.length === 0) return null;

                                            return (
                                                <div key={block} className="bg-white rounded-3xl p-6 shadow-lg border border-[#364649]/5">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        {getBlockIcon(block)}
                                                        <h3 className="font-bold text-[#364649]">{getBlockName(block)}</h3>
                                                        <span className="text-xs text-slate-400 ml-auto">
                                                            {blockHabits.filter(h => completions.some(c => c.habitId === h.id)).length}/{blockHabits.length}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {blockHabits.map(habit => {
                                                            const isCompleted = completions.some(c => c.habitId === habit.id);
                                                            const isDetox = habit.categoryId === 7;
                                                            const category = habit.category;

                                                            return (
                                                                <div key={habit.id} className="w-full relative group">
                                                                    <button
                                                                        onClick={() => toggleHabit(habit.id)}
                                                                        title={isCompleted ? "Click para desmarcar" : "Click para completar"}
                                                                        className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-200 relative overflow-hidden text-left ${isCompleted
                                                                            ? 'bg-green-50 border-2 border-green-200 shadow-sm'
                                                                            : 'bg-white hover:bg-gray-50 border border-gray-100 hover:border-[#AA895F]/30 hover:shadow-md'
                                                                            }`}
                                                                    >
                                                                        {isCompleted ? (
                                                                            isDetox ? (
                                                                                <ShieldCheck className="text-green-500 shrink-0" size={22} />
                                                                            ) : (
                                                                                <CheckCircle2 className="text-green-500 shrink-0" size={22} />
                                                                            )
                                                                        ) : (
                                                                            <Circle className="text-slate-300 shrink-0" size={22} />
                                                                        )}

                                                                        <div className="flex-1 text-left">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <span className={`font-bold text-lg ${isCompleted ? 'text-green-800' : 'text-[#364649]'}`}>
                                                                                    {habit.icon} {habit.name}
                                                                                </span>
                                                                                {!isCompleted && (
                                                                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-[#AA895F] bg-[#AA895F]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                                                        Completar
                                                                                    </span>
                                                                                )}
                                                                            </div>

                                                                            {/* Metadata Row */}
                                                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 font-medium">
                                                                                {category && (
                                                                                    <span className="flex items-center gap-1" style={{ color: category.color }}>
                                                                                        {category.emoji} {category.name}
                                                                                    </span>
                                                                                )}
                                                                                <span className="flex items-center gap-1">
                                                                                    <Clock size={12} /> {habit.estimatedDuration}m
                                                                                </span>
                                                                                {habit.fixedTime && (
                                                                                    <span className="flex items-center gap-1 text-[#AA895F] font-bold">
                                                                                        🕐 {habit.fixedTime}
                                                                                    </span>
                                                                                )}
                                                                                {habit.cognitiveLoad && (
                                                                                    <span className="flex items-center gap-1">
                                                                                        <Zap size={12} className={
                                                                                            habit.cognitiveLoad === 'high' ? 'text-red-400' :
                                                                                                habit.cognitiveLoad === 'medium' ? 'text-yellow-400' :
                                                                                                    'text-green-400'
                                                                                        } />
                                                                                        {habit.cognitiveLoad === 'high' ? 'Alta' : habit.cognitiveLoad === 'medium' ? 'Media' : 'Baja'}
                                                                                    </span>
                                                                                )}
                                                                                {/* Frecuencia: qué días */}
                                                                                <span className="flex items-center gap-1 text-xs bg-slate-100 px-2 py-1 rounded-lg">
                                                                                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => {
                                                                                        const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
                                                                                        const isActive = habit.frequency.includes(dayKeys[i]);
                                                                                        return (
                                                                                            <span
                                                                                                key={d}
                                                                                                className={`w-5 h-5 flex items-center justify-center rounded-full text-[11px] ${isActive
                                                                                                    ? 'bg-[#364649] text-white font-bold'
                                                                                                    : 'text-slate-300'
                                                                                                    }`}
                                                                                            >
                                                                                                {d}
                                                                                            </span>
                                                                                        );
                                                                                    })}
                                                                                </span>
                                                                            </div>

                                                                            {isCompleted && isDetox && (
                                                                                <span className="block mt-1 text-xs text-green-600 font-bold">✓ Me mantuve limpio</span>
                                                                            )}
                                                                        </div>

                                                                        {habit.currentStreak > 0 && (
                                                                            <div className="flex items-center gap-1 text-orange-500 shrink-0 mr-8">
                                                                                <Flame size={16} />
                                                                                <span className="text-sm font-bold">{habit.currentStreak}</span>
                                                                            </div>
                                                                        )}
                                                                    </button>

                                                                    {/* Edit/Delete Actions */}
                                                                    <div className="absolute top-1/2 -translate-y-1/2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleEditHabit(habit); }}
                                                                            className="p-1.5 hover:bg-gray-100 rounded-lg text-slate-400 hover:text-[#364649]"
                                                                        >
                                                                            <Edit2 size={16} />
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); confirmDeleteHabit(habit.id); }}
                                                                            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Progress & Pulse */}
                            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
                                {/* Progress Card */}
                                <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#364649]/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Hoy</p>
                                            <p className="text-4xl font-black text-[#364649] mt-1">{completionRate}%</p>
                                        </div>
                                        <div className="w-16 h-16 relative">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle cx="32" cy="32" r="28" stroke="#E0D8CC" strokeWidth="6" fill="none" />
                                                <circle
                                                    cx="32" cy="32" r="28"
                                                    stroke="#AA895F"
                                                    strokeWidth="6"
                                                    fill="none"
                                                    strokeLinecap="round"
                                                    strokeDasharray={`${completionRate * 1.75} 175`} // approx
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-500">{completedCount} de {totalHabits} completados</p>
                                </div>

                                {/* Daily Pulse */}
                                <DailyPulse
                                    dailyLog={dailyLog}
                                    onUpdate={fetchOrCreateDailyLog}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="grid lg:grid-cols-12 gap-8 items-start animate-pulse">
                            <div className="lg:col-span-8 space-y-4">
                                <div className="bg-white/50 rounded-3xl h-48 border border-gray-100" />
                                <div className="bg-white/50 rounded-3xl h-32 border border-gray-100" />
                            </div>
                            <div className="lg:col-span-4 space-y-4">
                                <div className="bg-white/50 rounded-3xl h-32 border border-gray-100" />
                                <div className="bg-gradient-to-br from-[#364649]/20 to-[#364649]/10 rounded-3xl h-64" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Persistent Mount: Analysis View */}
                <div style={{ display: activeTab === 'analysis' ? 'block' : 'none' }}>
                    <HabitStats
                        userId={session?.user?.id}
                        categories={categories}
                        googleAccessToken={googleAccessToken}
                    />
                </div>

                {/* Persistent Mount: Catalog View */}
                <div style={{ display: activeTab === 'catalog' ? 'block' : 'none' }}>
                    <HabitCatalog
                        userId={session?.user?.id}
                        categories={categories}
                        onEditHabit={handleEditHabit}
                        onDeleteHabit={confirmDeleteHabit}
                    />
                </div>

                <NewHabitModal
                    isOpen={isNewHabitModalOpen}
                    onClose={() => {
                        setIsNewHabitModalOpen(false);
                        setEditingHabit(null);
                    }}
                    categories={categories}
                    onHabitCreated={async () => {
                        await fetchHabits(categories);
                    }}
                    userId={session?.user?.id}
                    habitToEdit={editingHabit}
                    googleAccessToken={googleAccessToken}
                />

                {/* Custom Delete Confirmation Modal */}
                {
                    habitToDelete && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                                <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-[#364649] text-center mb-2">¿Eliminar hábito?</h3>
                                <p className="text-slate-500 text-center text-sm mb-6">
                                    ¿Estás seguro de que quieres eliminar este hábito? Esta acción lo moverá a la papelera (soft delete).
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setHabitToDelete(null)}
                                        className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-gray-100 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={executeDeleteHabit}
                                        className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >
        </div >
    );
}
