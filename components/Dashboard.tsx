
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ICONS } from '../constants';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Client, Appointment } from '../types';
import RegistrationModal from './RegistrationModal';

interface DashboardProps {
  onNavigateToRegistration?: (name: string) => void;
  onNavigateToSchedule?: () => void;
}

interface Reminder {
  id: string;
  text: string;
}

const data = [
  { name: 'S', rev: 4000 },
  { name: 'T', rev: 3500 },
  { name: 'Q', rev: 6200 },
  { name: 'Q', rev: 5100 },
  { name: 'S', rev: 9200 },
  { name: 'S', rev: 11000 },
];

const TimeBanner: React.FC = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const formattedTime = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="glass w-full py-4 px-8 rounded-2xl border border-[#BF953F]/20 flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex items-center space-x-3">
        <div className="w-1.5 h-1.5 rounded-full gold-bg animate-pulse"></div>
        <p className="text-[10px] md:text-[11px] font-num text-stone-300 uppercase tracking-[0.3em] font-light">
          {formattedDate}
        </p>
      </div>
      <div className="flex items-center space-x-4">
        <span className="h-4 w-[1px] bg-[#BF953F]/30 hidden md:block"></span>
        <p className="text-xl md:text-2xl font-num font-light text-[#BF953F] tracking-[0.2em]">
          {formattedTime}
        </p>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ onNavigateToRegistration, onNavigateToSchedule }) => {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [todayAppts, setTodayAppts] = useState<Appointment[]>([]);
  
  const [studioName, setStudioName] = useState(() => {
    const saved = localStorage.getItem('domme_studio_name');
    return saved || 'DOMME LASH ELITE';
  });
  const [studioSubtitle, setStudioSubtitle] = useState(() => {
    const saved = localStorage.getItem('domme_studio_subtitle');
    return saved || 'O Domínio da Exclusividade';
  });
  const [studioLogo, setStudioLogo] = useState(() => localStorage.getItem('domme_studio_logo') || '');
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('domme_reminders');
    return saved ? JSON.parse(saved) : [];
  });
  const [newReminderText, setNewReminderText] = useState('');
  const [isAddingReminder, setIsAddingReminder] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('domme_studio_name', studioName);
    localStorage.setItem('domme_studio_subtitle', studioSubtitle);
    localStorage.setItem('domme_studio_logo', studioLogo);
  }, [studioName, studioSubtitle, studioLogo]);

  useEffect(() => {
    localStorage.setItem('domme_reminders', JSON.stringify(reminders));
  }, [reminders]);

  const loadTodayData = () => {
    const savedAppts = localStorage.getItem('domme_appointments');
    const appts: Appointment[] = savedAppts ? JSON.parse(savedAppts) : [];
    const todayStr = new Date().toISOString().split('T')[0];
    
    const filtered = appts.filter(a => a.date === todayStr)
      .sort((a, b) => a.time.localeCompare(b.time));
    
    setTodayAppts(filtered);
  };

  useEffect(() => {
    loadTodayData();
  }, [isOverlayOpen]);

  const clients: Client[] = useMemo(() => {
    const saved = localStorage.getItem('domme_clients');
    return saved ? JSON.parse(saved) : [];
  }, []);

  const birthdays = useMemo(() => {
    const today = new Date();
    const tDay = today.getDate();
    const tMonth = today.getMonth() + 1;
    
    const isWithinNext7Days = (bMonth: number, bDay: number) => {
      const bDate = new Date(today.getFullYear(), bMonth - 1, bDay);
      if (bDate < today && tMonth === 12 && bMonth === 1) {
        bDate.setFullYear(today.getFullYear() + 1);
      }
      const diffTime = bDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 7;
    };

    const todayBdays: Client[] = [];
    const upcomingBdays: Client[] = [];

    clients.forEach(c => {
      if (!c.birthday) return;
      const parts = c.birthday.split('-');
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);
      
      if (day === tDay && month === tMonth) {
        todayBdays.push(c);
      } else if (isWithinNext7Days(month, day)) {
        upcomingBdays.push(c);
      }
    });

    return { today: todayBdays, upcoming: upcomingBdays };
  }, [clients]);

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderText.trim()) return;
    const newItem = { id: Math.random().toString(36).substr(2, 9), text: newReminderText };
    setReminders(prev => [newItem, ...prev]);
    setNewReminderText('');
    setIsAddingReminder(false);
  };

  const removeReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setStudioLogo(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const cleanPhone = (p: string) => p.replace(/\D/g, '');
  const getWhatsAppMessage = (name: string) => encodeURIComponent(`Olá ${name}, a Domme Lash te deseja um dia radiante! Temos um mimo especial para o seu olhar neste mês de aniversário. Vamos agendar?`);

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Cliente Externo';
  };

  return (
    <div className="space-y-12 pb-24 md:pb-0 animate-in fade-in duration-1000 relative">
      <header className="flex flex-col items-center justify-center text-center space-y-6">
        <div className="space-y-2">
          <p className="text-[9px] uppercase tracking-[0.4em] text-[#BF953F] font-bold">Visão Sistêmica</p>
          <h2 className="mobile-h1 font-serif text-white italic leading-tight">Domme <span className="font-normal opacity-80">Panorama</span></h2>
        </div>
        <button 
          onClick={() => setIsOverlayOpen(true)} 
          className="gold-bg text-black px-10 py-4 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(191,149,63,0.3)] animate-gold-pulse"
        >
          Integrar Atendimento
        </button>
      </header>

      <section className="relative glass p-10 md:p-14 rounded-[3rem] border border-[#BF953F]/20 overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.5)] animate-levitate transition-all duration-700 hover:shadow-[0_40px_80px_rgba(191,149,63,0.15)] group/identity">
        <div className="absolute inset-0 bg-gradient-to-br from-[#BF953F]/10 via-transparent to-black/40 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-center md:space-x-12 space-y-8 md:space-y-0 relative z-10">
          
          <div 
            onClick={() => logoInputRef.current?.click()}
            className="w-36 h-36 md:w-44 md:h-44 rounded-full glass border-[#BF953F]/40 flex items-center justify-center overflow-hidden transition-all duration-700 shadow-[0_0_40px_rgba(191,149,63,0.15)] relative cursor-pointer group/logo"
          >
            {studioLogo ? (
              <img src={studioLogo} alt="Logo" className="w-full h-full object-cover transition-transform duration-700 group-hover/logo:scale-110" />
            ) : (
              <ICONS.Dashboard className="w-12 h-12 stroke-[#BF953F] opacity-30" />
            )}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity duration-500">
               <svg className="w-8 h-8 text-[#BF953F] mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812-1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
               <p className="text-[8px] uppercase tracking-[0.3em] text-[#BF953F] font-bold">Trocar Logo</p>
            </div>
          </div>

          <div className="text-center md:text-left space-y-4 flex-1">
            <div className="relative group/editname">
              {isEditingName ? (
                <input 
                  autoFocus
                  value={studioName} 
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                  onChange={(e) => setStudioName(e.target.value.toUpperCase())} 
                  className="bg-transparent border-0 border-b-2 border-[#BF953F] text-3xl md:text-5xl font-serif text-[#BF953F] italic outline-none w-full py-2 animate-in fade-in duration-300" 
                />
              ) : (
                <div onClick={() => setIsEditingName(true)} className="flex items-center justify-center md:justify-start space-x-3 cursor-pointer">
                  <h2 className="text-3xl md:text-5xl font-serif text-white italic tracking-wide leading-tight group-hover/editname:text-[#BF953F] transition-colors">{studioName}</h2>
                  <svg className="w-4 h-4 text-[#BF953F] opacity-0 group-hover/editname:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                </div>
              )}
            </div>

            <div className="relative group/editsub">
              {isEditingSubtitle ? (
                <input 
                  autoFocus
                  value={studioSubtitle} 
                  onBlur={() => setIsEditingSubtitle(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingSubtitle(false)}
                  onChange={(e) => setStudioSubtitle(e.target.value)} 
                  className="bg-transparent border-0 border-b border-[#BF953F]/40 text-[11px] md:text-[13px] text-[#BF953F] uppercase tracking-[0.5em] font-light outline-none w-full py-1 animate-in fade-in duration-300" 
                />
              ) : (
                <div onClick={() => setIsEditingSubtitle(true)} className="flex items-center justify-center md:justify-start space-x-2 cursor-pointer">
                  <p className="text-[11px] md:text-[13px] text-stone-500 uppercase tracking-[0.6em] font-light group-hover/editsub:text-stone-300 transition-colors">{studioSubtitle}</p>
                  <svg className="w-3 h-3 text-[#BF953F] opacity-0 group-hover/editsub:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                </div>
              )}
            </div>
          </div>

          <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
        </div>
      </section>

      <TimeBanner />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass p-8 rounded-[2rem] border-[#BF953F]/10 flex flex-col h-[400px] relative group overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-serif italic text-white tracking-widest">Lembretes Estratégicos</h3>
            <button 
              onClick={() => setIsAddingReminder(!isAddingReminder)} 
              className="w-10 h-10 rounded-full gold-bg flex items-center justify-center text-black active:scale-90 transition-all shadow-[0_5px_15px_rgba(191,149,63,0.3)]"
            >
              <ICONS.Plus className={`w-5 h-5 transition-transform duration-500 ${isAddingReminder ? 'rotate-45' : ''}`} />
            </button>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            {isAddingReminder && (
              <form onSubmit={handleAddReminder} className="mb-6 animate-in slide-in-from-top-4 duration-500">
                <div className="relative">
                  <input 
                    autoFocus
                    value={newReminderText}
                    onChange={(e) => setNewReminderText(e.target.value)}
                    placeholder="O que precisa ser feito hoje?"
                    className="w-full bg-white/5 border border-[#BF953F]/40 rounded-2xl px-6 py-4 text-[11px] text-white outline-none focus:border-[#BF953F] transition-all font-num placeholder:text-stone-700 font-light"
                  />
                  <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#BF953F] hover:scale-110 transition-transform p-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                  </button>
                </div>
              </form>
            )}

            <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar pr-1 pb-4">
              {reminders.length > 0 ? reminders.map((r, index) => (
                <div 
                  key={r.id} 
                  className="flex items-center justify-between group/item p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-[#BF953F]/30 transition-all duration-500 animate-in fade-in slide-in-from-left-4"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <p className="text-[12px] text-stone-300 font-num font-light leading-relaxed flex-1 italic pr-4">
                    {r.text}
                  </p>
                  <button 
                    onClick={() => removeReminder(r.id)} 
                    className="text-[#BF953F]/30 group-hover/item:text-red-500/60 hover:!text-red-500 transition-all p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center h-full opacity-20 py-10 space-y-4">
                  <div className="w-16 h-16 rounded-full border border-dashed border-[#BF953F]/40 flex items-center justify-center">
                    <ICONS.Dashboard className="w-8 h-8 stroke-stone-500" />
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-stone-500 font-bold">Nenhum lembrete estratégico</p>
                </div>
              )}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#1C1917] to-transparent pointer-events-none opacity-60"></div>
          
          <button 
            onClick={() => setIsAddingReminder(true)}
            className="mt-4 text-[9px] font-bold text-[#BF953F] uppercase tracking-[0.4em] py-4 border-t border-white/5 w-full hover:tracking-[0.6em] transition-all flex items-center justify-center space-x-2"
          >
             <span>+ Adicionar Novo Lembrete</span>
          </button>
        </div>

        <div className="glass p-8 rounded-[2rem] border-[#BF953F]/10 flex flex-col h-[400px]">
          <h3 className="text-lg font-serif italic text-white tracking-widest mb-6">Celebração VIP</h3>
          
          <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar">
            <div className="space-y-4">
              <p className="text-[8px] uppercase tracking-[0.4em] text-[#BF953F] font-bold flex items-center">
                <span className="mr-2">💎</span> Brilho de Hoje
              </p>
              
              {birthdays.today.length > 0 ? (
                birthdays.today.map(c => (
                  <div key={c.id} className="flex items-center justify-between glass p-4 rounded-2xl border-[#BF953F]/30 bg-[#BF953F]/5 animate-in slide-in-from-right-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full border border-[#BF953F]/30 overflow-hidden">
                        <img src={c.gallery[0]} className="w-full h-full object-cover grayscale" alt="" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-[#BF953F] uppercase tracking-tighter truncate max-w-[120px] font-num">{c.name}</p>
                        <p className="text-[7px] text-stone-500 uppercase tracking-widest">Mimo aguardando</p>
                      </div>
                    </div>
                    {c.phone && (
                      <a 
                        href={`https://wa.me/${cleanPhone(c.phone)}?text=${getWhatsAppMessage(c.name)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full gold-bg flex items-center justify-center text-black hover:scale-110 active:scale-95 transition-all shadow-[0_5px_15px_rgba(191,149,63,0.3)]"
                      >
                        <ICONS.WhatsApp className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))
              ) : birthdays.upcoming.length === 0 ? (
                <div className="py-6 text-center opacity-40">
                  <p className="text-[10px] italic text-stone-500 leading-relaxed font-serif">
                    Nenhum brinde hoje. <br /> Que tal mimos para as clientes fiéis?
                  </p>
                </div>
              ) : null}
            </div>

            {birthdays.upcoming.length > 0 && (
              <div className="space-y-4 pt-4">
                <p className="text-[8px] uppercase tracking-[0.4em] text-stone-600 font-bold">Próximos Dias 🥂</p>
                <div className="space-y-3">
                  {birthdays.upcoming.map(c => {
                     const parts = c.birthday.split('-');
                     return (
                      <div key={c.id} className="flex items-center justify-between opacity-60 border-b border-white/5 pb-2 last:border-0 hover:opacity-100 transition-opacity">
                        <p className="text-[10px] text-stone-400 font-light font-num truncate max-w-[140px]">{c.name}</p>
                        <p className="text-[9px] font-num text-[#BF953F] font-bold">
                          {parts[2]}/{parts[1]}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="glass p-8 rounded-[2rem] border-[#BF953F]/10 flex flex-col h-[400px] hover:border-[#BF953F]/30 transition-all cursor-default">
          <h3 className="text-lg font-serif italic text-white tracking-widest mb-6">Agenda do Dia</h3>
          <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
            {todayAppts.length > 0 ? (
              todayAppts.slice(0, 5).map((appt, i) => (
                <button 
                  key={appt.id} 
                  onClick={onNavigateToSchedule}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-[#BF953F]/5 hover:border-[#BF953F]/20 transition-all group animate-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                       <div className="w-1 h-1 rounded-full gold-bg animate-pulse"></div>
                       <span className="text-[10px] font-bold font-num text-[#BF953F]">{appt.time}</span>
                    </div>
                    <span className="text-white/20 text-[10px]">|</span>
                    <div className="text-left">
                      <p className="text-[11px] font-serif italic text-white truncate max-w-[120px] group-hover:text-[#BF953F] transition-colors">{getClientName(appt.clientId)}</p>
                    </div>
                  </div>
                  <ICONS.Plus className="w-3 h-3 stroke-stone-700 group-hover:stroke-[#BF953F] transition-colors rotate-45" />
                </button>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-40 py-10">
                 <ICONS.Presence className="w-10 h-10 stroke-stone-600" />
                 <p className="text-[10px] font-serif italic text-stone-400 leading-relaxed text-center px-4">
                   Agenda livre para novos <br /> olhares hoje.
                 </p>
              </div>
            )}
          </div>
          {todayAppts.length > 0 && (
            <button 
              onClick={onNavigateToSchedule}
              className="mt-4 pt-4 border-t border-white/5 text-[9px] font-bold text-[#BF953F] uppercase tracking-[0.3em] hover:tracking-[0.5em] transition-all text-center w-full"
            >
              Ver Agenda Completa
            </button>
          )}
        </div>
      </div>

      <div className="glass p-10 rounded-[2.5rem]">
        <h3 className="text-lg md:text-xl font-serif text-white mb-10">Fluxo de Excelência</h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#BF953F" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#BF953F" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#ffffff03" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#6B7280'}} />
              <YAxis hide />
              <Tooltip contentStyle={{ backgroundColor: '#1C1917', borderRadius: '15px', border: 'none' }} itemStyle={{ color: '#BF953F', fontSize: '10px' }} />
              <Area type="monotone" dataKey="rev" stroke="#BF953F" strokeWidth={1} fill="url(#goldGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <RegistrationModal 
        isOpen={isOverlayOpen} 
        onClose={() => setIsOverlayOpen(false)}
        onSuccess={loadTodayData}
        onNavigateToVIP={(name) => {
          setIsOverlayOpen(false);
          if (onNavigateToRegistration) onNavigateToRegistration(name);
        }}
      />
    </div>
  );
};

export default Dashboard;
