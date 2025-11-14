import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eueccnznvvwnmyzciwbe.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1ZWNjbnpudnZ3bm15emNpd2JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTkwNTQsImV4cCI6MjA3ODY5NTA1NH0.yanokeP_2OFnfG5MFb8hVLMipsr_hXl_YLasnGOcqxY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
