-- ==============================================================================
-- SCRIPT DE DIAGNÓSTICO V2 (TABLA VISIBLE)
-- ==============================================================================
-- Ejecuta esto y mira la tabla de resultados.

SELECT 
  'a0d9fa8d-25b8-4643-b03e-f19a41698d59' as target_id,
  
  (SELECT count(*) FROM properties) as total_propiedades,
  (SELECT count(*) FROM properties WHERE user_id = 'a0d9fa8d-25b8-4643-b03e-f19a41698d59') as mis_propiedades,
  
  (SELECT count(*) FROM seller_clients) as total_clientes,
  (SELECT count(*) FROM seller_clients WHERE user_id = 'a0d9fa8d-25b8-4643-b03e-f19a41698d59') as mis_clientes,

  (SELECT count(*) FROM closing_logs) as total_cierres,
  (SELECT count(*) FROM closing_logs WHERE user_id = 'a0d9fa8d-25b8-4643-b03e-f19a41698d59') as mis_cierres,

  (SELECT role FROM user_roles WHERE user_id = 'a0d9fa8d-25b8-4643-b03e-f19a41698d59') as mi_rol_db;
