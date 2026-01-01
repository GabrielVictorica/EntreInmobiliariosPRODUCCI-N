-- RLS FIX for agent_objectives
-- Run this to allow SAVING objectives

-- 1. Enable RLS (Ensure it is enabled)
ALTER TABLE agent_objectives ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON agent_objectives;
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON agent_objectives;
DROP POLICY IF EXISTS "Enable all access for users based on user_id" ON agent_objectives;
DROP POLICY IF EXISTS "Enable mother read access" ON agent_objectives;

-- 3. Create Permissive INSERT Policy (Critical for Saving)
CREATE POLICY "Enable insert for users" ON agent_objectives
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. Create SELECT Policy (To view history/pre-set data)
CREATE POLICY "Enable select for users" ON agent_objectives
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 5. Create UPDATE Policy (Just in case needed later, though we insert new rows for history)
CREATE POLICY "Enable update for users" ON agent_objectives
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Grant Permissions
GRANT ALL ON agent_objectives TO authenticated;
GRANT ALL ON agent_objectives TO service_role;
