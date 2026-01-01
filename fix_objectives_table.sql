-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS agent_objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    year INTEGER NOT NULL,
    
    -- Financial Targets
    annual_billing NUMERIC DEFAULT 0,
    monthly_need NUMERIC DEFAULT 0,
    average_ticket NUMERIC DEFAULT 0,
    commission_split NUMERIC DEFAULT 0,
    commercial_weeks NUMERIC DEFAULT 0,
    exchange_rate NUMERIC DEFAULT 0,
    
    -- Tuning / Manual Overrides
    manual_ratio NUMERIC,
    is_manual_ratio BOOLEAN DEFAULT FALSE,
    is_manual_ticket BOOLEAN DEFAULT FALSE,
    
    -- Captation Goals
    captation_goal_qty NUMERIC DEFAULT 0,
    captation_goal_period TEXT DEFAULT 'month',
    manual_captation_ratio NUMERIC DEFAULT 0,
    is_manual_captation_ratio BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE agent_objectives ENABLE ROW LEVEL SECURITY;

-- Create Policies (Drop existing first to avoid errors if re-running)
DROP POLICY IF EXISTS "Enable all access for users based on user_id" ON agent_objectives;

-- Policy: Users can insert their own goals
CREATE POLICY "Enable insert for users based on user_id" ON agent_objectives
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own goals
CREATE POLICY "Enable select for users based on user_id" ON agent_objectives
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Policy: Mother account can view everything (optional, consistent with other tables)
CREATE POLICY "Enable mother read access" ON agent_objectives
FOR SELECT TO authenticated
USING (auth.jwt() ->> 'email' = 'gabriel.v.g06@gmail.com');

-- Grant permissions (just in case)
GRANT ALL ON agent_objectives TO authenticated;
GRANT ALL ON agent_objectives TO service_role;
