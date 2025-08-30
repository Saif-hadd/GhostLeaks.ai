import React from 'react';
import { Check, Crown, Zap } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { translations } from '../translations';

const PricingSection: React.FC = () => {
  const { language, user, setUser, setActiveSection } = useApp();
  const t = translations[language];

  const handleSelectPlan = (plan: 'free' | 'pro') => {
    if (plan === 'pro' && user.plan === 'free') {
      // Simulate upgrade
      setUser({
        ...user,
        plan: 'pro',
        scansRemaining: 999 // Unlimited for pro
      });
      alert('Successfully upgraded to Pro plan!');
    } else if (plan === 'free' && user.plan === 'pro') {
      // Simulate downgrade
      setUser({
        ...user,
        plan: 'free',
        scansRemaining: 1
      });
      alert('Downgraded to Free plan.');
    }
  };

  const handleUpgradeClick = () => {
    if (user.plan === 'free') {
      handleSelectPlan('pro');
    } else {
      setActiveSection('dashboard');
    }
  };

  return (
    <section className="min-h-screen bg-gray-900 py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">{t.pricing.title}</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 border border-green-500/20 hover:border-green-400/40 transition-colors duration-200">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">{t.pricing.free}</h3>
              <p className="text-4xl font-bold text-green-400 mb-1">$0</p>
              <p className="text-gray-400">{t.pricing.perMonth}</p>
            </div>
            
            <ul className="space-y-3 mb-8">
              {t.pricing.freeFeatures.map((feature, index) => (
                <li key={index} className="flex items-center text-gray-300">
                  <Check className="text-green-400 mr-3 flex-shrink-0" size={16} />
                  {feature}
                </li>
              ))}
            </ul>
            
            <button 
              onClick={() => handleSelectPlan('free')}
              disabled={user.plan === 'free'}
              className={`w-full font-bold py-3 px-6 rounded-lg transition-all duration-200 ${
                user.plan === 'free'
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-700 hover:bg-gray-600 text-white transform hover:scale-105'
              }`}
            >
              {user.plan === 'free' ? t.pricing.currentPlan : t.pricing.selectPlan}
            </button>
          </div>
          
          {/* Pro Plan */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 border border-blue-500/20 hover:border-blue-400/40 transition-colors duration-200 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
              Popular
            </div>
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">{t.pricing.pro}</h3>
              <p className="text-4xl font-bold text-blue-400 mb-1">$19</p>
              <p className="text-gray-400">{t.pricing.perMonth}</p>
            </div>
            
            <ul className="space-y-3 mb-8">
              {t.pricing.proFeatures.map((feature, index) => (
                <li key={index} className="flex items-center text-gray-300">
                  <Check className="text-blue-400 mr-3 flex-shrink-0" size={16} />
                  {feature}
                </li>
              ))}
            </ul>
            
            <button 
              onClick={() => handleSelectPlan('pro')}
              disabled={user.plan === 'pro'}
              className={`w-full font-bold py-3 px-6 rounded-lg transition-all duration-300 ${
                user.plan === 'pro'
                  ? 'bg-blue-600 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transform hover:scale-105'
              }`}
            >
              {user.plan === 'pro' ? (
                <>
                  <Crown className="inline mr-2" size={16} />
                  {t.pricing.currentPlan}
                </>
              ) : (
                <>
                  <Zap className="inline mr-2" size={16} />
                  {t.pricing.upgrade}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Upgrade CTA for free users */}
        {user.plan === 'free' && (
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-6 border border-blue-500/30">
              <h3 className="text-xl font-bold text-white mb-2">Ready to upgrade?</h3>
              <p className="text-gray-300 mb-4">Get unlimited scans and advanced features with Pro</p>
              <button
                onClick={handleUpgradeClick}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                <Crown className="inline mr-2" size={16} />
                {t.pricing.upgrade}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default PricingSection;