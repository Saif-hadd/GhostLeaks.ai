export interface ScanData {
  id: number;
  date: string;
  email: string;
  status: 'breach_found' | 'clean' | 'processing';
  threats: number;
  aiSummary: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ScanForm {
  email: string;
  name: string;
  file: File | null;
}

export interface AlertSettings {
  email: boolean;
  telegram: boolean;
  telegramUsername?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro';
  scansRemaining: number;
}

export type Language = 'en' | 'fr';
export type Section = 'hero' | 'scan' | 'dashboard' | 'pricing' | 'alerts' | 'privacy' | 'faq';