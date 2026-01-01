-- Add captation start and end dates to agent_objectives table
ALTER TABLE agent_objectives 
ADD COLUMN IF NOT EXISTS captation_start_date DATE,
ADD COLUMN IF NOT EXISTS captation_end_date DATE;

-- Update existing records to have default values if needed (optional)
-- UPDATE agent_objectives SET captation_start_date = CURRENT_DATE, captation_end_date = CURRENT_DATE + INTERVAL '1 month' WHERE captation_start_date IS NULL;
