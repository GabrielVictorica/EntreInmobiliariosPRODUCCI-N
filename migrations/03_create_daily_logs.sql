-- Create daily_logs table
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  date DATE NOT NULL,
  mood_score INT CHECK (mood_score BETWEEN 1 AND 5),
  energy_score INT CHECK (energy_score BETWEEN 1 AND 10),
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- RLS
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own daily_logs" ON daily_logs
  USING (auth.uid() = user_id);
