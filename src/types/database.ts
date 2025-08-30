export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          plan: 'free' | 'pro';
          scans_remaining: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          plan?: 'free' | 'pro';
          scans_remaining?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          plan?: 'free' | 'pro';
          scans_remaining?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      scans: {
        Row: {
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
        Insert: {
          id?: string;
          user_id: string;
          email_scanned: string;
          full_name?: string | null;
          status?: 'processing' | 'completed' | 'failed';
          threats_found?: number;
          severity?: 'low' | 'medium' | 'high' | 'critical';
          ai_summary?: string | null;
          breach_details?: any[];
          pdf_report_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email_scanned?: string;
          full_name?: string | null;
          status?: 'processing' | 'completed' | 'failed';
          threats_found?: number;
          severity?: 'low' | 'medium' | 'high' | 'critical';
          ai_summary?: string | null;
          breach_details?: any[];
          pdf_report_url?: string | null;
          created_at?: string;
        };
      };
      breaches: {
        Row: {
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
        Insert: {
          id?: string;
          name: string;
          domain?: string | null;
          breach_date?: string | null;
          added_date?: string;
          pwn_count?: number;
          description?: string | null;
          data_classes?: string[];
          is_verified?: boolean;
          is_fabricated?: boolean;
          is_sensitive?: boolean;
          is_retired?: boolean;
          logo_path?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          domain?: string | null;
          breach_date?: string | null;
          added_date?: string;
          pwn_count?: number;
          description?: string | null;
          data_classes?: string[];
          is_verified?: boolean;
          is_fabricated?: boolean;
          is_sensitive?: boolean;
          is_retired?: boolean;
          logo_path?: string | null;
        };
      };
      user_alerts: {
        Row: {
          id: string;
          user_id: string;
          email_alerts: boolean;
          telegram_alerts: boolean;
          telegram_username: string | null;
          webhook_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email_alerts?: boolean;
          telegram_alerts?: boolean;
          telegram_username?: string | null;
          webhook_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email_alerts?: boolean;
          telegram_alerts?: boolean;
          telegram_username?: string | null;
          webhook_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: 'free' | 'pro';
          status: 'active' | 'cancelled' | 'expired';
          current_period_start: string;
          current_period_end: string;
          stripe_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan: 'free' | 'pro';
          status?: 'active' | 'cancelled' | 'expired';
          current_period_start?: string;
          current_period_end?: string;
          stripe_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: 'free' | 'pro';
          status?: 'active' | 'cancelled' | 'expired';
          current_period_start?: string;
          current_period_end?: string;
          stripe_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}