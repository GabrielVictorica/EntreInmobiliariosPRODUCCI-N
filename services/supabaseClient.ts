
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://whfoflccshoztjlesnhh.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZm9mbGNjc2hvenRqbGVzbmhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzUwMzEsImV4cCI6MjA4MTMxMTAzMX0.rPQdO1qCovC9WP3ttlDOArvTI7I15lg7fnOPkJseDos';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Supabase credentials missing even after fallback.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        storage: localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});
