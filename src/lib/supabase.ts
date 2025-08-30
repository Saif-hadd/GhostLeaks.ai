import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Types pour l'authentification
export type AuthUser = {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
  };
};

// Types pour les profils
export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  plan: 'free' | 'pro';
  scans_remaining: number;
  created_at: string;
  updated_at: string;
};

// Types pour les scans
export type Scan = {
  id: string;
  user_id: string;
  email_scanned: string;
  full_name: string | null;
  status: 'processing' | 'completed' | 'failed';
  threats_found: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ai_summary: string | null;
  breach_details: any[];
  pdf_report_url: string | null;
  created_at: string;
};

// Types pour les breaches
export type Breach = {
  id: string;
  name: string;
  domain: string | null;
  breach_date: string | null;
  added_date: string;
  pwn_count: number;
  description: string | null;
  data_classes: string[];
  is_verified: boolean;
  is_fabricated: boolean;
  is_sensitive: boolean;
  is_retired: boolean;
  logo_path: string | null;
};

// Types pour les alertes
export type UserAlert = {
  id: string;
  user_id: string;
  email_alerts: boolean;
  telegram_alerts: boolean;
  telegram_username: string | null;
  webhook_url: string | null;
  created_at: string;
  updated_at: string;
};