import { create } from 'zustand';
import { useBusinessStore } from './useBusinessStore';
import { supabase } from '../services/supabaseClient';
import { createRecurringHabitEvent, updateHabitCalendarEvent, deleteHabitCalendarEvent } from '../services/habitCalendarService';
import { Habit, HabitCategory, HabitCompletion, DailyLog } from '../types';

// --- HELPERS (Mapping DB -> UI) ---
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

// --- DATE HELPERS (Argentina GMT-3) ---
export const getArgentinaDate = (): Date => {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
};

export const getTodayString = (): string => {
    return getArgentinaDate().toISOString().split('T')[0];
};

const mapCompletionFromDB = (db: any, categories: HabitCategory[] = []): HabitCompletion => ({
    id: db.id,
    habitId: db.habit_id,
    dailyLogId: db.daily_log_id,
    targetDate: db.target_date,
    completedAt: db.completed_at,
    value: db.value,
    habit: db.habit ? {
        id: db.habit.id || db.habit_id,
        name: db.habit.name,
        categoryId: db.habit.category_id,
        cognitiveLoad: db.habit.cognitive_load,
        estimatedDuration: db.habit.estimated_duration,
        userId: db.habit.user_id
    } as any : undefined
});

// --- ANALYSIS HELPERS ---
const parseDateUTC = (dateStr: string) => {
    return new Date(`${dateStr}T00:00:00`);
};

export const normalizeText = (text: string): string => {
    return (text || '').replace(/[^\w\sáéíóúñü]/gi, '').trim().toLowerCase();
};

const getPotentialForPeriod = (startDate: Date, endDate: Date, targetHabits: Habit[], categories: HabitCategory[]) => {
    const dayCodes = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const spherePotential: Record<number, number> = {};
    categories.forEach(c => spherePotential[c.id] = 0);

    targetHabits.filter(h => h.active).forEach(h => {
        const catId = h.categoryId;
        if (spherePotential[catId] !== undefined) {
            const habitCreated = new Date(h.createdAt);
            const effectiveStart = habitCreated > startDate ? habitCreated : startDate;
            if (effectiveStart > endDate) return;

            const habitDayOccurrences: Record<number, number> = {};
            const tempDate = new Date(effectiveStart);
            while (tempDate <= endDate) {
                const d = tempDate.getDay();
                habitDayOccurrences[d] = (habitDayOccurrences[d] || 0) + 1;
                tempDate.setDate(tempDate.getDate() + 1);
            }

            let habitPotential = 0;
            dayCodes.forEach((code, index) => {
                const isScheduled = h.frequency?.includes(code as any) || !h.frequency;
                if (isScheduled) {
                    habitPotential += (habitDayOccurrences[index] || 0);
                }
            });
            spherePotential[catId] += habitPotential;
        }
    });
    return spherePotential;
};

const mapDailyLogFromDB = (db: any): DailyLog => ({
    id: db.id,
    userId: db.user_id,
    date: db.date,
    moodScore: db.mood_score,
    energyScore: db.energy_score,
    tags: db.tags || [],
    notes: db.notes,
    createdAt: db.created_at
});

interface GenericCompletion {
    eventId: string;
    targetDate: string;
}

export type NotificationType = 'success' | 'error' | 'info';

interface AppNotification {
    message: string;
    type: NotificationType;
    id: number;
}

interface HabitState {
    // Data State
    habits: Habit[];
    categories: HabitCategory[];
    completions: HabitCompletion[];
    rangeCompletions: HabitCompletion[];
    genericCompletions: GenericCompletion[];
    dailyLog: DailyLog | null;
    historicalCompletions: HabitCompletion[];
    historicalDailyLogs: DailyLog[];
    isHistoricalLoading: boolean;

    // UI/Context State
    selectedDate: string; // YYYY-MM-DD
    analysisRange: number; // 30, 90, 180, 365
    targetUserId: string | null;
    isLoading: boolean;
    isRangeLoading: boolean;
    error: string | null;
    notification: AppNotification | null;

    // Actions
    setTargetUserId: (userId: string) => void;
    setSelectedDate: (date: string) => Promise<void>;
    setAnalysisRange: (range: number) => void;
    notify: (message: string, type: NotificationType) => void;
    clearNotification: () => void;

    // Data Fetching
    fetchInitialData: (userId: string) => Promise<void>;
    fetchCompletionsByRange: (userId: string, minDate: string, maxDate: string) => Promise<void>;
    fetchHistoricalAnalysisData: (userId: string) => Promise<void>;

    // Log Operations
    upsertDailyLog: (data: Partial<DailyLog>) => Promise<DailyLog | null>;

    // Habit Operations
    addHabit: (habitData: Partial<Habit>, googleAccessToken?: string | null) => Promise<Habit | null>;
    updateHabit: (habitId: string, habitData: Partial<Habit>, googleAccessToken?: string | null) => Promise<Habit | null>;
    deleteHabit: (habitId: string, googleAccessToken?: string | null) => Promise<void>;
    toggleHabit: (habitId: string, habitName: string, date?: string) => Promise<void>;

    // Generic Event Operations
    toggleGenericEvent: (eventId: string, eventDate: string) => Promise<void>;

    // Analyzers (Computed Data for Analysis Tab)
    getRadarData: () => any[];
    getProMetrics: () => any;
    getInsights: () => any;
    getYearInPixels: () => any[];
    getCorrelationData: () => any[];
    getHabitHistory: (habitId: string) => any;
    getAnalysisSufficiency: () => { ok: boolean, msg: string };

