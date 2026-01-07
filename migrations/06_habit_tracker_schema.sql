-- ==============================================================================
-- MIGRACIÓN: Sistema de Hábitos (Espejo Digital)
-- ==============================================================================
-- Ejecutar este script en el Editor SQL de Supabase
-- ==============================================================================

-- ==============================================================================
-- PARTE 1: TABLA DE CATEGORÍAS (Las 7 Esferas)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS habit_categories (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  color TEXT NOT NULL
);

ALTER TABLE habit_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "habit_categories_select" ON habit_categories;
CREATE POLICY "habit_categories_select" ON habit_categories
  FOR SELECT TO authenticated USING (true);

-- Seed Data: Las 7 Esferas de la Vida
INSERT INTO habit_categories (id, name, emoji, color) VALUES
(1, 'Bio', '🩸', '#EF4444'),
(2, 'Ser', '🧘', '#8B5CF6'),
(3, 'Hustle', '💼', '#F59E0B'),
(4, 'Social', '❤️', '#EC4899'),
(5, 'Play', '🎨', '#10B981'),
(6, 'Entorno', '🏠', '#6366F1'),
(7, 'Detox', '⛔', '#6B7280')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  color = EXCLUDED.color;

-- ==============================================================================
-- PARTE 2: TABLA DE HÁBITOS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  category_id INT REFERENCES habit_categories(id) NOT NULL,
  frequency TEXT[] DEFAULT ARRAY['mon','tue','wed','thu','fri','sat','sun'],
  schedule_type TEXT CHECK (schedule_type IN ('flexible', 'fixed')) DEFAULT 'flexible',
  preferred_block TEXT CHECK (preferred_block IN ('morning', 'afternoon', 'evening', 'anytime')) DEFAULT 'anytime',
  fixed_time TIME,
  estimated_duration INT DEFAULT 15, -- minutos
  cognitive_load TEXT CHECK (cognitive_load IN ('high', 'medium', 'low')) DEFAULT 'medium',
  active BOOLEAN DEFAULT true,
  icon TEXT DEFAULT '📌',
  -- Campos de racha desnormalizados (actualizados por trigger)
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_completed_date DATE,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  end_date DATE
);

-- Índice compuesto para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_habits_user_active ON habits(user_id, active);

-- RLS
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "habits_select" ON habits;
CREATE POLICY "habits_select" ON habits
  FOR SELECT USING (auth.uid() = user_id OR is_mother());

DROP POLICY IF EXISTS "habits_insert" ON habits;
CREATE POLICY "habits_insert" ON habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "habits_update" ON habits;
CREATE POLICY "habits_update" ON habits
  FOR UPDATE USING (auth.uid() = user_id OR is_mother());

DROP POLICY IF EXISTS "habits_delete" ON habits;
CREATE POLICY "habits_delete" ON habits
  FOR DELETE USING (auth.uid() = user_id OR is_mother());

-- ==============================================================================
-- PARTE 3: TABLA DE LOGS DIARIOS
-- ==============================================================================

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

-- Índice compuesto
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, date);

-- RLS
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_logs_select" ON daily_logs;
CREATE POLICY "daily_logs_select" ON daily_logs
  FOR SELECT USING (auth.uid() = user_id OR is_mother());

DROP POLICY IF EXISTS "daily_logs_insert" ON daily_logs;
CREATE POLICY "daily_logs_insert" ON daily_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_logs_update" ON daily_logs;
CREATE POLICY "daily_logs_update" ON daily_logs
  FOR UPDATE USING (auth.uid() = user_id OR is_mother());

DROP POLICY IF EXISTS "daily_logs_delete" ON daily_logs;
CREATE POLICY "daily_logs_delete" ON daily_logs
  FOR DELETE USING (auth.uid() = user_id OR is_mother());

-- ==============================================================================
-- PARTE 4: TABLA DE COMPLETACIONES DE HÁBITOS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  daily_log_id UUID REFERENCES daily_logs(id) ON DELETE CASCADE NOT NULL,
  target_date DATE NOT NULL, -- Día lógico (puede diferir de completed_at)
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  value NUMERIC, -- Para hábitos con valor (ej: páginas leídas)
  UNIQUE(habit_id, daily_log_id)
);

