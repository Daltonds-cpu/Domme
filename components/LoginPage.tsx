
import React, { useState } from 'react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleEnterSystem = () => {
    setIsLoading(true);
    // Simula uma validação de protocolo de luxo
    setTimeout(() => {
      localStorage.setItem('domme_auth_token', 'session_active');
      onLoginSuccess();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#1C1917] flex flex-col items-center justify-center px-6 text-center animate-in fade-in duration-1000">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#BF953F] rounded-full blur-[200px] opacity-[0.05]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#4A3F35] rounded-full blur-[200px] opacity-[0.08]"></div>
      </div>

      <div className="relative space-y-16 max-w-sm w-full animate-in zoom-in-95 duration-1000">
        <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full text-[#BF953F] animate-levitate" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="0.8"/>
            <circle cx="12" cy="12" r="1" fill="currentColor"/>
          </svg>
          <div className="absolute inset-0 bg-[#BF953F]/10 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-serif text-white tracking-[0.3em] uppercase leading-tight">
            Domme<span className="gold-gradient">Lash</span>
          </h1>
          <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-[#BF953F] to-transparent mx-auto"></div>
          <p className="text-[11px] uppercase tracking-[0.7em] text-stone-500 font-bold">The Elite Domain</p>
        </div>

        <div className="pt-10">
          <button
            onClick={handleEnterSystem}
            disabled={isLoading}
            className="w-full group relative flex items-center justify-center bg-transparent border border-[#BF953F]/40 hover:border-[#BF953F] px-8 py-6 rounded-2xl transition-all duration-700 overflow-hidden active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-[#BF953F]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-out"></div>
            
            <span className="relative text-[12px] font-bold text-white uppercase tracking-[0.4em] flex items-center justify-center">
              {isLoading ? (
                <span className="flex items-center space-x-3">
                  <span className="w-4 h-4 border border-[#BF953F] border-t-transparent rounded-full animate-spin"></span>
                  <span>Autenticando...</span>
                </span>
              ) : (
                "Acessar Domínio Elite"
              )}
            </span>
          </button>
        </div>

        <div className="pt-12 flex flex-col items-center space-y-4 opacity-40">
          <div className="w-6 h-[1px] bg-white/20"></div>
          <p className="text-[9px] text-stone-600 uppercase tracking-[0.5em] leading-relaxed">
            Sistema Local Seguro <br /> 
            Privacidade Master
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
