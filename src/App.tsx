import React from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import AuthModal from './components/AuthModal';
import Navigation from './components/Navigation';
import HeroSection from './components/HeroSection';
import ScanSection from './components/ScanSection';
import DashboardSection from './components/DashboardSection';
import PricingSection from './components/PricingSection';
import AlertsSection from './components/AlertsSection';
import PrivacySection from './components/PrivacySection';
import FAQSection from './components/FAQSection';

const AppContent: React.FC = () => {
  const { activeSection, showAuthModal, setShowAuthModal, authModalMode } = useApp();

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'scan':
        return <ScanSection />;
      case 'dashboard':
        return <DashboardSection />;
      case 'pricing':
        return <PricingSection />;
      case 'alerts':
        return <AlertsSection />;
      case 'privacy':
        return <PrivacySection />;
      case 'faq':
        return <FAQSection />;
      default:
        return <HeroSection />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-inter">
      <Navigation />
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />
      {renderActiveSection()}
      
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Roboto+Mono:wght@300;400;500;600;700&display=swap');
        
        .font-inter {
          font-family: 'Inter', sans-serif;
        }
        
        .font-mono {
          font-family: 'Roboto Mono', monospace;
        }
        
        .glow-effect {
          box-shadow: 0 0 20px rgba(0, 255, 65, 0.3);
        }
        
        .glow-effect:hover {
          box-shadow: 0 0 30px rgba(0, 255, 65, 0.5);
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;