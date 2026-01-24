-- ==============================================================================
-- MIGRACIÓN: Tabla de Integraciones de Usuario (Google Calendar)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google_calendar')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Habilitar RLS
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propias integraciones
DROP POLICY IF EXISTS "user_integrations_select" ON user_integrations;
CREATE POLICY "user_integrations_select" ON user_integrations
  FOR SELECT USING (auth.uid() = user_id OR is_mother());

-- Política: Los usuarios pueden insertar sus propias integraciones
DROP POLICY IF EXISTS "user_integrations_insert" ON user_integrations;
CREATE POLICY "user_integrations_insert" ON user_integrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden actualizar sus propias integraciones
DROP POLICY IF EXISTS "user_integrations_update" ON user_integrations;
CREATE POLICY "user_integrations_update" ON user_integrations
  FOR UPDATE USING (auth.uid() = user_id);

-- Política: Los usuarios pueden borrar sus propias integraciones
DROP POLICY IF EXISTS "user_integrations_delete" ON user_integrations;
CREATE POLICY "user_integrations_delete" ON user_integrations
  FOR DELETE USING (auth.uid() = user_id);

-- Función para actualizar el timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_integrations_updated_at
    BEFORE UPDATE ON user_integrations
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
