-- OPTIMIZE RLS POLICIES TO PREVENT HANGS/TIMEOUTS
-- We replace complex joins/recursion with direct Email Checks.
-- Target User: gabriel.v.g06@gmail.com (Mother/Admin)

-- 1. VISITS
DROP POLICY IF EXISTS "Users can view own visits" ON visits;
DROP POLICY IF EXISTS "Mother can view all visits" ON visits;
DROP POLICY IF EXISTS "Enable read access for all users" ON visits;

CREATE POLICY "Simplified Access visits" ON visits
FOR ALL USING (
  auth.uid() = user_id 
  OR 
  auth.jwt() ->> 'email' = 'gabriel.v.g06@gmail.com'
);

-- 2. ACTIVITIES
DROP POLICY IF EXISTS "Users can view own activities" ON activities;
DROP POLICY IF EXISTS "Mother can view all activities" ON activities;
DROP POLICY IF EXISTS "Enable read access for all users" ON activities;

CREATE POLICY "Simplified Access activities" ON activities
FOR ALL USING (
  auth.uid() = user_id 
  OR 
  auth.jwt() ->> 'email' = 'gabriel.v.g06@gmail.com'
);

-- 3. SELLER CLIENTS (clients)
DROP POLICY IF EXISTS "Users can view own clients" ON seller_clients;
DROP POLICY IF EXISTS "Mother can view all clients" ON seller_clients;
DROP POLICY IF EXISTS "Enable read access for all users" ON seller_clients;

CREATE POLICY "Simplified Access seller_clients" ON seller_clients
FOR ALL USING (
  auth.uid() = user_id 
  OR 
  auth.jwt() ->> 'email' = 'gabriel.v.g06@gmail.com'
);

-- 4. PROPERTIES
DROP POLICY IF EXISTS "Users can view own properties" ON properties;
DROP POLICY IF EXISTS "Mother can view all properties" ON properties;
DROP POLICY IF EXISTS "Enable read access for all users" ON properties;

CREATE POLICY "Simplified Access properties" ON properties
FOR ALL USING (
  auth.uid() = user_id 
  OR 
  auth.jwt() ->> 'email' = 'gabriel.v.g06@gmail.com'
);

-- 5. BUYER CLIENTS
DROP POLICY IF EXISTS "Users can view own buyer clients" ON buyer_clients;
DROP POLICY IF EXISTS "Mother can view all buyer clients" ON buyer_clients;
DROP POLICY IF EXISTS "Enable read access for all users" ON buyer_clients;

CREATE POLICY "Simplified Access buyer_clients" ON buyer_clients
FOR ALL USING (
  auth.uid() = user_id 
  OR 
  auth.jwt() ->> 'email' = 'gabriel.v.g06@gmail.com'
);

-- 6. BUYER SEARCHES
DROP POLICY IF EXISTS "Users can view own buyer searches" ON buyer_searches;
DROP POLICY IF EXISTS "Mother can view all buyer searches" ON buyer_searches;
DROP POLICY IF EXISTS "Enable read access for all users" ON buyer_searches;

CREATE POLICY "Simplified Access buyer_searches" ON buyer_searches
FOR ALL USING (
  auth.uid() = user_id 
  OR 
  auth.jwt() ->> 'email' = 'gabriel.v.g06@gmail.com'
);

-- 7. CLOSING LOGS (Reinforce)
DROP POLICY IF EXISTS "Simple Access" ON closing_logs;

CREATE POLICY "Simplified Access closing_logs" ON closing_logs
FOR ALL USING (
  auth.uid() = user_id 
  OR 
  auth.jwt() ->> 'email' = 'gabriel.v.g06@gmail.com'
);

-- 8. PROPERTY MARKETING LOGS
DROP POLICY IF EXISTS "Users can view own logs" ON property_marketing_logs;
DROP POLICY IF EXISTS "Enable read access for all users" ON property_marketing_logs;

CREATE POLICY "Simplified Access property_marketing_logs" ON property_marketing_logs
FOR ALL USING (
  auth.uid() = user_id 
  OR 
  auth.jwt() ->> 'email' = 'gabriel.v.g06@gmail.com'
);

-- 9. USER SETTINGS
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_settings;

CREATE POLICY "Simplified Access user_settings" ON user_settings
FOR ALL USING (
  auth.uid() = user_id 
); -- Only user sees their own settings
