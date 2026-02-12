
import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // Autenticação Real via Firebase Google Auth
      await signInWithPopup(auth, googleProvider);
      onLoginSuccess();
    } catch (error) {
      console.error("Erro na autenticação Firebase:", error);
      alert("Falha na conexão com o Protocolo de Segurança. Verifique sua conta Google.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#1C1917] flex flex-col items-center justify-center px-6 text-center animate-in fade-in duration-1000">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#BF953F] rounded-full blur-[180px] opacity-[0.03]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#4A3F35] rounded-full blur-[180px] opacity-[0.05]"></div>
      </div>

      <div className="relative space-y-12 max-w-sm w-full animate-in zoom-in-95 duration-1000">
        {/* Ícone de Olho Minimalista */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <svg className="w-full h-full text-[#BF953F] animate-pulse" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1"/>
            <circle cx="12" cy="12" r="1" fill="currentColor"/>
          </svg>
          <div className="absolute inset-0 bg-[#BF953F]/10 rounded-full blur-2xl animate-gold-pulse"></div>
        </div>

        {/* Branding */}
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-serif text-white tracking-[0.2em] uppercase">
            Domme<span className="gold-gradient">Lash</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.5em] text-stone-500 font-bold">The Luxury Domain System</p>
        </div>

        {/* Login Button */}
        <div className="pt-6">
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full group relative flex items-center justify-center space-x-4 bg-white/[0.03] border border-white/10 hover:border-[#BF953F]/40 px-8 py-5 rounded-2xl transition-all duration-500 overflow-hidden active:scale-95 disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-[#BF953F]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-[#BF953F] border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            <span className="relative text-[11px] font-bold text-white uppercase tracking-[0.2em]">
              {isLoading ? 'Conectando ao Firebase...' : 'Entrar com Google'}
            </span>
          </button>
        </div>

        {/* Footer info */}
        <p className="text-[9px] text-stone-600 uppercase tracking-widest leading-relaxed">
          Acesso exclusivo para membros certificados <br /> da rede Domme Lash Elite.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
