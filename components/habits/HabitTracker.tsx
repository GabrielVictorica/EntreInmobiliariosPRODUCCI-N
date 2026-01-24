import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';
import { deleteHabitCalendarEvent } from '../../services/habitCalendarService';
import { Habit, HabitCategory, DailyLog, HabitCompletion, DayOfWeek } from '../../types';
import { useHabitStore, getArgentinaDate, getTodayString } from '../../store/useHabitStore';
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
    MoreVertical,
    X
} from 'lucide-react';
import NewHabitModal from './NewHabitModal';
import DailyPulse from './DailyPulse';
import HabitStats from './HabitStats';
import HabitCatalog from './HabitCatalog';

// Helpers para formato de fecha Argentina moved to store or kept as UI formatters
const formatDateAR = (date: Date): string => {
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Mapeo DB -> Frontend removido (movido al store)

interface HabitTrackerProps {
    session: any;
    isActive?: boolean;
    googleAccessToken?: string | null;
    customUserId?: string;
}


function HabitTracker({ session, isActive, googleAccessToken, customUserId }: HabitTrackerProps) {
    const habits = useHabitStore(s => s.habits);
    const categories = useHabitStore(s => s.categories);
    const completions = useHabitStore(s => s.completions);
    const dailyLog = useHabitStore(s => s.dailyLog);
    const selectedDate = useHabitStore(s => s.selectedDate);
    const isLoading = useHabitStore(s => s.isLoading);
    const setSelectedDate = useHabitStore(s => s.setSelectedDate);
    const setTargetUserId = useHabitStore(s => s.setTargetUserId);
    const storeToggleHabit = useHabitStore(s => s.toggleHabit);
    const storeDeleteHabit = useHabitStore(s => s.deleteHabit);
    const notification = useHabitStore(s => s.notification);
    const clearNotification = useHabitStore(s => s.clearNotification);

    const [activeTab, setActiveTab] = useState<'today' | 'analysis' | 'catalog'>('today');
    const [isNewHabitModalOpen, setIsNewHabitModalOpen] = useState(false);
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
    const [habitToDelete, setHabitToDelete] = useState<string | null>(null);

    // Initial setup - Optimized to prevent redundant fetches on tab switch
    const currentTargetUserId = useHabitStore(s => s.targetUserId);
    useEffect(() => {
        if (!isActive) return;
        const targetUserId = customUserId || session?.user?.id;
        if (targetUserId && targetUserId !== currentTargetUserId) {
            setTargetUserId(targetUserId);
        }
    }, [customUserId, session?.user?.id, setTargetUserId, isActive, currentTargetUserId]);

    // Helpers para navegación
    const changeDate = (days: number) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        setSelectedDate(d.toISOString().split('T')[0]);
    };

    const goToToday = () => setSelectedDate(getTodayString());

    // Confirm Delete habit prompt
    const confirmDeleteHabit = (habitId: string) => {
        setHabitToDelete(habitId);
    };

    const executeDeleteHabit = async () => {
        if (!habitToDelete) return;

        try {
            await storeDeleteHabit(habitToDelete, googleAccessToken);
            setHabitToDelete(null);
        } catch (error) {
            // Error handling is now inside the store (notifications)
            console.error('Delete error:', error);
        }
    };

    // Edit habit handler
    const handleEditHabit = (habit: Habit) => {
        setEditingHabit(habit);
        setIsNewHabitModalOpen(true);
    };

    // Toggle habit completion via Store
    const toggleHabit = async (habitId: string) => {
        const habit = habits.find(h => h.id === habitId);
        if (habit) {
            await storeToggleHabit(habitId, habit.name);
        }
    };

    // Visibility/Focus Sync is now partially handled by state, 
    // but we can refetch when coming back to ensure sync.
    useEffect(() => {
        const handleRefresh = () => {
            const userId = customUserId || session?.user?.id;
            if (userId && document.visibilityState === 'visible') {
                useHabitStore.getState().setSelectedDate(selectedDate);
            }
        };
        document.addEventListener('visibilitychange', handleRefresh);
        window.addEventListener('focus', handleRefresh);
        return () => {
            document.removeEventListener('visibilitychange', handleRefresh);
            window.removeEventListener('focus', handleRefresh);
        };
    }, [customUserId, session?.user?.id, selectedDate]);

    // 1. Index completions for O(1) lookups
    const completedHabitIds = React.useMemo(() => {
        return new Set(completions.map(c => c.habitId));
    }, [completions]);

    // 2. Memoize group calculation (O(H))
    const groupedHabits = React.useMemo(() => {
        // Obtener el día de la semana del selectedDate (mon, tue, wed, thu, fri, sat, sun)
        const date = new Date(selectedDate + 'T00:00:00');
        const days: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const selectedDayKey = days[date.getDay()];

        // Filtrar hábitos que aplican para el día seleccionado
        const habitsForSelectedDay = habits.filter(h => h.frequency.includes(selectedDayKey));

        return {
            morning: habitsForSelectedDay.filter(h => h.preferredBlock === 'morning'),
            afternoon: habitsForSelectedDay.filter(h => h.preferredBlock === 'afternoon'),
            evening: habitsForSelectedDay.filter(h => h.preferredBlock === 'evening'),
            anytime: habitsForSelectedDay.filter(h => h.preferredBlock === 'anytime'),
            allCount: habitsForSelectedDay.length
        };
    }, [habits, selectedDate]);

    // 3. Optimized Stats
    const totalHabits = groupedHabits.allCount;
    const completedCount = React.useMemo(() => {
        // Since groupedHabits are only for this day, and completedHabitIds are for this day
        // we can just count how many habits in groupedHabits are in the Set
        let count = 0;
        const all = [...groupedHabits.morning, ...groupedHabits.afternoon, ...groupedHabits.evening, ...groupedHabits.anytime];
        all.forEach(h => { if (completedHabitIds.has(h.id)) count++; });
        return count;
    }, [groupedHabits, completedHabitIds]);

    const completionRate = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

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
                    {!isLoading ? (
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
                                                            {blockHabits.filter(h => completedHabitIds.has(h.id)).length}/{blockHabits.length}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {blockHabits.map(habit => (
                                                            <HabitItem
                                                                key={habit.id}
                                                                habit={habit}
                                                                isCompleted={completedHabitIds.has(habit.id)}
                                                                toggleHabit={toggleHabit}
                                                                handleEditHabit={handleEditHabit}
                                                                confirmDeleteHabit={confirmDeleteHabit}
                                                            />
                                                        ))}
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
                                <DailyPulse />
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
                        googleAccessToken={googleAccessToken}
                    />
                </div>

                {/* Persistent Mount: Catalog View */}
                <div style={{ display: activeTab === 'catalog' ? 'block' : 'none' }}>
                    <HabitCatalog
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
                    onHabitCreated={async () => {
                        const targetUserId = customUserId || session?.user?.id;
                        if (targetUserId) useHabitStore.getState().fetchInitialData(targetUserId);
                    }}
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

                {/* --- PREMIUM TOAST NOTIFICATION --- */}
                {notification && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 duration-300">
                        <div className={`
                            px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[320px] backdrop-blur-md
                            ${notification.type === 'error' ? 'bg-red-500/90 text-white' :
                                notification.type === 'success' ? 'bg-green-600/90 text-white' :
                                    'bg-[#364649]/90 text-white'}
                        `}>
                            {notification.type === 'error' && <Zap size={20} />}
                            {notification.type === 'success' && <CheckCircle2 size={20} />}
                            {notification.type === 'info' && <Clock size={20} />}

                            <p className="flex-1 font-bold text-sm tracking-tight">{notification.message}</p>

                            <button
                                onClick={clearNotification}
                                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Auto-hide helper */}
                <NotificationManager />
            </div>
        </div>
    );
}

// --- 4. ATOMIC SUB-COMPONENT ---
const HabitItem = React.memo(({
    habit,
    isCompleted,
    toggleHabit,
    handleEditHabit,
    confirmDeleteHabit
}: {
    habit: Habit;
    isCompleted: boolean;
    toggleHabit: (id: string) => void;
    handleEditHabit: (habit: Habit) => void;
    confirmDeleteHabit: (id: string) => void;
}) => {
    const isDetox = habit.categoryId === 7;
    const category = habit.category;

    return (
        <div className="w-full relative group">
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
                        <span className="flex items-center gap-1 text-xs bg-slate-100 px-2 py-1 rounded-lg">
                            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => {
                                const dayKeys: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
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
});

// 5. MEMOIZATION WRAPPER
export default React.memo(HabitTracker);
const NotificationManager = () => {
    const notification = useHabitStore(s => s.notification);
    const clearNotification = useHabitStore(s => s.clearNotification);
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(clearNotification, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification, clearNotification]);
    return null;
};
