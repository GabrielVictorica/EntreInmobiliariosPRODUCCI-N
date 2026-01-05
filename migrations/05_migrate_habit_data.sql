-- Migrate data from habit_logs to daily_logs and habit_completions

DO $$
BEGIN
  -- 1. Create daily_logs for existing habit_logs dates
  INSERT INTO daily_logs (user_id, date, created_at)
  SELECT DISTINCT user_id, date, NOW()
  FROM habit_logs
  ON CONFLICT (user_id, date) DO NOTHING;

  -- 2. Insert completions
  INSERT INTO habit_completions (habit_id, daily_log_id, completed_at, value)
  SELECT 
    hl.habit_id,
    dl.id as daily_log_id,
    (hl.date + TIME '12:00:00')::timestamptz as completed_at, -- Approximation
    hl.current_value
  FROM habit_logs hl
  JOIN daily_logs dl ON hl.user_id = dl.user_id AND hl.date = dl.date
  WHERE hl.completed = true OR hl.current_value > 0
  ON CONFLICT (habit_id, daily_log_id) DO NOTHING;

END $$;
