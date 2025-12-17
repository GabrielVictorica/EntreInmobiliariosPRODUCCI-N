-- FIX RECURSION IN RLS
-- The policy "Mother can read all roles" relies on "is_mother()" function.
-- If is_mother() queries user_roles, it triggers an infinite loop (Recursion), causing the query to hang.

-- 1. Drop the problematic policy
DROP POLICY IF EXISTS "Mother can read all roles" ON user_roles;

-- 2. Drop the redundant policy (we see two policies for reading own role)
DROP POLICY IF EXISTS "read_policy_user_roles" ON user_roles;

-- 3. Ensure we have a clean, simple policy for reading own role
DROP POLICY IF EXISTS "Users can read own role" ON user_roles;
CREATE POLICY "Users can read own role" ON user_roles
    FOR SELECT
    USING (auth.uid() = user_id);

-- 4. FOR NOW, to guarantee access, we will allow the specific Mother User to read all rows HARDCODED
-- This avoids recursion by not looking up the table inside the policy for the user ID check
CREATE POLICY "Mother Admin Access" ON user_roles
    FOR SELECT
    USING (auth.uid() = 'a0d9fa8d-25b8-4643-b03e-f19a41698d59');
