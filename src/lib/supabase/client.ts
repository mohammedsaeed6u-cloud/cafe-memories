import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export function createClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://rflyenjmzgssxzcockss.supabase.co';
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbHllbmptemdzc3h6Y29ja3NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NDIyNjcsImV4cCI6MjEwMDMxODI2N30.mockAnonKeyForResilience';

  return createBrowserClient<any>(url, key);
}
