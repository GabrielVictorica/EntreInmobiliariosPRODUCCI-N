-- Run this in the Supabase SQL Editor to fix the saving error

-- 1. Create the table if it doesn't exist
create table if not exists user_settings (
  user_id uuid references auth.users not null primary key,
  goals jsonb,
  updated_at timestamp with time zone
);

-- 2. If table exists but column is missing, this adds it consistently
alter table user_settings 
add column if not exists goals jsonb;

-- 3. Enable RLS
alter table user_settings enable row level security;

-- 4. Create policies
create policy "Users can view their own settings" 
on user_settings for select 
using (auth.uid() = user_id);

create policy "Users can insert their own settings" 
on user_settings for insert 
with check (auth.uid() = user_id);

create policy "Users can update their own settings" 
on user_settings for update 
using (auth.uid() = user_id);
