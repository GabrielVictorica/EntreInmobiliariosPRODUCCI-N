-- Agregar columna google_event_id a tabla habits para sincronización con Google Calendar
ALTER TABLE habits ADD COLUMN IF NOT EXISTS google_event_id TEXT;

COMMENT ON COLUMN habits.google_event_id IS 'ID del evento recurrente en Google Calendar para sincronización';
