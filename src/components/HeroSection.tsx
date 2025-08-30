import React, { useEffect, useRef } from 'react';
import { Search, Shield, Lock, Eye, Zap, LogIn } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { translations } from '../translations';

const HeroSection: React.FC = () => {
  const { language, setActiveSection, user, setShowAuthModal, setAuthModalMode } = useApp();
  const t = translations[language];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const matrixRef = useRef<HTMLDivElement>(null);

  const handleScanClick = () => {
    if (user) {
      setActiveSection('scan');
    } else {
      setAuthModalMode('signup');
      setShowAuthModal(true);
    }
  };

  const handleSignInClick = () => {
    setAuthModalMode('signin');
    setShowAuthModal(true);
  };

  // Matrix rain effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const matrix = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}";
    const matrixArray = matrix.split("");

    const fontSize = 10;
    const columns = canvas.width / fontSize;

    const drops: number[] = [];
    for (let x = 0; x < columns; x++) {
      drops[x] = 1;
    }

    function draw() {
      if (!ctx || !canvas) return;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#00ff41';
      ctx.font = fontSize + 'px monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = matrixArray[Math.floor(Math.random() * matrixArray.length)];
        ctx.fillStyle = Math.random() > 0.98 ? '#00d4ff' : '#00ff41';
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }

    const interval = setInterval(draw, 35);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Floating particles effect
  useEffect(() => {
    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.cssText = `
        position: absolute;
        width: ${Math.random() * 4 + 1}px;
        height: ${Math.random() * 4 + 1}px;
        background: ${Math.random() > 0.5 ? '#00ff41' : '#00d4ff'};
        border-radius: 50%;
        pointer-events: none;
        opacity: ${Math.random() * 0.8 + 0.2};
        left: ${Math.random() * 100}%;
        top: 100%;
        animation: floatUp ${Math.random() * 10 + 10}s linear infinite;
        box-shadow: 0 0 ${Math.random() * 10 + 5}px currentColor;
      `;
      
      if (matrixRef.current) {
        matrixRef.current.appendChild(particle);
        setTimeout(() => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
        }, 20000);
      }
    };

    const particleInterval = setInterval(createParticle, 200);
    return () => clearInterval(particleInterval);
  }, []);

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
      {/* Matrix Rain Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 opacity-30"
        style={{ zIndex: 1 }}
      />

      {/* Floating Particles Container */}
      <div ref={matrixRef} className="absolute inset-0" style={{ zIndex: 2 }} />

      {/* Animated Grid Background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 65, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 65, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite',
          zIndex: 1
        }}
      />

      {/* Scanning Lines Effect */}
      <div className="absolute inset-0" style={{ zIndex: 2 }}>
        <div className="scan-line"></div>
        <div className="scan-line-2"></div>
      </div>

      {/* Glitch Overlay */}
      <div className="absolute inset-0 opacity-5" style={{ zIndex: 3 }}>
        <div className="glitch-overlay"></div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
        {/* Floating Icons */}
        <div className="absolute -top-20 -left-20 text-green-400 opacity-20 animate-pulse">
          <Shield size={60} />
        </div>
        <div className="absolute -top-10 -right-16 text-blue-400 opacity-20 animate-pulse delay-1000">
          <Lock size={50} />
        </div>
        <div className="absolute -bottom-16 -left-10 text-red-400 opacity-20 animate-pulse delay-2000">
          <Eye size={45} />
        </div>
        <div className="absolute -bottom-20 -right-20 text-purple-400 opacity-20 animate-pulse delay-500">
          <Zap size={55} />
        </div>

        <div className="mb-8">
          {/* Animated Title with Typewriter Effect */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            <span className="inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-blue-400 to-green-400 animate-gradient-x typewriter">
                {t.hero.title}
              </span>
              <span className="blinking-cursor">|</span>
            </span>
          </h1>
          
          {/* Glitch Effect Subtitle */}
          <div className="relative">
            <p className="text-xl md:text-2xl text-gray-300 mb-4 font-mono glitch-text" data-text={t.hero.subtitle}>
              {t.hero.subtitle}
            </p>
          </div>
          
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8 fade-in-up">
            {t.hero.description}
          </p>
        </div>
        
        {/* Enhanced CTA Button */}
        <div className="relative inline-block">
          <button
            onClick={handleScanClick}
            className="relative bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-black font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 border-2 border-green-400 cyber-button overflow-hidden group"
          >
            <span className="relative z-10 flex items-center">
              <Search className="mr-2" size={20} />
              {user ? t.hero.cta : 'Get Started'}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:animate-shimmer"></div>
          </button>
          
          {/* Button Glow Effect */}
          <div className="absolute inset-0 bg-green-400 rounded-lg blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300 -z-10"></div>
        </div>

        {/* Sign In Button for non-authenticated users */}
        {!user && (
          <div className="mt-4">
            <button
              onClick={handleSignInClick}
              className="text-green-400 hover:text-green-300 font-medium transition-colors duration-200 flex items-center mx-auto"
            >
              <LogIn className="mr-2" size={16} />
              Already have an account? Sign In
            </button>
          </div>
        )}

        {/* Status Indicators */}
        <div className="mt-12 flex justify-center space-x-8 text-sm">
          <div className="flex items-center text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            <span className="font-mono">SYSTEM ONLINE</span>
          </div>
          <div className="flex items-center text-blue-400">
            <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse delay-500"></div>
            <span className="font-mono">AI READY</span>
          </div>
          <div className="flex items-center text-yellow-400">
            <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse delay-1000"></div>
            <span className="font-mono">SCANNING...</span>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }

        @keyframes gradient-x {
          0%, 100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }

        @keyframes glitch {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }

        .animate-shimmer {
          animation: shimmer 0.8s ease-out;
        }

        .typewriter {
          overflow: hidden;
          border-right: 2px solid #00ff41;
          white-space: nowrap;
          animation: typing 3.5s steps(40, end), blink-caret 0.75s step-end infinite;
        }

        @keyframes typing {
          from { width: 0; }
          to { width: 100%; }
        }

        .blinking-cursor {
          color: #00ff41;
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .glitch-text {
          position: relative;
        }

        .glitch-text:before,
        .glitch-text:after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .glitch-text:before {
          animation: glitch 0.3s infinite;
          color: #ff0040;
          z-index: -1;
        }

        .glitch-text:after {
          animation: glitch 0.3s infinite reverse;
          color: #00d4ff;
          z-index: -2;
        }

        .scan-line {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #00ff41, transparent);
          animation: scanDown 4s linear infinite;
        }

        .scan-line-2 {
          position: absolute;
          top: 0;
          right: 0;
          width: 2px;
          height: 100%;
          background: linear-gradient(180deg, transparent, #00d4ff, transparent);
          animation: scanRight 6s linear infinite;
        }

        @keyframes scanDown {
          0% { top: 0; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }

        @keyframes scanRight {
          0% { right: 0; opacity: 0; }
          50% { opacity: 1; }
          100% { right: 100%; opacity: 0; }
        }

        .cyber-button {
          position: relative;
          overflow: hidden;
        }

        .cyber-button:before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }

        .cyber-button:hover:before {
          left: 100%;
        }

        .glitch-overlay {
          width: 100%;
          height: 100%;
          background: repeating-linear-gradient(
            90deg,
            transparent,
            transparent 2px,
            rgba(0, 255, 65, 0.03) 2px,
            rgba(0, 255, 65, 0.03) 4px
          );
          animation: glitchMove 0.1s infinite linear alternate-reverse;
        }

        @keyframes glitchMove {
          0% { transform: translateX(0); }
          100% { transform: translateX(2px); }
        }

        .fade-in-up {
          animation: fadeInUp 1s ease-out 0.5s both;
        }
      `}</style>
    </section>
  );
};

export default HeroSection;