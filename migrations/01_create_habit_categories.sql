-- Create habit_categories table
CREATE TABLE IF NOT EXISTS habit_categories (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  color TEXT NOT NULL
);

-- Turn on RLS
ALTER TABLE habit_categories ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access to authenticated users" ON habit_categories
  FOR SELECT TO authenticated USING (true);

-- Insert the 7 spheres
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