    // New Centralized Logic
    matchEventToHabit: (eventTitle: string) => Habit | undefined;
    cleanupOrphanHabitEvents: (googleAccessToken: string) => Promise<void>;
    cleanupGhostEventsFromCalendar: (googleEvents: any[], googleAccessToken: string) => Promise<void>; // NEW: Inverse cleanup
}

// --- INTERNAL CACHE FOR HEAVY ANALYTICS ---
interface AnalyticalCache {
    radarData: any[] | null;
    proMetrics: any | null;
    insights: any | null;
    yearInPixels: any[] | null;
    correlationData: any[] | null;
    habitHistory: Map<string, any>;
    lastRefs: {
        habits: any[] | null;
        completions: any[] | null;
        historicalCompletions: any[] | null;
        historicalDailyLogs: any[] | null;
        analysisRange: number | null;
    };
}

let analyticalCache: AnalyticalCache = {
    radarData: null,
    proMetrics: null,
    insights: null,
    yearInPixels: null,
    correlationData: null,
    habitHistory: new Map(),
    lastRefs: {
        habits: null,
        completions: null,
        historicalCompletions: null,
        historicalDailyLogs: null,
        analysisRange: null
    }
};

const invalidateCacheIfneeded = (get: () => HabitState) => {
    const { habits, completions, historicalCompletions, historicalDailyLogs, analysisRange } = get();
    const refs = analyticalCache.lastRefs;

    if (
        habits !== refs.habits ||
        completions !== refs.completions ||
        historicalCompletions !== refs.historicalCompletions ||
        historicalDailyLogs !== refs.historicalDailyLogs ||
        analysisRange !== refs.analysisRange
    ) {
        // Data changed, wipe cache
        analyticalCache.radarData = null;
        analyticalCache.proMetrics = null;
        analyticalCache.insights = null;
        analyticalCache.yearInPixels = null;
        analyticalCache.correlationData = null;
        analyticalCache.habitHistory.clear();
        analyticalCache.lastRefs = { habits, completions, historicalCompletions, historicalDailyLogs, analysisRange };
    }
};

