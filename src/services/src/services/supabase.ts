import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bkgtlddjmfkjfmjeogzu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrZ3RsZGRqbWZramZtamVvZ3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNTg4NTgsImV4cCI6MjEwMjgzNDg1OH0.lwuF0TdSdHqBAunTd-frnAYNo44k8P3RK9M01QRsxaU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);