
import React, { useState, useMemo, useEffect } from 'react';
import { Client, Appointment } from '../types';
import RegistrationModal from './RegistrationModal';
import { ICONS } from '../constants';
import { dataService } from '../services/firebase';

interface ScheduleTimelineProps {
  onNavigateToClient?: (clientId: string) => void;
}

const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({ onNavigateToClient }) => {
  const [filter, setFilter] = useState<'dia' | 'semana' | 'mes' | 'ano'>('dia');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const appts = await dataService.getCollection('appointments');
    const clis = await dataService.getCollection('clients');
    setAppointments(appts);
    setClients(clis);
  };

  const filteredData = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return appointments.filter(appt => {
      const apptDate = appt.date;
      switch (filter) {
        case 'dia': return apptDate === todayStr;
        case 'semana':
          const diff = (new Date(apptDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          return diff >= -1 && diff <= 7;
        case 'mes': return apptDate.startsWith(todayStr.substring(0, 7));
        default: return true;
      }
    }).sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  }, [filter, appointments]);

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Cliente Externo';
  };

  const confirmDelete = async () => {
    if (!appointmentToDelete) return;
    await dataService.deleteItem('appointments', appointmentToDelete.id);
    setAppointmentToDelete(null);
    loadData();
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 pb-24 md:pb-0">
      <header className="flex flex-col space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between space-y-6 md:space-y-0 text-center md:text-left">
          <div className="space-y-2">
            <p className="text-[9px] uppercase tracking-[0.4em] text-[#BF953F] font-bold">Gestão de Presença</p>
            <h2 className="mobile-h1 font-serif text-white italic">Agenda de Domínio</h2>
          </div>
          <button onClick={() => { setAppointmentToEdit(null); setIsRegisterModalOpen(true); }} className="flex items-center justify-center space-x-4 glass border border-[#BF953F]/30 px-8 py-4 rounded-full text-[10px] font-bold text-[#BF953F] uppercase tracking-[0.3em] hover:bg-[#BF953F] hover:text-black transition-all">
             <ICONS.Plus className="w-5 h-5" />
             <span>Registrar Atendimento</span>
          </button>
        </div>
        <div className="flex glass p-1 rounded-2xl overflow-x-auto no-scrollbar max-w-max mx-auto md:mx-0">
          {(['dia', 'semana', 'mes', 'ano'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-6 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${filter === f ? 'gold-bg text-black' : 'text-stone-500'}`}>{f === 'dia' ? 'Hoje' : f === 'semana' ? 'Semana' : f === 'mes' ? 'Mês' : 'Ano'}</button>
          ))}
        </div>
      </header>

      <div className="space-y-4">
        {filteredData.length > 0 ? filteredData.map((appt) => (
          <div key={appt.id} className="glass p-6 md:p-8 rounded-[2rem] border-white/5 flex flex-col md:flex-row md:items-center justify-between hover:border-[#BF953F]/30 transition-all group">
            <div className="flex items-center space-x-6 cursor-pointer flex-1 mb-4 md:mb-0" onClick={() => appt.clientId !== 'guest' && onNavigateToClient?.(appt.clientId)}>
              <div className="text-center min-w-[60px]">
                 <p className="text-[11px] font-bold text-[#BF953F] uppercase tracking-widest">{appt.time}</p>
                 <p className="text-[8px] text-stone-600 uppercase mt-1">{appt.date.split('-').reverse().slice(0,2).join('/')}</p>
              </div>
              <div>
                <h4 className="text-xl font-serif italic text-white group-hover:text-[#BF953F] transition-colors">{getClientName(appt.clientId)}</h4>
                <p className="text-[9px] uppercase tracking-widest text-stone-500 mt-1">{appt.serviceType}</p>
              </div>
            </div>
            <div className="flex items-center justify-between md:justify-end md:space-x-10 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
               <p className="text-lg font-num text-white">R$ {appt.price.toFixed(2)}</p>
               <div className="flex items-center space-x-3">
                  <button onClick={() => { setAppointmentToEdit(appt); setIsRegisterModalOpen(true); }} className="w-10 h-10 rounded-full border border-[#BF953F]/20 flex items-center justify-center text-[#BF953F] hover:bg-[#BF953F] hover:text-black transition-all"><ICONS.Plus className="w-4 h-4" /></button>
                  <button onClick={() => setAppointmentToDelete(appt)} className="w-10 h-10 rounded-full border border-red-500/20 flex items-center justify-center text-red-500/40 hover:bg-red-500 hover:text-white transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2"/></svg></button>
               </div>
            </div>
          </div>
        )) : (
          <div className="glass h-64 rounded-[3rem] flex flex-col items-center justify-center opacity-40 text-center space-y-4">
             <ICONS.Presence className="w-12 h-12 stroke-stone-600" />
             <p className="text-sm font-serif italic text-white">Domínio aguardando sua primeira ação.</p>
          </div>
        )}
      </div>

      <RegistrationModal 
        isOpen={isRegisterModalOpen} 
        onClose={() => { setIsRegisterModalOpen(false); setAppointmentToEdit(null); }}
        onSuccess={loadData}
        appointmentToEdit={appointmentToEdit}
        onNavigateToVIP={() => setIsRegisterModalOpen(false)}
      />

      {appointmentToDelete && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95" onClick={() => setAppointmentToDelete(null)}></div>
          <div className="relative glass p-10 rounded-[2.5rem] border-red-500/20 text-center space-y-8 max-w-xs w-full">
            <h4 className="text-xl font-serif text-white italic">Remover da Agenda?</h4>
            <button onClick={confirmDelete} className="w-full py-4 rounded-xl bg-red-600 text-white font-bold uppercase tracking-widest text-[9px]">Confirmar Exclusão</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleTimeline;
