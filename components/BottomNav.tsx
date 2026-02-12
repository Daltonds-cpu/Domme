
import React from 'react';
import { ICONS } from '../constants';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Panorama', icon: ICONS.Dashboard },
    { id: 'clients', label: 'Estilo', icon: ICONS.Portfolio },
    { id: 'schedule', label: 'Presença', icon: ICONS.Presence },
    { id: 'finance', label: 'Métricas', icon: ICONS.Finance },
    { id: 'more', label: 'Mais', icon: ICONS.About },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/5 z-[100] safe-pb px-4 md:hidden">
      <div className="flex justify-around items-center h-20">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center space-y-1 w-16 transition-all duration-300 ${
                isActive ? 'text-[#BF953F]' : 'text-stone-500'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[#BF953F]' : 'stroke-current'}`} />
              <span className="text-[8px] uppercase tracking-widest font-bold">
                {item.label}
              </span>
              {isActive && <div className="w-1 h-1 rounded-full gold-bg animate-pulse"></div>}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
