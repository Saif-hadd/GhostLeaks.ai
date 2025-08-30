import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { translations } from '../translations';

const FAQSection: React.FC = () => {
  const { language } = useApp();
  const t = translations[language];
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <section className="min-h-screen bg-gray-900 py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <HelpCircle className="mx-auto mb-4 text-green-400" size={48} />
          <h2 className="text-4xl font-bold text-white mb-4">{t.faq.title}</h2>
        </div>
        
        <div className="space-y-4">
          {t.faq.questions.map((item, index) => (
            <div 
              key={index} 
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-green-500/20 overflow-hidden hover:border-green-400/40 transition-colors duration-200"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-700/50 transition-colors duration-200"
              >
                <span className="text-white font-medium pr-4">{item.q}</span>
                <ChevronDown 
                  className={`text-green-400 transition-transform duration-200 flex-shrink-0 ${
                    openFaq === index ? 'transform rotate-180' : ''
                  }`} 
                  size={20} 
                />
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ${
                openFaq === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="px-6 pb-4 border-t border-gray-700">
                  <p className="text-gray-400 pt-4 leading-relaxed">{item.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className="mt-12 text-center">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-blue-500/20">
            <h3 className="text-xl font-bold text-white mb-2">Still have questions?</h3>
            <p className="text-gray-400 mb-4">Our support team is here to help you 24/7</p>
            <button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;