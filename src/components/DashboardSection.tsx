import React from 'react';
import { Download, Eye, FileText, AlertTriangle, Shield, Clock } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { translations } from '../translations';

const DashboardSection: React.FC = () => {
  const { language, scanHistory, user, setShowAuthModal, setAuthModalMode, setActiveSection } = useApp();
  const t = translations[language];

  // Redirect to auth if not logged in
  React.useEffect(() => {
    if (!user) {
      setAuthModalMode('signin');
      setShowAuthModal(true);
      setActiveSection('hero');
    }
  }, [user, setAuthModalMode, setShowAuthModal, setActiveSection]);

  if (!user) {
    return null; // Don't render if not authenticated
  }

  const handleDownloadReport = (scanId: number) => {
    // Simulate PDF download
    const link = document.createElement('a');
    link.href = '#';
    link.download = `security-report-${scanId}.pdf`;
    link.click();
    
    // Show notification
    alert('Report download started!');
  };

  const handleViewDetails = (scanId: number) => {
    alert(`Viewing details for scan ${scanId}`);
  };

  const getThreatCounts = () => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    scanHistory.forEach(scan => {
      if (scan.status === 'breach_found') {
        counts[scan.severity as keyof typeof counts]++;
      }
    });
    return counts;
  };

  const threatCounts = getThreatCounts();

  return (
    <section className="min-h-screen bg-gray-900 py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">{t.dashboard.title}</h2>
          <div className="flex justify-center items-center space-x-4 text-sm">
            <span className="text-gray-400">Plan: </span>
            <span className={`px-3 py-1 rounded-full font-medium ${
              user.plan === 'pro' 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {user.plan.toUpperCase()}
            </span>
            {user.plan === 'free' && (
              <>
                <span className="text-gray-400">Scans remaining: </span>
                <span className="text-yellow-400 font-medium">{user.scansRemaining}</span>
              </>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Scan History */}
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold text-white mb-6">{t.dashboard.scanHistory}</h3>
            {scanHistory.length === 0 ? (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 border border-green-500/20 text-center">
                <Shield className="mx-auto mb-4 text-gray-400" size={48} />
                <p className="text-gray-400">{t.dashboard.noScans}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {scanHistory.map((scan) => (
                  <div key={scan.id} className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-green-500/20 hover:border-green-400/40 transition-colors duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          scan.severity === 'critical' ? 'bg-red-600' :
                          scan.severity === 'high' ? 'bg-red-500' : 
                          scan.severity === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}></div>
                        <span className="text-white font-medium">{scan.email}</span>
                        <div className="flex items-center text-gray-400 text-sm">
                          <Clock className="mr-1" size={14} />
                          {scan.date}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          scan.status === 'breach_found' 
                            ? 'bg-red-500/20 text-red-400' 
                            : scan.status === 'processing'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {scan.threats} {t.dashboard.threats}
                        </span>
                        <button 
                          onClick={() => handleViewDetails(scan.id)}
                          className="text-blue-400 hover:text-blue-300 text-sm transition-colors duration-200"
                        >
                          <Eye className="inline mr-1" size={14} />
                          {t.dashboard.viewDetails}
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">{t.dashboard.aiSummary}</h4>
                      <p className="text-gray-400 text-sm">{scan.aiSummary}</p>
                    </div>
                    
                    <button 
                      onClick={() => handleDownloadReport(scan.id)}
                      className="text-green-400 hover:text-green-300 text-sm flex items-center transition-colors duration-200"
                    >
                      <Download className="mr-2" size={16} />
                      {t.dashboard.downloadReport}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Threat Overview */}
          <div className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-green-500/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <AlertTriangle className="mr-2 text-red-400" size={20} />
                {t.dashboard.threats}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">{t.dashboard.critical}</span>
                  <span className="text-red-600 font-bold">{threatCounts.critical}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">{t.dashboard.high}</span>
                  <span className="text-red-400 font-bold">{threatCounts.high}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">{t.dashboard.medium}</span>
                  <span className="text-yellow-400 font-bold">{threatCounts.medium}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">{t.dashboard.low}</span>
                  <span className="text-green-400 font-bold">{threatCounts.low}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-green-500/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <FileText className="mr-2 text-blue-400" size={20} />
                {t.dashboard.reports}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">{t.dashboard.monthlyReport}</span>
                  <button className="text-green-400 hover:text-green-300 transition-colors duration-200">
                    <FileText size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">{t.dashboard.threatAnalysis}</span>
                  <button className="text-green-400 hover:text-green-300 transition-colors duration-200">
                    <FileText size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardSection;