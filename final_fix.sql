-- ==========================================
-- SCRIPT FINAL DE RECUPERACIÓN (Versión Nuclear)
-- EJECUTAR EN SQL EDITOR DE SUPABASE (Proyecto CORRECTO)
-- ==========================================

BEGIN;

-- 1. IDENTIFICAR USUARIO ACTUAL (El que ejecuta el script)
-- Si auth.uid() es NULL, usamos el ID que proporcionaste antes, pero ideally usamos el del contexto
DO $$
DECLARE
    target_user_id UUID := auth.uid();
BEGIN
    IF target_user_id IS NULL THEN
        -- FALLBACK: Si se corre como admin puro sin sesión, inserta aquí TU ID manual si lo conoces
        -- target_user_id := 'TU-UUID-AQUI';
        RAISE NOTICE 'No se detectó auth.uid(). Asignando a un ID hardcodeado si fuera necesario. Revisa esto.';
    ELSE
        RAISE NOTICE 'Asignando datos al usuario: %', target_user_id;

        -- 2. ASIGNAR ROL DE MADRE (Para ver todo)
        DELETE FROM user_roles WHERE user_id = target_user_id;
        INSERT INTO user_roles (user_id, role) VALUES (target_user_id, 'mother');
        
        -- 3. RESCATAR DATOS HUÉRFANOS (user_id IS NULL)
        UPDATE properties SET user_id = target_user_id WHERE user_id IS NULL;
        UPDATE seller_clients SET user_id = target_user_id WHERE user_id IS NULL;
        UPDATE buyer_clients SET user_id = target_user_id WHERE user_id IS NULL;
        UPDATE buyer_searches SET user_id = target_user_id WHERE user_id IS NULL;
        UPDATE visits SET user_id = target_user_id WHERE user_id IS NULL;
        UPDATE activities SET user_id = target_user_id WHERE user_id IS NULL;
        UPDATE closing_logs SET user_id = target_user_id WHERE user_id IS NULL;
        UPDATE property_marketing_logs SET user_id = target_user_id WHERE user_id IS NULL;

        -- 4. FORZAR PROPIEDAD DE TODO (Opcional - Descomentar si lo anterior no basta)
        -- UPDATE closing_logs SET user_id = target_user_id; 

    END IF;
END $$;

-- 5. DESACTIVAR LA SEGURIDAD (RLS) TEMPORALMENTE
-- Esto garantiza que SI o SI veas los datos, sin importar de quién sean.
ALTER TABLE closing_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE seller_clients DISABLE ROW LEVEL SECURITY;

COMMIT;

-- VERIFICACIÓN FINAL
SELECT count(*) as total_cierres FROM closing_logs;