-- Índice compuesto
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_target ON habit_completions(habit_id, target_date);

-- RLS (hereda permisos del habit vía JOIN)
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "habit_completions_select" ON habit_completions;
CREATE POLICY "habit_completions_select" ON habit_completions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM habits h 
      WHERE h.id = habit_completions.habit_id 
      AND (h.user_id = auth.uid() OR is_mother())
    )
  );

DROP POLICY IF EXISTS "habit_completions_insert" ON habit_completions;
CREATE POLICY "habit_completions_insert" ON habit_completions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM habits h 
      WHERE h.id = habit_completions.habit_id 
      AND h.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "habit_completions_delete" ON habit_completions;
CREATE POLICY "habit_completions_delete" ON habit_completions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM habits h 
      WHERE h.id = habit_completions.habit_id 
      AND (h.user_id = auth.uid() OR is_mother())
    )
  );

-- ==============================================================================
-- PARTE 5: TRIGGER PARA ACTUALIZAR RACHAS
-- ==============================================================================

CREATE OR REPLACE FUNCTION update_habit_streaks()
RETURNS TRIGGER AS $$
DECLARE
  v_habit_id UUID;
  v_target_date DATE;
  v_yesterday DATE;
  v_last_completed DATE;
  v_current_streak INT;
  v_longest_streak INT;
BEGIN
  -- Determinar habit_id y target_date según la operación
  IF TG_OP = 'DELETE' THEN
    v_habit_id := OLD.habit_id;
    v_target_date := OLD.target_date;
  ELSE
    v_habit_id := NEW.habit_id;
    v_target_date := NEW.target_date;
  END IF;

  -- Obtener datos actuales del hábito
  SELECT last_completed_date, current_streak, longest_streak
  INTO v_last_completed, v_current_streak, v_longest_streak
  FROM habits WHERE id = v_habit_id;

  v_yesterday := v_target_date - INTERVAL '1 day';

  IF TG_OP = 'INSERT' THEN
    -- Calcular nueva racha
    IF v_last_completed = v_yesterday THEN
      v_current_streak := COALESCE(v_current_streak, 0) + 1;
    ELSIF v_last_completed = v_target_date THEN
      -- Ya marcado hoy, no hacer nada
      RETURN NEW;
    ELSE
      v_current_streak := 1; -- Reiniciar racha
    END IF;
    
    -- Actualizar longest si es necesario
    IF v_current_streak > COALESCE(v_longest_streak, 0) THEN
      v_longest_streak := v_current_streak;
    END IF;
    
    UPDATE habits SET
      current_streak = v_current_streak,
      longest_streak = v_longest_streak,
      last_completed_date = v_target_date
    WHERE id = v_habit_id;

  ELSIF TG_OP = 'DELETE' THEN
    -- Recalcular racha solo si el día eliminado era el último completado
    IF v_last_completed = v_target_date THEN
      -- Buscar el nuevo último día completado
      SELECT MAX(target_date) INTO v_last_completed
      FROM habit_completions WHERE habit_id = v_habit_id;
      
      -- Recalcular current_streak contando días consecutivos hacia atrás
      IF v_last_completed IS NOT NULL THEN
        WITH consecutive AS (
          SELECT target_date,
                 target_date - (ROW_NUMBER() OVER (ORDER BY target_date DESC))::int AS grp
          FROM habit_completions WHERE habit_id = v_habit_id
        )
        SELECT COUNT(*) INTO v_current_streak
        FROM consecutive WHERE grp = (SELECT grp FROM consecutive ORDER BY target_date DESC LIMIT 1);
      ELSE
        v_current_streak := 0;
      END IF;
      
      UPDATE habits SET
        current_streak = COALESCE(v_current_streak, 0),
        last_completed_date = v_last_completed
      WHERE id = v_habit_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger
DROP TRIGGER IF EXISTS trg_update_streaks ON habit_completions;
CREATE TRIGGER trg_update_streaks
AFTER INSERT OR DELETE ON habit_completions
FOR EACH ROW EXECUTE FUNCTION update_habit_streaks();

-- ==============================================================================
-- ¡MIGRACIÓN COMPLETA!
-- ==============================================================================
