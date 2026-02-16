
import React from 'react';
import { ICONS } from '../constants';
import { logoutLocal } from '../services/storage';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userProfile?: {
    name: string;
    avatar: string;
    title: string;
  };
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, userProfile }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Panorama', icon: ICONS.Dashboard },
    { id: 'clients', label: 'Portfólio de Estilo', icon: ICONS.Portfolio },
    { id: 'schedule', label: 'Gestão de Presença', icon: ICONS.Presence },
    { id: 'finance', label: 'Métricas de Lucro', icon: ICONS.Finance },
    { id: 'more', label: 'Mais', icon: ICONS.About },
  ];

  const profile = userProfile || {
    name: 'Domme Master',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&auto=format&fit=crop',
    title: 'Senior Lash Master'
  };

  return (
    <aside className="w-72 h-screen bg-[#1C1917] border-r border-white/5 flex flex-col sticky top-0 z-50">
      <div className="p-10 text-center">
        <h1 className="text-2xl font-serif font-bold tracking-[0.3em] text-white">
          DOMME<span className="gold-gradient">LASH</span>
        </h1>
        <p className="text-[9px] uppercase tracking-[0.4em] text-stone-500 mt-2 font-light">Exclusividade & Domínio</p>
      </div>

      <nav className="flex-1 px-6 space-y-4 mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-4 px-6 py-4 rounded-full transition-all duration-500 group ${
                isActive 
                  ? 'bg-white/5 text-[#BF953F] shadow-[0_0_20px_rgba(191,149,63,0.1)]' 
                  : 'text-stone-500 hover:text-stone-300 hover:bg-white/5'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[#BF953F]' : 'stroke-current group-hover:stroke-stone-300'} transition-colors`} />
              <span className="text-[10px] font-medium tracking-[0.15em] uppercase">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-8 mt-auto border-t border-white/5 space-y-4">
        <div 
          onClick={() => setActiveTab('more')}
          className="flex items-center space-x-4 p-4 rounded-2xl glass transition-all hover:bg-white/5 cursor-pointer group/profile"
        >
          <div className="relative">
            <img 
              src={profile.avatar} 
              alt={profile.name} 
              className="w-10 h-10 rounded-full border border-[#BF953F]/40 grayscale group-hover/profile:grayscale-0 transition-all duration-700 object-cover"
            />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#BF953F] rounded-full border-2 border-[#1C1917] shadow-lg"></div>
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-bold text-white tracking-widest truncate uppercase">{profile.name}</p>
            <p className="text-[9px] text-stone-500 uppercase tracking-tighter truncate">{profile.title}</p>
          </div>
        </div>

        <button 
          onClick={() => logoutLocal()}
          className="w-full py-3 text-[9px] uppercase tracking-[0.4em] text-stone-600 hover:text-red-500 transition-colors flex items-center justify-center space-x-2"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Sair do Domínio</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
