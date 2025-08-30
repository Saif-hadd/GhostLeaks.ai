import React from 'react';
import { Shield, Eye, Users, Lock, Server, UserCheck } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { translations } from '../translations';

const PrivacySection: React.FC = () => {
  const { language } = useApp();
  const t = translations[language];

  const privacyFeatures = [
    {
      icon: Shield,
      title: t.privacy.encryption,
      description: t.privacy.encryptionDesc,
      color: 'text-green-400',
      borderColor: 'border-green-500/20'
    },
    {
      icon: Eye,
      title: t.privacy.noStorage,
      description: t.privacy.noStorageDesc,
      color: 'text-blue-400',
      borderColor: 'border-blue-500/20'
    },
    {
      icon: Users,
      title: t.privacy.anonymous,
      description: t.privacy.anonymousDesc,
      color: 'text-purple-400',
      borderColor: 'border-purple-500/20'
    }
  ];

  const additionalFeatures = [
    {
      icon: Lock,
      title: 'Zero-Knowledge Architecture',
      description: 'Our systems are designed so that even we cannot access your personal data.',
      color: 'text-yellow-400'
    },
    {
      icon: Server,
      title: 'Secure Infrastructure',
      description: 'All data processing happens on secure, encrypted servers with regular security audits.',
      color: 'text-red-400'
    },
    {
      icon: UserCheck,
      title: 'GDPR Compliant',
      description: 'Full compliance with European data protection regulations and user rights.',
      color: 'text-indigo-400'
    }
  ];

  return (
    <section className="min-h-screen bg-gray-900 py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">{t.privacy.title}</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">{t.privacy.subtitle}</p>
        </div>
        
        {/* Main Privacy Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {privacyFeatures.map((feature, index) => (
            <div 
              key={index}
              className={`bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border ${feature.borderColor} text-center hover:border-opacity-60 transition-all duration-300 transform hover:scale-105`}
            >
              <feature.icon className={`${feature.color} mx-auto mb-4`} size={48} />
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Additional Security Features */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-8 border border-gray-700/50 mb-12">
          <h3 className="text-2xl font-bold text-white mb-8 text-center">Additional Security Measures</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {additionalFeatures.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4">
                <feature.icon className={`${feature.color} flex-shrink-0 mt-1`} size={24} />
                <div>
                  <h4 className="text-white font-medium mb-2">{feature.title}</h4>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Processing Information */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 border border-green-500/20">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Shield className="mr-3 text-green-400" size={24} />
            How We Handle Your Data
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-green-400 mb-3">What We Collect</h4>
              <ul className="space-y-2 text-gray-300">
                <li>• Email addresses for breach checking</li>
                <li>• Names for personalized reports</li>
                <li>• PDF documents (processed, not stored)</li>
                <li>• Scan results and timestamps</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-blue-400 mb-3">What We Don't Do</h4>
              <ul className="space-y-2 text-gray-300">
                <li>• Store personal information permanently</li>
                <li>• Share data with third parties</li>
                <li>• Track user behavior across sites</li>
                <li>• Use data for advertising purposes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrivacySection;