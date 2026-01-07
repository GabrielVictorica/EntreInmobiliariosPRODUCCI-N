import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus, ZoomIn, ZoomOut, Check, Loader2 } from 'lucide-react';
import { ActivityRecord, VisitRecord } from '../../types';
import { supabase } from '../../services/supabaseClient';
import CreateEventModal from './CreateEventModal';

interface CalendarDashboardProps {
    session: any;
    activities: ActivityRecord[];
    visits: VisitRecord[];
    googleEvents: any[];
    onEventsChange: (events: any[]) => void;
    isGoogleSynced: boolean;
    onSyncChange: (synced: boolean) => void;
    googleAccessToken: string | null;
    onTokenChange: (token: string | null) => void;
    isCheckingSync: boolean;
    targetUserId?: string; // For habit sync
}

export default function CalendarDashboard({
    session: propSession,
    activities,
    visits,
    googleEvents,
    onEventsChange,
    isGoogleSynced: isSynced, // Rename prop to keep internal usage
    onSyncChange: setIsSynced,
    googleAccessToken,
    onTokenChange: setGoogleAccessToken,
    isCheckingSync,
    targetUserId
}: CalendarDashboardProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isSyncing, setIsSyncing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [session, setSession] = useState<any>(propSession);
    const [modalInitialDate, setModalInitialDate] = useState<Date | null>(null);
    const [editingEvent, setEditingEvent] = useState<any | null>(null);

    // Resize State: Now includes visual feedback data
    const [isResizing, setIsResizing] = useState(false);
    const [resizePreview, setResizePreview] = useState<{ eventId: string, height: number, timeLabel: string } | null>(null);
    const resizeState = useRef<{ eventId: string, startY: number, originalEnd: Date, originalHeight: number } | null>(null);

    // Zoom control state (height of one hour in pixels)
    const [hourHeight, setHourHeight] = useState(80);
    const gridRef = useRef<HTMLDivElement>(null);

    // ========== COMPLETION STATE ==========
    const [habits, setHabits] = useState<{ id: string; name: string }[]>([]);
    const [dailyLogId, setDailyLogId] = useState<string | null>(null);
    const [completedEventIds, setCompletedEventIds] = useState<Set<string>>(new Set());

    const fetchCompletionData = async () => {
        if (!targetUserId) return;
        const today = new Date().toISOString().split('T')[0];

        const { data: habitsData } = await supabase
            .from('habits')
            .select('id, name')
            .eq('user_id', targetUserId)
            .eq('active', true);

        if (habitsData) setHabits(habitsData);

        const { data: dailyLog } = await supabase
            .from('daily_logs')
            .select('id')
            .eq('user_id', targetUserId)
            .eq('date', today)
            .maybeSingle();

        if (dailyLog) setDailyLogId(dailyLog.id);

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

    useEffect(() => {
        fetchCompletionData();
    }, [targetUserId]);

    useEffect(() => {
        if (targetUserId && completedEventIds.size > 0) {
            const today = new Date().toISOString().split('T')[0];
            localStorage.setItem(`completedEvents_${targetUserId}`, JSON.stringify({
                date: today,
                ids: Array.from(completedEventIds)
            }));
        }
    }, [completedEventIds, targetUserId]);

    // Auto-refresh when tab becomes visible (for cross-tab sync)
    useEffect(() => {
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

    const toggleEventCompletion = async (eventId: string, eventTitle: string, eventDate: string) => {
        if (!eventId || !targetUserId) return;
        const today = new Date().toISOString().split('T')[0];
        const isToday = eventDate === today;
        const isCompleted = completedEventIds.has(eventId);

        setCompletedEventIds(prev => {
            const newSet = new Set(prev);
            if (isCompleted) {
                newSet.delete(eventId);
            } else {
                newSet.add(eventId);
            }
            return newSet;
        });

        if (isToday) {
            // Normalize: remove emojis and extra whitespace for better matching
            const normalizedTitle = eventTitle.replace(/[^\w\sáéíóúñü]/gi, '').trim().toLowerCase();

            const matchedHabit = habits.find(h => {
                const normalizedName = h.name.toLowerCase();
                return normalizedTitle.includes(normalizedName) || normalizedName.includes(normalizedTitle);
            });

            console.log('[Calendar Habit Sync]', {
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

                    if (!currentLogId) {
                        const { data: newLog, error: logError } = await supabase
                            .from('daily_logs')
                            .insert({ user_id: targetUserId, date: today })
                            .select()
                            .single();

                        if (logError) {
                            console.error('[Calendar Sync] Error creating daily log:', logError);
                            return;
                        }

                        if (newLog) {
                            currentLogId = newLog.id;
                            setDailyLogId(newLog.id);
                        }
                    }

                    if (isCompleted) {
                        const { error: deleteError } = await supabase
                            .from('habit_completions')
                            .delete()
                            .eq('daily_log_id', currentLogId)
                            .eq('habit_id', matchedHabit.id);

                        if (deleteError) {
                            console.error('[Calendar Sync] Error deleting:', deleteError);
                        } else {
                            console.log('[Calendar Sync] UNMARKED:', matchedHabit.name);
                            // Dispatch for instant cross-component sync
                            window.dispatchEvent(new CustomEvent('habitCompletionChanged', {
                                detail: { habitId: matchedHabit.id, completed: false }
                            }));
                        }
                    } else {
                        const { error: insertError } = await supabase
                            .from('habit_completions')
                            .insert({
                                habit_id: matchedHabit.id,
                                daily_log_id: currentLogId,
                                target_date: today,
                                completed_at: new Date().toISOString()
                            });

                        if (insertError) {
                            console.error('[Calendar Sync] Error inserting:', insertError);
                        } else {
                            console.log('[Calendar Sync] MARKED:', matchedHabit.name);
                            // Dispatch for instant cross-component sync
                            window.dispatchEvent(new CustomEvent('habitCompletionChanged', {
                                detail: { habitId: matchedHabit.id, completed: true }
                            }));
                        }
                    }
                } catch (error) {
                    console.error('[Calendar Sync] Exception:', error);
                }
            }
        }
    };

    const isEventCompleted = (eventId: string): boolean => {
        return completedEventIds.has(eventId);
    };

    // Google Colors Helper
    const getGoogleColor = (colorId: string) => {
        const colors: any = {
            '1': '#7986cb', '2': '#33b679', '3': '#8e24aa', '4': '#e67c73',
            '5': '#f6bf26', '6': '#f4511e', '7': '#039be5', '8': '#616161',
            '9': '#3f51b5', '10': '#0b8043', '11': '#d50000'
        };
        return colors[colorId] || '#039be5'; // Default Blue
    };

    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -10 : 10;
                setHourHeight(prev => Math.min(200, Math.max(40, prev + delta)));
            }
        };

        const gridElement = gridRef.current;
        if (gridElement) {
            gridElement.addEventListener('wheel', handleWheel, { passive: false });
        }

        return () => {
            if (gridElement) {
                gridElement.removeEventListener('wheel', handleWheel);
            }
        };
    }, []);

    // Resize Global Listeners (Live Preview Logic)
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing || !resizeState.current) return;

            const { eventId, startY, originalHeight, originalEnd } = resizeState.current;
            const deltaY = e.clientY - startY;

            // Calculate raw new height
            const rawHeight = Math.max(25, originalHeight + deltaY); // Min height 25px

            // Calculate snapped time for visual feedback
            // 5 min blocks. 5 min = hourHeight / 12
            const blockHeight = hourHeight / 12;
            const snappedHeight = Math.round(rawHeight / blockHeight) * blockHeight;

            // Calculate resulting time
            // Re-calculate minutes from deltaY directly for time accuracy
            const deltaMinutes = (deltaY / hourHeight) * 60;
            const snappedDeltaMinutes = Math.round(deltaMinutes / 5) * 5;
            const newEndTime = new Date(originalEnd.getTime() + (snappedDeltaMinutes * 60000));
            const timeLabel = newEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            setResizePreview({
                eventId,
                height: Math.max(25, snappedHeight),
                timeLabel
            });
        };

        const handleMouseUp = async (e: MouseEvent) => {
            if (!isResizing || !resizeState.current) return;

            const { eventId, startY, originalEnd } = resizeState.current;
            const deltaY = e.clientY - startY;
            const deltaMinutes = Math.round((deltaY / hourHeight) * 60);

            // Snap to 5 min
            const snappedMinutes = Math.round(deltaMinutes / 5) * 5;

            if (snappedMinutes !== 0) {
                const newEnd = new Date(originalEnd.getTime() + (snappedMinutes * 60000));
                await updateEventTime(eventId, newEnd);
            }

            setIsResizing(false);
            setResizePreview(null);
            resizeState.current = null;
            document.body.style.cursor = 'default';
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, hourHeight]);

    // ... (DB Loading, Sync, APIs - Same as before)

    const refreshGoogleToken = async () => {
        try {
            const { data, error } = await supabase.functions.invoke('refresh-google-token');
            if (error) throw error;
            if (data?.access_token) {
                setGoogleAccessToken(data.access_token);
                setIsSynced(true);
                return data.access_token;
            }
        } catch (error) {
            console.error('Error refreshing Google token:', error);
            setIsSynced(false);
            return null;
        }
    };

    useEffect(() => {
        setSession(propSession);
        if (propSession?.provider_token) {
            setGoogleAccessToken(propSession.provider_token);
            setIsSynced(true);
            saveGoogleToken(propSession.user.id, propSession.provider_token, propSession.provider_refresh_token);
        }
    }, [propSession]);

    const saveGoogleToken = async (userId: string, accessToken: string, refreshToken?: string) => {
        try {
            const updates: any = { user_id: userId, provider: 'google_calendar', access_token: accessToken, updated_at: new Date().toISOString() };
            if (refreshToken) updates.refresh_token = refreshToken;
            await supabase.from('user_integrations').upsert(updates, { onConflict: 'user_id, provider' });
        } catch (error) { console.error(error); }
    };

    // Local state for calendar view events (separate from global Home events)
    const [localEvents, setLocalEvents] = useState<any[]>(googleEvents);

    // Helper to check if we're viewing the current week
    const isCurrentWeek = () => {
        const today = new Date();
        const todayMonday = new Date(today);
        const dayOfWeek = today.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        todayMonday.setDate(today.getDate() + mondayOffset);
        todayMonday.setHours(0, 0, 0, 0);

        const viewMonday = new Date(currentDate);
        viewMonday.setDate(viewMonday.getDate() - viewMonday.getDay() + 1);
        viewMonday.setHours(0, 0, 0, 0);

        return todayMonday.getTime() === viewMonday.getTime();
    };

    const listGoogleEvents = async (token?: string) => {
        const currentToken = token || googleAccessToken;
        if (!currentToken) return;

        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 7);

        try {
            const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startOfWeek.toISOString()}&timeMax=${endOfWeek.toISOString()}&singleEvents=true&orderBy=startTime`, {
                headers: { 'Authorization': `Bearer ${currentToken}` }
            });
            if (!response.ok) {
                if (response.status === 401) {
                    const newToken = await refreshGoogleToken();
                    if (newToken) {
                        return listGoogleEvents(newToken);
                    }
                    setIsSynced(false);
                }
                throw new Error('Failed to fetch events');
            }
            const data = await response.json();
            const events = data.items || [];

            // Always update local state for calendar display
            setLocalEvents(events);

            // Only update global state if viewing current week (for Home sync)
            if (isCurrentWeek()) {
                onEventsChange(events);
            }
        } catch (error) { console.error(error); }
    };

    const updateEventTime = async (eventId: string, newEnd: Date) => {
        try {
            const updatedEvents = localEvents.map(e => {
                if (e.id === eventId) return { ...e, end: { ...e.end, dateTime: newEnd.toISOString() } };
                return e;
            });
            setLocalEvents(updatedEvents);
            if (isCurrentWeek()) {
                onEventsChange(updatedEvents);
            }
            await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${googleAccessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ end: { dateTime: newEnd.toISOString() } }),
            });
        } catch (error) {
            console.error("Error resizing event:", error);
            listGoogleEvents();
        }
    }

    // Sync local events with global when component mounts (use global as initial)
    useEffect(() => {
        if (googleEvents.length > 0 && localEvents.length === 0) {
            setLocalEvents(googleEvents);
        }
    }, [googleEvents]);

    // Load events when entering calendar view
    useEffect(() => {
        if (isSynced && googleAccessToken) {
            listGoogleEvents();
        }
    }, [isSynced, googleAccessToken, currentDate]);

    const handleEventSubmit = async (eventData: any) => {
        if (!googleAccessToken) { alert('Sincroniza primero.'); return; }
        const isUpdate = !!eventData.id;
        const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events${isUpdate ? '/' + eventData.id : ''}`;
        const body: any = {
            'summary': eventData.summary,
            'location': eventData.location,
            'description': eventData.description,
            'start': { 'dateTime': new Date(eventData.startDateTime).toISOString() },
            'end': { 'dateTime': new Date(eventData.endDateTime).toISOString() },
            'colorId': eventData.colorId
        };
        try {
            const response = await fetch(url, {
                method: isUpdate ? 'PATCH' : 'POST',
                headers: { 'Authorization': `Bearer ${googleAccessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!response.ok) throw new Error('API Error');
            listGoogleEvents();
            setEditingEvent(null);
        } catch (error: any) { alert('Error: ' + error.message); }
    };

    const getWeekDays = (date: Date) => {
        const start = new Date(date);
        start.setDate(start.getDate() - start.getDay() + 1);
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const weekDays = getWeekDays(currentDate);
    const hours = Array.from({ length: 17 }, (_, i) => i + 8);
    const nextWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); };
    const prevWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); };
    const isSameDay = (d1: Date, d2: string) => {
        const target = new Date(d2 + 'T12:00:00');
        return d1.getDate() === target.getDate() && d1.getMonth() === target.getMonth() && d1.getFullYear() === target.getFullYear();
    };

    const layoutEvents = (events: any[]) => {
        // 1. Sort by start time
        const sorted = [...events].sort((a, b) => new Date(a.start.dateTime || a.start.date).getTime() - new Date(b.start.dateTime || b.start.date).getTime());

        // 2. Group into Clusters (Disjoint sets of overlapping events)
        const clusters: any[][] = [];
        let currentCluster: any[] = [];
        let clusterEnd = 0;

        sorted.forEach(event => {
            const start = new Date(event.start.dateTime || event.start.date).getTime();
            const end = new Date(event.end.dateTime || event.end.date).getTime();

            if (currentCluster.length === 0) {
                currentCluster.push(event);
                clusterEnd = end;
            } else {
                // If event starts before the current cluster chain ends -> It overlaps/connects
                if (start < clusterEnd) {
                    currentCluster.push(event);
                    clusterEnd = Math.max(clusterEnd, end);
                } else {
                    // Gap detected -> Close cluster
                    clusters.push(currentCluster);
                    currentCluster = [event];
                    clusterEnd = end;
                }
            }
        });
        if (currentCluster.length > 0) clusters.push(currentCluster);

        // 3. Layout each cluster independently
        return clusters.flatMap(cluster => {
            const columns: any[][] = [];
            cluster.forEach(event => {
                const start = new Date(event.start.dateTime || event.start.date).getTime();
                let placed = false;
                for (let i = 0; i < columns.length; i++) {
                    const col = columns[i];
                    const lastEventInCol = col[col.length - 1];
                    const lastEnd = new Date(lastEventInCol.end.dateTime || lastEventInCol.end.date).getTime();

                    // Greedy packing: If fits in column, place it.
                    if (start >= lastEnd) {
                        col.push(event);
                        event._col = i;
                        placed = true;
                        break;
                    }
                }
                if (!placed) {
                    columns.push([event]);
                    event._col = columns.length - 1;
                }
            });

            // Map styles for this cluster
            return cluster.map(event => ({
                ...event,
                _style: {
                    left: `${(event._col * (100 / columns.length))}%`,
                    width: `${(100 / columns.length) - 1}%` // -1% gap
                }
            }));
        });
    };

    const getEventsForDay = (day: Date) => {
        const dayVisits = visits.filter(v => isSameDay(day, v.date));
        const dayActivities = activities.filter(a => isSameDay(day, a.date));
        const rawGoogleEvents = localEvents.filter((e: any) => {
            const eventDate = e.start.dateTime || e.start.date;
            const target = new Date(eventDate);
            return day.getDate() === target.getDate() && day.getMonth() === target.getMonth() && day.getFullYear() === target.getFullYear();
        });

        // Filter out All Day events for the hourly grid layout
        // All Day events have 'date' but no 'dateTime'
        // ALSO filter events starting < 8am because the renderer hides them (prevening "Ghost Columns")
        const timedEvents = rawGoogleEvents.filter((e: any) => {
            if (!e.start.dateTime) return false;
            const h = new Date(e.start.dateTime).getHours();
            return h >= 8 && h < 24;
        });

        // DEDUPLICATION: Merge identical events (Same Start + Same Summary)
        // This prevents "split columns" if the user accidentally has duplicates or sync errors
        const uniqueEvents: any[] = [];
        const seenKeys = new Set();

        timedEvents.forEach((e: any) => {
            const key = `${e.start.dateTime}-${e.summary}`;
            if (!seenKeys.has(key)) {
                seenKeys.add(key);
                uniqueEvents.push(e);
            }
        });

        const dayGoogleEvents = layoutEvents(uniqueEvents);

        return { dayVisits, dayActivities, dayGoogleEvents };
    };

    const handleSyncGoogleCalendar = async () => {
        setIsSyncing(true);
        try {
            await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    queryParams: { access_type: 'offline', prompt: 'consent' },
                    scopes: 'https://www.googleapis.com/auth/calendar',
                    redirectTo: window.location.origin + '?tab=calendar'
                },
            });
        } catch (error: any) { alert(`Error: ${error.message}`); } finally { setIsSyncing(false); }
    };

    const handleGridClick = (date: Date, hour: number) => {
        const d = new Date(date); d.setHours(hour, 0, 0, 0);
        setModalInitialDate(d); setEditingEvent(null); setIsModalOpen(true);
    };

    const handleEditClick = (e: React.MouseEvent, event: any) => {
        e.stopPropagation(); setEditingEvent(event); setModalInitialDate(null); setIsModalOpen(true);
    };

    const handleResizeStart = (e: React.MouseEvent, event: any) => {
        e.stopPropagation();
        e.preventDefault();
        setIsResizing(true);
        document.body.style.cursor = 'ns-resize';

        // Find current height for correct offset assumption
        // We can approximate or better yet, get from DOM target?
        // Since we are clicking the handle which is at bottom, clientY IS the bottom.
        // We know start time, so we know 'top'. height = clientY - top (relative to container).
        // Simpler: Just track delta from MOUSE DOWN.
        // But we need 'originalHeight' to add delta to.
        // Calculate originalHeight from event duration
        const start = new Date(event.start.dateTime || event.start.date);
        const end = new Date(event.end.dateTime || event.end.date);
        const durationMin = (end.getTime() - start.getTime()) / 60000;
        const originalHeight = (durationMin / 60) * hourHeight;

        resizeState.current = {
            eventId: event.id,
            startY: e.clientY,
            originalEnd: end,
            originalHeight
        };
    };

    // We no longer block the whole screen with a loader. 
    // We just let the UI render and the "Conectar Google" button will show current status.

    return (
        <div className="space-y-6 pb-20 animate-fade-in-up">
            <CreateEventModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingEvent(null); }}
                onSubmit={handleEventSubmit}
                initialDate={modalInitialDate}
                eventToEdit={editingEvent}
            />

            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#364649] tracking-tight">Calendario</h1>
                    <p className="text-[#364649]/60 text-sm font-medium">Gestiona tu agenda y sincroniza</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleSyncGoogleCalendar} disabled={isSynced || isSyncing} className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${isSynced ? 'bg-green-100 text-green-700' : 'bg-white text-[#364649]'}`}>
                        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google" className="w-5 h-5" />
                        <span className="hidden md:inline">{isSyncing || isCheckingSync ? 'Cargando...' : (isSynced ? 'Sincronizado' : 'Conectar Google')}</span>
                    </button>
                    <button onClick={() => { setModalInitialDate(null); setIsModalOpen(true); }} className="bg-[#AA895F] text-white px-4 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2">
                        <Plus size={18} /> <span className="hidden md:inline">Evento</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#364649]/10 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={prevWeek} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={20} /></button>
                    <h2 className="text-xl font-bold text-[#364649] capitalize">{currentDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</h2>
                    <button onClick={nextWeek} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight size={20} /></button>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-100">
                        <ZoomOut size={16} onClick={() => setHourHeight(h => Math.max(40, h - 20))} className="cursor-pointer text-gray-500" />
                        <span className="text-xs font-bold text-gray-400 w-12 text-center">ZOOM</span>
                        <ZoomIn size={16} onClick={() => setHourHeight(h => Math.min(200, h + 20))} className="cursor-pointer text-gray-500" />
                    </div>
                    <button onClick={() => setCurrentDate(new Date())} className="text-sm font-bold text-[#AA895F]">Hoy</button>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-[#364649]/10">
                <div className="grid grid-cols-8 border-b border-gray-100">
                    <div className="p-4 bg-gray-50 border-r border-gray-100"></div>
                    {weekDays.map((date, i) => (
                        <div key={i} className={`p-4 text-center border-r border-gray-100 ${date.toDateString() === new Date().toDateString() ? 'bg-[#AA895F]/5' : ''}`}>
                            <p className="text-xs font-bold uppercase text-[#364649]/50">{date.toLocaleDateString('es-AR', { weekday: 'short' })}</p>
                            <p className="text-xl font-bold mt-1 text-[#364649]">{date.getDate()}</p>
                        </div>
                    ))}
                </div>
                <div ref={gridRef} className="grid grid-cols-8 h-[600px] overflow-y-auto custom-scrollbar">
                    <div className="bg-gray-50 border-r border-gray-100">
                        {hours.map(h => (
                            <div key={h} style={{ height: `${hourHeight}px` }} className="border-b border-gray-100 text-xs text-gray-400 font-bold p-2 text-right">
                                {h === 24 ? '00' : h}:00
                            </div>
                        ))}
                    </div>
                    {weekDays.map((date, i) => {
                        const { dayVisits, dayActivities, dayGoogleEvents } = getEventsForDay(date);
                        return (
                            <div key={i} className={`border-r border-gray-100 relative ${date.toDateString() === new Date().toDateString() ? 'bg-[#AA895F]/5' : ''}`}>
                                {hours.map(h => (
                                    <div key={h} onClick={() => handleGridClick(date, h)} style={{ height: `${hourHeight}px` }} className="border-b border-gray-100 cursor-pointer hover:bg-[#AA895F]/10"></div>
                                ))}
                                <div className="absolute top-0 left-0 w-full h-full p-1 pointer-events-none">
                                    {dayGoogleEvents.map((e: any) => {
                                        const eventTime = new Date(e.start.dateTime || e.start.date);
                                        const hour = eventTime.getHours();
                                        if (hour < 8 || hour >= 24) return null;
                                        const top = (hour - 8) * hourHeight + (eventTime.getMinutes() / 60) * hourHeight;

                                        let height = hourHeight;
                                        if (e.end?.dateTime) {
                                            const endTime = new Date(e.end.dateTime);
                                            height = ((endTime.getTime() - eventTime.getTime()) / 60000 / 60) * hourHeight;
                                        }

                                        // Apply Resize overrides if active
                                        let displayHeight = height;
                                        let showLabel = false;
                                        let labelTime = '';

                                        if (resizePreview && resizePreview.eventId === e.id) {
                                            displayHeight = resizePreview.height;
                                            showLabel = true;
                                            labelTime = resizePreview.timeLabel;
                                        }

                                        // Get event date as YYYY-MM-DD
                                        const eventDate = date.toISOString().split('T')[0];

                                        // Check if this event is completed (by unique event ID)
                                        const isCompleted = isEventCompleted(e.id);

                                        return (
                                            <div key={e.id}
                                                onDoubleClick={(ev) => handleEditClick(ev, e)}
                                                onClick={(ev) => {
                                                    ev.stopPropagation();
                                                    toggleEventCompletion(e.id, e.summary || '', eventDate);
                                                }}
                                                className={`text-white text-[10px] p-1.5 rounded-lg shadow-sm pointer-events-auto cursor-pointer hover:shadow-md transition-all z-10 group overflow-hidden ${resizePreview?.eventId === e.id ? 'opacity-90 ring-2 ring-blue-400 z-50' : ''} ${isCompleted ? 'opacity-70 ring-2 ring-green-400' : 'ring-2 ring-white/30'}`}
                                                style={{
                                                    top: `${top}px`,
                                                    height: `${Math.max(displayHeight, 25)}px`,
                                                    position: 'absolute',
                                                    backgroundColor: isCompleted ? '#22c55e' : getGoogleColor(e.colorId),
                                                    ...e._style
                                                }}
                                                title={isCompleted ? 'Click para desmarcar' : 'Click para marcar completado'}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <p className={`font-bold truncate flex-1 ${isCompleted ? 'line-through' : ''}`}>
                                                        {e.summary}
                                                    </p>
                                                    {/* CHECKBOX VISUAL */}
                                                    <span className="ml-1 text-sm">
                                                        {isCompleted ? '✅' : '⬜'}
                                                    </span>
                                                    {showLabel && (
                                                        <span className="bg-black/50 px-1 rounded text-[9px] font-mono whitespace-nowrap ml-1">
                                                            {labelTime}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Resize Handle */}
                                                <div
                                                    onMouseDown={(ev) => handleResizeStart(ev, e)}
                                                    className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize hover:bg-white/30 transition-colors flex justify-center items-end pb-0.5"
                                                >
                                                    {/* Visual grip indicator */}
                                                    <div className="w-8 h-1 bg-white/40 rounded-full"></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
