
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ICONS } from '../constants';
import { Client, Appointment } from '../types';
import RegistrationModal from './RegistrationModal';
import { dataService } from '../services/firebase';

interface DashboardProps {
  onNavigateToRegistration?: (name: string) => void;
  onNavigateToSchedule?: () => void;
}

interface Reminder {
  id: string;
  text: string;
}

const TimeBanner: React.FC = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="glass w-full py-4 px-8 rounded-2xl border border-[#BF953F]/20 flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex items-center space-x-3">
        <div className="w-1.5 h-1.5 rounded-full gold-bg animate-pulse"></div>
        <p className="text-[10px] md:text-[11px] font-num text-stone-300 uppercase tracking-[0.3em] font-light">
          {now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>
      <div className="flex items-center space-x-4">
        <span className="h-4 w-[1px] bg-[#BF953F]/30 hidden md:block"></span>
        <p className="text-xl md:text-2xl font-num font-light text-[#BF953F] tracking-[0.2em]">
          {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ onNavigateToRegistration, onNavigateToSchedule }) => {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [todayAppts, setTodayAppts] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [studioName, setStudioName] = useState('DOMME LASH ELITE');
  const [studioSubtitle, setStudioSubtitle] = useState('O Domínio da Exclusividade');
  const [studioLogo, setStudioLogo] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newReminderText, setNewReminderText] = useState('');
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const [appts, clis, settings, rems] = await Promise.all([
      dataService.getCollection('appointments'),
      dataService.getCollection('clients'),
      dataService.getItem('settings', 'studio'),
      dataService.getCollection('reminders')
    ]);

    const todayStr = new Date().toISOString().split('T')[0];
    
    // Filtro Agenda de Hoje: Data atual + Ordenação por Horário
    const filteredAppts = (appts as any[])
      .filter((a) => a.date === todayStr)
      .sort((a, b) => a.time.localeCompare(b.time));
    
    setTodayAppts(filteredAppts);
    setClients(clis as any[]);
    setReminders(rems as any[]);

    if (settings) {
      setStudioName((settings as any).name || 'DOMME LASH ELITE');
      setStudioSubtitle((settings as any).subtitle || 'O Domínio da Exclusividade');
      setStudioLogo((settings as any).logo || '');
    }
  };

  const saveStudioSettings = async (updates: any) => {
    await dataService.saveItem('settings', { id: 'studio', ...updates });
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderText.trim()) return;
    const newItem = await dataService.saveItem('reminders', { text: newReminderText });
    setReminders(prev => [newItem as any, ...prev]);
    setNewReminderText('');
    setIsAddingReminder(false);
  };

  const removeReminder = async (id: string) => {
    setDeletingId(id); // Gatilho para animação de fade-out
    setTimeout(async () => {
      await dataService.deleteItem('reminders', id);
      setReminders(prev => prev.filter(r => r.id !== id));
      setDeletingId(null);
    }, 400);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setStudioLogo(base64);
        await saveStudioSettings({ logo: base64, name: studioName, subtitle: studioSubtitle });
      };
      reader.readAsDataURL(file);
    }
  };

  const birthdays = useMemo(() => {
    const today = new Date();
    const tDay = today.getDate();
    const tMonth = today.getMonth() + 1;
    const todayBdays: Client[] = [];

    clients.forEach(c => {
      if (!c.birthday) return;
      // Espera-se formato YYYY-MM-DD
      const parts = c.birthday.split('-');
      const d = parseInt(parts[2]);
      const m = parseInt(parts[1]);
      
      if (d === tDay && m === tMonth) todayBdays.push(c);
    });
    return todayBdays;
  }, [clients]);

  return (
    <div className="space-y-12 pb-24 md:pb-0 animate-in fade-in duration-1000 relative">
      <header className="flex flex-col items-center justify-center text-center space-y-6">
        <div className="space-y-2">
          <p className="text-[9px] uppercase tracking-[0.4em] text-[#BF953F] font-bold">Visão Sistêmica</p>
          <h2 className="mobile-h1 font-serif text-white italic leading-tight">Domme <span className="font-normal opacity-80">Panorama</span></h2>
        </div>
        <button onClick={() => setIsOverlayOpen(true)} className="gold-bg text-black px-10 py-4 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all shadow-[0_10px_30px_rgba(191,149,63,0.3)] animate-gold-pulse">
          Integrar Atendimento
        </button>
      </header>

      <section className="relative glass p-10 md:p-14 rounded-[3rem] border border-[#BF953F]/20 overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.5)] animate-levitate transition-all duration-700 hover:shadow-[0_40px_80px_rgba(191,149,63,0.15)] group/identity">
        <div className="absolute inset-0 bg-gradient-to-br from-[#BF953F]/10 via-transparent to-black/40 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-center md:space-x-12 space-y-8 md:space-y-0 relative z-10">
          <div onClick={() => logoInputRef.current?.click()} className="w-36 h-36 md:w-44 md:h-44 rounded-full glass border-[#BF953F]/40 flex items-center justify-center overflow-hidden transition-all duration-700 shadow-[0_0_40px_rgba(191,149,63,0.15)] relative cursor-pointer group/logo">
            {studioLogo ? <img src={studioLogo} className="w-full h-full object-cover" alt="" /> : <ICONS.Dashboard className="w-12 h-12 stroke-[#BF953F] opacity-30" />}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity duration-500"><p className="text-[8px] uppercase tracking-[0.3em] text-[#BF953F] font-bold">Trocar Logo</p></div>
          </div>
          <div className="text-center md:text-left space-y-4 flex-1">
            <div className="relative group/editname">
              {isEditingName ? (
                <input autoFocus value={studioName} onBlur={() => { setIsEditingName(false); saveStudioSettings({ name: studioName, subtitle: studioSubtitle, logo: studioLogo }); }} onChange={(e) => setStudioName(e.target.value.toUpperCase())} className="bg-transparent border-0 border-b-2 border-[#BF953F] text-3xl md:text-5xl font-serif text-[#BF953F] italic outline-none w-full" />
              ) : (
                <h2 onClick={() => setIsEditingName(true)} className="text-3xl md:text-5xl font-serif text-white italic tracking-wide cursor-pointer">{studioName}</h2>
              )}
            </div>
            <div className="relative group/editsub">
              {isEditingSubtitle ? (
                <input autoFocus value={studioSubtitle} onBlur={() => { setIsEditingSubtitle(false); saveStudioSettings({ subtitle: studioSubtitle, name: studioName, logo: studioLogo }); }} onChange={(e) => setStudioSubtitle(e.target.value)} className="bg-transparent border-0 border-b border-[#BF953F]/40 text-[11px] md:text-[13px] text-[#BF953F] outline-none w-full" />
              ) : (
                <p onClick={() => setIsEditingSubtitle(true)} className="text-[11px] md:text-[13px] text-stone-500 uppercase tracking-[0.6em] font-light cursor-pointer">{studioSubtitle}</p>
              )}
            </div>
          </div>
          <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
        </div>
      </section>

      <TimeBanner />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* CARD: LEMBRETES VIP */}
        <div className="glass p-8 rounded-[2rem] border-[#BF953F]/10 flex flex-col h-[400px] relative">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-serif italic text-white tracking-widest">Lembretes VIP</h3>
            <button onClick={() => setIsAddingReminder(!isAddingReminder)} className="w-10 h-10 rounded-full gold-bg flex items-center justify-center text-black shadow-lg hover:scale-110 transition-transform"><ICONS.Plus className={`w-5 h-5 transition-transform ${isAddingReminder ? 'rotate-45' : ''}`} /></button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
            {isAddingReminder && (
              <form onSubmit={handleAddReminder} className="mb-4 animate-in slide-in-from-top-2">
                <input autoFocus value={newReminderText} onChange={(e) => setNewReminderText(e.target.value)} placeholder="Definir nova tarefa..." className="w-full bg-white/5 border border-[#BF953F]/40 rounded-2xl px-5 py-3 text-xs text-white outline-none focus:border-[#BF953F]" />
              </form>
            )}
            {reminders.length > 0 ? reminders.map(r => (
              <div 
                key={r.id} 
                className={`flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 group transition-all duration-300 ${deletingId === r.id ? 'opacity-0 scale-95' : 'opacity-100'}`}
              >
                <p className="text-xs text-stone-300 italic">{r.text}</p>
                <button 
                  onClick={() => removeReminder(r.id)} 
                  className="text-stone-700 hover:text-red-500 transition-colors p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            )) : (
              <p className="text-[10px] text-stone-600 uppercase tracking-widest text-center py-10">Tudo em ordem no domínio.</p>
            )}
          </div>
        </div>

        {/* CARD: CELEBRAÇÃO VIP (ANIVERSARIANTES) */}
        <div className="glass p-8 rounded-[2rem] border-[#BF953F]/10 flex flex-col h-[400px]">
          <h3 className="text-lg font-serif italic text-white tracking-widest mb-6">Celebração VIP</h3>
          <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar">
            {birthdays.length > 0 ? birthdays.map(c => (
              <div key={c.id} className="flex items-center justify-between p-5 rounded-2xl bg-[#BF953F]/5 border border-[#BF953F]/20 animate-in zoom-in-95 duration-500">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">🎈</span>
                  <div>
                    <p className="text-[11px] font-bold text-white uppercase tracking-widest">{c.name}</p>
                    <p className="text-[9px] text-[#BF953F] uppercase">Aniversariante do Dia</p>
                  </div>
                </div>
                <a href={`https://wa.me/${c.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full glass border-[#BF953F]/40 flex items-center justify-center text-[#BF953F] hover:bg-[#BF953F] hover:text-black transition-all">
                  <ICONS.WhatsApp className="w-4 h-4" />
                </a>
              </div>
            )) : (
              <div className="text-center py-20 opacity-30 flex flex-col items-center">
                <svg className="w-10 h-10 mb-3 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="1" />
                </svg>
                <p className="text-[10px] uppercase tracking-[0.2em]">Nenhum aniversariante hoje</p>
              </div>
            )}
          </div>
        </div>

        {/* CARD: AGENDA DE HOJE */}
        <div className="glass p-8 rounded-[2rem] border-[#BF953F]/10 flex flex-col h-[400px]">
          <h3 className="text-lg font-serif italic text-white tracking-widest mb-6">Agenda de Hoje</h3>
          <div className="space-y-4 overflow-y-auto no-scrollbar">
            {todayAppts.length > 0 ? todayAppts.map(appt => {
              const client = clients.find(c => c.id === appt.clientId);
              return (
                <div 
                  key={appt.id} 
                  className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 group hover:border-[#BF953F]/40 cursor-pointer transition-all" 
                  onClick={onNavigateToSchedule}
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-[11px] font-bold text-[#BF953F] font-num">{appt.time}</span>
                    <div className="h-4 w-[1px] bg-white/10"></div>
                    <div>
                      <p className="text-xs italic text-white font-medium">{client?.name || 'Cliente Externo'}</p>
                      <p className="text-[8px] uppercase tracking-widest text-stone-500">{appt.serviceType}</p>
                    </div>
                  </div>
                  <ICONS.Plus className="w-3 h-3 rotate-45 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              );
            }) : (
              <div className="text-center py-20 opacity-30 flex flex-col items-center">
                <ICONS.Presence className="w-10 h-10 mb-3 text-stone-500" />
                <p className="text-[10px] uppercase tracking-[0.2em]">Sem compromissos para hoje</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <RegistrationModal 
        isOpen={isOverlayOpen} 
        onClose={() => setIsOverlayOpen(false)} 
        onSuccess={loadDashboardData} 
        onNavigateToVIP={(name) => { 
          setIsOverlayOpen(false); 
          if (onNavigateToRegistration) onNavigateToRegistration(name); 
        }} 
      />
    </div>
  );
};

export default Dashboard;
