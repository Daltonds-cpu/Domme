
import React, { useState } from 'react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    // Simulação de acesso seguro local
    setTimeout(() => {
      onLoginSuccess();
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#1C1917] flex flex-col items-center justify-center px-6 text-center animate-in fade-in duration-1000">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-[#BF953F] rounded-full blur-[220px] opacity-[0.04]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#4A3F35] rounded-full blur-[200px] opacity-[0.06]"></div>
      </div>

      <div className="relative space-y-12 max-w-sm w-full animate-in zoom-in-95 duration-1000">
        <div className="relative mx-auto w-36 h-36 flex items-center justify-center">
          <svg className="w-full h-full text-[#BF953F] animate-levitate" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="0.8"/>
            <circle cx="12" cy="12" r="1" fill="currentColor"/>
            <path d="M5 8L4 6" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" />
            <path d="M12 4V2" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" />
            <path d="M19 8L20 6" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 bg-[#BF953F]/10 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-serif text-white tracking-[0.3em] uppercase leading-tight">
            Domme<span className="gold-gradient">Lash</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.8em] text-stone-500 font-bold">The Elite Domain</p>
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-[#BF953F]/40 to-transparent mx-auto mt-6"></div>
        </div>

        <div className="pt-8">
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full group relative flex items-center justify-center bg-[#1C1917] border border-[#BF953F]/30 hover:border-[#BF953F] px-8 py-5 rounded-full transition-all duration-700 overflow-hidden active:scale-[0.98] shadow-2xl"
          >
            <div className="absolute inset-0 bg-[#BF953F]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative text-[11px] font-bold text-white uppercase tracking-[0.3em]">
              {isLoading ? "Acessando Domínio..." : "Acessar Sistema Elite"}
            </span>
          </button>
        </div>

        <div className="pt-20 flex flex-col items-center space-y-4 opacity-30">
          <div className="w-8 h-[0.5px] bg-white/20"></div>
          <p className="text-[9px] text-stone-600 uppercase tracking-[0.5em] leading-relaxed">
            Desenvolvido por <br />
            <span className="text-stone-400">Dalton D. & Daniele M.</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
