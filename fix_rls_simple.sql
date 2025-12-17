-- SIMPLIFY CLOSING LOGS RLS
-- The previous policy forced a join with 'properties', hindering access to manual closings or orphan records.
-- We will allow access based on direct ownership ('user_id') or Admin status ('is_mother').

DROP POLICY IF EXISTS "access_policy_closing_logs" ON closing_logs;

CREATE POLICY "access_policy_closing_logs" ON closing_logs
    FOR ALL
    USING (user_id = auth.uid() OR is_mother());

-- Also ensure user_settings is accessible (just in case)
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings" ON user_settings
    FOR ALL
    USING (user_id = auth.uid());
