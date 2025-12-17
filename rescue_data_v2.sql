-- ==============================================================================
-- SCRIPT DE RESCATE FINAL (V2 - CON ID CORREGIDO)
-- ==============================================================================
-- INSTRUCCIONES:
-- 1. Dale RUN a este script. Ya tiene tu ID puesto.
-- 2. Recarga la aplicación.
-- ==============================================================================

DO $$
DECLARE
    -- TU ID (Ya puesto por el asistente)
    my_user_id uuid := 'a0d9fa8d-25b8-4643-b03e-f19a41698d59'; 
BEGIN
    
    RAISE NOTICE 'Iniciando rescate para usuario: %', my_user_id;

    -- 1. RESETEAR Y ASEGURAR ROL DE MADRE (ADMIN)
    DELETE FROM user_roles WHERE user_id = my_user_id; -- Limpiar para asegurar
    
    INSERT INTO user_roles (user_id, email, role)
    VALUES (my_user_id, 'gabriel.v.g06@gmail.com', 'mother')
    ON CONFLICT (user_id) DO UPDATE SET role = 'mother';

    RAISE NOTICE 'Rol de Madre asignado.';


    -- 2. ASIGNAR DUEÑO A TODOS LOS DATOS HUÉRFANOS
    -- Esto toma TODO lo que no tiene dueño y te lo asigna a ti.
    
    UPDATE seller_clients SET user_id = my_user_id WHERE user_id IS NULL;
    UPDATE properties SET user_id = my_user_id WHERE user_id IS NULL;
    UPDATE buyer_clients SET user_id = my_user_id WHERE user_id IS NULL;
    UPDATE buyer_searches SET user_id = my_user_id WHERE user_id IS NULL;
    UPDATE visits SET user_id = my_user_id WHERE user_id IS NULL;
    UPDATE activities SET user_id = my_user_id WHERE user_id IS NULL;
    UPDATE closing_logs SET user_id = my_user_id WHERE user_id IS NULL;
    UPDATE property_marketing_logs SET user_id = my_user_id WHERE user_id IS NULL;
    UPDATE user_settings SET user_id = my_user_id WHERE user_id IS NULL;

    RAISE NOTICE '¡DATOS RECUPERADOS EXITOSAMENTE!';

END $$;
