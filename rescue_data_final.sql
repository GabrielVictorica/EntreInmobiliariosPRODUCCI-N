-- ==============================================================================
-- SCRIPT DE RESCATE FINAL (AUTOMÁTICO POR EMAIL)
-- ==============================================================================
-- Este script busca tu usuario por email y le asigna todos los datos.
-- Ejecútalo COMPLETO en el Editor SQL.

DO $$
DECLARE
    -- TU EMAIL (Visto en la app)
    target_email text := 'gabriel.v.g06@gmail.com';
    target_user_id uuid;
BEGIN
    -- 1. BUSCAR ID POR EMAIL
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION '¡ERROR CRÍTICO! No se encontró ningún usuario con el email %. Verifica que sea exactamente ese.', target_email;
    END IF;

    RAISE NOTICE 'Usuario encontrado: % (ID: %)', target_email, target_user_id;

    -- 2. FUERZA BRUTA: ASIGNAR ROL 'MOTHER'
    DELETE FROM user_roles WHERE user_id = target_user_id; -- Borrar rol anterior si existe
    
    INSERT INTO user_roles (user_id, email, role)
    VALUES (target_user_id, target_email, 'mother');

    RAISE NOTICE 'Rol de Madre asignado exitosamente.';

    -- 3. ASIGNAR DUEÑO A DATOS HUÉRFANOS (SI O SI)
    -- Asignamos TODO lo que sea NULL al usuario encontrado.
    
    UPDATE seller_clients SET user_id = target_user_id WHERE user_id IS NULL;
    UPDATE properties SET user_id = target_user_id WHERE user_id IS NULL;
    UPDATE buyer_clients SET user_id = target_user_id WHERE user_id IS NULL;
    UPDATE buyer_searches SET user_id = target_user_id WHERE user_id IS NULL;
    UPDATE visits SET user_id = target_user_id WHERE user_id IS NULL;
    UPDATE activities SET user_id = target_user_id WHERE user_id IS NULL;
    UPDATE closing_logs SET user_id = target_user_id WHERE user_id IS NULL;
    UPDATE property_marketing_logs SET user_id = target_user_id WHERE user_id IS NULL;
    UPDATE user_settings SET user_id = target_user_id WHERE user_id IS NULL;

    RAISE NOTICE '------------------------------------------------';
    RAISE NOTICE '¡RESCATE FINALIZADO! TUS DATOS HAN VUELTO.';
    RAISE NOTICE 'Por favor recarga la página de la app.';
    RAISE NOTICE '------------------------------------------------';

END $$;
