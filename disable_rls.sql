-- ==============================================================================
-- SCRIPT DE EMERGENCIA: DESACTIVAR SEGURIDAD (VERSION CORREGIDA)
-- ==============================================================================

DO $$
BEGIN
    -- Ejecutamos los comandos DDL dinámicamente para poder usar RAISE NOTICE
    EXECUTE 'ALTER TABLE closing_logs DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE visits DISABLE ROW LEVEL SECURITY';

    RAISE NOTICE 'Seguridad desactivada correctamente. Tus datos deberían ser visibles AHORA.';
END $$;
