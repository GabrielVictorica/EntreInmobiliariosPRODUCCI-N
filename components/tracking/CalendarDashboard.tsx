import React, { useState, useEffect, useRef } from 'react';
import { useHabitStore } from '../../store/useHabitStore';
import { useBusinessStore } from '../../store/useBusinessStore';
import { supabase } from '../../services/supabaseClient';
import CreateEventModal from './CreateEventModal';
import CalendarHeader from './calendar-parts/CalendarHeader';
import CalendarGrid from './calendar-parts/CalendarGrid';
import AgendaView from './calendar-parts/AgendaView';

interface CalendarDashboardProps {
    session: any;
    isActive?: boolean;
    targetUserId?: string; // For habit sync
}

const CalendarDashboard = ({
    session: propSession, // Optional override
    isActive = true,      // Default to true if not provided (typical for route-based rendering)
    targetUserId: propTargetUserId // Optional override
}: CalendarDashboardProps) => {
    // Atomic Selectors
    const authSession = useBusinessStore(s => s.authSession);
    const storeTargetUserId = useBusinessStore(s => s.targetUserId);

    // Resolve effective values (Props > Store)
    const session = propSession || authSession;
    const targetUserId = propTargetUserId || storeTargetUserId || session?.user?.id;

    const activities = useBusinessStore(s => s.activities);
    const visits = useBusinessStore(s => s.visits);
    const closings = useBusinessStore(s => s.closings);
    const properties = useBusinessStore(s => s.properties);
    const searches = useBusinessStore(s => s.searches);
    const marketingLogs = useBusinessStore(s => s.marketingLogs);
    const googleEvents = useBusinessStore(s => s.googleEvents);
    const isSynced = useBusinessStore(s => s.isGoogleSynced);
    const googleAccessToken = useBusinessStore(s => s.googleAccessToken);
    const isCheckingSync = useBusinessStore(s => s.isCheckingGoogleSync);
    const isGlobalView = useBusinessStore(s => s.isGlobalView);
    const syncGoogleCalendarEvents = useBusinessStore(s => s.syncGoogleCalendarEvents);
    const initializeGoogleSync = useBusinessStore(s => s.initializeGoogleSync); // NEW: Selector
    const updateGoogleEvent = useBusinessStore(s => s.updateGoogleEvent);

    const createGoogleEvent = useBusinessStore(s => s.createGoogleEvent);
    const deleteGoogleEvent = useBusinessStore(s => s.deleteGoogleEvent);
    const cleanupGhostEventsFromCalendar = useHabitStore(s => s.cleanupGhostEventsFromCalendar); // NEW: Inverse Orphan Cleanup action

    const [currentDate, setCurrentDate] = useState(new Date());
    const [isSyncing, setIsSyncing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalInitialDate, setModalInitialDate] = useState<Date | null>(null);
    const [editingEvent, setEditingEvent] = useState<any | null>(null);
    const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<any | null>(null);

    // View State
    const [viewMode, setViewMode] = useState<'week' | 'day' | 'agenda'>('week');

    const getArgentinaNow = React.useCallback(() => {
        const str = new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" });
        return new Date(str);
    }, []);

    // Drag and Drop State
    const [isDragging, setIsDragging] = useState(false);
    const [draggedEvent, setDraggedEvent] = useState<any | null>(null);

    // Resize State
    const [isResizing, setIsResizing] = useState(false);
    const [resizePreview, setResizePreview] = useState<{ eventId: string, height: number, timeLabel: string } | null>(null);
    const resizeState = useRef<{ eventId: string, startY: number, originalEnd: Date, originalHeight: number } | null>(null);

    // Zoom control state
    const [hourHeight, setHourHeight] = useState(80);
    const gridRef = useRef<HTMLDivElement>(null);

    // Completion Global Store
    const habits = useHabitStore(s => s.habits);
    const rangeCompletions = useHabitStore(s => s.rangeCompletions);
    const genericCompletions = useHabitStore(s => s.genericCompletions);
    const storeToggleHabit = useHabitStore(s => s.toggleHabit);
    const storeToggleGeneric = useHabitStore(s => s.toggleGenericEvent);
    const fetchCompletionsByRange = useHabitStore(s => s.fetchCompletionsByRange);
    const fetchInitialData = useHabitStore(s => s.fetchInitialData);
    const notify = useHabitStore(s => s.notify);
    const matchEventToHabit = useHabitStore(s => s.matchEventToHabit);

    // ========== COMPLETION LOGIC (MEMOIZED) ==========
    const completedEventIds = React.useMemo(() => {
        if (!googleEvents.length) return new Set<string>();
        const newSet = new Set<string>();
        genericCompletions.forEach(c => newSet.add(c.eventId));

        const normalizedHabits = habits.map(h => ({
            id: h.id,
            normName: h.name.replace(/[^\w\sáéíóúñü]/gi, '').trim().toLowerCase()
        }));

        rangeCompletions.forEach(c => {
            const hInfo = habits.find(h => h.id === c.habitId);
            if (!hInfo) return;
            googleEvents.forEach(ev => {
                const evDate = ev.start?.dateTime ? new Date(ev.start.dateTime).toISOString().split('T')[0] : ev.start?.date;
                if (evDate !== c.targetDate) return;
                const matchedHabit = matchEventToHabit(ev.summary || '');
                if (matchedHabit?.id === hInfo.id) {
                    newSet.add(ev.id);
                }
            });
        });
        return newSet;
    }, [rangeCompletions, genericCompletions, googleEvents, habits, matchEventToHabit]);

    useEffect(() => {
        if (targetUserId && isActive) {
            if (habits.length === 0) fetchInitialData(targetUserId);
            const pivot = new Date(currentDate);
            const day = pivot.getDay();
            const mondayOffset = day === 0 ? -6 : 1 - day;
            const startRange = new Date(pivot);
            startRange.setDate(pivot.getDate() + mondayOffset - 7);
            const startStr = startRange.toISOString().split('T')[0];
            const endRange = new Date(startRange);
            endRange.setDate(startRange.getDate() + 21);
            const endStr = endRange.toISOString().split('T')[0];
            fetchCompletionsByRange(targetUserId, startStr, endStr);
        }
    }, [targetUserId, currentDate, habits.length, isActive, fetchInitialData, fetchCompletionsByRange]);

    const toggleEventCompletion = React.useCallback(async (eventId: string, eventTitle: string, eventDate: string) => {
        if (!eventId || !targetUserId) return;
        const matchedHabit = matchEventToHabit(eventTitle);
        if (matchedHabit) {
            await storeToggleHabit(matchedHabit.id, matchedHabit.name, eventDate);
        } else {
            await storeToggleGeneric(eventId, eventDate);
        }
    }, [targetUserId, storeToggleHabit, storeToggleGeneric, matchEventToHabit]);

    const isEventCompleted = React.useCallback((eventId: string): boolean => {
        return completedEventIds.has(eventId);
    }, [completedEventIds]);

    const getGoogleColor = React.useCallback((colorId: string) => {
        const colors: any = {
            '1': '#7986cb', '2': '#33b679', '3': '#8e24aa', '4': '#e67c73',
            '5': '#f6bf26', '6': '#f4511e', '7': '#039be5', '8': '#616161',
            '9': '#3f51b5', '10': '#0b8043', '11': '#d50000'
        };
        return colors[colorId] || '#039be5';
    }, []);

    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -10 : 10;
                setHourHeight(prev => Math.min(200, Math.max(40, prev + delta)));
            }
        };
        const gridElement = gridRef.current;
        if (gridElement) gridElement.addEventListener('wheel', handleWheel, { passive: false });
        return () => { if (gridElement) gridElement.removeEventListener('wheel', handleWheel); };
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing || !resizeState.current) return;
            const { eventId, startY, originalHeight, originalEnd } = resizeState.current;
            const deltaY = e.clientY - startY;
            const rawHeight = Math.max(25, originalHeight + deltaY);
            const blockHeight = hourHeight / 12;
            const snappedHeight = Math.round(rawHeight / blockHeight) * blockHeight;
            const deltaMinutes = (deltaY / hourHeight) * 60;
            const snappedDeltaMinutes = Math.round(deltaMinutes / 5) * 5;
            const newEndTime = new Date(originalEnd.getTime() + (snappedDeltaMinutes * 60000));
            const timeLabel = newEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setResizePreview({ eventId, height: Math.max(25, snappedHeight), timeLabel });
        };
        const handleMouseUp = async (e: MouseEvent) => {
            if (!isResizing || !resizeState.current) return;
            const { eventId, startY, originalEnd } = resizeState.current;
            const deltaY = e.clientY - startY;
            const deltaMinutes = Math.round((deltaY / hourHeight) * 60);
            const snappedMinutes = Math.round(deltaMinutes / 5) * 5;
            if (snappedMinutes !== 0) {
                const newEnd = new Date(originalEnd.getTime() + (snappedMinutes * 60000));
                await updateGoogleEvent(eventId, { end: { dateTime: newEnd.toISOString() } });
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
    }, [isResizing, hourHeight, updateGoogleEvent]);

    const handleDragStart = React.useCallback((e: React.DragEvent, event: any) => {
        if (event.isSystem) return;
        setDraggedEvent(event);
        setIsDragging(true);
        e.dataTransfer.setData('text/plain', event.id);
        e.dataTransfer.effectAllowed = 'move';
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
        e.dataTransfer.setDragImage(img, 0, 0);
    }, []);

    const handleDragOver = React.useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = React.useCallback(async (e: React.DragEvent, targetDate: Date, targetHour: number) => {
        e.preventDefault();
        setIsDragging(false);
        if (!draggedEvent) return;
        const { id, start, end } = draggedEvent;
        const originalStart = new Date(start.dateTime);
        const duration = new Date(end.dateTime).getTime() - originalStart.getTime();
        const newStart = new Date(targetDate);
        newStart.setHours(targetHour, originalStart.getMinutes(), 0, 0);
        const newEnd = new Date(newStart.getTime() + duration);
        try {
            await updateGoogleEvent(id, {
                start: { dateTime: newStart.toISOString() },
                end: { dateTime: newEnd.toISOString() }
            });
        } catch (error) {
            console.error("Error moving event:", error);
        } finally {
            setDraggedEvent(null);
        }
    }, [draggedEvent, updateGoogleEvent]);

    const handleDeleteEvent = async () => {
        if (!deleteConfirmEvent) return;
        try {
            await deleteGoogleEvent(deleteConfirmEvent.id);
            setDeleteConfirmEvent(null);
        } catch (error) {
            console.error("Error deleting event:", error);
        }
    };

    // Check if we are viewing another user's profile OR the Global aggregate view
    const isViewingOtherProfile = React.useMemo(() => {
        if (!targetUserId || !session?.user?.id) return false;
        // Privacy Guard: Hide personal calendar if viewing another user OR Global aggregate view
        return targetUserId !== session.user.id || isGlobalView;
    }, [targetUserId, session, isGlobalView]);

    // PROACTIVE RESTORATION: Ensure sync is updated when switching back to personal profile
    const lastSyncAttemptRef = React.useRef<number>(0);
    useEffect(() => {
        const now = Date.now();
        // Cooldown of 30 seconds between proactive sync attempts to prevent infinite loops on failure
        if (!isViewingOtherProfile && !isSynced && !isCheckingSync && session && (now - lastSyncAttemptRef.current > 30000)) {
            console.log("[CalendarDashboard] Proactive restoration: initializing Google Sync...");
            lastSyncAttemptRef.current = now;
            initializeGoogleSync(session);
        }
    }, [isViewingOtherProfile, isSynced, isCheckingSync, session, initializeGoogleSync]);

    useEffect(() => {
        // Prevent sync if looking at another user to avoid showing Mother's calendar on Child's view
        if (isViewingOtherProfile) return;

        // Sync if we have a token (initiate fetch to validate/refresh)
        if (googleAccessToken) {
            syncGoogleCalendarEvents(targetUserId || session?.user?.id || '', googleAccessToken, currentDate);

            // AUTOMATED CLEANUP: Remove ghost habits (INVERSE STRATEGY)
            // Pass the current events we see on screen so the store can filter them
            if (googleEvents.length > 0) {
                cleanupGhostEventsFromCalendar(googleEvents, googleAccessToken).catch(err => console.error("Auto-cleanup failed:", err));
            }
        }
        // CRITICAL PERFORMANCE: REMOVED 'isSynced' from dependencies to prevent recursive loops on 401 failure
    }, [googleAccessToken, currentDate, targetUserId, session?.user?.id, syncGoogleCalendarEvents, cleanupGhostEventsFromCalendar, googleEvents, isViewingOtherProfile]);




    const handleEventSubmit = async (eventData: any) => {
        if (isViewingOtherProfile) { notify('No puedes editar el calendario de otro usuario.', 'error'); return; }
        if (!googleAccessToken) { notify('Sincroniza primero tu calendario.', 'info'); return; }
        const isUpdate = !!eventData.id;
        const body: any = {
            'summary': eventData.summary,
            'location': eventData.location,
            'description': eventData.description,
            'start': { 'dateTime': new Date(eventData.startDateTime).toISOString() },
            'end': { 'dateTime': new Date(eventData.endDateTime).toISOString() },
            'colorId': eventData.colorId
        };
        try {
            if (isUpdate) {
                await updateGoogleEvent(eventData.id, body);
            } else {
                await createGoogleEvent(body, 'primary', currentDate);
            }
            setEditingEvent(null);
            notify(isUpdate ? 'Evento actualizado' : 'Evento creado', 'success');
        } catch (error: any) { notify('Error: ' + error.message, 'error'); }
    };

    const isSameDay = React.useCallback((d1: Date, d2: any) => {
        if (!d2) return false;
        try {
            let dateVal = d2.dateTime || d2.date || d2;
            const targetDate = new Date(dateVal);
            if (isNaN(targetDate.getTime())) return false;
            const options: Intl.DateTimeFormatOptions = {
                timeZone: 'America/Argentina/Buenos_Aires',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            };
            const formatter = new Intl.DateTimeFormat('en-CA', options);
            return formatter.format(d1) === formatter.format(targetDate);
        } catch (e) { return false; }
    }, []);

    const layoutEvents = React.useCallback((events: any[]) => {
        const sorted = [...events].sort((a, b) => {
            const timeA = new Date(a.start.dateTime || a.start.date).getTime();
            const timeB = new Date(b.start.dateTime || b.start.date).getTime();
            return timeA - timeB;
        });
        const clusters: any[][] = [];
        let currentCluster: any[] = [];
        let clusterEnd = 0;
        sorted.forEach(event => {
            const start = new Date(event.start.dateTime || event.start.date).getTime();
            const end = new Date(event.end.dateTime || event.end.date).getTime();
            if (currentCluster.length === 0) {
                currentCluster.push(event); clusterEnd = end;
            } else {
                if (start < clusterEnd) {
                    currentCluster.push(event); clusterEnd = Math.max(clusterEnd, end);
                } else {
                    clusters.push(currentCluster); currentCluster = [event]; clusterEnd = end;
                }
            }
        });
        if (currentCluster.length > 0) clusters.push(currentCluster);
        return clusters.flatMap(cluster => {
            const columns: any[][] = [];
            cluster.forEach(event => {
                const start = new Date(event.start.dateTime || event.start.date).getTime();
                let placed = false;
                for (let i = 0; i < columns.length; i++) {
                    const col = columns[i];
                    const lastEventInCol = col[col.length - 1];
                    const lastEnd = new Date(lastEventInCol.end.dateTime || lastEventInCol.end.date).getTime();
                    if (start >= lastEnd) {
                        col.push(event); event._col = i; placed = true; break;
                    }
                }
                if (!placed) { columns.push([event]); event._col = columns.length - 1; }
            });

            const maxCols = columns.length;
            return cluster.map(event => {
                const left = (event._col / maxCols) * 100;

                // Level 2 Overlap: We make it much wider (2.8x) so it's always readable.
                // Even with 4 columns, width will be ~70%, stacking behind neighbors.
                const boxWidth = 100 / maxCols;
                // Side-by-Side Layout: Strict columns with gap, no overlap to ensure back cards are visible.
                const width = maxCols > 1 ? boxWidth - 1 : 98;

                return {
                    ...event,
                    _style: {
                        left: `${left}%`,
                        width: `${width}%`,
                        zIndex: 10 + event._col,
                    }
                };
            });
        });
    }, []);

    const getEventsForDay = React.useCallback((day: Date) => {
        const dayVisits = (visits || []).filter(v => isSameDay(day, v.date));
        const dayActivities = (activities || []).filter(a => isSameDay(day, a.date));
        const dayClosings = (closings || []).filter(c => isSameDay(day, c.date));
        const dayProperties = (properties || []).filter(p => isSameDay(day, p.createdAt));
        const daySearches = (searches || []).filter(s => isSameDay(day, s.createdAt));
        const dayMarketing = (marketingLogs || []).filter(m => isSameDay(day, m.date));

        // Filter Google Events: Show ONLY if NOT viewing other profile
        // If viewing other profile, checking `isViewingOtherProfile` hook result reference here or passing it down might be cleaner?
        // But since this useCallback depends on [googleEvents], and useEffect blocks syncing googleEvents, 
        // effectively googleEvents global store might still have data from previous view if we don't clear it.
        // It's safer to filter here too or ensure store is cleared.
        // For now, let's assume useEffect handles the fetch blockage, but we also filter visually just in case.

        const rawGoogleEvents = isViewingOtherProfile ? [] : googleEvents.filter((e: any) => e.start && isSameDay(day, e.start));

        const mappedGoogleEvents = rawGoogleEvents.map((e: any) => {
            const isAllDay = !e.start.dateTime;
            let start = new Date(e.start.dateTime || e.start.date);
            let end = new Date(e.end.dateTime || e.end.date);
            if (isAllDay) {
                const dateStr = e.start.date || '';
                if (dateStr.includes('-')) {
                    const [y, m, d] = dateStr.split('-').map(Number);
                    start = new Date(y, m - 1, d, 8, 0, 0);
                    end = new Date(y, m - 1, d, 9, 0, 0);
                } else {
                    start = new Date(dateStr); start.setHours(8, 0, 0); end = new Date(start); end.setHours(9, 0, 0);
                }
            }
            return { ...e, start: { dateTime: start.toISOString() }, end: { dateTime: end.toISOString() }, isAllDay };
        });

        const dayGoogleEventsTimed: any[] = [];
        const dayGoogleEventsAllDay: any[] = [];
        const seenKeys = new Set();

        mappedGoogleEvents.forEach((e: any) => {
            const key = `${e.start.dateTime || e.start.date}-${e.summary}`;
            if (!seenKeys.has(key)) {
                seenKeys.add(key);
                if (e.isAllDay) dayGoogleEventsAllDay.push(e); else dayGoogleEventsTimed.push(e);
            }
        });

        const mappedVisits = dayVisits.map(v => {
            if (!v.date) return null;
            const cleanDate = typeof v.date === 'string' ? v.date.split(' ')[0].split('T')[0] : '';
            if (!cleanDate) return null;
            const startTimeStr = `${cleanDate}T${v.time || '10:00'}:00-03:00`;
            const startTime = new Date(startTimeStr);
            return {
                id: v.id,
                summary: `📍 VISITA: ${v.manualPropertyAddress || 'Propiedad'}`,
                start: { dateTime: startTime.toISOString() },
                end: { dateTime: new Date(startTime.getTime() + (parseInt(v.duration) || 60) * 60000).toISOString() },
                colorId: '10', isSystem: true, type: 'visit'
            };
        }).filter(Boolean);

        const mappedClosings = dayClosings.map((c, idx) => {
            const cleanDate = typeof c.date === 'string' ? c.date.split(' ')[0].split('T')[0] : '';
            if (!cleanDate) return null;
            const startHour = Math.min(10 + idx, 22);
            const startTimeStr = `${cleanDate}T${startHour.toString().padStart(2, '0')}:00:00-03:00`;
            const startTime = new Date(startTimeStr);
            return {
                id: c.id,
                summary: `💰 CIERRE: ${c.manualProperty || 'Cierre'} - ${c.currency} ${c.totalBilling.toLocaleString()}`,
                start: { dateTime: startTime.toISOString() },
                end: { dateTime: new Date(startTime.getTime() + 60 * 60000).toISOString() },
                colorId: '2', isSystem: true, type: 'closing'
            };
        }).filter(Boolean);

        const mappedCaptures = dayProperties.map((p, idx) => {
            const cleanDate = typeof p.createdAt === 'string' ? p.createdAt.split('T')[0].split(' ')[0] : '';
            if (!cleanDate) return null;
            const startHour = Math.min(14 + idx, 23);
            const startTimeStr = `${cleanDate}T${startHour.toString().padStart(2, '0')}:00:00-03:00`;
            const startTime = new Date(startTimeStr);
            return {
                id: `cap-${p.id}`,
                summary: `🏠 CAPTACIÓN: ${p.address.street} ${p.address.number}`,
                start: { dateTime: startTime.toISOString() },
                end: { dateTime: new Date(startTime.getTime() + 30 * 60000).toISOString() },
                colorId: '6', isSystem: true, type: 'capture'
            };
        }).filter(Boolean);

        const mappedSearches = daySearches.map((s, idx) => {
            const cleanDate = typeof s.createdAt === 'string' ? s.createdAt.split('T')[0].split(' ')[0] : '';
            if (!cleanDate) return null;
            const startHour = Math.min(16 + idx, 23);
            const startTimeStr = `${cleanDate}T${startHour.toString().padStart(2, '0')}:00:00-03:00`;
            const startTime = new Date(startTimeStr);
            return {
                id: `search-${s.id}`,
                summary: `🔍 BÚSQUEDA: ${s.agentName}`,
                start: { dateTime: startTime.toISOString() },
                end: { dateTime: new Date(startTime.getTime() + 30 * 60000).toISOString() },
                colorId: '9', isSystem: true, type: 'search'
            };
        }).filter(Boolean);

        const mappedMarketing = dayMarketing.map((m, idx) => {
            const cleanDate = typeof m.date === 'string' ? m.date.split('T')[0].split(' ')[0] : '';
            if (!cleanDate) return null;
            const startHour = Math.min(18 + idx, 23);
            const startTimeStr = `${cleanDate}T${startHour.toString().padStart(2, '0')}:00:00-03:00`;
            const startTime = new Date(startTimeStr);
            return {
                id: `mkt-${m.id}`,
                summary: `📢 MKT: Actualización Portales`,
                start: { dateTime: startTime.toISOString() },
                end: { dateTime: new Date(startTime.getTime() + 30 * 60000).toISOString() },
                colorId: '4', isSystem: true, type: 'marketing'
            };
        }).filter(Boolean);

        const closingIds = new Set(dayClosings.map(c => c.id));
        const mappedActivities = dayActivities.filter(a => !a.referenceId || !closingIds.has(a.referenceId)).map((a, idx) => {
            const cleanDate = typeof a.date === 'string' ? a.date.split(' ')[0].split('T')[0] : '';
            if (!cleanDate) return null;
            let startHour = 9; let startMin = 0;
            if (a.time && a.time.includes(':')) {
                const [h, m] = a.time.split(':').map(Number);
                if (!isNaN(h)) startHour = h; if (!isNaN(m)) startMin = m;
            } else { startHour = Math.min(9 + idx, 23); }
            const startTimeStr = `${cleanDate}T${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}:00-03:00`;
            const startTime = new Date(startTimeStr);
            return {
                id: a.id,
                summary: `${a.type.toUpperCase()}: ${a.contactName}`,
                start: { dateTime: startTime.toISOString() },
                end: { dateTime: new Date(startTime.getTime() + 45 * 60000).toISOString() },
                colorId: (a.type as string) === 'act_verde' || (a.type as string) === 'reunion_verde' ? '10' :
                    (a.type as string) === 'act_roja' ? '11' :
                        (a.type as string) === 'pre_listing' ? '10' : // Updated to Green (Basil)
                            (a.type as string) === 'pre_buying' ? '6' : '7',
                isSystem: true, type: 'activity', isAuto: a.systemGenerated
            };
        }).filter(Boolean);

        const dayGoogleEvents = layoutEvents([
            ...dayGoogleEventsTimed, ...mappedVisits, ...mappedClosings, ...mappedCaptures, ...mappedSearches, ...mappedMarketing, ...mappedActivities
        ]);

        return { dayGoogleEvents, dayGoogleEventsAllDay };
    }, [visits, activities, closings, properties, searches, marketingLogs, googleEvents, isSameDay, layoutEvents, isViewingOtherProfile]); // Added isViewingOtherProfile dependency



    const handleSyncGoogleCalendar = React.useCallback(async () => {
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
        } catch (error: any) { notify(`Error: ${error.message}`, 'error'); } finally { setIsSyncing(false); }
    }, [notify]);

    const handleGridClick = React.useCallback((date: Date, hour: number) => {
        const d = new Date(date); d.setHours(hour, 0, 0, 0);
        setModalInitialDate(d); setEditingEvent(null); setIsModalOpen(true);
    }, []);

    const handleEditClick = React.useCallback((e: React.MouseEvent, event: any) => {
        e.stopPropagation(); setEditingEvent(event); setModalInitialDate(null); setIsModalOpen(true);
    }, []);

    const handleResizeStart = React.useCallback((e: React.MouseEvent, event: any) => {
        e.stopPropagation(); e.preventDefault(); setIsResizing(true); document.body.style.cursor = 'ns-resize';
        const start = new Date(event.start.dateTime || event.start.date);
        const end = new Date(event.end.dateTime || event.end.date);
        const durationMin = (end.getTime() - start.getTime()) / 60000;
        const oH = (durationMin / 60) * hourHeight;
        resizeState.current = { eventId: event.id, startY: e.clientY, originalEnd: end, originalHeight: oH };
    }, [hourHeight]);

    const getWeekDays = React.useCallback((date: Date) => {
        const start = new Date(date); const day = start.getDay();
        const mondayOffset = day === 0 ? -6 : 1 - day;
        start.setDate(start.getDate() + mondayOffset);
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start); d.setDate(start.getDate() + i); d.setHours(0, 0, 0, 0);
            days.push(d);
        }
        return days;
    }, []);

    const weekDays = React.useMemo(() => getWeekDays(currentDate), [currentDate, getWeekDays]);

    // PERFORMANCE: Pre-calculate events for all visible days to avoid recalculation on every render
    const eventsByDay = React.useMemo(() => {
        const map = new Map<string, ReturnType<typeof getEventsForDay>>();
        weekDays.forEach(day => {
            const key = day.toISOString().split('T')[0];
            map.set(key, getEventsForDay(day));
        });
        return map;
    }, [weekDays, getEventsForDay]);

    // PERFORMANCE: Stable callbacks for CalendarHeader
    const handlePrevWeek = React.useCallback(() => {
        setCurrentDate(d => { const nd = new Date(d); nd.setDate(nd.getDate() - 7); return nd; });
    }, []);

    const handleNextWeek = React.useCallback(() => {
        setCurrentDate(d => { const nd = new Date(d); nd.setDate(nd.getDate() + 7); return nd; });
    }, []);

    const handleToday = React.useCallback(() => setCurrentDate(new Date()), []);

    const handleNewEvent = React.useCallback(() => {
        setModalInitialDate(null); setIsModalOpen(true);
    }, []);

    if (isViewingOtherProfile) {
        return (
            <div className="flex flex-col items-center justify-center h-[600px] text-center p-8 bg-white/50 rounded-3xl border-2 border-dashed border-gray-200">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-3xl">🔒</div>
                <h3 className="text-xl font-bold text-[#364649] mb-2">
                    {isGlobalView ? 'Calendario en Vista Global' : 'Calendario Privado'}
                </h3>
                <p className="text-gray-500 max-w-md">
                    {isGlobalView
                        ? 'Estás en la vista global del equipo. Por privacidad y orden, tu calendario personal solo es visible en tu perfil individual.'
                        : 'Estás viendo el perfil de otro usuario. Por motivos de privacidad y seguridad, no puedes ver ni editar su Google Calendar, solo sus actividades registradas en el sistema.'}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">

            <CalendarHeader
                currentDate={currentDate}
                onPrevWeek={handlePrevWeek}
                onNextWeek={handleNextWeek}
                onToday={handleToday}
                viewMode={viewMode}
                setViewMode={setViewMode}
                isSynced={isSynced}
                isCheckingSync={isCheckingSync}
                isSyncing={isSyncing}
                onSync={handleSyncGoogleCalendar}
                onNewEvent={handleNewEvent}
                hourHeight={hourHeight}
                setHourHeight={setHourHeight}
            />

            {/* Sync Lost / Error State for personal view - Rendered BELOW header */}
            {(!isSynced && !isCheckingSync) ? (
                <div className="flex flex-col items-center justify-center h-[500px] text-center p-8 bg-white/50 rounded-3xl border-2 border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6 text-3xl">⚠️</div>
                    <h3 className="text-xl font-bold text-[#364649] mb-2">Conexión con Google Perdida</h3>
                    <p className="text-gray-500 max-w-md mb-8">
                        Tu sesión de Google ha expirado o no se pudo renovar automáticamente.
                        Necesitas volver a vincular tu cuenta para ver o editar tus eventos.
                    </p>
                    <button
                        onClick={handleSyncGoogleCalendar}
                        disabled={isCheckingSync}
                        className="px-8 py-3 bg-[#364649] text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all flex items-center gap-2"
                    >
                        {isCheckingSync ? 'Conectando...' : 'Revincular Google Calendar'}
                    </button>
                </div>
            ) : (

                viewMode !== 'agenda' ? (
                    <CalendarGrid
                        viewMode={viewMode}
                        weekDays={weekDays}
                        currentDate={currentDate}
                        hours={Array.from({ length: 19 }, (_, i) => i + 6)}
                        hourHeight={hourHeight}
                        eventsByDay={eventsByDay}
                        toggleEventCompletion={toggleEventCompletion}
                        isEventCompleted={isEventCompleted}
                        handleGridClick={handleGridClick}
                        handleDrop={handleDrop}
                        handleDragOver={handleDragOver}
                        handleDragStart={handleDragStart}
                        handleEditClick={handleEditClick}
                        handleResizeStart={handleResizeStart}
                        getGoogleColor={getGoogleColor}
                        isDragging={isDragging}
                        resizePreview={resizePreview}
                        setDeleteConfirmEvent={setDeleteConfirmEvent}
                        getArgentinaNow={getArgentinaNow}
                        isSameDay={isSameDay}
                        gridRef={gridRef}
                    />
                ) : (
                    <AgendaView
                        googleEvents={googleEvents}
                        isEventCompleted={isEventCompleted}
                        toggleEventCompletion={toggleEventCompletion}
                        getGoogleColor={getGoogleColor}
                    />
                ))}

            <CreateEventModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingEvent(null); }}
                onSubmit={handleEventSubmit}
                initialDate={modalInitialDate}
                eventToEdit={editingEvent}
            />

            {deleteConfirmEvent && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6 font-bold text-3xl">!</div>
                        <h3 className="text-2xl font-black text-[#364649] mb-2">¿Eliminar evento?</h3>
                        <p className="text-gray-500 text-sm mb-8 leading-relaxed">Esta acción eliminará permanentemente de tu calendario.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setDeleteConfirmEvent(null)} className="flex-1 py-4 px-6 rounded-2xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200">Cancelar</button>
                            <button onClick={handleDeleteEvent} className="flex-1 py-4 px-6 rounded-2xl font-bold text-white bg-red-500 hover:bg-red-600">Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(CalendarDashboard);
