-- ==============================================================================
-- SCRIPT DE CAMBIO DE DUEÑO ABSOLUTO (FORCE RESCUE)
-- ==============================================================================
-- ATENCIÓN: Este script asigna CADA FILA de la base de datos a tu usuario.
-- Ignora si ya tenía dueño o si era NULL. Todo pasará a ser tuyo.
-- ==============================================================================

DO $$
DECLARE
    my_user_id uuid := 'a0d9fa8d-25b8-4643-b03e-f19a41698d59';
BEGIN
    
    RAISE NOTICE 'Iniciando TRANSFERENCIA TOTAL de datos a: %', my_user_id;

    -- 1. ASIGNAR DUEÑO A TODO (Seller Clients)
    UPDATE seller_clients SET user_id = my_user_id;
    
    -- 2. ASIGNAR DUEÑO A TODO (Properties)
    UPDATE properties SET user_id = my_user_id;
    
    -- 3. ASIGNAR DUEÑO A TODO (Buyer Clients)
    UPDATE buyer_clients SET user_id = my_user_id;
    
    -- 4. ASIGNAR DUEÑO A TODO (Searches)
    UPDATE buyer_searches SET user_id = my_user_id;
    
    -- 5. ASIGNAR DUEÑO A TODO (Visits)
    UPDATE visits SET user_id = my_user_id;
    
    -- 6. ASIGNAR DUEÑO A TODO (Activities)
    UPDATE activities SET user_id = my_user_id;
    
    -- 7. ASIGNAR DUEÑO A TODO (Closings)
    UPDATE closing_logs SET user_id = my_user_id;
    
    -- 8. ASIGNAR DUEÑO A TODO (Marketing Logs)
    UPDATE property_marketing_logs SET user_id = my_user_id;
    
    -- 9. ASIGNAR DUEÑO A TODO (User Settings)
    UPDATE user_settings SET user_id = my_user_id;

    -- 10. RE-CONFIRMAR ROL DE MADRE
    INSERT INTO user_roles (user_id, email, role)
    VALUES (my_user_id, 'gabriel.v.g06@gmail.com', 'mother')
    ON CONFLICT (user_id) DO UPDATE SET role = 'mother';

    RAISE NOTICE '¡TRANSFERENCIA COMPLETA! Ahora eres el dueño de todos los datos.';

END $$;
