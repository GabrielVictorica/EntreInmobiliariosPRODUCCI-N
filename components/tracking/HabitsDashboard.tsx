import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Calendar, Target, BarChart3, Sparkles, Plus } from 'lucide-react';
import HabitCard, { Habit } from './HabitCard';
import NewHabitModal from './NewHabitModal';
import HabitAnalysis from './HabitAnalysis';

interface HabitsDashboardProps {
    session: any;
    isMother: boolean;
    selectedTeamUser: string | null;
}

const WEEK_DAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function HabitsDashboard({ session, isMother, selectedTeamUser }: HabitsDashboardProps) {
    // State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(new Date());
    const [isMonthlyView, setIsMonthlyView] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isNewHabitModalOpen, setIsNewHabitModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedHabitForEdit, setSelectedHabitForEdit] = useState<Habit | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Real habits data from Supabase
    const [habits, setHabits] = useState<Habit[]>([]);
    const [allHabitsStore, setAllHabitsStore] = useState<Habit[]>([]); // Store all habits for Analysis Mode

    // User context for data fetching
    const effectiveUserEmail = isMother && selectedTeamUser ? selectedTeamUser : session?.user?.email;
    const effectiveUserId = session?.user?.id;

    const SUPABASE_URL = 'https://whfoflccshoztjlesnhh.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZm9mbGNjc2hvenRqbGVzbmhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzUwMzEsImV4cCI6MjA4MTMxMTAzMX0.rPQdO1qCovC9WP3ttlDOArvTI7I15lg7fnOPkJseDos';

    // Fetch habits and their logs for the selected day
    useEffect(() => {
        if (!session?.user?.id) return;
        fetchData();
    }, [selectedDay, effectiveUserEmail, session]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const dateStr = formatDateKey(selectedDay);

            // 1. Fetch habits for the effective user (by email)
            const habitsResponse = await fetch(`${SUPABASE_URL}/rest/v1/habits?user_email=eq.${effectiveUserEmail}&select=*`, {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            const habitsData = await habitsResponse.json();

            if (!Array.isArray(habitsData) || habitsData.length === 0) {
                setHabits([]);
                setIsLoading(false);
                return;
            }

            // 2. Get habit IDs to fetch their logs
            const habitIds = habitsData.map((h: any) => h.id);

            // 3. Fetch logs for these specific habits on the selected day
            const logsResponse = await fetch(`${SUPABASE_URL}/rest/v1/habit_logs?habit_id=in.(${habitIds.join(',')})&date=eq.${dateStr}&select=*`, {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            const logsData = await logsResponse.json();

            // 4. Merge logs into habits
            const mergedHabits = habitsData.map((h: any) => {
                const log = Array.isArray(logsData) ? logsData.find((l: any) => l.habit_id === h.id) : null;
                return {
                    ...h,
                    current: log ? log.current_value : 0,
                    completed: log ? log.completed : false,
                    notes: log ? log.notes : ''
                };
            });

            // Store full list of habits (with current day's status) for Analysis Mode
            setAllHabitsStore(mergedHabits);

            // 5. Filter habits by selected day's weekday (only show if this day is in habit's frequency)
            const selectedDayOfWeek = selectedDay.getDay(); // 0=Sun, 1=Mon, etc.
            const filteredHabits = mergedHabits.filter((h: any) => {
                // If no frequency defined, show on all days
                if (!h.frequency || !Array.isArray(h.frequency) || h.frequency.length === 0) {
                    return true;
                }
                return h.frequency.includes(selectedDayOfWeek);
            });

            setHabits(filteredHabits);
        } catch (error) {
            console.error("Error fetching habits:", error);
            setHabits([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Habit handlers
    const saveLog = async (habitId: string, updates: Partial<{ completed: boolean, current_value: number, notes: string }>) => {
        if (isMother && selectedTeamUser) return; // Read-only for Director

        try {
            const dateStr = formatDateKey(selectedDay);
            await fetch(`${SUPABASE_URL}/rest/v1/habit_logs`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify({
                    habit_id: habitId,
                    user_id: effectiveUserId,
                    date: dateStr,
                    ...updates,
                    updated_at: new Date().toISOString()
                })
            });

            // Trigger refresh for analysis mode
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error("Error saving habit log:", error);
        }
    };

    const handleToggleHabit = async (id: string) => {
        if (isMother && selectedTeamUser && selectedTeamUser !== session?.user?.email) return;
        const habit = habits.find(h => h.id === id);
        if (!habit) return;

        const newCompleted = !habit.completed;
        setHabits(prev => prev.map(h => h.id === id ? { ...h, completed: newCompleted } : h));
        await saveLog(id, { completed: newCompleted });
    };

    const handleIncrementHabit = async (id: string, delta: number) => {
        if (isMother && selectedTeamUser && selectedTeamUser !== session?.user?.email) return;
        setHabits(prev => prev.map(h => {
            if (h.id === id && h.type === 'quantitative') {
                const newValue = Math.max(0, (h.current || 0) + delta);
                const isComplete = h.target ? newValue >= h.target : false;

                // Save to DB
                saveLog(id, { current_value: newValue, completed: isComplete });

                return { ...h, current: newValue, completed: isComplete };
            }
            return h;
        }));
    };

    const handleUpdateNotes = async (id: string, notes: string) => {
        if (isMother && selectedTeamUser && selectedTeamUser !== session?.user?.email) return;
        setHabits(prev => prev.map(h => h.id === id ? { ...h, notes } : h));
        await saveLog(id, { notes });
    };

    const handleAddHabit = async (habitData: any) => {
        if (isMother && selectedTeamUser && selectedTeamUser !== session?.user?.email) return;
        if (!session?.user?.id) {
            console.error("No active session found");
            return;
        }

        try {
            // Fix schema mismatch: endDate must be null if empty
            const payload = {
                ...habitData,
                end_date: habitData.endDate === '' ? null : habitData.endDate,
                user_id: effectiveUserId,
                user_email: session.user.email
            };

            // Remove camelCase fields or internal UI fields
            delete (payload as any).endDate;
            delete (payload as any).current;
            delete (payload as any).completed;
            delete (payload as any).createdAt;
            delete (payload as any).executionTime;

            if (habitData.id) {
                // EDIT MODE
                const response = await fetch(`${SUPABASE_URL}/rest/v1/habits?id=eq.${habitData.id}`, {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();
                if (response.ok && result && result[0]) {
                    // Update both stores
                    setHabits(prev => prev.map(h => h.id === habitData.id ? { ...h, ...result[0] } : h));
                    setAllHabitsStore(prev => prev.map(h => h.id === habitData.id ? { ...h, ...result[0] } : h));
                }
            } else {
                // CREATE MODE
                const response = await fetch(`${SUPABASE_URL}/rest/v1/habits`, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();
                if (!response.ok) {
                    console.error("Supabase habit creation error:", result);
                    return;
                }

                if (result && result[0]) {
                    setHabits(prev => [...prev, { ...result[0], current: 0, completed: false }]);
                    setAllHabitsStore(prev => [...prev, { ...result[0], current: 0, completed: false }]);
                }
            }
        } catch (error) {
            console.error("Error saving habit:", error);
        }
    };

    const handleEditHabit = (habit: Habit) => {
        setSelectedHabitForEdit(habit);
        setIsNewHabitModalOpen(true);
    };

    const handleDeleteHabit = async (id: string) => {
        if (isMother && selectedTeamUser && selectedTeamUser !== session?.user?.email) return;
        if (!session?.access_token) return;

        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/habits?id=eq.${id}`, {
                method: 'DELETE',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (response.ok) {
                setHabits(prev => prev.filter(h => h.id !== id));
            } else {
                console.error("Error deleting habit:", await response.text());
            }
        } catch (error) {
            console.error("Error deleting habit:", error);
        }
    };

    // Touch handling for swipe gestures
    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);

    // Date helpers
    const formatDateKey = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const isToday = (date: Date) => formatDateKey(date) === formatDateKey(new Date());
    const isSelected = (date: Date) => formatDateKey(date) === formatDateKey(selectedDay);

    // Get start of week (Monday)
    const startOfWeek = useMemo(() => {
        const d = new Date(currentDate);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }, [currentDate]);

    // Week dates array
    const weekDates = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(startOfWeek);
            d.setDate(d.getDate() + i);
            return d;
        });
    }, [startOfWeek]);

    // Month calendar data
    const monthCalendar = useMemo(() => {
        const year = selectedYear;
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
        let startDayOfWeek = firstDay.getDay();
        startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Convert to Monday-based

        const daysInMonth = lastDay.getDate();
        const weeks: (Date | null)[][] = [];

        let currentWeek: (Date | null)[] = [];

        // Add empty cells for days before the first of the month
        for (let i = 0; i < startDayOfWeek; i++) {
            currentWeek.push(null);
        }

        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            currentWeek.push(new Date(year, month, day));
            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        }

        // Fill remaining cells in the last week
        while (currentWeek.length > 0 && currentWeek.length < 7) {
            currentWeek.push(null);
        }
        if (currentWeek.length > 0) {
            weeks.push(currentWeek);
        }

        return weeks;
    }, [currentDate, selectedYear]);

    // Navigation functions
    const navigateWeek = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        setCurrentDate(newDate);
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        setCurrentDate(newDate);
    };

    // Touch handlers for swipe gestures
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null || touchStartY.current === null) return;

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const deltaX = touchEndX - touchStartX.current;
        const deltaY = touchEndY - touchStartY.current;

        const minSwipeDistance = 50;

        // Determine if horizontal or vertical swipe
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0) {
                    isMonthlyView ? navigateMonth('prev') : navigateWeek('prev');
                } else {
                    isMonthlyView ? navigateMonth('next') : navigateWeek('next');
                }
            }
        } else {
            // Vertical swipe
            if (Math.abs(deltaY) > minSwipeDistance) {
                if (deltaY > 0) {
                    setIsMonthlyView(true); // Swipe down = expand
                } else {
                    setIsMonthlyView(false); // Swipe up = collapse
                }
            }
        }

        touchStartX.current = null;
        touchStartY.current = null;
    };

    const handleDayClick = (date: Date) => {
        setSelectedDay(date);
        // In monthly view, clicking a day also collapses to weekly view
        if (isMonthlyView) {
            setCurrentDate(date);
            setIsMonthlyView(false);
        }
    };

    // Available years for selector
    const availableYears = [2024, 2025, 2026, 2027, 2028];

    return (
        <div className="space-y-6 pb-20 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#364649] tracking-tight flex items-center gap-2">
                        <Sparkles size={28} className="text-[#AA895F]" />
                        Tus Hábitos
                    </h1>
                    <p className="text-[#364649]/60 text-sm font-medium">
                        {isMonthlyView ? 'Análisis mensual de rendimiento' : 'Seguimiento diario de hábitos'}
                    </p>
                </div>
            </div>

            {/* Accordion Calendar */}
            <div
                className="bg-white/60 backdrop-blur-xl border border-white rounded-3xl shadow-xl overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* Weekly View (Collapsed) */}
                <div className={`transition-all duration-300 ease-in-out ${isMonthlyView ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[200px] opacity-100'}`}>
                    <div className="p-4">
                        {/* Week Navigation */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={() => navigateWeek('prev')}
                                className="p-2 hover:bg-[#364649]/10 rounded-full transition-colors"
                            >
                                <ChevronLeft size={20} className="text-[#364649]" />
                            </button>

                            <span className="text-sm font-bold text-[#364649] bg-white/50 px-4 py-2 rounded-xl border border-[#364649]/10">
                                {startOfWeek.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} - {weekDates[6].toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>

                            <button
                                onClick={() => navigateWeek('next')}
                                className="p-2 hover:bg-[#364649]/10 rounded-full transition-colors"
                            >
                                <ChevronRight size={20} className="text-[#364649]" />
                            </button>
                        </div>

                        {/* Week Days Row */}
                        <div className="grid grid-cols-7 gap-2">
                            {weekDates.map((date, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleDayClick(date)}
                                    className={`flex flex-col items-center py-3 px-2 rounded-xl transition-all duration-200 ${isToday(date)
                                        ? 'bg-[#364649] text-white shadow-lg'
                                        : isSelected(date)
                                            ? 'bg-[#AA895F]/20 text-[#AA895F] border-2 border-[#AA895F]'
                                            : 'hover:bg-[#364649]/5 text-[#364649]'
                                        }`}
                                >
                                    <span className={`text-[10px] font-bold uppercase ${isToday(date) ? 'text-white/70' : 'text-[#364649]/50'}`}>
                                        {WEEK_DAYS[i]}
                                    </span>
                                    <span className="text-lg font-bold mt-1">
                                        {date.getDate()}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Expand Indicator */}
                    <button
                        onClick={() => setIsMonthlyView(true)}
                        className="w-full py-2 border-t border-[#364649]/10 flex items-center justify-center gap-2 text-[#364649]/40 hover:text-[#364649] hover:bg-[#364649]/5 transition-colors"
                    >
                        <ChevronDown size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Ver mes completo</span>
                    </button>
                </div>

                {/* Monthly View (Expanded) */}
                <div className={`transition-all duration-300 ease-in-out ${isMonthlyView ? 'opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    <div className="p-4">
                        {/* Month Navigation with Year Selector */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={() => navigateMonth('prev')}
                                className="p-2 hover:bg-[#364649]/10 rounded-full transition-colors"
                            >
                                <ChevronLeft size={20} className="text-[#364649]" />
                            </button>

                            <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-[#364649] capitalize">
                                    {MONTH_NAMES[currentDate.getMonth()]}
                                </span>

                                {/* Year Selector */}
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    className="bg-[#AA895F]/10 text-[#AA895F] font-bold text-sm px-3 py-1.5 rounded-lg border border-[#AA895F]/20 outline-none cursor-pointer hover:bg-[#AA895F]/20 transition-colors"
                                >
                                    {availableYears.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={() => navigateMonth('next')}
                                className="p-2 hover:bg-[#364649]/10 rounded-full transition-colors"
                            >
                                <ChevronRight size={20} className="text-[#364649]" />
                            </button>
                        </div>

                        {/* Calendar Header */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {WEEK_DAYS.map((day, i) => (
                                <div key={i} className="text-center text-[10px] font-bold uppercase text-[#364649]/40 py-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="space-y-1">
                            {monthCalendar.map((week, weekIndex) => (
                                <div key={weekIndex} className="grid grid-cols-7 gap-1">
                                    {week.map((date, dayIndex) => (
                                        <button
                                            key={dayIndex}
                                            disabled={!date}
                                            onClick={() => date && handleDayClick(date)}
                                            className={`aspect-square w-full max-w-[36px] md:max-w-[44px] mx-auto flex items-center justify-center rounded-xl text-sm font-bold transition-all ${!date
                                                ? 'opacity-0 cursor-default'
                                                : isToday(date)
                                                    ? 'bg-[#364649] text-white shadow-md'
                                                    : isSelected(date)
                                                        ? 'bg-[#AA895F] text-white shadow-lg scale-105'
                                                        : 'hover:bg-[#364649]/10 text-[#364649]'
                                                }`}
                                        >
                                            {date?.getDate()}
                                        </button>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Collapse Indicator */}
                    <button
                        onClick={() => setIsMonthlyView(false)}
                        className="w-full py-2 border-t border-[#364649]/10 flex items-center justify-center gap-2 text-[#364649]/40 hover:text-[#364649] hover:bg-[#364649]/5 transition-colors"
                    >
                        <ChevronUp size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Ver semana</span>
                    </button>
                </div>
            </div>

            {/* Dynamic Body Content */}
            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-3xl shadow-xl p-6 min-h-[300px]">
                {isMonthlyView ? (
                    /* ANALYSIS MODE - Monthly View Active */
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#AA895F]/10 rounded-xl flex items-center justify-center">
                                <BarChart3 size={20} className="text-[#AA895F]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[#364649]">Modo Análisis</h3>
                                <p className="text-xs text-[#364649]/60">
                                    Métricas de rendimiento para {MONTH_NAMES[currentDate.getMonth()]} {selectedYear}
                                </p>
                            </div>
                        </div>

                        {/* Integrated Analysis View */}
                        <HabitAnalysis
                            habits={allHabitsStore}
                            selectedDate={currentDate}
                            session={session}
                            isMother={isMother}
                            selectedTeamUser={selectedTeamUser}
                            refreshTrigger={refreshTrigger}
                        />
                    </div>
                ) : (
                    /* ACTION MODE - Weekly View Active */
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                    <Target size={20} className="text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[#364649]">Modo Acción</h3>
                                    <p className="text-xs text-[#364649]/60">
                                        {isMother && selectedTeamUser ? `Hábitos de ${selectedTeamUser} para ` : 'Tus hábitos para '}
                                        {selectedDay.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </p>
                                </div>
                            </div>

                            {/* Completion Summary */}
                            {!isLoading && habits.length > 0 && (
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-[#364649]">
                                        {habits.filter(h => h.completed).length}/{habits.length}
                                    </div>
                                    <div className="text-xs text-[#364649]/40">completados</div>
                                </div>
                            )}
                        </div>

                        {/* Habits List or Loading State */}
                        <div className="mt-4">
                            {isLoading ? (
                                <div className="py-20 text-center">
                                    <div className="w-12 h-12 border-4 border-[#364649]/10 border-t-[#AA895F] rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-[#364649]/40 font-bold uppercase text-xs tracking-widest">Cargando hábitos...</p>
                                </div>
                            ) : habits.length > 0 ? (
                                habits.map(habit => (
                                    <HabitCard
                                        key={habit.id}
                                        habit={habit}
                                        onToggle={handleToggleHabit}
                                        onIncrement={handleIncrementHabit}
                                        onUpdateNotes={handleUpdateNotes}
                                        onDelete={handleDeleteHabit}
                                        onEdit={handleEditHabit}
                                    />
                                ))
                            ) : (
                                <div className="py-20 text-center border-2 border-dashed border-[#364649]/10 rounded-[32px]">
                                    <Sparkles size={48} className="mx-auto text-[#364649]/10 mb-4" />
                                    <p className="text-[#364649]/40 font-bold mb-1">No hay hábitos para este día</p>
                                    <p className="text-xs text-[#364649]/30">Empieza creando uno nuevo para hoy</p>
                                </div>
                            )}
                        </div>

                        {/* Add Habit Button - Restricted for Director in View Mode */}
                        {!(isMother && selectedTeamUser && selectedTeamUser !== session?.user?.email) && (
                            <button
                                onClick={() => {
                                    setSelectedHabitForEdit(null);
                                    setIsNewHabitModalOpen(true);
                                }}
                                className="w-full py-3 border-2 border-dashed border-[#364649]/20 rounded-2xl flex items-center justify-center gap-2 text-[#364649]/40 hover:text-[#364649] hover:border-[#364649]/40 transition-colors"
                            >
                                <Plus size={20} />
                                <span className="font-bold">Agregar hábito</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* New Habit Modal */}
            <NewHabitModal
                isOpen={isNewHabitModalOpen}
                onClose={() => {
                    setIsNewHabitModalOpen(false);
                    setSelectedHabitForEdit(null);
                }}
                onSave={handleAddHabit}
                initialData={selectedHabitForEdit}
            />
        </div>
    );
}
