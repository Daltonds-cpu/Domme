
import React from 'react';

const AboutTab: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-180px)] md:min-h-full w-full px-5 py-10 md:py-0 space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-24 md:pb-0 text-center">
      {/* Logotipo e Versão - Topo Centralizado */}
      <div className="space-y-4 w-full flex flex-col items-center">
        <p className="text-[10px] md:text-[11px] uppercase tracking-[0.5em] text-[#BF953F] font-bold">Domme Lash Elite System</p>
        <h2 className="text-4xl md:text-7xl font-serif font-bold tracking-[0.2em] text-white leading-tight">
          DOMME LASH <span className="gold-gradient">ELITE</span>
        </h2>
        <p className="text-[11px] uppercase tracking-[0.6em] text-stone-500 font-light">Versão 1.0.0 Stable</p>
      </div>

      <div className="w-24 h-[1px] gold-bg opacity-30"></div>

      {/* Card Principal - Glassmorphism Responsivo */}
      <div className="glass p-8 md:p-16 rounded-[2.5rem] md:rounded-[3rem] border-[#BF953F]/10 w-[95%] md:w-full max-w-2xl text-center space-y-10 relative overflow-hidden group flex flex-col items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#BF953F]/5 to-transparent pointer-events-none"></div>
        
        {/* Bloco de Desenvolvedores */}
        <div className="space-y-4 relative z-10 w-full flex flex-col items-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-stone-400 font-light">
            Desenvolvido com exclusividade por
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center space-y-2 md:space-y-0 md:space-x-4">
            <p className="text-2xl md:text-3xl font-serif italic text-white leading-relaxed">
              <span className="gold-gradient font-bold not-italic group-hover:tracking-wider transition-all duration-700">Dalton</span> 
            </p>
            <span className="opacity-30 text-stone-500 text-lg md:text-2xl font-light">&</span> 
            <p className="text-2xl md:text-3xl font-serif italic text-white leading-relaxed">
              <span className="gold-gradient font-bold not-italic group-hover:tracking-wider transition-all duration-700">Daniele</span>
            </p>
          </div>
        </div>

        {/* Contato e Suporte */}
        <div className="space-y-6 relative z-10 w-full flex flex-col items-center">
          <div className="h-[1px] w-12 bg-white/10 mx-auto"></div>
          <p className="text-[9px] uppercase tracking-[0.5em] text-stone-500 font-bold mb-4">Concierge de Suporte</p>
          <a 
            href="mailto:concierge@dommelash.com" 
            className="inline-block glass px-10 py-5 rounded-full border-[#BF953F]/20 text-[10px] text-[#BF953F] uppercase tracking-[0.3em] font-bold hover:bg-[#BF953F] hover:text-black transition-all duration-500 hover:shadow-[0_10px_30px_rgba(191,149,63,0.3)] active:scale-95"
          >
            concierge@dommelash.com
          </a>
        </div>
      </div>

      {/* Manifesto de Beleza - Tipografia Fluida */}
      <div className="max-w-md w-full text-center relative pt-10 flex flex-col items-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 text-5xl font-serif text-[#BF953F]/10 select-none">“</div>
        <p className="text-sm md:text-base text-stone-400 italic font-serif leading-relaxed tracking-wide px-6">
          A beleza é o domínio absoluto <br className="inline" /> entre a técnica e a alma. <br className="hidden md:block" />
          Criado para quem transforma <br className="inline" /> olhares em autoridade e arte.
        </p>
      </div>
    </div>
  );
};

export default AboutTab;
