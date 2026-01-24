// Servicio para crear eventos recurrentes de Google Calendar al crear hábitos

interface HabitData {
    id?: string;
    name: string;
    icon: string;
    estimatedDuration: number;
    scheduleType: 'flexible' | 'fixed';
    preferredBlock: 'morning' | 'afternoon' | 'evening' | 'anytime';
    fixedTime?: string;
    frequency: string[]; // ['mon', 'tue', 'wed', etc.]
}

// Horarios por defecto para cada bloque
const BLOCK_DEFAULT_HOURS: Record<string, number> = {
    morning: 8,
    afternoon: 14,
    evening: 20,
    anytime: 9
};

// Color naranja para hábitos (Mandarina en Google Calendar)
const HABIT_COLOR_ID = '6';

// Mapeo de días a formato RRULE de Google Calendar
const DAY_TO_RRULE: Record<string, string> = {
    mon: 'MO',
    tue: 'TU',
    wed: 'WE',
    thu: 'TH',
    fri: 'FR',
    sat: 'SA',
    sun: 'SU'
};

/**
 * Crea un evento RECURRENTE en Google Calendar cuando se crea un hábito.
 * El evento aparecerá en los días de la semana configurados.
 */
export async function createRecurringHabitEvent(
    habit: HabitData,
    accessToken: string
): Promise<{ success: boolean; event?: any; error?: string }> {
    if (!accessToken) {
        return { success: false, error: 'No access token' };
    }

    try {
        const summary = `${habit.icon} ${habit.name}`;
        const durationMinutes = habit.estimatedDuration || 30;

        // Construir regla de recurrencia (RRULE)
        const rruleDays = habit.frequency
            .map(d => DAY_TO_RRULE[d])
            .filter(Boolean)
            .join(',');

        // Si no hay días, no crear evento
        if (!rruleDays) {
            return { success: false, error: 'No frequency days specified' };
        }

        const recurrence = [`RRULE:FREQ=WEEKLY;BYDAY=${rruleDays}`];

        // Fecha de inicio: próximo día que coincida con la frecuencia
        const today = new Date();
        const startDate = getNextValidDate(today, habit.frequency);

        let eventBody: any;

        // Propiedades extendidas para Linking Robust
        const extendedProperties = habit.id ? {
            shared: {
                habitId: habit.id,
                source: 'app-habit-tracker'
            }
        } : undefined;

        // Caso Flexible/Anytime → Evento all-day recurrente
        if (habit.scheduleType === 'flexible' && habit.preferredBlock === 'anytime') {
            const dateStr = startDate.toISOString().split('T')[0];
            const nextDay = new Date(startDate);
            nextDay.setDate(nextDay.getDate() + 1);
            const nextDayStr = nextDay.toISOString().split('T')[0];

            eventBody = {
                summary,
                start: { date: dateStr },
                end: { date: nextDayStr },
                colorId: HABIT_COLOR_ID,
                description: `📋 Hábito programado\n⏱️ Duración estimada: ${durationMinutes} min`,
                transparency: 'transparent',
                recurrence,
                extendedProperties
            };
        } else {
            // Hora fija o Bloque con hora por defecto
            let startHour: number;
            let startMinute = 0;

            if (habit.scheduleType === 'fixed' && habit.fixedTime) {
                const [h, m] = habit.fixedTime.split(':').map(Number);
                startHour = h;
                startMinute = m;
            } else {
                startHour = BLOCK_DEFAULT_HOURS[habit.preferredBlock] || 9;
            }

            startDate.setHours(startHour, startMinute, 0, 0);
            const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

            // Google uses ISO strings. To avoid issues with "Z" (UTC) vs local, 
            // we'll send the local-time part + timeZone name.
            const toLocalISO = (d: Date) => {
                const pad = (n: number) => n < 10 ? '0' + n : n;
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
            };

            eventBody = {
                summary,
                start: {
                    dateTime: toLocalISO(startDate),
                    timeZone: 'America/Argentina/Buenos_Aires'
                },
                end: {
                    dateTime: toLocalISO(endDate),
                    timeZone: 'America/Argentina/Buenos_Aires'
                },
                colorId: HABIT_COLOR_ID,
                description: `📋 Hábito programado\n⏱️ Duración: ${durationMinutes} min`,
                recurrence,
                extendedProperties
            };
        }

        const response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventBody)
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Google Calendar API error:', errorData);
            return { success: false, error: errorData.error?.message || 'API Error' };
        }

        const event = await response.json();
        console.log('Recurring habit event created:', event.id);
        return { success: true, event };

    } catch (error: any) {
        console.error('Error creating recurring habit event:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Obtiene la próxima fecha válida según la frecuencia del hábito
 */
function getNextValidDate(fromDate: Date, frequency: string[]): Date {
    const dayMap: Record<number, string> = {
        0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat'
    };

    const date = new Date(fromDate);
    for (let i = 0; i < 7; i++) {
        const dayKey = dayMap[date.getDay()];
        if (frequency.includes(dayKey)) {
            return date;
        }
        date.setDate(date.getDate() + 1);
    }
    return fromDate; // Fallback
}

/**
 * Actualiza un evento recurrente existente en Google Calendar
 */
export async function updateHabitCalendarEvent(
    eventId: string,
    habit: HabitData,
    accessToken: string
): Promise<{ success: boolean; event?: any; error?: string }> {
    if (!accessToken || !eventId) {
        return { success: false, error: 'Missing token or eventId' };
    }

    try {
        const summary = `${habit.icon} ${habit.name}`;
        const durationMinutes = habit.estimatedDuration || 30;

        // Construir regla de recurrencia
        const rruleDays = habit.frequency
            .map(d => DAY_TO_RRULE[d])
            .filter(Boolean)
            .join(',');

        if (!rruleDays) {
            return { success: false, error: 'No frequency days specified' };
        }

        const recurrence = [`RRULE:FREQ=WEEKLY;BYDAY=${rruleDays}`];

        // Hora de inicio
        let startHour = BLOCK_DEFAULT_HOURS[habit.preferredBlock] || 9;
        let startMinute = 0;

        if (habit.scheduleType === 'fixed' && habit.fixedTime) {
            const [h, m] = habit.fixedTime.split(':').map(Number);
            startHour = h;
            startMinute = m;
        }

        const startDate = getNextValidDate(new Date(), habit.frequency);
        startDate.setHours(startHour, startMinute, 0, 0);
        const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

        const isAllDay = habit.scheduleType === 'flexible' && habit.preferredBlock === 'anytime';
        const dateStr = startDate.toISOString().split('T')[0];

        // Propiedades extendidas
        const extendedProperties = habit.id ? {
            shared: {
                habitId: habit.id,
                source: 'app-habit-tracker'
            }
        } : undefined;

        const toLocalISO = (d: Date) => {
            const pad = (n: number) => n < 10 ? '0' + n : n;
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        };

        const eventBody = isAllDay ? (() => {
            const nextDay = new Date(startDate);
            nextDay.setDate(nextDay.getDate() + 1);
            return {
                summary,
                start: { date: dateStr },
                end: { date: nextDay.toISOString().split('T')[0] },
                colorId: HABIT_COLOR_ID,
                description: `📋 Hábito programado\n⏱️ Duración estimada: ${durationMinutes} min`,
                transparency: 'transparent',
                recurrence,
                extendedProperties
            };
        })() : {
            summary,
            start: { dateTime: toLocalISO(startDate), timeZone: 'America/Argentina/Buenos_Aires' },
            end: { dateTime: toLocalISO(endDate), timeZone: 'America/Argentina/Buenos_Aires' },
            colorId: HABIT_COLOR_ID,
            description: `📋 Hábito programado\n⏱️ Duración: ${durationMinutes} min`,
            recurrence,
            extendedProperties
        };

        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventBody)
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Google Calendar update error:', errorData);
            return { success: false, error: errorData.error?.message || 'API Error' };
        }

        const event = await response.json();
        console.log('Habit calendar event updated:', event.id);
        return { success: true, event };
    } catch (error: any) {
        console.error('Error updating habit calendar event:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Elimina un evento recurrente de Google Calendar
 */
export async function deleteHabitCalendarEvent(
    eventId: string,
    accessToken: string
): Promise<{ success: boolean; error?: string }> {
    if (!accessToken || !eventId) {
        return { success: false, error: 'Missing token or eventId' };
    }

    try {
        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        if (!response.ok && response.status !== 204) {
            return { success: false, error: 'Failed to delete event' };
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
