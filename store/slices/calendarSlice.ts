import { StateCreator } from 'zustand';
import { supabase } from '../../services/supabaseClient';
import { BusinessState } from './types';

export interface CalendarSlice {
    googleEvents: any[];
    isGoogleSynced: boolean;
    googleAccessToken: string | null;
    isCheckingGoogleSync: boolean;
    checkGoogleSyncStatus: (userId: string, userToken?: string) => Promise<void>;
    setGoogleAccessToken: (token: string | null) => void;
    syncGoogleCalendarEvents: (userId: string, accessToken: string, date?: Date, calendarId?: string) => Promise<void>;
    refreshGoogleToken: (userId?: string) => Promise<string | null>;
    updateGoogleEvent: (eventId: string, body: any, calendarId?: string) => Promise<void>;
    createGoogleEvent: (body: any, calendarId?: string, date?: Date) => Promise<void>;
    deleteGoogleEvent: (eventId: string, calendarId?: string) => Promise<void>;
    upsertGoogleEventToCache: (event: any) => void;
    clearGoogleCache: () => void;
    persistGoogleConnection: (session: any) => Promise<void>;
    initializeGoogleSync: (session: any) => Promise<void>;
}

export const createCalendarSlice: StateCreator<BusinessState, [], [], CalendarSlice> = (set, get) => ({
    googleEvents: [],
    isGoogleSynced: false,
    googleAccessToken: null,
    isCheckingGoogleSync: false,

    setGoogleAccessToken: (token: string | null) => set({ googleAccessToken: token }),

    checkGoogleSyncStatus: async (userId, userToken) => {
        try {
            // Check legacy settings + modern integrations
            const { data: legacyData } = await supabase
                .from('user_settings')
                .select('google_sync_enabled, google_refresh_token')
                .eq('user_id', userId)
                .maybeSingle();

            const { data: integrationData } = await supabase
                .from('user_integrations')
                .select('access_token')
                .eq('user_id', userId)
                .eq('provider', 'google_calendar')
                .maybeSingle();

            if ((legacyData?.google_sync_enabled && legacyData?.google_refresh_token) || integrationData?.access_token) {
                const { googleAccessToken } = get();
                if (!googleAccessToken) {
                    // Try to hydrate from integration first, then refresh if needed
                    if (integrationData?.access_token) {
                        set({ googleAccessToken: integrationData.access_token, isGoogleSynced: true });
                    } else {
                        await get().refreshGoogleToken();
                    }
                } else {
                    set({ isGoogleSynced: true });
                }
            } else {
                set({ isGoogleSynced: false });
            }
        } catch (error) {
            console.error('Error checking Google sync status:', error);
            set({ isGoogleSynced: false });
        }
    },

    syncGoogleCalendarEvents: async (userId, accessToken, date = new Date(), calendarId = 'primary') => {
        const isInitial = !get().isGoogleSynced;
        if (isInitial) set({ isCheckingGoogleSync: true });
        try {
            const pivot = new Date(date);
            const day = pivot.getDay();
            const mondayOffset = day === 0 ? -6 : 1 - day;

            const startRange = new Date(pivot);
            startRange.setDate(pivot.getDate() + mondayOffset - 7);
            startRange.setHours(0, 0, 0, 0);

            const endRange = new Date(startRange);
            endRange.setDate(startRange.getDate() + 21);

            const toRFC3339 = (d: Date) => {
                const pad = (n: number) => n < 10 ? '0' + n : n;
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00:00-03:00`;
            };
            const timeMin = toRFC3339(startRange);
            const timeMax = toRFC3339(endRange);

            const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (response.status === 401) {
                console.log("[CalendarSlice] 401 Unauthorized detected. Attempting token refresh...");
                const newToken = await get().refreshGoogleToken(userId);
                if (newToken) {
                    console.log("[CalendarSlice] Refresh successful. Retrying sync...");
                    return get().syncGoogleCalendarEvents(userId, newToken, date, calendarId);
                }

                console.warn("[CalendarSlice] Refresh failed. Clearing token and disabling sync.");
                set({ isGoogleSynced: false, googleAccessToken: null });
                return;
            }

            if (!response.ok) throw new Error('Failed to fetch events');

            const data = await response.json();
            const newEvents = data.items || [];

            set((state) => {
                const existing = state.googleEvents;
                const existingMap = new Map(existing.map(ev => [ev.id, ev]));
                newEvents.forEach(ev => existingMap.set(ev.id, ev));

                return {
                    googleEvents: Array.from(existingMap.values()),
                    isGoogleSynced: true
                };
            });
        } catch (error) {
            console.error("Error fetching Google events:", error);
        } finally {
            if (isInitial) set({ isCheckingGoogleSync: false });
        }
    },

    initializeGoogleSync: async (session) => {
        if (!session?.user?.id) return;
        const { googleAccessToken, setGoogleAccessToken, syncGoogleCalendarEvents, targetUserId } = get();

        // 0. FLAG AS CHECKING: Prevents UI loops in components
        set({ isCheckingGoogleSync: true });

        // 1. PRIORITY: If the session passed to us HAS a provider_token (fresh from OAuth redirect), 
        // use it IMMEDIATELY and skip database checks. This solves race conditions.
        if (session.provider_token) {
            console.log("[CalendarSlice] Using fresh provider_token from session.");
            set({ googleAccessToken: session.provider_token, isGoogleSynced: true, isCheckingGoogleSync: false });
            await syncGoogleCalendarEvents(targetUserId || session.user.id, session.provider_token);
            return;
        }

        // 2. SECONDARY: If we already have a token in the store state, just sync.
        if (googleAccessToken) {
            await syncGoogleCalendarEvents(targetUserId || session.user.id, googleAccessToken);
            set({ isCheckingGoogleSync: false });
            return;
        }

        // 3. FALLBACK: Check database for existing tokens
        try {
            // Check only Modern table (user_integrations) to avoid legacy column 400 errors
            const { data: integrationData, error: dbError } = await supabase
                .from('user_integrations')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('provider', 'google_calendar')
                .maybeSingle();

            if (dbError) throw dbError;

            if (integrationData?.access_token) {
                setGoogleAccessToken(integrationData.access_token);
                set({ isGoogleSynced: true });
                await syncGoogleCalendarEvents(targetUserId || session.user.id, integrationData.access_token);
            } else {
                set({ isGoogleSynced: false });
            }

        } catch (e) {
            console.error("[CalendarSlice] Failed to init Google Sync:", e);
        } finally {
            set({ isCheckingGoogleSync: false });
        }
    },

    persistGoogleConnection: async (session) => {
        if (!session?.provider_token || !session?.user?.id) return;
        const { provider_token, provider_refresh_token, expires_at } = session;
        console.log("[CalendarSlice] Google token detected, persisting...");

        // 1. IMMEDIATE STATE UPDATE
        set({
            googleAccessToken: provider_token,
            isGoogleSynced: true
        });

        // 2. IMMEDIATE SYNC
        get().syncGoogleCalendarEvents(get().targetUserId || session.user.id, provider_token);

        // 3. NULL-SAFE DB PERSISTENCE
        try {
            const updateObject: any = {
                user_id: session.user.id,
                provider: 'google_calendar',
                access_token: provider_token,
                expires_at: expires_at || null,
                updated_at: new Date().toISOString()
            };

            // CRITICAL: Only include refresh_token if Google actually sent a new one.
            // If we overwrite a valid refresh_token with null, we break the link!
            if (provider_refresh_token) {
                updateObject.refresh_token = provider_refresh_token;
            }

            const { error } = await supabase
                .from('user_integrations')
                .upsert(updateObject, { onConflict: 'user_id,provider' });

            if (error) throw error;
            console.log("[CalendarSlice] Google tokens persisted successfully.");
        } catch (e) {
            console.error("[CalendarSlice] Failed to persist tokens:", e);
        }
    },

    refreshGoogleToken: async (userId?: string) => {
        try {
            // Speculative fix for the 400 error: ensure userId is sent if available
            const { data, error } = await supabase.functions.invoke('refresh-google-token', {
                body: { user_id: userId }
            });

            if (error) throw error;
            if (data?.access_token) {
                set({ googleAccessToken: data.access_token, isGoogleSynced: true });
                return data.access_token;
            }
        } catch (error) {
            console.error('Error refreshing Google token:', error);
            // CRITICAL: Clear token from store so background effects stop
            set({ isGoogleSynced: false, googleAccessToken: null });

            // CRITICAL: Clear the dead token from DB to prevent recurrence on refresh
            if (userId) {
                console.log("[CalendarSlice] Clearing invalid integration from DB...");
                await supabase
                    .from('user_integrations')
                    .delete()
                    .eq('user_id', userId)
                    .eq('provider', 'google_calendar');
            }
            return null;
        }
        set({ isGoogleSynced: false, googleAccessToken: null });
        return null;
    },

    updateGoogleEvent: async (eventId, body, calendarId = 'primary') => {
        const { googleAccessToken, googleEvents } = get();
        if (!googleAccessToken) return;

        const originalEvents = [...googleEvents];
        const updatedEvents = googleEvents.map(e => e.id === eventId ? { ...e, ...body } : e);
        set({ googleEvents: updatedEvents });

        try {
            const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${googleAccessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (response.status === 401) {
                console.warn("[CalendarSlice] 401 Unauthorized in updateGoogleEvent. Session expired.");
                set({ isGoogleSynced: false, googleAccessToken: null });
                return;
            }
            if (!response.ok) throw new Error('Failed to patch event');
        } catch (error) {
            console.error("Error patching google event:", error);
            set({ googleEvents: originalEvents });
        }
    },

    createGoogleEvent: async (body, calendarId = 'primary', date = new Date()) => {
        const { googleAccessToken } = get();
        if (!googleAccessToken) return;

        try {
            const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${googleAccessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (response.status === 401) {
                console.warn("[CalendarSlice] 401 Unauthorized in createGoogleEvent. Session expired.");
                set({ isGoogleSynced: false, googleAccessToken: null });
                return;
            }
            if (!response.ok) throw new Error('Failed to create event');
            await get().syncGoogleCalendarEvents(get().targetUserId || '', googleAccessToken, date, calendarId);
        } catch (error) {
            console.error("Error creating google event:", error);
            throw error;
        }
    },

    deleteGoogleEvent: async (eventId, calendarId = 'primary') => {
        const { googleAccessToken } = get();
        if (!googleAccessToken) return;

        try {
            const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${googleAccessToken}` }
            });
            if (response.status === 401) {
                console.warn("[CalendarSlice] 401 Unauthorized in deleteGoogleEvent. Session expired.");
                set({ isGoogleSynced: false, googleAccessToken: null });
                return;
            }
            if (!response.ok) throw new Error('Failed to delete event');
            set((state) => ({
                // If it's a recurring event, its instances will have IDs like MasterID_Timestamp
                // We filter anything that starts with the eventId to clear the cache immediately.
                googleEvents: state.googleEvents.filter(ev => !ev.id.startsWith(eventId))
            }));
        } catch (error) {
            console.error("Error deleting google event:", error);
            throw error;
        }
    },

    upsertGoogleEventToCache: (event) => {
        if (!event?.id) return;
        set((state) => {
            const existingMap = new Map(state.googleEvents.map(ev => [ev.id, ev]));
            existingMap.set(event.id, event);
            return { googleEvents: Array.from(existingMap.values()) };
        });
    },

    clearGoogleCache: () => set({ googleEvents: [] }),
});
