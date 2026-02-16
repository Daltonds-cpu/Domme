
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Client, Appointment } from '../types';
import RegistrationModal from './RegistrationModal';
import { ICONS } from '../constants';
import { db, auth } from '../services/firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';

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
    const user = auth.currentUser;
    if (!user) return;

    const qAppts = query(collection(db, 'appointments'), where('ownerId', '==', user.uid));
    const unsubAppts = onSnapshot(qAppts, (snap) => {
      setAppointments(snap.docs.map(d => ({ ...d.data(), id: d.id } as Appointment)));
    });

    const qClients = query(collection(db, 'clients'), where('ownerId', '==', user.uid));
    const unsubClients = onSnapshot(qClients, (snap) => {
      setClients(snap.docs.map(d => ({ ...d.data(), id: d.id } as Client)));
    });

    return () => { unsubAppts(); unsubClients(); };
  }, []);

  const filteredData = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return appointments.filter(appt => {
      const parts = appt.date.split('-');
      const apptDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      
      switch (filter) {
        case 'dia': return apptDate.getTime() === today.getTime();
        case 'semana':
          const diffInDays = (apptDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
          return diffInDays >= 0 && diffInDays <= 7;
        case 'mes': return apptDate.getFullYear() === now.getFullYear() && apptDate.getMonth() === now.getMonth();
        case 'ano': return apptDate.getFullYear() === now.getFullYear();
        default: return true;
      }
    }).sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`).getTime();
      const dateB = new Date(`${b.date}T${b.time}`).getTime();
      return dateA - dateB;
    });
  }, [filter, appointments]);

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Cliente Externo';
  };

  const confirmDelete = async () => {
    if (!appointmentToDelete) return;
    try {
      await deleteDoc(doc(db, 'appointments', appointmentToDelete.id));
      setAppointmentToDelete(null);
    } catch (err) {
      console.error("Erro ao deletar:", err);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-24 md:pb-0">
      <header className="flex flex-col space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between space-y-6 md:space-y-0 text-center md:text-left">
          <div className="space-y-2">
            <p className="text-[9px] uppercase tracking-[0.4em] text-[#BF953F] font-bold">Gestão de Presença</p>
            <h2 className="mobile-h1 font-serif text-white italic">Agenda de Domínio</h2>
          </div>
          <button 
            onClick={() => { setAppointmentToEdit(null); setIsRegisterModalOpen(true); }}
            className="flex items-center justify-center space-x-4 glass border border-[#BF953F]/30 px-8 py-4 rounded-full text-[10px] font-bold text-[#BF953F] uppercase tracking-[0.3em] hover:bg-[#BF953F] shadow-xl group max-w-max mx-auto md:mx-0"
          >
             <ICONS.Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
             <span>Registrar Atendimento</span>
          </button>
        </div>
        <div className="flex glass p-1 rounded-2xl overflow-x-auto no-scrollbar max-w-max mx-auto md:mx-0">
          {(['dia', 'semana', 'mes', 'ano'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-5 md:px-6 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${filter === f ? 'gold-bg text-black' : 'text-stone-500'}`}>{f === 'dia' ? 'Hoje' : f === 'semana' ? 'Esta Semana' : f === 'mes' ? 'Este Mês' : 'Ano'}</button>
          ))}
        </div>
      </header>

      <div className="space-y-4">
        {filteredData.length > 0 ? (
          filteredData.map((appt) => (
            <div key={appt.id} className="glass p-6 md:p-8 rounded-[2rem] border-white/5 flex flex-col md:flex-row md:items-center justify-between hover:border-[#BF953F]/30 transition-all group animate-in fade-in">
              <div className="flex items-center space-x-6 md:space-x-10 cursor-pointer flex-1 mb-4 md:mb-0" onClick={() => appt.clientId !== 'guest' && onNavigateToClient?.(appt.clientId)}>
                <div className="text-center min-w-[60px]">
                   <p className="text-[11px] font-bold text-[#BF953F] uppercase tracking-widest">{appt.time}</p>
                   <p className="text-[8px] text-stone-600 uppercase mt-1">{appt.date.split('-')[2]}/{appt.date.split('-')[1]}</p>
                </div>
                <div>
                  <h4 className="text-xl font-serif italic text-white group-hover:text-[#BF953F] transition-colors">{getClientName(appt.clientId)}</h4>
                  <p className="text-[9px] uppercase tracking-widest text-stone-500 mt-1">{appt.serviceType}</p>
                </div>
              </div>
              <div className="flex items-center justify-between md:justify-end md:space-x-10 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                 <div className="text-right">
                    <p className="text-lg font-num text-white">{formatCurrency(appt.price)}</p>
                 </div>
                 <div className="flex items-center space-x-3">
                    <button onClick={() => { setAppointmentToEdit(appt); setIsRegisterModalOpen(true); }} className="w-10 h-10 rounded-full border border-[#BF953F]/20 flex items-center justify-center text-[#BF953F] hover:bg-[#BF953F] hover:text-black transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <button onClick={() => setAppointmentToDelete(appt)} className="w-10 h-10 rounded-full border border-red-500/20 flex items-center justify-center text-red-500/40 hover:bg-red-500 hover:text-white transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                 </div>
              </div>
            </div>
          ))
        ) : (
          <div className="glass h-[300px] rounded-[3rem] flex flex-col items-center justify-center opacity-40 text-center">
             <ICONS.Presence className="w-12 h-12 stroke-stone-600" />
             <p className="text-sm font-serif italic text-white">Domínio aguardando sua primeira ação.</p>
          </div>
        )}
      </div>

      <RegistrationModal 
        isOpen={isRegisterModalOpen} 
        onClose={() => { setIsRegisterModalOpen(false); setAppointmentToEdit(null); }}
        appointmentToEdit={appointmentToEdit}
        onNavigateToVIP={() => setIsRegisterModalOpen(false)}
      />

      {appointmentToDelete && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-[8px]" onClick={() => setAppointmentToDelete(null)}></div>
          <div className="relative w-[92%] max-w-sm glass p-10 rounded-[3rem] border-red-500/20 text-center space-y-8">
            <h4 className="text-xl font-serif text-white italic">Remover da Agenda?</h4>
            <div className="flex flex-col space-y-4">
              <button onClick={confirmDelete} className="w-full py-4 rounded-xl bg-red-600 text-white font-bold uppercase tracking-widest text-[9px]">Confirmar Exclusão</button>
              <button onClick={() => setAppointmentToDelete(null)} className="w-full py-4 rounded-xl glass text-stone-400 font-bold uppercase tracking-widest text-[9px]">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleTimeline;
