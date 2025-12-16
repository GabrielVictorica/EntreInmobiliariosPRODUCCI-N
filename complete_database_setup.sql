-- ==============================================================================
-- SCRIPT COMPLETO DE CONFIGURACIÓN DE BASE DE DATOS
-- ==============================================================================
-- Este script configura TODA la estructura necesaria para que:
-- 1. Los "Hijos" (Agentes) guarden y vean solo SUS datos
-- 2. La "Madre" (Admin) vea y edite TODOS los datos
--
-- INSTRUCCIONES:
-- 1. Copia todo este contenido en el Editor SQL de Supabase
-- 2. Haz clic en "Run"
-- 3. Después de ejecutar, asigna el rol "mother" a tu usuario admin
-- ==============================================================================

-- ==============================================================================
-- PARTE 1: TABLA DE ROLES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  role text NOT NULL DEFAULT 'agent' CHECK (role IN ('mother', 'admin', 'agent')),
  email text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer su propio rol
DROP POLICY IF EXISTS "Users can read own role" ON user_roles;
CREATE POLICY "Users can read own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Mother puede leer todos los roles (para ver su equipo)
DROP POLICY IF EXISTS "Mother can read all roles" ON user_roles;
CREATE POLICY "Mother can read all roles" ON user_roles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'mother')
  );

-- ==============================================================================
-- PARTE 2: TRIGGER AUTOMÁTICO PARA NUEVOS USUARIOS
-- ==============================================================================
-- Esto crea automáticamente una entrada en user_roles cuando alguien se registra

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, email, role)
  VALUES (NEW.id, NEW.email, 'agent')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- PARTE 3: FUNCIÓN HELPER PARA VERIFICAR SI ES MOTHER
-- ==============================================================================

CREATE OR REPLACE FUNCTION is_mother()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'mother'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- PARTE 4: AGREGAR COLUMNA user_id A TODAS LAS TABLAS
-- ==============================================================================

-- seller_clients
ALTER TABLE seller_clients ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users;

-- properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users;

-- buyer_clients
ALTER TABLE buyer_clients ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users;

-- buyer_searches
ALTER TABLE buyer_searches ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users;

-- visits
ALTER TABLE visits ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users;

-- activities
ALTER TABLE activities ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users;

-- closing_logs
ALTER TABLE closing_logs ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users;

-- property_marketing_logs
ALTER TABLE property_marketing_logs ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users;

-- user_settings (ya debería tenerla, pero por si acaso)
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users;

-- ==============================================================================
-- PARTE 5: POLÍTICAS RLS PARA TODAS LAS TABLAS
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- SELLER CLIENTS
-- ------------------------------------------------------------------------------
ALTER TABLE seller_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "seller_clients_select" ON seller_clients;
CREATE POLICY "seller_clients_select" ON seller_clients
  FOR SELECT USING (auth.uid() = user_id OR is_mother());

DROP POLICY IF EXISTS "seller_clients_insert" ON seller_clients;
CREATE POLICY "seller_clients_insert" ON seller_clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "seller_clients_update" ON seller_clients;
CREATE POLICY "seller_clients_update" ON seller_clients
  FOR UPDATE USING (auth.uid() = user_id OR is_mother());

DROP POLICY IF EXISTS "seller_clients_delete" ON seller_clients;
CREATE POLICY "seller_clients_delete" ON seller_clients
  FOR DELETE USING (auth.uid() = user_id OR is_mother());

-- ------------------------------------------------------------------------------
-- PROPERTIES
-- ------------------------------------------------------------------------------
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "properties_select" ON properties;
CREATE POLICY "properties_select" ON properties
  FOR SELECT USING (auth.uid() = user_id OR is_mother());

DROP POLICY IF EXISTS "properties_insert" ON properties;
CREATE POLICY "properties_insert" ON properties
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "properties_update" ON properties;
CREATE POLICY "properties_update" ON properties
  FOR UPDATE USING (auth.uid() = user_id OR is_mother());

DROP POLICY IF EXISTS "properties_delete" ON properties;
CREATE POLICY "properties_delete" ON properties
  FOR DELETE USING (auth.uid() = user_id OR is_mother());

-- ------------------------------------------------------------------------------
-- BUYER CLIENTS
-- ------------------------------------------------------------------------------
ALTER TABLE buyer_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "buyer_clients_select" ON buyer_clients;
CREATE POLICY "buyer_clients_select" ON buyer_clients
  FOR SELECT USING (auth.uid() = user_id OR is_mother());

DROP POLICY IF EXISTS "buyer_clients_insert" ON buyer_clients;
CREATE POLICY "buyer_clients_insert" ON buyer_clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "buyer_clients_update" ON buyer_clients;
CREATE POLICY "buyer_clients_update" ON buyer_clients
  FOR UPDATE USING (auth.uid() = user_id OR is_mother());

DROP POLICY IF EXISTS "buyer_clients_delete" ON buyer_clients;
CREATE POLICY "buyer_clients_delete" ON buyer_clients
  FOR DELETE USING (auth.uid() = user_id OR is_mother());

