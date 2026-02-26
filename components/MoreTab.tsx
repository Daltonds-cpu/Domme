
import React, { useState, useRef } from 'react';
import { ICONS } from '../constants';

interface MoreTabProps {
  userProfile: {
    name: string;
    avatar: string;
    title: string;
  };
  onUpdateProfile: (profile: Partial<{name: string, avatar: string, title: string}>) => void;
  deferredPrompt?: any;
}

const MoreTab: React.FC<MoreTabProps> = ({ userProfile, onUpdateProfile, deferredPrompt }) => {
  const [activeModal, setActiveModal] = useState<'none' | 'about' | 'care' | 'profile'>('none');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const careTips = [
    {
      title: "Primeiras 24h",
      text: "Evite vapor, água quente e saunas para a cura completa do adesivo.",
      icon: "✨"
    },
    {
      title: "Penteado Estruturado",
      text: "Penteie suas extensões diariamente com a escovinha seca para alinhar os fios.",
      icon: "🧹"
    },
    {
      title: "Calor Extremo",
      text: "Evite proximidade excessiva com calor intenso (fornos, secadores), pois as fibras podem perder a curvatura.",
      icon: "🔥"
    },
    {
      title: "Demaquilagem Segura",
      text: "Utilize água micelar sem óleo. Nunca use algodão diretamente nos cílios.",
      icon: "🧼"
    }
  ];

  const handleShareCare = (title: string, text: string) => {
    const message = `✨ Domme Lash informa: ${title} - ${text} ✨`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
    } else {
      // Fallback para quando o evento não foi capturado (ex: já instalado ou browser não suporta)
      alert("Para instalar: No iPhone, use 'Compartilhar' > 'Adicionar à Tela de Início'. No Android, clique nos três pontos e 'Instalar Aplicativo'.");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateProfile({ avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-24 md:pb-0">
      <header className="space-y-1 text-center md:text-left">
        <p className="text-[9px] uppercase tracking-[0.4em] text-[#BF953F] font-bold">Menu de Utilidades</p>
        <h2 className="mobile-h1 font-serif text-white italic">Domínio & Mais</h2>
      </header>

      <div className="glass p-8 md:p-10 rounded-[2.5rem] border-[#BF953F]/10 flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8 text-center md:text-left">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 rounded-full border-2 border-[#BF953F]/40 overflow-hidden relative group cursor-pointer"
          >
            <img src={userProfile.avatar} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Avatar" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-[8px] uppercase tracking-widest font-bold">Trocar</p>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
          </div>
          <div>
            <h3 className="text-2xl font-serif text-white italic">{userProfile.name}</h3>
            <p className="text-[10px] uppercase tracking-[0.4em] text-stone-500 font-bold">{userProfile.title}</p>
          </div>
        </div>
        <button 
          onClick={() => setActiveModal('profile')}
          className="px-8 py-3 rounded-full border border-white/5 text-[9px] font-bold uppercase tracking-widest text-stone-400 hover:text-white hover:border-[#BF953F]/40 transition-all"
        >
          Refinar Perfil
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <button 
          onClick={() => setActiveModal('about')}
          className="glass p-8 md:p-10 rounded-[2.5rem] border-[#BF953F]/10 text-center space-y-4 hover:border-[#BF953F]/40 transition-all duration-500 group"
        >
          <div className="w-16 h-16 rounded-full bg-[#BF953F]/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
            <ICONS.About className="w-8 h-8 text-[#BF953F]" />
          </div>
          <h4 className="text-lg md:text-xl font-serif text-white italic">Sobre o Sistema</h4>
          <p className="text-[9px] uppercase tracking-widest text-stone-500">Versão & Desenvolvedores</p>
        </button>

        <button 
          onClick={handleInstallApp}
          className="glass p-8 md:p-10 rounded-[2.5rem] border-[#BF953F]/10 text-center space-y-4 hover:border-[#BF953F]/40 transition-all duration-500 group relative overflow-hidden"
        >
          {deferredPrompt && <div className="absolute top-0 right-0 p-2"><div className="w-2 h-2 rounded-full gold-bg animate-ping"></div></div>}
          <div className="w-16 h-16 rounded-full bg-[#BF953F]/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
             <svg className="w-8 h-8 text-[#BF953F]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h4 className="text-lg md:text-xl font-serif text-white italic">Baixar App</h4>
          <p className="text-[9px] uppercase tracking-widest text-stone-500">Instalar Modo Tela Cheia</p>
        </button>

        <button 
          onClick={() => setActiveModal('care')}
          className="glass p-8 md:p-10 rounded-[2.5rem] border-[#BF953F]/10 text-center space-y-4 hover:border-[#BF953F]/40 transition-all duration-500 group"
        >
          <div className="w-16 h-16 rounded-full bg-[#BF953F]/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
             <svg className="w-8 h-8 text-[#BF953F]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          </div>
          <h4 className="text-lg md:text-xl font-serif text-white italic">Cuidados Lash</h4>
          <p className="text-[9px] uppercase tracking-widest text-stone-500">Manual de Saúde Ocular</p>
        </button>
      </div>

      {activeModal === 'profile' && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center transition-all duration-300">
          <div className="absolute inset-0 bg-[#1C1917]/90 backdrop-blur-[8px]" onClick={() => setActiveModal('none')}></div>
          <div className="relative w-[92%] max-w-md glass p-10 rounded-[2.5rem] border-[#BF953F]/20 text-center space-y-8 animate-in zoom-in-95 duration-300">
             <h3 className="text-2xl font-serif text-white italic">Identidade Master</h3>
             <div className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest text-stone-500 ml-2">Seu Nome</label>
                  <input type="text" value={userProfile.name} onChange={(e) => onUpdateProfile({ name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-sm outline-none focus:border-[#BF953F]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest text-stone-500 ml-2">Cargo/Título</label>
                  <input type="text" value={userProfile.title} onChange={(e) => onUpdateProfile({ title: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-sm outline-none focus:border-[#BF953F]" />
                </div>
             </div>
             <button onClick={() => setActiveModal('none')} className="w-full gold-bg text-black py-4 rounded-xl font-bold uppercase tracking-widest text-[9px]">Salvar Perfil</button>
          </div>
        </div>
      )}

      {activeModal === 'about' && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setActiveModal('none')}></div>
          <div className="relative w-full max-w-lg glass p-10 rounded-[3rem] border-[#BF953F]/30 text-center space-y-8 animate-in zoom-in-95 duration-500">
            <header>
              <p className="text-[10px] uppercase tracking-[0.5em] text-[#BF953F] font-bold">Domínio Tecnológico</p>
              <h3 className="text-2xl font-serif text-white italic mt-2">Sobre o Sistema</h3>
            </header>
            <div className="space-y-6 text-stone-400 text-xs leading-relaxed">
              <p>O <span className="text-white font-bold">Domme Lash Elite</span> é uma plataforma de gestão de alta performance, desenhada para profissionais que buscam o domínio absoluto sobre seu portfólio e finanças.</p>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[#BF953F] font-bold text-[10px] uppercase tracking-widest">Versão</p>
                  <p className="text-white mt-1">2.5.0 Gold</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[#BF953F] font-bold text-[10px] uppercase tracking-widest">Status</p>
                  <p className="text-white mt-1">Sincronizado</p>
                </div>
              </div>
              <p className="pt-4 border-t border-white/5">Desenvolvido com foco em exclusividade, segurança de dados e experiência do usuário de luxo.</p>
            </div>
            <button onClick={() => setActiveModal('none')} className="w-full gold-bg text-black py-4 rounded-2xl font-bold uppercase tracking-widest text-[9px]">Fechar Panorama</button>
          </div>
        </div>
      )}

      {activeModal === 'care' && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setActiveModal('none')}></div>
          <div className="relative w-full max-w-2xl glass p-10 rounded-[3rem] border-[#BF953F]/30 animate-in zoom-in-95 duration-500 max-h-[85vh] overflow-y-auto no-scrollbar">
            <header className="text-center mb-10">
              <p className="text-[10px] uppercase tracking-[0.5em] text-[#BF953F] font-bold">Manual de Preservação</p>
              <h3 className="text-2xl font-serif text-white italic mt-2">Cuidados Lash</h3>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {careTips.map((tip, i) => (
                <div key={i} className="p-6 rounded-[2rem] bg-white/5 border border-white/10 space-y-3 group hover:border-[#BF953F]/40 transition-all">
                  <div className="flex justify-between items-start">
                    <span className="text-2xl">{tip.icon}</span>
                    <button onClick={() => handleShareCare(tip.title, tip.text)} className="w-8 h-8 rounded-full glass border border-white/10 flex items-center justify-center text-[#BF953F] hover:bg-[#BF953F] hover:text-black transition-all">
                      <ICONS.WhatsApp className="w-3 h-3" />
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-widest">{tip.title}</h4>
                  <p className="text-[11px] text-stone-500 leading-relaxed">{tip.text}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setActiveModal('none')} className="w-full mt-10 gold-bg text-black py-4 rounded-2xl font-bold uppercase tracking-widest text-[9px]">Entendido</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoreTab;
