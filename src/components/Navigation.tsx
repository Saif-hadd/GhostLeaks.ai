import React from 'react';
import { Shield, Globe, Menu, X, User, LogOut } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { translations } from '../translations';

const Navigation: React.FC = () => {
  const { 
    language, 
    setLanguage, 
    activeSection, 
    setActiveSection, 
    mobileMenuOpen, 
    setMobileMenuOpen,
    showAuthModal,
    setShowAuthModal,
    setAuthModalMode,
    user
  } = useApp();
  
  const t = translations[language];

  const handleLanguageToggle = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  const handleNavClick = (section: string) => {
    setActiveSection(section as any);
    setMobileMenuOpen(false);
  };

  const handleSignIn = () => {
    setAuthModalMode('signin');
    setShowAuthModal(true);
  };

  const handleSignUp = () => {
    setAuthModalMode('signup');
    setShowAuthModal(true);
  };

  const handleSignOut = () => {
    // Simulate sign out
    alert('Signed out successfully');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-green-500/20">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="text-green-400" size={28} />
            <span className="text-xl font-bold text-white font-mono">GhostLeaks.ai</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {Object.entries(t.nav).map(([key, label]) => (
              <button
                key={key}
                onClick={() => handleNavClick(key)}
                className={`text-sm font-medium transition-colors duration-200 ${
                  activeSection === key 
                    ? 'text-green-400 border-b-2 border-green-400' 
                    : 'text-gray-300 hover:text-green-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          
          {/* Language Switcher */}
          <div className="flex items-center space-x-4">
            {/* Auth Buttons */}
            {user ? (
              <div className="hidden md:flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-gray-300">
                  <User size={16} />
                  <span className="text-sm">{user.name}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.plan === 'pro' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {user.plan.toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-gray-300 hover:text-red-400 transition-colors duration-200"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-4">
                <button
                  onClick={handleSignIn}
                  className="text-gray-300 hover:text-green-400 transition-colors duration-200 text-sm font-medium"
                >
                  Sign In
                </button>
                <button
                  onClick={handleSignUp}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 text-sm"
                >
                  Sign Up
                </button>
              </div>
            )}

            <button
              onClick={handleLanguageToggle}
              className="flex items-center space-x-2 text-gray-300 hover:text-green-400 transition-colors duration-200"
            >
              <Globe size={16} />
              <span className="text-sm font-medium">{language.toUpperCase()}</span>
            </button>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-300 hover:text-green-400"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-green-500/20">
            {Object.entries(t.nav).map(([key, label]) => (
              <button
                key={key}
                onClick={() => handleNavClick(key)}
                className={`block w-full text-left py-2 px-4 text-sm font-medium transition-colors duration-200 ${
                  activeSection === key 
                    ? 'text-green-400 bg-green-500/10' 
                    : 'text-gray-300 hover:text-green-400 hover:bg-green-500/5'
                }`}
              >
                {label}
              </button>
            ))}
            
            {/* Mobile Auth Buttons */}
            <div className="mt-4 pt-4 border-t border-gray-700/50">
              {user ? (
                <div className="space-y-2">
                  <div className="px-4 py-2 text-gray-300 text-sm">
                    <User className="inline mr-2" size={16} />
                    {user.name} ({user.plan.toUpperCase()})
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left py-2 px-4 text-sm font-medium text-red-400 hover:text-red-300 transition-colors duration-200"
                  >
                    <LogOut className="inline mr-2" size={16} />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleSignIn}
                    className="block w-full text-left py-2 px-4 text-sm font-medium text-gray-300 hover:text-green-400 transition-colors duration-200"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={handleSignUp}
                    className="block w-full text-left py-2 px-4 text-sm font-medium text-green-400 hover:text-green-300 transition-colors duration-200"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;