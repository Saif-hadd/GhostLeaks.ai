import React, { useState } from 'react';
import { Search, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { translations } from '../translations';
import { ScanForm } from '../types';

const ScanSection: React.FC = () => {
  const { 
    language, 
    isScanning, 
    setIsScanning, 
    setActiveSection, 
    scanHistory, 
    setScanHistory,
    user,
    setUser,
    setShowAuthModal,
    setAuthModalMode
  } = useApp();
  
  const t = translations[language];
  const [scanForm, setScanForm] = useState<ScanForm>({ email: '', name: '', file: null });
  const [message, setMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' });

  // Redirect to auth if not logged in
  React.useEffect(() => {
    if (!user) {
      setAuthModalMode('signup');
      setShowAuthModal(true);
      setActiveSection('hero');
    }
  }, [user, setAuthModalMode, setShowAuthModal, setActiveSection]);

  if (!user) {
    return null; // Don't render if not authenticated
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setScanForm({ ...scanForm, file });
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (user?.plan === 'free' && (user?.scansRemaining ?? 0) <= 0) {
      setMessage({ type: 'error', text: 'No scans remaining. Please upgrade to Pro plan.' });
      return;
    }

    setIsScanning(true);
    setMessage({ type: null, text: '' });
    
    // Simulate scan process
    setTimeout(() => {
      const newScan = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        email: scanForm.email,
        status: Math.random() > 0.5 ? 'breach_found' : 'clean' as 'breach_found' | 'clean',
        threats: Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 1 : 0,
        aiSummary: Math.random() > 0.5 
          ? 'Potential security risks detected. Review recommended actions.'
          : 'No breaches detected. Your information appears secure.',
        severity: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low' as 'high' | 'medium' | 'low'
      };

      setScanHistory([newScan, ...(scanHistory ?? [])]);

      
      if (user?.plan === 'free') {
        setUser({ ...user, scansRemaining: (user?.scansRemaining ?? 0) - 1 });
      }
      
      setIsScanning(false);
      setMessage({ type: 'success', text: t.scan.success });
      
      // Reset form
      setScanForm({ email: '', name: '', file: null });
      
      // Navigate to dashboard after 2 seconds
      setTimeout(() => {
        setActiveSection('dashboard');
      }, 2000);
    }, 3000);
  };

  return (
    <section className="min-h-screen bg-gray-900 py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">{t.scan.title}</h2>
          <p className="text-gray-400 text-lg">{t.scan.subtitle}</p>
          {user?.plan === 'free' && (
            <p className="text-yellow-400 text-sm mt-2">
              Scans remaining: {user?.scansRemaining ?? 0}
            </p>
          )}
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

          <form onSubmit={handleScan} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t.scan.email}</label>
              <input
                type="email"
                required
                value={scanForm.email}
                onChange={(e) => setScanForm({...scanForm, email: e.target.value})}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors duration-200"
                placeholder="your@email.com"
                disabled={isScanning}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t.scan.name}</label>
              <input
                type="text"
                required
                value={scanForm.name}
                onChange={(e) => setScanForm({...scanForm, name: e.target.value})}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors duration-200"
                placeholder="John Doe"
                disabled={isScanning}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t.scan.upload}</label>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-green-500 transition-colors duration-200">
                <Upload className="mx-auto mb-4 text-gray-400" size={48} />
                {scanForm.file ? (
                  <div className="text-green-400 mb-2">
                    <CheckCircle className="inline mr-2" size={16} />
                    {t.scan.fileSelected}: {scanForm.file.name}
                  </div>
                ) : (
                  <p className="text-gray-400 mb-2">{t.scan.dragDrop}</p>
                )}
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  disabled={isScanning}
                />
                <label 
                  htmlFor="file-upload" 
                  className={`text-green-400 hover:text-green-300 cursor-pointer ${
                    isScanning ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {t.scan.chooseFile}
                </label>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isScanning || (user?.plan === 'free' && (user?.scansRemaining ?? 0) <= 0)}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 hover:shadow-lg hover:shadow-green-500/25 disabled:cursor-not-allowed"
            >
              {isScanning ? (
                <>
                  <div className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  {t.scan.processing}
                </>
              ) : (
                <>
                  <Search className="inline mr-2" size={20} />
                  {t.scan.scan}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ScanSection;