-- ------------------------------------------------------------------------------
-- BUYER SEARCHES
-- ------------------------------------------------------------------------------
ALTER TABLE buyer_searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "buyer_searches_select" ON buyer_searches;
CREATE POLICY "buyer_searches_select" ON buyer_searches
  FOR SELECT USING (auth.uid() = user_id OR is_mother());

DROP POLICY IF EXISTS "buyer_searches_insert" ON buyer_searches;
CREATE POLICY "buyer_searches_insert" ON buyer_searches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "buyer_searches_update" ON buyer_searches;
CREATE POLICY "buyer_searches_update" ON buyer_searches
  FOR UPDATE USING (auth.uid() = user_id OR is_mother());

DROP POLICY IF EXISTS "buyer_searches_delete" ON buyer_searches;
CREATE POLICY "buyer_searches_delete" ON buyer_searches
  FOR DELETE USING (auth.uid() = user_id OR is_mother());

-- ------------------------------------------------------------------------------
-- VISITS
-- ------------------------------------------------------------------------------
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "visits_select" ON visits;
CREATE POLICY "visits_select" ON visits
  FOR SELECT USING (auth.uid() = user_id OR is_mother());

DROP POLICY IF EXISTS "visits_insert" ON visits;
CREATE POLICY "visits_insert" ON visits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "visits_update" ON visits;
CREATE POLICY "visits_update" ON visits
  FOR UPDATE USING (auth.uid() = user_id OR is_mother());

DROP POLICY IF EXISTS "visits_delete" ON visits;
CREATE POLICY "visits_delete" ON visits
  FOR DELETE USING (auth.uid() = user_id OR is_mother());

-- ------------------------------------------------------------------------------
-- ACTIVITIES
-- ------------------------------------------------------------------------------
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activities_select" ON activities;
CREATE POLICY "activities_select" ON activities
  FOR SELECT USING (auth.uid() = user_id OR is_mother());

DROP POLICY IF EXISTS "activities_insert" ON activities;
CREATE POLICY "activities_insert" ON activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "activities_update" ON activities;
CREATE POLICY "activities_update" ON activities
  FOR UPDATE USING (auth.uid() = user_id OR is_mother());

DROP POLICY IF EXISTS "activities_delete" ON activities;
CREATE POLICY "activities_delete" ON activities
  FOR DELETE USING (auth.uid() = user_id OR is_mother());

-- ------------------------------------------------------------------------------
-- CLOSING LOGS
-- ------------------------------------------------------------------------------
ALTER TABLE closing_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "closing_logs_select" ON closing_logs;
CREATE POLICY "closing_logs_select" ON closing_logs
  FOR SELECT USING (auth.uid() = user_id OR is_mother());

DROP POLICY IF EXISTS "closing_logs_insert" ON closing_logs;
CREATE POLICY "closing_logs_insert" ON closing_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "closing_logs_update" ON closing_logs;
CREATE POLICY "closing_logs_update" ON closing_logs
  FOR UPDATE USING (auth.uid() = user_id OR is_mother());

DROP POLICY IF EXISTS "closing_logs_delete" ON closing_logs;
CREATE POLICY "closing_logs_delete" ON closing_logs
  FOR DELETE USING (auth.uid() = user_id OR is_mother());

-- ------------------------------------------------------------------------------
-- PROPERTY MARKETING LOGS
-- ------------------------------------------------------------------------------
ALTER TABLE property_marketing_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "property_marketing_logs_select" ON property_marketing_logs;
CREATE POLICY "property_marketing_logs_select" ON property_marketing_logs
  FOR SELECT USING (auth.uid() = user_id OR is_mother());

DROP POLICY IF EXISTS "property_marketing_logs_insert" ON property_marketing_logs;
CREATE POLICY "property_marketing_logs_insert" ON property_marketing_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "property_marketing_logs_update" ON property_marketing_logs;
CREATE POLICY "property_marketing_logs_update" ON property_marketing_logs
  FOR UPDATE USING (auth.uid() = user_id OR is_mother());

-- ------------------------------------------------------------------------------
-- USER SETTINGS
-- ------------------------------------------------------------------------------
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_settings_select" ON user_settings;
CREATE POLICY "user_settings_select" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_settings_insert" ON user_settings;
CREATE POLICY "user_settings_insert" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_settings_update" ON user_settings;
CREATE POLICY "user_settings_update" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- ==============================================================================
-- PARTE 6: REGISTRAR USUARIOS EXISTENTES EN user_roles
-- ==============================================================================
-- Esto registra a todos los usuarios que ya existen pero no tienen entrada

INSERT INTO user_roles (user_id, email, role)
SELECT id, email, 'agent'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_roles)
ON CONFLICT (user_id) DO NOTHING;

-- ==============================================================================
-- ¡LISTO!
-- ==============================================================================
-- Ahora debes asignar manualmente el rol "mother" a tu usuario admin.
-- Ejecuta esto reemplazando TU_EMAIL con el email del admin:
--
-- UPDATE user_roles SET role = 'mother' WHERE email = 'TU_EMAIL_AQUI';
--
-- Ejemplo:
-- UPDATE user_roles SET role = 'mother' WHERE email = 'gabriel.v.g06@gmail.com';
-- ==============================================================================
