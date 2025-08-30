import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Language, Section, ScanData, AlertSettings } from '../types';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  activeSection: Section;
  setActiveSection: (section: Section) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  alertSettings: AlertSettings;
  setAlertSettings: (settings: AlertSettings) => void;
  isScanning: boolean;
  setIsScanning: (scanning: boolean) => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  authModalMode: 'signin' | 'signup';
  setAuthModalMode: (mode: 'signin' | 'signup') => void;
  scanHistory: ScanData[];
  setScanHistory: (history: ScanData[]) => void;
  user: any;
  setUser: (user: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [activeSection, setActiveSection] = useState<Section>('hero');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [scanHistory, setScanHistory] = useState<ScanData[]>([]);
  const [user, setUser] = useState<any>({
    id: '1',
    email: 'demo@example.com',
    name: 'Demo User',
    plan: 'free',
    scansRemaining: 1
  });
  
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    email: true,
    telegram: false,
    telegramUsername: ''
  });

  return (
    <AppContext.Provider value={{
      language,
      setLanguage,
      activeSection,
      setActiveSection,
      mobileMenuOpen,
      setMobileMenuOpen,
      alertSettings,
      setAlertSettings,
      isScanning,
      setIsScanning,
      showAuthModal,
      setShowAuthModal,
      authModalMode,
      setAuthModalMode,
      scanHistory,
      setScanHistory,
      user,
      setUser
    }}>
      {children}
    </AppContext.Provider>
  );
};