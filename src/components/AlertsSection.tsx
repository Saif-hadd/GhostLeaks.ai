import React, { useState } from 'react';
import { Mail, MessageCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { translations } from '../translations';

const AlertsSection: React.FC = () => {
  const { language, alertSettings, setAlertSettings } = useApp();
  const t = translations[language];
  const [telegramUsername, setTelegramUsername] = useState(alertSettings.telegramUsername || '');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' });

  const handleToggle = (setting: 'email' | 'telegram') => {
    setAlertSettings({
      ...alertSettings,
      [setting]: !alertSettings[setting]
    });
  };

  const handleSave = () => {
    setAlertSettings({
      ...alertSettings,
      telegramUsername: telegramUsername
    });
    
    setMessage({ type: 'success', text: t.alerts.saved });
    
    // Clear message after 3 seconds
    setTimeout(() => {
      setMessage({ type: null, text: '' });
    }, 3000);
  };

  return (
    <section className="min-h-screen bg-gray-900 py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">{t.alerts.title}</h2>
          <p className="text-gray-400 text-lg">{t.alerts.subtitle}</p>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 border border-green-500/20">
          {message.type && (
            <div className={`mb-6 p-4 rounded-lg flex items-center ${
              message.type === 'success' 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="mr-2" size={20} />
              ) : (
                <AlertCircle className="mr-2" size={20} />
              )}
              {message.text}
            </div>
          )}

          <div className="space-y-6">
            {/* Email Notifications */}
            <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600/50">
              <div className="flex items-center space-x-4">
                <Mail className="text-green-400" size={24} />
                <div>
                  <h3 className="text-white font-medium">{t.alerts.email}</h3>
                  <p className="text-gray-400 text-sm">{t.alerts.emailDesc}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('email')}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                  alertSettings.email ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                  alertSettings.email ? 'transform translate-x-6' : ''
                }`}></div>
              </button>
            </div>
            
            {/* Telegram Notifications */}
            <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <MessageCircle className="text-blue-400" size={24} />
                  <div>
                    <h3 className="text-white font-medium">{t.alerts.telegram}</h3>
                    <p className="text-gray-400 text-sm">{t.alerts.telegramDesc}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('telegram')}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                    alertSettings.telegram ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                    alertSettings.telegram ? 'transform translate-x-6' : ''
                  }`}></div>
                </button>
              </div>
              
              {alertSettings.telegram && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t.alerts.telegramUsername}
                  </label>
                  <input
                    type="text"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors duration-200"
                    placeholder="@username"
                  />
                </div>
              )}
            </div>
            
            <button 
              onClick={handleSave}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25"
            >
              <CheckCircle className="inline mr-2" size={16} />
              {t.alerts.save}
            </button>
          </div>
        </div>
      </div>
    </section>

  );
};

export default AlertsSection;