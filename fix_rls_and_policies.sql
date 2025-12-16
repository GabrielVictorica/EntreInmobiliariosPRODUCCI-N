-- ==============================================================================
-- SCRIPT DE SEGURIDAD Y SEPARACIÓN DE DATOS (RLS)
-- ==============================================================================
-- Este script configura la base de datos para separar los datos de los usuarios.
-- 1. Los "Hijos" (Agentes) solo podrán ver y editar sus propios datos.
-- 2. La "Madre" (Admin) podrá ver y editar TODOS los datos.
--
-- INSTRUCCIONES:
-- Copia y pega todo este contenido en el Editor SQL de Supabase y ejecútalo.
-- ==============================================================================

-- 1. Crear tabla de roles si no existe (para saber quién es "mother")
CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('mother', 'admin', 'agent')),
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS en user_roles para que todos puedan leer su propio rol
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer su propio rol
DROP POLICY IF EXISTS "Users can read own role" ON user_roles;
CREATE POLICY "Users can read own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Política: Solo Mother puede asignar roles (Insert/Update) - Opcional, por seguridad
DROP POLICY IF EXISTS "Mother can manage roles" ON user_roles;
CREATE POLICY "Mother can manage roles" ON user_roles
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'mother'
    )
  );

-- ==============================================================================
-- FUNCION HELPER PARA VERIFICAR SI SOY MOTHER
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
-- APLICAR RLS A LAS TABLAS PRINCIPALES
-- ==============================================================================

-- Lista de tablas a asegurar
-- seller_clients, properties, buyer_clients, buyer_searches, visits, activities, closing_logs, property_marketing_logs

-- ------------------------------------------------------------------------------
-- 1. SELLER CLIENTS (Vendedores)
-- ------------------------------------------------------------------------------
ALTER TABLE seller_clients ENABLE ROW LEVEL SECURITY;

-- Policy: Ver (Select)
DROP POLICY IF EXISTS "See own or all if mother logic" ON seller_clients;
CREATE POLICY "See own or all if mother logic" ON seller_clients
  FOR SELECT
  USING (
    auth.uid() = user_id -- Soy el dueño
    OR
    is_mother() -- O soy la madre
  );

-- Policy: Insertar (Insert)
DROP POLICY IF EXISTS "Insert own" ON seller_clients;
CREATE POLICY "Insert own" ON seller_clients
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

-- Policy: Actualizar (Update)
DROP POLICY IF EXISTS "Update own or all if mother" ON seller_clients;
CREATE POLICY "Update own or all if mother" ON seller_clients
  FOR UPDATE
  USING (
    auth.uid() = user_id OR is_mother()
  );

-- Policy: Eliminar (Delete) - Solo dueño o madre
DROP POLICY IF EXISTS "Delete own or all if mother" ON seller_clients;
CREATE POLICY "Delete own or all if mother" ON seller_clients
  FOR DELETE
  USING (
    auth.uid() = user_id OR is_mother()
  );


-- ------------------------------------------------------------------------------
-- 2. PROPERTIES (Propiedades)
-- ------------------------------------------------------------------------------
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Properties Policy Select" ON properties;
CREATE POLICY "Properties Policy Select" ON properties FOR SELECT USING (auth.uid() = user_id OR is_mother());

DROP POLICY IF EXISTS "Properties Policy Insert" ON properties;
CREATE POLICY "Properties Policy Insert" ON properties FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Properties Policy Update" ON properties;
CREATE POLICY "Properties Policy Update" ON properties FOR UPDATE USING (auth.uid() = user_id OR is_mother());

DROP POLICY IF EXISTS "Properties Policy Delete" ON properties;
CREATE POLICY "Properties Policy Delete" ON properties FOR DELETE USING (auth.uid() = user_id OR is_mother());


-- ------------------------------------------------------------------------------
-- 3. BUYER CLIENTS (Compradores)
-- ------------------------------------------------------------------------------
ALTER TABLE buyer_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buyer Clients Policy Select" ON buyer_clients;
CREATE POLICY "Buyer Clients Policy Select" ON buyer_clients FOR SELECT USING (auth.uid() = user_id OR is_mother());

DROP POLICY IF EXISTS "Buyer Clients Policy Insert" ON buyer_clients;
CREATE POLICY "Buyer Clients Policy Insert" ON buyer_clients FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Buyer Clients Policy Update" ON buyer_clients;
CREATE POLICY "Buyer Clients Policy Update" ON buyer_clients FOR UPDATE USING (auth.uid() = user_id OR is_mother());

DROP POLICY IF EXISTS "Buyer Clients Policy Delete" ON buyer_clients;
CREATE POLICY "Buyer Clients Policy Delete" ON buyer_clients FOR DELETE USING (auth.uid() = user_id OR is_mother());