export const useHabitStore = create<HabitState>((set, get) => ({
    habits: [],
    categories: [],
    completions: [],
    rangeCompletions: [],
    genericCompletions: [],
    dailyLog: null,
    selectedDate: new Date().toISOString().split('T')[0],
    targetUserId: null,
    analysisRange: 30,
    isLoading: false,
    isHistoricalLoading: false,
    isRangeLoading: false,
    error: null,
    notification: null,
    historicalCompletions: [],
    historicalDailyLogs: [],

    notify: (message, type) => {
        set({ notification: { message, type, id: Date.now() } });
    },

    clearNotification: () => set({ notification: null }),

    setTargetUserId: (userId) => {
        set({ targetUserId: userId });
        get().fetchInitialData(userId);
    },

    setAnalysisRange: (range) => set({ analysisRange: range }),

    setSelectedDate: async (date) => {
        const { habits, dailyLog: currentLog } = get();
        // Only show loader if we have no dailyLog currently or if the date changes significantly
        // For transitions between dates we already have loaded, we skip full loader.
        set({ selectedDate: date, isLoading: currentLog?.date !== date && !habits.length });
        const { targetUserId } = get();
        if (targetUserId) {
            // Fetch daily log and completions for the new date
            const { data: dailyLog } = await supabase
                .from('daily_logs')
                .select('*')
                .eq('user_id', targetUserId)
                .eq('date', date)
                .maybeSingle();

            set({ dailyLog: dailyLog || null });
            if (dailyLog) {
                const { data: completions } = await supabase
                    .from('habit_completions')
                    .select('*')
                    .eq('daily_log_id', dailyLog.id);
                set({
                    dailyLog: mapDailyLogFromDB(dailyLog),
                    completions: (completions || []).map(c => mapCompletionFromDB(c, get().categories))
                });
            } else {
                set({ dailyLog: null, completions: [] });
            }
        }
        set({ isLoading: false });
    },

    fetchInitialData: async (userId) => {
        const { habits: existingHabits } = get();
        // Smart loading: only show skeleton if we have no data at all
        set({ isLoading: !existingHabits.length, targetUserId: userId });
        try {
            // 1. Fetch Categories
            const { data: categories } = await supabase.from('habit_categories').select('*').order('id');
            const mappedCategories = categories || [];

            // 2. Fetch Habits
            const { data: habits } = await supabase
                .from('habits')
                .select('*')
                .eq('user_id', userId)
                .eq('active', true);

            const mappedHabits = (habits || []).map(h => mapHabitFromDB(h, mappedCategories));

            // 3. Fetch today's context
            const today = get().selectedDate;
            const { data: dailyLog } = await supabase
                .from('daily_logs')
                .select('*')
                .eq('user_id', userId)
                .eq('date', today)
                .maybeSingle();

            let currentDailyLog: DailyLog | null = null;
            if (dailyLog) {
                currentDailyLog = mapDailyLogFromDB(dailyLog);
            }

            let todayCompletions: HabitCompletion[] = [];
            if (dailyLog) {
                const { data: comp } = await supabase
                    .from('habit_completions')
                    .select('*')
                    .eq('daily_log_id', dailyLog.id);
                todayCompletions = (comp || []).map(c => mapCompletionFromDB(c, mappedCategories));
            }

            set({
                categories: mappedCategories,
                habits: mappedHabits,
                dailyLog: currentDailyLog,
                completions: todayCompletions,
                isLoading: false
            });
            // Start fetching historical data in background
            get().fetchHistoricalAnalysisData(userId);
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    fetchHistoricalAnalysisData: async (userId) => {
        set({ isHistoricalLoading: true });
        try {
            const yearAgo = new Date();
            yearAgo.setDate(yearAgo.getDate() - 365);
            const minDate = yearAgo.toISOString().split('T')[0];

            // 1. Fetch completions (Using filter on habits to guarantee user scope)
            const { data: completions } = await supabase
                .from('habit_completions')
                .select(`
                    id,
                    habit_id,
                    daily_log_id,
                    target_date,
                    completed_at,
                    value,
                    habit:habits!inner ( name, category_id, cognitive_load, estimated_duration, user_id )
                `)
                .eq('habits.user_id', userId)
                .gte('target_date', minDate);

            // 2. Fetch logs
            const { data: logs } = await supabase
                .from('daily_logs')
                .select('*')
                .eq('user_id', userId)
                .gte('date', minDate)
                .order('date');

            set({
                historicalCompletions: (completions || []).map(c => mapCompletionFromDB(c, get().categories)),
                historicalDailyLogs: (logs || []).map(mapDailyLogFromDB),
                isHistoricalLoading: false
            });
        } catch (err) {
            console.error('Error fetching historical data:', err);
            set({ isHistoricalLoading: false });
        }
    },

    fetchCompletionsByRange: async (userId, minDate, maxDate) => {
        if (get().isRangeLoading) return;
        set({ isRangeLoading: true });
        console.log(`[habitStore] fetchCompletionsByRange START: ${minDate} to ${maxDate}`);
        const { habits } = get();
        const habitIds = habits.map(h => h.id);

        try {
            // 1. Fetch Habit Completions
            if (habitIds.length > 0) {
                const { data: habitData } = await supabase
                    .from('habit_completions')
                    .select('*')
                    .in('habit_id', habitIds)
                    .gte('target_date', minDate)
                    .lte('target_date', maxDate);

                if (habitData) {
                    const mappedNew = habitData.map(c => mapCompletionFromDB(c, habits as any));
                    set((state) => {
                        const existing = state.rangeCompletions;
                        const existingMap = new Map(existing.map(c => [`${c.targetDate}-${c.habitId}`, c]));
                        mappedNew.forEach(c => existingMap.set(`${c.targetDate}-${c.habitId}`, c));
                        return { rangeCompletions: Array.from(existingMap.values()) };
                    });
                }
            }

            // 2. Fetch Generic Event Completions
            const { data: genericData } = await supabase
                .from('event_completions')
                .select('event_id, target_date')
                .eq('user_id', userId)
                .gte('target_date', minDate)
                .lte('target_date', maxDate);

            if (genericData) {
                const mappedNew = genericData.map((d: any) => ({
                    eventId: d.event_id,
                    targetDate: d.target_date
                }));
                set((state) => {
                    const existingMap = new Map(state.genericCompletions.map(c => [`${c.targetDate}-${c.eventId}`, c]));
                    mappedNew.forEach(c => existingMap.set(`${c.targetDate}-${c.eventId}`, c));
                    return { genericCompletions: Array.from(existingMap.values()) };
                });
            }
        } catch (error) {
            console.error("Error fetching completions range:", error);
        } finally {
            set({ isRangeLoading: false });
            console.log(`[habitStore] fetchCompletionsByRange FINISHED`);
        }
    },

    upsertDailyLog: async (logData) => {
        const { targetUserId, selectedDate, dailyLog } = get();
        if (!targetUserId) return null;

        const date = logData.date || selectedDate;
        const dbData = {
            user_id: targetUserId,
            date,
            mood_score: logData.moodScore,
            energy_score: logData.energyScore,
            notes: logData.notes,
            tags: logData.tags
        };

        try {
            let result: any;
            if (dailyLog?.id && dailyLog.date === date) {
                // Update
                const { data, error } = await supabase
                    .from('daily_logs')
                    .update(dbData)
                    .eq('id', dailyLog.id)
                    .select()
                    .single();
                if (error) throw error;
                result = data;
            } else {
                // Check if exists first maybe? Or just upsert
                const { data, error } = await supabase
                    .from('daily_logs')
                    .upsert({ ...dbData }, { onConflict: 'user_id,date' })
                    .select()
                    .single();
                if (error) throw error;
                result = data;
            }

            const mapped = mapDailyLogFromDB(result);
            if (date === selectedDate) {
                set({ dailyLog: mapped });
            }
            return mapped;
        } catch (err) {
            console.error('Error upserting daily log:', err);
            get().notify('Error al guardar el pulso diario', 'error');
            return null;
        }
    },

    addHabit: async (habitData, googleAccessToken) => {
        const { targetUserId, categories } = get();
        if (!targetUserId) throw new Error("No target user ID");

        try {
            const dbReady = {
                user_id: targetUserId,
                name: habitData.name,
                category_id: habitData.categoryId,
                frequency: habitData.frequency,
                schedule_type: habitData.scheduleType,
                preferred_block: habitData.preferredBlock,
                fixed_time: habitData.fixedTime,
                estimated_duration: habitData.estimatedDuration,
                cognitive_load: habitData.cognitiveLoad,
                icon: habitData.icon,
                active: true
            };

            const { data, error } = await supabase
                .from('habits')
                .insert(dbReady)
                .select()
                .single();

            if (error) throw error;

            const newHabit = mapHabitFromDB(data, categories);

            // UI Update first
            set(state => ({ habits: [newHabit, ...state.habits] }));

            // GOOGLE CALENDAR SYNC (Atomic side-effect)
            if (googleAccessToken) {
                try {
                    const calResult = await createRecurringHabitEvent({
                        id: newHabit.id,
                        name: newHabit.name || '',
                        icon: newHabit.icon || '📌',
                        estimatedDuration: newHabit.estimatedDuration || 15,
                        scheduleType: newHabit.scheduleType || 'flexible',
                        preferredBlock: newHabit.preferredBlock || 'anytime',
                        fixedTime: newHabit.fixedTime,
                        frequency: newHabit.frequency || []
                    }, googleAccessToken);

                    if (calResult.success && calResult.event?.id) {
                        const eventId = calResult.event.id;
                        // Save ID to DB
                        await supabase.from('habits').update({ google_event_id: eventId }).eq('id', newHabit.id);
                        // Update local state and Business Cache
                        set(state => ({
                            habits: state.habits.map(h => h.id === newHabit.id ? { ...h, googleEventId: eventId } : h)
                        }));
                        useBusinessStore.getState().upsertGoogleEventToCache(calResult.event);
                    }
                } catch (calErr) {
                    console.error("Error creating GCal event in addHabit:", calErr);
                }
            }

            return newHabit;
        } catch (error: any) {
            set({ error: error.message });
            return null;
        }
    },

    updateHabit: async (id, updates, googleAccessToken) => {
        try {
            const { habits, categories } = get();
            const habitToUpdate = habits.find(h => h.id === id);
            if (!habitToUpdate) return null;

            const dbUpdates: any = {};
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;
            if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency;
            if (updates.scheduleType !== undefined) dbUpdates.schedule_type = updates.scheduleType;
            if (updates.preferredBlock !== undefined) dbUpdates.preferred_block = updates.preferredBlock;
            if (updates.fixedTime !== undefined) dbUpdates.fixed_time = updates.fixedTime;
            if (updates.estimatedDuration !== undefined) dbUpdates.estimated_duration = updates.estimatedDuration;
            if (updates.cognitiveLoad !== undefined) dbUpdates.cognitive_load = updates.cognitiveLoad;
            if (updates.active !== undefined) dbUpdates.active = updates.active;
            if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
            if (updates.googleEventId !== undefined) dbUpdates.google_event_id = updates.googleEventId;

            const { data, error } = await supabase
                .from('habits')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            const updatedHabit = mapHabitFromDB(data, categories);
            set(state => ({
                habits: state.habits.map(h => (h.id === id ? updatedHabit : h))
            }));

            // GOOGLE CALENDAR SYNC
            if (googleAccessToken) {
                try {
                    const habitDataForCal = {
                        id: updatedHabit.id,
                        name: updatedHabit.name || '',
                        icon: updatedHabit.icon || '📌',
                        estimatedDuration: updatedHabit.estimatedDuration || 15,
                        scheduleType: updatedHabit.scheduleType || 'flexible',
                        preferredBlock: updatedHabit.preferredBlock || 'anytime',
                        fixedTime: updatedHabit.fixedTime,
                        frequency: updatedHabit.frequency || []
                    };

                    let calResult;
                    if (updatedHabit.googleEventId) {
                        calResult = await updateHabitCalendarEvent(updatedHabit.googleEventId, habitDataForCal, googleAccessToken);
                    } else {
                        calResult = await createRecurringHabitEvent(habitDataForCal, googleAccessToken);
                        if (calResult.success && calResult.event?.id) {
                            const newEventId = calResult.event.id;
                            await supabase.from('habits').update({ google_event_id: newEventId }).eq('id', id);
                            set(state => ({
                                habits: state.habits.map(h => h.id === id ? { ...h, googleEventId: newEventId } : h)
                            }));
                        }
                    }

                    if (calResult?.success && calResult.event) {
                        useBusinessStore.getState().upsertGoogleEventToCache(calResult.event);
                    }
                } catch (calErr) {
                    console.error("Error syncing GCal in updateHabit:", calErr);
                }
            }

            return updatedHabit;
        } catch (error: any) {
            set({ error: error.message });
            return null;
        }
    },

    deleteHabit: async (habitId, googleAccessToken) => {
        const { habits } = get();
        const habitToDelete = habits.find(h => h.id === habitId);
        if (!habitToDelete) return;

        try {
            // 1. Soft delete in DB
            const { error } = await supabase
                .from('habits')
                .update({ active: false })
                .eq('id', habitId);

            if (error) throw error;

            // 2. Synchronize with Google Calendar (CLEAN SWEEP STRATEGY)
            if (googleAccessToken) {
                try {
                    const { deleteGoogleEvent, googleEvents } = useBusinessStore.getState();

                    // A. Delete the Master Series Event (if known)
                    if (habitToDelete.googleEventId) {
                        try {
                            await deleteGoogleEvent(habitToDelete.googleEventId);
                        } catch (e) { console.warn("Master event delete failed (might be already gone):", e); }
                    }

                    // B. Clean Sweep: Find any other "detached" events or exceptions for this habit
                    const relatedEvents = googleEvents.filter(ev =>
                        ev.extendedProperties?.shared?.habitId === habitId &&
                        ev.id !== habitToDelete.googleEventId // Avoid double delete attempt
                    );

                    if (relatedEvents.length > 0) {
                        console.log(`[HabitStore] Clean Sweep: Deleting ${relatedEvents.length} detached events for habit ${habitId}`);
                        for (const ev of relatedEvents) {
                            try {
                                await deleteGoogleEvent(ev.id);
                            } catch (e) {
                                console.error(`[HabitStore] Failed to sweep event ${ev.id}:`, e);
                            }
                        }
                    }

                } catch (calErr) {
                    console.error('Error in Google Calendar cleanup:', calErr);
                    // Non-blocking error
                }
            }

            // 3. Update local state
            set({ habits: habits.filter(h => h.id !== habitId) });
            get().notify('Hábito eliminado correctamente', 'success');

        } catch (err: any) {
            console.error('Error in deleteHabit action:', err);
            get().notify('Error al eliminar el hábito', 'error');
            throw err;
        }
    },

    cleanupOrphanHabitEvents: async (googleAccessToken) => {
        const { targetUserId } = get();
        // Check sync status from business store (which contains calendar slice) to avoid futile attempts
        const isSynced = useBusinessStore.getState().isGoogleSynced;
        if (!targetUserId || !googleAccessToken || !isSynced) return;

        try {
            // Find inactive habits that still have a googleEventId
            const { data: orphans, error } = await supabase
                .from('habits')
                .select('id, name, google_event_id')
                .eq('user_id', targetUserId)
                .eq('active', false)
                .not('google_event_id', 'is', null);

            if (error) throw error;
            if (!orphans || orphans.length === 0) return;

            console.log(`[HabitStore] Found ${orphans.length} orphan habit events to clean up.`);

            for (const orphan of orphans) {
                // CRITICAL: Stop the loop immediately if sync is lost to avoid console error spam
                if (!useBusinessStore.getState().isGoogleSynced) {
                    console.warn("[HabitStore] Sync lost during orphan cleanup. Aborting remaining tasks.");
                    break;
                }

                try {
                    // Use BusinessStore to delete from GCal and cache
                    await useBusinessStore.getState().deleteGoogleEvent(orphan.google_event_id);

                    // Clear the ID in DB so we don't try again
                    await supabase
                        .from('habits')
                        .update({ google_event_id: null })
                        .eq('id', orphan.id);

                    console.log(`[HabitStore] Cleaned up orphan event for: ${orphan.name}`);
                } catch (err) {
                    console.error(`[HabitStore] Failed to cleanup orphan ${orphan.google_event_id}:`, err);
                }
            }
        } catch (err) {
            console.error('[HabitStore] Orphan cleanup failed:', err);
        }
    },

    cleanupGhostEventsFromCalendar: async (googleEvents, googleAccessToken) => {
        const { habits } = get();
        if (!googleAccessToken || !googleEvents || googleEvents.length === 0) return;

        const activeHabitIds = new Set(habits.filter(h => h.active).map(h => h.id));
        const ghosts: any[] = [];

        googleEvents.forEach(event => {
            const extended = event.extendedProperties?.shared;
            // Check if it's OUR event (tagged with source)
            if (extended && extended.source === 'app-habit-tracker') {
                const habitId = extended.habitId;
                // If it claims to be a habit event, but we don't have that ACTIVE habit ID -> It's a ghost
                if (habitId && !activeHabitIds.has(habitId)) {
                    ghosts.push(event);
                }
            }
        });

        if (ghosts.length === 0) return;

        console.log(`[HabitStore] Found ${ghosts.length} GHOST events in calendar to cleanup (Inverse Strategy).`);

        for (const ghost of ghosts) {
            try {
                // Use BusinessStore to delete from GCal and connectively update the store cache
                // This prevents the infinite loop issue because deleteGoogleEvent updates the store,
                // which might re-trigger effects, but next time ghosts.length will be 0.
                await useBusinessStore.getState().deleteGoogleEvent(ghost.id);
                console.log(`[HabitStore] Deleted GHOST event: ${ghost.summary} (${ghost.id})`);
            } catch (err) {
                console.error(`[HabitStore] Failed to delete ghost ${ghost.id}:`, err);
            }
        }
    },

    toggleHabit: async (habitId, habitName, date) => {
        const { targetUserId, selectedDate, dailyLog, completions, rangeCompletions, habits, notify } = get();
        if (!targetUserId) return;

        const targetDate = date || selectedDate;
        const isSelectedDate = targetDate === selectedDate;

        const isCompleted = isSelectedDate
            ? completions.some(c => c.habitId === habitId)
            : rangeCompletions.some(c => c.habitId === habitId && c.targetDate === targetDate);

        // Backup for rollbacks
        const previousHabits = [...habits];
        const previousCompletions = [...completions];
        const previousRangeCompletions = [...rangeCompletions];

        // --- OPTIMISTIC UPDATE ---
        if (isCompleted) {
            if (isSelectedDate) {
                set({ completions: completions.filter(c => c.habitId !== habitId) });
            }
            set({
                rangeCompletions: rangeCompletions.filter(c => !(c.habitId === habitId && c.targetDate === targetDate)),
                historicalCompletions: get().historicalCompletions.filter(c => !(c.habitId === habitId && c.targetDate === targetDate))
            });
        } else {
            const habitInfo = habits.find(h => h.id === habitId);
            const newCompletion = {
                id: 'temp-' + Date.now(),
                habitId,
                dailyLogId: isSelectedDate ? (dailyLog?.id || '') : '',
                targetDate,
                completedAt: new Date().toISOString(),
                habit: habitInfo ? {
                    id: habitInfo.id,
                    name: habitInfo.name,
                    categoryId: habitInfo.categoryId,
                    cognitiveLoad: habitInfo.cognitiveLoad,
                } as any : undefined
            } as HabitCompletion;

            if (isSelectedDate) {
                set({ completions: [...completions, newCompletion] });
            }
            set({
                rangeCompletions: [...rangeCompletions, newCompletion],
                historicalCompletions: [...get().historicalCompletions, newCompletion]
            });
        }

        // 2. Update Streaks (Optimistic)
        const updatedHabits = habits.map(h => {
            if (h.id === habitId) {
                let newStreak = h.currentStreak;
                if (isCompleted) {
                    newStreak = Math.max(0, newStreak - 1);
                } else {
                    newStreak += 1;
                }
                const newLongest = Math.max(h.longestStreak, newStreak);
                return { ...h, currentStreak: newStreak, longestStreak: newLongest };
            }
            return h;
        });
        set({ habits: updatedHabits });

        try {
            let currentLogId = isSelectedDate ? dailyLog?.id : null;
            if (!currentLogId) {
                const { data: log, error: logError } = await supabase
                    .from('daily_logs')
                    .select('id')
                    .eq('user_id', targetUserId)
                    .eq('date', targetDate)
                    .maybeSingle();

                if (logError) throw logError;
                if (log) {
                    currentLogId = log.id;
                    if (isSelectedDate) set({ dailyLog: log as any });
                } else {
                    const { data: newLog, error: createLogError } = await supabase
                        .from('daily_logs')
                        .insert({ user_id: targetUserId, date: targetDate })
                        .select()
                        .single();
                    if (createLogError) throw createLogError;
                    currentLogId = newLog.id;
                    if (isSelectedDate) set({ dailyLog: newLog });
                }
            }

            if (isCompleted) {
                const { error: deleteError } = await supabase
                    .from('habit_completions')
                    .delete()
                    .eq('daily_log_id', currentLogId)
                    .eq('habit_id', habitId);
                if (deleteError) throw deleteError;
            } else {
                const { error: insertError } = await supabase
                    .from('habit_completions')
                    .insert({
                        habit_id: habitId,
                        daily_log_id: currentLogId,
                        target_date: targetDate,
                        completed_at: new Date().toISOString()
                    });
                if (insertError) throw insertError;
            }

            const { data: refreshedHabit } = await supabase
                .from('habits')
                .select('current_streak, longest_streak')
                .eq('id', habitId)
                .single();

            if (refreshedHabit) {
                set(state => ({
                    habits: state.habits.map(h => h.id === habitId ? {
                        ...h,
                        currentStreak: refreshedHabit.current_streak,
                        longestStreak: refreshedHabit.longest_streak
                    } : h)
                }));
            }

            window.dispatchEvent(new CustomEvent('habitCompletionChanged', {
                detail: { habitId, completed: !isCompleted, date: targetDate }
            }));

        } catch (err) {
            console.error('Error toggling habit:', err);
            set({
                habits: previousHabits,
                completions: previousCompletions,
                rangeCompletions: previousRangeCompletions
            });
            notify('Error al sincronizar. Se revirtió el cambio.', 'error');
        }
    },

    toggleGenericEvent: async (eventId, eventDate) => {
        const { targetUserId, genericCompletions } = get();
        if (!targetUserId) return;

        const isCompleted = genericCompletions.some(c => c.eventId === eventId && c.targetDate === eventDate);
        const previousGeneric = [...genericCompletions];

        if (isCompleted) {
            set({ genericCompletions: genericCompletions.filter(c => !(c.eventId === eventId && c.targetDate === eventDate)) });
        } else {
            set({ genericCompletions: [...genericCompletions, { eventId, targetDate: eventDate }] });
        }

        try {
            if (isCompleted) {
                const { error } = await supabase
                    .from('event_completions')
                    .delete()
                    .eq('user_id', targetUserId)
                    .eq('event_id', eventId)
                    .eq('target_date', eventDate);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('event_completions')
                    .insert({
                        user_id: targetUserId,
                        event_id: eventId,
                        target_date: eventDate,
                        completed_at: new Date().toISOString()
                    });
                if (error) throw error;
            }

            window.dispatchEvent(new CustomEvent('genericEventStatusChanged', {
                detail: { eventId, completed: !isCompleted }
            }));
        } catch (err) {
            console.error('Error toggling generic event:', err);
            set({ genericCompletions: previousGeneric });
            alert('Error al sincronizar evento. Se revirtió el cambio.');
        }
    },

    // --- ANALYZERS ---
    getAnalysisSufficiency: () => {
        const { historicalDailyLogs: logs, historicalCompletions: comps } = get();
        if (logs.length < 3) return { ok: false, msg: "Faltan registros (mín. 3 días)" };
        if (comps.length < 10) return { ok: false, msg: "Faltan acciones (mín. 10)" };
        return { ok: true, msg: "" };
    },

    getRadarData: () => {
        invalidateCacheIfneeded(get);
        if (analyticalCache.radarData) return analyticalCache.radarData;

        const { historicalCompletions: comps, habits, categories, analysisRange } = get();
        if (!habits.length) return [];

        const now = new Date();
        const rangeStartDate = new Date();
        rangeStartDate.setDate(now.getDate() - analysisRange);

        // O(N) Pre-filter
        const filteredCompletions = comps.filter(c => parseDateUTC(c.targetDate) >= rangeStartDate);
        const spherePotential = getPotentialForPeriod(rangeStartDate, now, habits, categories);

        // O(N) Count by Category
        const sphereCompletions: Record<number, number> = {};
        filteredCompletions.forEach((c) => {
            const catId = c.habit?.categoryId;
            if (catId) sphereCompletions[catId] = (sphereCompletions[catId] || 0) + 1;
        });

        const radarResult = categories.map(cat => {
            const potential = spherePotential[cat.id] || 0;
            const completed = sphereCompletions[cat.id] || 0;
            const mastery = potential > 0 ? Math.min(100, Math.round((completed / potential) * 100)) : 0;
            return { subject: cat.name, A: mastery, fullMark: 100 };
        });

        analyticalCache.radarData = radarResult;
        return radarResult;
    },

    getProMetrics: () => {
        invalidateCacheIfneeded(get);
        if (analyticalCache.proMetrics) return analyticalCache.proMetrics;

        const { historicalCompletions: comps, historicalDailyLogs: logs, habits, analysisRange, categories } = get();
        if (!habits.length) return null;

        const now = new Date();
        const currentRangeStart = new Date();
        currentRangeStart.setDate(now.getDate() - analysisRange);

        // Pre-filter for O(N)
        const currentCompletions = comps.filter(c => parseDateUTC(c.targetDate) >= currentRangeStart);
        const totalMinutes = currentCompletions.reduce((acc, c: any) => acc + (c.habit?.estimatedDuration || 15), 0);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;

        // Momentum calculation
        const prevRangeStart = new Date();
        prevRangeStart.setDate(now.getDate() - (analysisRange * 2));
        const prevRangeEnd = new Date(currentRangeStart);
        prevRangeEnd.setDate(prevRangeEnd.getDate() - 1);

        const prevCompletions = comps.filter(c => {
            const d = parseDateUTC(c.targetDate);
            return d >= prevRangeStart && d <= prevRangeEnd;
        });

        const getRate = (cList: any[], start: Date, end: Date) => {
            const pot = getPotentialForPeriod(start, end, habits, categories);
            const totalPot = Object.values(pot).reduce((a, b: number) => a + b, 0);
            return totalPot > 0 ? (cList.length / totalPot) * 100 : 0;
        };

        const currentRate = getRate(currentCompletions, currentRangeStart, now);
        const prevRate = getRate(prevCompletions, prevRangeStart, prevRangeEnd);
        const momentumValue = Math.round(currentRate - prevRate);

        // Focus Index: High Load on High Energy (O(N) with Set)
        const highEnergySet = new Set(logs.filter(l => (l.energyScore || 0) >= 7).map(l => l.date));
        const highLoadComps = currentCompletions.filter((c: any) => c.habit?.cognitiveLoad === 'high');
        const efficientComps = highLoadComps.filter((c: any) => highEnergySet.has(c.targetDate));
        const focusIndex = highLoadComps.length > 0 ? Math.round((efficientComps.length / highLoadComps.length) * 100) : null;

        const metricsResult = {
            timeROI: { hours, mins, totalMinutes },
            momentum: { value: momentumValue, isPositive: momentumValue >= 0 },
            focusIndex
        };
        analyticalCache.proMetrics = metricsResult;
        return metricsResult;
    },

    getInsights: () => {
        invalidateCacheIfneeded(get);
        if (analyticalCache.insights) return analyticalCache.insights;

        const sufficiency = get().getAnalysisSufficiency();
        if (!sufficiency.ok) return null;

        const { historicalCompletions: comps, historicalDailyLogs: logs, habits } = get();

        const hoursMap: Record<number, number> = {};
        comps.forEach(c => {
            const isHighLoad = c.habit?.cognitiveLoad === 'high';
            if (isHighLoad && c.completedAt) {
                const h = new Date(c.completedAt).getHours();
                hoursMap[h] = (hoursMap[h] || 0) + 1;
            }
        });
        const bestHour = Object.keys(hoursMap).reduce((a, b) => hoursMap[Number(a)] > hoursMap[Number(b)] ? a : b, null as string | null);
        let goldenHour = null;
        if (bestHour) {
            const h = Number(bestHour);
            let period = 'Mañana';
            let biotype = 'Alondra';
            let biotypeIcon = '🌅';

            if (h >= 12 && h < 18) {
                period = 'Tarde';
                biotype = 'Colibrí';
                biotypeIcon = '☀️';
            } else if (h >= 18 || h < 5) {
                period = 'Noche';
                biotype = 'Búho';
                biotypeIcon = '🦉';
            }
            goldenHour = { hour: `${h}:00`, period, biotype, biotypeIcon };
        }

        const lowEnergyDays = logs.filter(l => (l.energyScore || 0) <= 4).map(l => l.date);
        const habitCounts: Record<string, number> = {};
        comps.forEach(c => {
            if (lowEnergyDays.includes(c.targetDate)) {
                const hName = c.habit?.name || 'Habit';
                habitCounts[hName] = (habitCounts[hName] || 0) + 1;
            }
        });
        const bestVampire = Object.keys(habitCounts).reduce((a, b) => habitCounts[a] > habitCounts[b] ? a : b, null as string | null);
        let vampire = null;
        if (bestVampire) {
            vampire = { name: bestVampire, correlation: Math.round((habitCounts[bestVampire] / lowEnergyDays.length) * 100) };
        }

        const dayCodes = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const dayOccurrences: Record<number, number> = {};
        logs.forEach(l => {
            const d = parseDateUTC(l.date).getDay();
            dayOccurrences[d] = (dayOccurrences[d] || 0) + 1;
        });
        let worstDay = null;
        let lowestRate = 101;
        dayCodes.forEach((code, index) => {
            const scheduled = habits.filter(h => h.active && (h.frequency?.includes(code as any) || !h.frequency));
            const potential = scheduled.length * (dayOccurrences[index] || 1);
            const actual = comps.filter(c => parseDateUTC(c.targetDate).getDay() === index).length;
            const rate = potential > 0 ? Math.round((actual / potential) * 100) : 100;
            if (rate < lowestRate) {
                lowestRate = rate;
                worstDay = { name: dayNames[index], rate: lowestRate, gap: 100 - lowestRate };
            }
        });

        const result = { goldenHour, vampire, kryptonite: worstDay };
        analyticalCache.insights = result;
        return result;
    },

    getYearInPixels: () => {
        invalidateCacheIfneeded(get);
        if (analyticalCache.yearInPixels) return analyticalCache.yearInPixels;

        const { historicalDailyLogs: logs, historicalCompletions: comps, habits } = get();
        const activeHabits = habits.length || 1;
        const completionsMap: Record<string, number> = {};
        comps.forEach(c => {
            completionsMap[c.targetDate] = (completionsMap[c.targetDate] || 0) + 1;
        });

        const result = logs.map(log => {
            const done = completionsMap[log.date] || 0;
            const rate = Math.min(100, Math.round((done / activeHabits) * 100));
            return {
                date: log.date,
                moodScore: log.moodScore,
                completionRate: rate
            };
        });

        analyticalCache.yearInPixels = result;
        return result;
    },

    getCorrelationData: () => {
        invalidateCacheIfneeded(get);
        if (analyticalCache.correlationData) return analyticalCache.correlationData;

        const { historicalDailyLogs: logs, historicalCompletions: comps, habits } = get();
        if (!logs.length) return [];

        const dayCodes = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const correlationResult = logs.map(l => {
            const compsForDay = comps.filter(c => c.targetDate === l.date);
            const totalScheduled = habits.filter(h => h.active && h.frequency?.includes(dayCodes[parseDateUTC(l.date).getDay()] as any)).length;
            const performance = totalScheduled > 0 ? (compsForDay.length / totalScheduled) * 100 : 0;

            return {
                date: l.date,
                performance,
                energy: l.energyScore ? l.energyScore * 20 : 0
            };
        }).filter(d => d.energy > 0);

        analyticalCache.correlationData = correlationResult;
        return correlationResult;
    },

    getHabitHistory: (habitId) => {
        invalidateCacheIfneeded(get);
        if (analyticalCache.habitHistory.has(habitId)) return analyticalCache.habitHistory.get(habitId);

        const { historicalCompletions: comps, habits } = get();
        const habit = habits.find(h => h.id === habitId);
        if (!habit) return null;

        const completionsMap = new Set(
            comps.filter(c => c.habitId === habitId).map(c => c.targetDate)
        );

        const today = new Date();
        const yearData = [];
        const dayCodes = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const habitCreated = parseDateUTC(habit.createdAt.split('T')[0]);

        let scheduledTotal = 0;
        let completedTotal = 0;

        for (let i = 364; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const isBeforeCreation = d < habitCreated;

            if (isBeforeCreation) {
                yearData.push({ date: dateStr, status: 'blank' });
                continue;
            }

            const isScheduled = habit.frequency?.includes(dayCodes[d.getDay()] as any) || !habit.frequency;
            const isCompleted = completionsMap.has(dateStr);

            if (isScheduled) {
                scheduledTotal++;
                if (isCompleted) {
                    completedTotal++;
                    yearData.push({ date: dateStr, status: 'completed' });
                } else {
                    yearData.push({ date: dateStr, status: 'missed' });
                }
            } else {
                yearData.push({ date: dateStr, status: 'neutral', isCompleted });
            }
        }

        const adherence = scheduledTotal > 0 ? Math.round((completedTotal / scheduledTotal) * 100) : 0;

        const result = {
            history: yearData,
            stats: {
                name: habit.name,
                completedTotal: completedTotal,
                scheduledTotal: scheduledTotal,
                adherence: adherence,
                icon: habit.icon
            }
        };

        analyticalCache.habitHistory.set(habitId, result);
        return result;
    },

    matchEventToHabit: (eventTitle: string) => {
        const { habits } = get();
        const normalizedTitle = normalizeText(eventTitle);
        if (!normalizedTitle) return undefined;

        return habits.find(h => {
            const normalizedName = normalizeText(h.name);
            return normalizedTitle.includes(normalizedName) || normalizedName.includes(normalizedTitle);
        });
    }
} satisfies Partial<HabitState>)); // Minor type hint usage internally if needed, or just end the object
