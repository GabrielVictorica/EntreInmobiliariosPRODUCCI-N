-- ==============================================================================
-- SCRIPT DE DIAGNÓSTICO (VERIFY DB)
-- ==============================================================================
-- Este script NO MODIFICA nada. Solo nos dice qué está pasando.
-- Ejecútalo y dime qué resultado te muestra en "Results".

DO $$
DECLARE
    target_id uuid := 'a0d9fa8d-25b8-4643-b03e-f19a41698d59';
    count_props integer;
    count_clients integer;
    owned_props integer;
    my_role text;
BEGIN
    RAISE NOTICE '--- INICIO DIAGNÓSTICO ---';

    -- 1. Ver cuántas propiedades existen en TOTAL
    SELECT count(*) INTO count_props FROM properties;
    RAISE NOTICE 'Total Propiedades en DB: %', count_props;

    -- 2. Ver cuántas son de tu usuario
    SELECT count(*) INTO owned_props FROM properties WHERE user_id = target_id;
    RAISE NOTICE 'Propiedades asignadas a ti (%): %', target_id, owned_props;

    -- 3. Ver tu ROL actual
    SELECT role INTO my_role FROM user_roles WHERE user_id = target_id;
    RAISE NOTICE 'Tu Rol en user_roles: %', my_role;

    -- 4. Ver si hay datos huérfanos
    SELECT count(*) INTO count_clients FROM seller_clients WHERE user_id IS NULL;
    RAISE NOTICE 'Clientes sin dueño (NULL): %', count_clients;
    
    RAISE NOTICE '--- FIN DIAGNÓSTICO ---';
    
    IF owned_props = 0 THEN
        RAISE NOTICE '¡ALERTA! El script force_rescue NO parece haber funcionado. Tienes 0 propiedades.';
    ELSE
        RAISE NOTICE 'La base de datos dice que TIENES % propiedades. Si la app dice 0, es culpa de RLS o de la App.', owned_props;
    END IF;

END $$;
