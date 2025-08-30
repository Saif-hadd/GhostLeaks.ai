/*
  # Schema initial pour GhostLeaks.ai

  1. Nouvelles Tables
    - `profiles` - Profils utilisateurs étendus
      - `id` (uuid, clé primaire, référence auth.users)
      - `email` (text)
      - `full_name` (text)
      - `plan` (text) - 'free' ou 'pro'
      - `scans_remaining` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `scans` - Historique des scans
      - `id` (uuid, clé primaire)
      - `user_id` (uuid, référence profiles)
      - `email_scanned` (text)
      - `full_name` (text)
      - `status` (text) - 'processing', 'completed', 'failed'
      - `threats_found` (integer)
      - `severity` (text) - 'low', 'medium', 'high', 'critical'
      - `ai_summary` (text)
      - `breach_details` (jsonb)
      - `pdf_report_url` (text)
      - `created_at` (timestamp)
    
    - `breaches` - Base de données des breaches connues
      - `id` (uuid, clé primaire)
      - `name` (text)
      - `domain` (text)
      - `breach_date` (date)
      - `added_date` (timestamp)
      - `pwn_count` (bigint)
      - `description` (text)
      - `data_classes` (text[])
      - `is_verified` (boolean)
      - `is_fabricated` (boolean)
      - `is_sensitive` (boolean)
      - `is_retired` (boolean)
      - `logo_path` (text)
    
    - `user_alerts` - Configuration des alertes
      - `id` (uuid, clé primaire)
      - `user_id` (uuid, référence profiles)
      - `email_alerts` (boolean)
      - `telegram_alerts` (boolean)
      - `telegram_username` (text)
      - `webhook_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `subscriptions` - Gestion des abonnements
      - `id` (uuid, clé primaire)
      - `user_id` (uuid, référence profiles)
      - `plan` (text)
      - `status` (text) - 'active', 'cancelled', 'expired'
      - `current_period_start` (timestamp)
      - `current_period_end` (timestamp)
      - `stripe_subscription_id` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Sécurité
    - Activer RLS sur toutes les tables
    - Politiques pour l'accès utilisateur sécurisé
    - Fonctions pour la gestion des scans
*/

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  scans_remaining integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des scans
CREATE TABLE IF NOT EXISTS scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  email_scanned text NOT NULL,
  full_name text,
  status text DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  threats_found integer DEFAULT 0,
  severity text DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  ai_summary text,
  breach_details jsonb DEFAULT '[]'::jsonb,
  pdf_report_url text,
  created_at timestamptz DEFAULT now()
);

-- Table des breaches connues
CREATE TABLE IF NOT EXISTS breaches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text,
  breach_date date,
  added_date timestamptz DEFAULT now(),
  pwn_count bigint DEFAULT 0,
  description text,
  data_classes text[] DEFAULT '{}',
  is_verified boolean DEFAULT false,
  is_fabricated boolean DEFAULT false,
  is_sensitive boolean DEFAULT false,
  is_retired boolean DEFAULT false,
  logo_path text
);

-- Table des alertes utilisateur
CREATE TABLE IF NOT EXISTS user_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  email_alerts boolean DEFAULT true,
  telegram_alerts boolean DEFAULT false,
  telegram_username text,
  webhook_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des abonnements
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan text NOT NULL CHECK (plan IN ('free', 'pro')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz DEFAULT now() + interval '1 month',
  stripe_subscription_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE breaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Politiques RLS pour scans
CREATE POLICY "Users can read own scans"
  ON scans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scans"
  ON scans
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scans"
  ON scans
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Politiques RLS pour breaches (lecture publique pour les utilisateurs authentifiés)
CREATE POLICY "Authenticated users can read breaches"
  ON breaches
  FOR SELECT
  TO authenticated
  USING (true);

-- Politiques RLS pour user_alerts
CREATE POLICY "Users can manage own alerts"
  ON user_alerts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politiques RLS pour subscriptions
CREATE POLICY "Users can read own subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Fonction pour créer un profil automatiquement
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO user_alerts (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer un profil automatiquement
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER user_alerts_updated_at
  BEFORE UPDATE ON user_alerts
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Insérer des données de test pour les breaches
INSERT INTO breaches (name, domain, breach_date, pwn_count, description, data_classes, is_verified) VALUES
('Adobe', 'adobe.com', '2013-10-04', 152445165, 'In October 2013, 153 million Adobe accounts were breached with each containing an internal ID, username, email, encrypted password and a password hint in plain text.', ARRAY['Email addresses', 'Password hints', 'Passwords', 'Usernames'], true),
('LinkedIn', 'linkedin.com', '2012-06-05', 164611595, 'In May 2016, LinkedIn had 164 million email addresses and passwords exposed. Originally hacked in 2012, the data remained out of sight until being offered for sale on a dark market site 4 years later.', ARRAY['Email addresses', 'Passwords'], true),
('Yahoo', 'yahoo.com', '2013-08-01', 3000000000, 'In August 2013, 1 billion Yahoo accounts were compromised. In December 2016, Yahoo disclosed a second breach from 2014 affecting 500 million accounts.', ARRAY['Backup email addresses', 'Date of birth', 'Email addresses', 'Names', 'Passwords', 'Phone numbers', 'Security questions and answers'], true),
('Equifax', 'equifax.com', '2017-07-29', 147900000, 'In September 2017, Equifax announced a cybersecurity incident that potentially impacted approximately 147.9 million U.S. consumers.', ARRAY['Credit card numbers', 'Email addresses', 'Names', 'Phone numbers', 'Physical addresses', 'Social security numbers'], true),
('Facebook', 'facebook.com', '2019-04-03', 533000000, 'In April 2021, a large amount of Facebook data was made freely available on a popular hacking forum. The data was originally scraped in 2019 and contained 533 million records.', ARRAY['Email addresses', 'Names', 'Phone numbers', 'Physical addresses'], true);