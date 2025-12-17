-- ==============================================================================
-- SCRIPT DE RECUPERACIÓN DE DATOS (RESCUE DATA)
-- ==============================================================================
-- Este script asigna todos los datos "huerfanos" (sin dueño) a tu usuario.
-- Ejecútalo en el Editor SQL de Supabase.

DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- 1. BUSCAR TU ID DE USUARIO (Reemplaza el email si es necesario)
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'gabriel.v.g06@gmail.com';

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró el usuario gabriel.v.g06@gmail.com';
    END IF;

    -- 2. Asegurar que seas "mother" (Admin supremo)
    UPDATE user_roles SET role = 'mother' WHERE user_id = target_user_id;
    
    -- Si no existía en user_roles, lo creamos
    INSERT INTO user_roles (user_id, email, role)
    VALUES (target_user_id, 'gabriel.v.g06@gmail.com', 'mother')
    ON CONFLICT (user_id) DO UPDATE SET role = 'mother';


    -- 3. ASIGNAR DUEÑO A DATOS HUÉRFANOS (user_id IS NULL)
    
    -- Clientes Vendedores
    UPDATE seller_clients SET user_id = target_user_id WHERE user_id IS NULL;
    
    -- Propiedades
    UPDATE properties SET user_id = target_user_id WHERE user_id IS NULL;
    
    -- Clientes Compradores
    UPDATE buyer_clients SET user_id = target_user_id WHERE user_id IS NULL;
    
    -- Búsquedas
    UPDATE buyer_searches SET user_id = target_user_id WHERE user_id IS NULL;
    
    -- Visitas
    UPDATE visits SET user_id = target_user_id WHERE user_id IS NULL;
    
    -- Actividades
    UPDATE activities SET user_id = target_user_id WHERE user_id IS NULL;
    
    -- Cierres
    UPDATE closing_logs SET user_id = target_user_id WHERE user_id IS NULL;

    -- Logs de Marketing
    UPDATE property_marketing_logs SET user_id = target_user_id WHERE user_id IS NULL;
    
    -- Configuraciones
    UPDATE user_settings SET user_id = target_user_id WHERE user_id IS NULL;

END $$;
