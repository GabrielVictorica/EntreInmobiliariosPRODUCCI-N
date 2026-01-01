-- Create view for KPI Dashboard
-- DROP VIEW IF EXISTS view_kpi_dashboard_anual;

CREATE OR REPLACE VIEW view_kpi_dashboard_anual AS
WITH 
metrics_financial AS (
    SELECT 
        user_id,
        EXTRACT(YEAR FROM date)::integer as anio,
        SUM(total_billing) as facturacion_total,
        SUM(sides) as transacciones_cerradas,
        COUNT(id) as transacciones_operaciones,
        SUM(sale_price) as volumen_total,
        CASE 
            WHEN COUNT(id) > 0 THEN SUM(sale_price) / COUNT(id) 
            ELSE 0 
        END as ticket_promedio,
        SUM(agent_honorarium) as honorarios_reales
    FROM closing_logs
    GROUP BY user_id, EXTRACT(YEAR FROM date)
),
metrics_activities AS (
    SELECT
        user_id,
        EXTRACT(YEAR FROM date)::integer as anio,
        COUNT(CASE WHEN type ILIKE '%pl%' OR type ILIKE '%primera llamada%' OR type ILIKE '%pre_listing%' THEN 1 END) as total_pl,
        COUNT(CASE WHEN type ILIKE '%pb%' OR type ILIKE '%primera busqueda%' OR type ILIKE '%pre_buying%' THEN 1 END) as total_pb,
        COUNT(CASE WHEN type ILIKE '%captacion%' THEN 1 END) as total_captaciones,
        COUNT(*) as total_reuniones_verdes
    FROM activities
    GROUP BY user_id, EXTRACT(YEAR FROM date)
),
metrics_objectives AS (
    SELECT DISTINCT ON (user_id, year)
        user_id,
        year::integer as anio,
        annual_billing,
        monthly_need
    FROM agent_objectives
    ORDER BY user_id, year, created_at DESC
)
SELECT
    COALESCE(mf.user_id, ma.user_id, mo.user_id) as user_id,
    COALESCE(mf.anio, ma.anio, mo.anio) as anio,
    
    -- Financials
    COALESCE(mf.facturacion_total, 0) as facturacion_total,
    COALESCE(mf.transacciones_cerradas, 0) as transacciones_cerradas,
    COALESCE(mf.transacciones_operaciones, 0) as transacciones_operaciones,
    COALESCE(mf.volumen_total, 0) as volumen_total,
    COALESCE(mf.ticket_promedio, 0) as ticket_promedio,
    COALESCE(mf.honorarios_reales, 0) as honorarios_reales,

    -- Activities
    COALESCE(ma.total_pl, 0) as total_pl,
    COALESCE(ma.total_pb, 0) as total_pb,
    COALESCE(ma.total_captaciones, 0) as total_captaciones,
    COALESCE(ma.total_reuniones_verdes, 0) as total_reuniones_verdes,
    
    -- Calculated Activity Metrics
    (COALESCE(ma.total_pl, 0) + COALESCE(ma.total_pb, 0) + COALESCE(ma.total_captaciones, 0) + COALESCE(mf.transacciones_cerradas, 0)) as total_gestion,

    -- Ratios & Productivity
    CASE 
        WHEN COALESCE(mf.transacciones_cerradas, 0) > 0 THEN (COALESCE(ma.total_pl, 0) + COALESCE(ma.total_pb, 0))::numeric / COALESCE(mf.transacciones_cerradas, 0)
        ELSE 0 
    END as efectividad_cierre,
    
    CASE 
        WHEN COALESCE(ma.total_pl, 0) > 0 THEN (COALESCE(ma.total_captaciones, 0)::numeric / COALESCE(ma.total_pl, 0)) * 100
        ELSE 0 
    END as efectividad_captacion,

    CASE 
        WHEN COALESCE(mf.transacciones_cerradas, 0) > 0 THEN COALESCE(mf.honorarios_reales, 0) / mf.transacciones_cerradas
        ELSE 0 
    END as honorarios_promedio,

    CASE 
        WHEN (COALESCE(ma.total_reuniones_verdes, 0) + COALESCE(mf.transacciones_cerradas, 0)) > 0 
        THEN COALESCE(mf.honorarios_reales, 0) / (COALESCE(ma.total_reuniones_verdes, 0) + COALESCE(mf.transacciones_cerradas, 0))
        ELSE 0 
    END as productividad_actividad,

    -- Objectives
    COALESCE(mo.annual_billing, 0) as annual_billing,
    COALESCE(mo.monthly_need, 0) as monthly_need

FROM metrics_financial mf
FULL OUTER JOIN metrics_activities ma ON mf.user_id = ma.user_id AND mf.anio = ma.anio
FULL OUTER JOIN metrics_objectives mo ON COALESCE(mf.user_id, ma.user_id) = mo.user_id AND COALESCE(mf.anio, ma.anio) = mo.anio;