-- ------------------------------------------------------------------------------
-- 4. BUYER SEARCHES (Búsquedas)
-- ------------------------------------------------------------------------------
ALTER TABLE buyer_searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buyer Searches Policy Select" ON buyer_searches;
CREATE POLICY "Buyer Searches Policy Select" ON buyer_searches FOR SELECT USING (auth.uid() = user_id OR is_mother());

DROP POLICY IF EXISTS "Buyer Searches Policy Insert" ON buyer_searches;
CREATE POLICY "Buyer Searches Policy Insert" ON buyer_searches FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Buyer Searches Policy Update" ON buyer_searches;
CREATE POLICY "Buyer Searches Policy Update" ON buyer_searches FOR UPDATE USING (auth.uid() = user_id OR is_mother());

DROP POLICY IF EXISTS "Buyer Searches Policy Delete" ON buyer_searches;
CREATE POLICY "Buyer Searches Policy Delete" ON buyer_searches FOR DELETE USING (auth.uid() = user_id OR is_mother());


-- ------------------------------------------------------------------------------
-- 5. VISITS (Visitas)
-- ------------------------------------------------------------------------------
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Visits Policy Select" ON visits;
CREATE POLICY "Visits Policy Select" ON visits FOR SELECT USING (auth.uid() = user_id OR is_mother());

DROP POLICY IF EXISTS "Visits Policy Insert" ON visits;
CREATE POLICY "Visits Policy Insert" ON visits FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Visits Policy Update" ON visits;
CREATE POLICY "Visits Policy Update" ON visits FOR UPDATE USING (auth.uid() = user_id OR is_mother());

DROP POLICY IF EXISTS "Visits Policy Delete" ON visits;
CREATE POLICY "Visits Policy Delete" ON visits FOR DELETE USING (auth.uid() = user_id OR is_mother());


-- ------------------------------------------------------------------------------
-- 6. ACTIVITIES (Log de Actividades)
-- ------------------------------------------------------------------------------
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Activities Policy Select" ON activities;
CREATE POLICY "Activities Policy Select" ON activities FOR SELECT USING (auth.uid() = user_id OR is_mother());

DROP POLICY IF EXISTS "Activities Policy Insert" ON activities;
CREATE POLICY "Activities Policy Insert" ON activities FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Activities Policy Update" ON activities;
CREATE POLICY "Activities Policy Update" ON activities FOR UPDATE USING (auth.uid() = user_id OR is_mother());


-- ------------------------------------------------------------------------------
-- 7. CLOSING LOGS (Cierres)
-- ------------------------------------------------------------------------------
-- Nota: closing_logs puede no tener user_id directo a veces, pero App.tsx lo mapea.
-- Asegurémonos de que la columna existe. Si no, esto fallará, pero asumo que existe por mapClosingLog.

ALTER TABLE closing_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Closings Policy Select" ON closing_logs;
CREATE POLICY "Closings Policy Select" ON closing_logs FOR SELECT USING (auth.uid() = user_id OR is_mother());

DROP POLICY IF EXISTS "Closings Policy Insert" ON closing_logs;
CREATE POLICY "Closings Policy Insert" ON closing_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Closings Policy Update" ON closing_logs;
CREATE POLICY "Closings Policy Update" ON closing_logs FOR UPDATE USING (auth.uid() = user_id OR is_mother());


-- ------------------------------------------------------------------------------
-- 8. MARKETING LOGS
-- ------------------------------------------------------------------------------
ALTER TABLE property_marketing_logs ENABLE ROW LEVEL SECURITY;

-- Marketing logs suelen ser vistos por todos o al menos por la madre.
-- Asumiremos que el user_id es quien cargó el log.

DROP POLICY IF EXISTS "Marketing Policy Select" ON property_marketing_logs;
CREATE POLICY "Marketing Policy Select" ON property_marketing_logs FOR SELECT USING (true); -- Marketing visible para todos para colaborar? O restringir?
-- Restrinjamos por ahora para ser consistentes, o dejemos abierto si es colaborativo.
-- El request dice "respetando que los login hijos solo vean sus datos".
-- Entonces:
DROP POLICY IF EXISTS "Marketing Policy Select Restricted" ON property_marketing_logs;
CREATE POLICY "Marketing Policy Select Restricted" ON property_marketing_logs 
FOR SELECT USING (auth.uid() = user_id OR is_mother());

DROP POLICY IF EXISTS "Marketing Policy Insert" ON property_marketing_logs;
CREATE POLICY "Marketing Policy Insert" ON property_marketing_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Marketing Policy Update" ON property_marketing_logs;
CREATE POLICY "Marketing Policy Update" ON property_marketing_logs FOR UPDATE USING (auth.uid() = user_id OR is_mother());

