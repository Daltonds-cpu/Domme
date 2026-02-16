
import React, { useState } from 'react';
import { loginWithGoogle } from '../services/firebase';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      onLoginSuccess();
    } catch (err: any) {
      console.error(err);
      setError("Falha na autenticação. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#1C1917] flex flex-col items-center justify-center px-6 text-center animate-in fade-in duration-1000">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-[#BF953F] rounded-full blur-[220px] opacity-[0.04]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#4A3F35] rounded-full blur-[200px] opacity-[0.06]"></div>
      </div>

      <div className="relative space-y-12 max-w-sm w-full animate-in zoom-in-95 duration-1000">
        <div className="relative mx-auto w-36 h-36 flex items-center justify-center">
          <svg className="w-full h-full text-[#BF953F] animate-levitate" viewBox="0 0 24 24" fill="none">
            <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="0.8"/>
            <circle cx="12" cy="12" r="1" fill="currentColor"/>
          </svg>
          <div className="absolute inset-0 bg-[#BF953F]/10 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-serif text-white tracking-[0.3em] uppercase leading-tight">
            Domme<span className="gold-gradient">Lash</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.8em] text-stone-500 font-bold">The Elite Domain</p>
        </div>

        <div className="pt-8 space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full group relative flex items-center justify-center bg-[#1C1917] border border-[#BF953F]/30 hover:border-[#BF953F] px-8 py-5 rounded-full transition-all duration-700 overflow-hidden active:scale-[0.98] shadow-2xl"
          >
            <div className="absolute inset-0 bg-[#BF953F]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center space-x-4">
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-[#BF953F] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              <span className="text-[11px] font-bold text-white uppercase tracking-[0.3em]">
                {isLoading ? "Validando Acesso..." : "Entrar com Google"}
              </span>
            </div>
          </button>
          {error && <p className="text-[9px] text-red-500 uppercase tracking-widest">{error}</p>}
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
