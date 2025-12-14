import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus, ZoomIn, ZoomOut, Check, Loader2 } from 'lucide-react';
import { ActivityRecord, VisitRecord } from '../../types';
import { supabase } from '../../services/supabaseClient';
import CreateEventModal from './CreateEventModal';

interface CalendarDashboardProps {
    activities: ActivityRecord[];
    visits: VisitRecord[];
}

export default function CalendarDashboard({ activities, visits }: CalendarDashboardProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isSynced, setIsSynced] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [session, setSession] = useState<any>(null);
    const [googleEvents, setGoogleEvents] = useState<any[]>([]);
    const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

    // Zoom control state (height of one hour in pixels)
    // Default 80px (same as h-20)
    const [hourHeight, setHourHeight] = useState(80);
    const gridRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
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

    // Load saved token from DB on mount
    const loadSavedGoogleToken = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('user_integrations')
                .select('access_token, refresh_token')
                .eq('user_id', userId)
                .eq('provider', 'google_calendar')
                .single();

            if (data?.access_token) {
                console.log("Token de Google recuperado de la base de datos");
                setGoogleAccessToken(data.access_token);
                setIsSynced(true);
            }
        } catch (error) {
            console.error("Error loading saved google token:", error);
        }
    };

    React.useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.provider_token) {
                console.log("Token found in session, attempting to save...");
                setGoogleAccessToken(session.provider_token);
                setIsSynced(true);
                // Save it immediately if it's fresh
                if (session.user) {
                    saveGoogleToken(session.user.id, session.provider_token, session.provider_refresh_token);
                }
            } else if (session?.user) {
                // If no session token (reload), try to load from DB
                loadSavedGoogleToken(session.user.id);
            }
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.provider_token) {
                console.log("Auth change: Token found in session, attempting to save...");
                setGoogleAccessToken(session.provider_token);
                setIsSynced(true);
                if (session.user) {
                    saveGoogleToken(session.user.id, session.provider_token, session.provider_refresh_token);
                }
            } else if (session?.user) {
                loadSavedGoogleToken(session.user.id);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Helpers
    const getWeekDays = (date: Date) => {
        const start = new Date(date);
        start.setDate(start.getDate() - start.getDay() + 1); // Start Monday
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const weekDays = getWeekDays(currentDate);
    // Range from 8:00 to 00:00 (which is 24:00)
    // 17 hours total: 8, 9, 10, ... 23, 24
    const hours = Array.from({ length: 17 }, (_, i) => i + 8);

    // Navigation
    const nextWeek = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + 7);
        setCurrentDate(d);
    };

    const prevWeek = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - 7);
        setCurrentDate(d);
    };

    const isSameDay = (d1: Date, d2: string) => {
        const target = new Date(d2 + 'T12:00:00'); // Normalize
        return d1.getDate() === target.getDate() &&
            d1.getMonth() === target.getMonth() &&
            d1.getFullYear() === target.getFullYear();
    };

    // Database Persistence
    const saveGoogleToken = async (userId: string, accessToken: string, refreshToken?: string) => {
        try {
            const updates: any = {
                user_id: userId,
                provider: 'google_calendar',
                access_token: accessToken,
                updated_at: new Date().toISOString(),
            };
            if (refreshToken) {
                updates.refresh_token = refreshToken;
            }

            const { error } = await supabase
                .from('user_integrations')
                .upsert(updates, { onConflict: 'user_id, provider' });

            if (error) {
                console.error("Error Saving Token to DB:", error);
                alert(`Error guardando token en BD: ${error.message}`);
                throw error;
            }
            console.log("Tokens de Google guardados en DB");
        } catch (error: any) {
            console.error("Error saving tokens:", error);
            alert(`Error inesperado guardando tokens: ${error.message || error}`);
        }
    };

    // List Events
    const listGoogleEvents = async () => {
        if (!googleAccessToken) return;

        // Get start and end of current week view to optimize fetch
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 7);

        // Add padding to ensure we catch events
        const timeMin = startOfWeek.toISOString();
        const timeMax = endOfWeek.toISOString();

        try {
            const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${googleAccessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                // If 401, maybe token expired. For now just throw.
                if (response.status === 401) {
                    console.warn("Token de Google expirado o inválido.");
                    // TODO: Implement refresh flow if we had the secret or via backend
                    setIsSynced(false); // Valid token lost
                }
                throw new Error('Failed to fetch events');
            }

            const data = await response.json();
            setGoogleEvents(data.items || []);
        } catch (error) {
            console.error("Error fetching Google Events:", error);
        }
    };

    // Fetch events when synced or date changes
    React.useEffect(() => {
        if (isSynced && googleAccessToken) {
            listGoogleEvents();
        }
    }, [isSynced, currentDate, googleAccessToken]);

    // Filter Events
    const getEventsForDay = (day: Date) => {
        const dayVisits = visits.filter(v => isSameDay(day, v.date));
        const dayActivities = activities.filter(a => isSameDay(day, a.date));

        // Filter Google Events
        const dayGoogleEvents = googleEvents.filter((e: any) => {
            const eventDate = e.start.dateTime || e.start.date;

            // Check if it's the same day
            // Note: isSameDay handles string date input
            const target = new Date(eventDate);
            return day.getDate() === target.getDate() &&
                day.getMonth() === target.getMonth() &&
                day.getFullYear() === target.getFullYear();
        });

        return { dayVisits, dayActivities, dayGoogleEvents };
    };

    // Sync with Google Calendar
    const handleSyncGoogleCalendar = async () => {
        setIsSyncing(true);
        console.log("Iniciando proceso de sincronización con Google Calendar...");
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    queryParams: {
                        access_type: 'offline', // Important for refresh_token
                        prompt: 'consent',
                    },
                    scopes: 'https://www.googleapis.com/auth/calendar',
                    redirectTo: window.location.origin,
                },
            });

            if (error) {
                console.error("Error en signInWithOAuth:", error);
                throw error;
            }
            // Note: The actual redirect happens here, so code below might not run immediately until return
        } catch (error: any) {
            console.error('Error syncing with Google Calendar:', error);
            alert(`Error al intentar sincronizar con Google Calendar: ${error.message || 'Error desconocido'}. Revisa la consola para más detalles.`);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleCreateEvent = async (eventData: any) => {
        if (!googleAccessToken) {
            alert('Debes sincronizar con Google Calendar primero.');
            return;
        }

        const event = {
            'summary': eventData.summary,
            'location': eventData.location,
            'description': eventData.description,
            'start': {
                'dateTime': new Date(eventData.startDateTime).toISOString(),
                'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            'end': {
                'dateTime': new Date(eventData.endDateTime).toISOString(),
                'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
        };

        try {
            const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${googleAccessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(event),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(JSON.stringify(errorData));
            }

            const data = await response.json();
            console.log('Event created:', data);
            alert('Evento creado exitosamente en Google Calendar!');
            listGoogleEvents(); // Refresh list immediately
        } catch (error: any) {
            console.error('Error creating event:', error);
            alert('Error al crear el evento: ' + error.message);
        }
    };

    return (
        <div className="space-y-6 pb-20 animate-fade-in-up">
            <CreateEventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateEvent}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#364649] tracking-tight">Calendario</h1>
                    <p className="text-[#364649]/60 text-sm font-medium">Gestiona tu agenda y sincroniza</p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleSyncGoogleCalendar}
                        disabled={isSynced || isSyncing}
                        className={`px-4 py-2 rounded-xl font-bold shadow-sm transition-all flex items-center gap-2 ${isSynced
                            ? 'bg-green-100 text-green-700 border border-green-200 cursor-default'
                            : 'bg-white border border-[#364649]/10 text-[#364649] hover:bg-gray-50'
                            }`}
                    >
                        {isSyncing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : isSynced ? (
                            <Check className="w-5 h-5" />
                        ) : (
                            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google" className="w-5 h-5" />
                        )}
                        <span className="hidden md:inline">
                            {isSynced ? 'Sincronizado' : isSyncing ? 'Conectando...' : 'Sincronizar Google Calendar'}
                        </span>
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-[#AA895F] text-white px-4 py-2 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                    >
                        <Plus size={18} /> <span className="hidden md:inline">Evento</span>
                    </button>
                    <button
                        onClick={() => {
                            console.log("Session Debug:", session);
                            alert(JSON.stringify({
                                hasSession: !!session,
                                providerToken: session?.provider_token ? 'Present' : 'Missing',
                                refreshToken: session?.provider_refresh_token ? 'Present' : 'Missing',
                                user: session?.user?.email
                            }, null, 2));
                        }}
                        className="bg-gray-800 text-white px-3 py-2 rounded-xl font-bold text-xs"
                    >
                        Debug Info
                    </button>
                </div>
            </div>

            {/* Calendar Controls */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#364649]/10 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={prevWeek} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={20} /></button>
                    <h2 className="text-xl font-bold text-[#364649] capitalize">
                        {currentDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button onClick={nextWeek} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight size={20} /></button>
                </div>

                <div className="flex items-center gap-4">
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-100">
                        <button
                            onClick={() => setHourHeight(prev => Math.max(40, prev - 20))}
                            className="p-1.5 hover:bg-white rounded shadow-sm text-[#364649]/70"
                            title="Reducir altura (-)"
                        >
                            <ZoomOut size={16} />
                        </button>
                        <span className="text-xs font-bold text-[#364649]/50 w-12 text-center select-none">ZOOM</span>
                        <button
                            onClick={() => setHourHeight(prev => Math.min(200, prev + 20))}
                            className="p-1.5 hover:bg-white rounded shadow-sm text-[#364649]/70"
                            title="Aumentar altura (+)"
                        >
                            <ZoomIn size={16} />
                        </button>
                    </div>

                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className="text-sm font-bold text-[#AA895F] hover:underline"
                    >
                        Hoy
                    </button>
                </div>
            </div>

            {/* WEEK VIEW GRID */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-[#364649]/10">
                <div className="grid grid-cols-8 border-b border-gray-100">
                    <div className="p-4 bg-gray-50 border-r border-gray-100"></div>
                    {weekDays.map((date, i) => (
                        <div key={i} className={`p-4 text-center border-r border-gray-100 ${date.toDateString() === new Date().toDateString() ? 'bg-[#AA895F]/5' : ''}`}>
                            <p className="text-xs font-bold uppercase text-[#364649]/50">{date.toLocaleDateString('es-AR', { weekday: 'short' })}</p>
                            <p className={`text-xl font-bold mt-1 ${date.toDateString() === new Date().toDateString() ? 'text-[#AA895F]' : 'text-[#364649]'}`}>
                                {date.getDate()}
                            </p>
                        </div>
                    ))}
                </div>

                <div
                    ref={gridRef}
                    className="grid grid-cols-8 h-[600px] overflow-y-auto custom-scrollbar"
                >
                    {/* Time Column */}
                    <div className="bg-gray-50 border-r border-gray-100">
                        {hours.map(h => (
                            <div
                                key={h}
                                className="border-b border-gray-100 text-xs text-[#364649]/40 font-bold p-2 text-right box-border"
                                style={{ height: `${hourHeight}px` }}
                            >
                                {/* Display 24 as 00 for the last slot if desired, or just 24:00 if strictly following array */}
                                {h === 24 ? '00' : h}:00
                            </div>
                        ))}
                    </div>

                    {/* Days Columns */}
                    {weekDays.map((date, i) => {
                        const { dayVisits, dayActivities, dayGoogleEvents } = getEventsForDay(date);
                        return (
                            <div key={i} className={`border-r border-gray-100 relative ${date.toDateString() === new Date().toDateString() ? 'bg-[#AA895F]/5' : ''}`}>
                                {hours.map(h => (
                                    <div
                                        key={h}
                                        className="border-b border-gray-100 box-border"
                                        style={{ height: `${hourHeight}px` }}
                                    ></div>
                                ))}

                                {/* Events Overflow */}
                                <div className="absolute top-0 left-0 w-full h-full p-1 space-y-1 pointer-events-none">
                                    {dayVisits.map((v, idx) => (
                                        <div key={v.id} className="bg-[#364649] text-white text-[10px] p-2 rounded-lg shadow-md pointer-events-auto cursor-pointer hover:scale-105 transition-transform"
                                            style={{
                                                top: `${(parseInt(v.time.split(':')[0]) - 8) * hourHeight}px`,
                                                height: `${hourHeight}px`, // Default 1 hour
                                                position: 'absolute',
                                                width: '95%'
                                            }}
                                        >
                                            <p className="font-bold truncate">{v.time} - Visita</p>
                                            <p className="truncate opacity-70">{v.propertyId}</p>
                                        </div>
                                    ))}
                                    {dayGoogleEvents.map((e: any) => {
                                        const eventTime = new Date(e.start.dateTime || e.start.date);
                                        const hour = eventTime.getHours();

                                        // Calculate position
                                        // If full day, just put at top (0). If has time, calc offset.
                                        let top = 0;
                                        // Default duration 1 hour if not specified
                                        let height = hourHeight;

                                        if (e.start.dateTime) {
                                            if (hour < 8 || hour >= 24) return null; // Out of view

                                            // Calculate precise top position based on minutes
                                            top = (hour - 8) * hourHeight + (eventTime.getMinutes() / 60) * hourHeight;

                                            // Calculate height based on duration
                                            if (e.end?.dateTime) {
                                                const endTime = new Date(e.end.dateTime);
                                                const diffInMinutes = (endTime.getTime() - eventTime.getTime()) / 60000;
                                                // Convert minutes to height using current zoom
                                                height = (diffInMinutes / 60) * hourHeight;
                                            }
                                        }

                                        return (
                                            <div key={e.id} className="bg-blue-100 border border-blue-200 text-blue-800 text-[10px] p-1.5 rounded-lg shadow-sm pointer-events-auto cursor-pointer hover:scale-105 transition-transform z-10"
                                                style={{
                                                    top: `${top}px`,
                                                    height: `${Math.max(height, 20)}px`, // Min height for visibility
                                                    position: 'absolute',
                                                    width: '95%',
                                                    overflow: 'hidden'
                                                }}
                                                title={`${e.summary} (${e.start.dateTime ? new Date(e.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Todo el día'})`}
                                            >
                                                <p className="font-bold truncate opacity-100">{e.summary}</p>
                                                <p className="truncate opacity-70 text-[9px]">Google Calendar</p>
                                            </div>
                                        );
                                    })}
                                    {dayActivities.map((a, idx) => (
                                        <div key={a.id} className="bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] p-1.5 rounded-lg pointer-events-auto mb-1 relative opacity-90">
                                            <p className="font-bold truncate">{a.type}</p>
                                            <p className="truncate opacity-70">{a.contactName}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
