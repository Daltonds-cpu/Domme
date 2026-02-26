
import React, { useState, useMemo, useEffect } from 'react';
import { ICONS } from '../constants';
import { Client, Appointment, DossieEntry } from '../types';
import { dataService } from '../services/firebase';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onNavigateToVIP: (name: string) => void;
  appointmentToEdit?: Appointment | null;
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({ 
  isOpen, onClose, onSuccess, onNavigateToVIP, appointmentToEdit 
}) => {
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  const [totalPrice, setTotalPrice] = useState<string>('');
  const [depositValue, setDepositValue] = useState<string>('');
  const [installments, setInstallments] = useState<number>(1);
  const [procedure, setProcedure] = useState('');
  const [observations, setObservations] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [paymentStatus, setPaymentStatus] = useState<'pago' | 'pendente' | 'parcial'>('pago');

  useEffect(() => {
    if (isOpen) loadClients();
  }, [isOpen]);

  const loadClients = async () => {
    const data = await dataService.getCollection('clients') as Client[];
    setClients(data);
  };

  useEffect(() => {
    if (appointmentToEdit) {
      const client = clients.find(c => c.id === appointmentToEdit.clientId);
      setSearch(client ? client.name : 'Cliente Externo');
      setTotalPrice(appointmentToEdit.price.toString());
      setDepositValue(appointmentToEdit.depositValue?.toString() || '');
      setInstallments(appointmentToEdit.installments || 1);
      setProcedure(appointmentToEdit.serviceType);
      setObservations(''); 
      setSelectedDate(appointmentToEdit.date);
      setSelectedTime(appointmentToEdit.time);
      setPaymentStatus(appointmentToEdit.paymentStatus || 'pago');
    } else {
      setSearch('');
      setTotalPrice('');
      setDepositValue('');
      setInstallments(1);
      setProcedure('');
      setObservations('');
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setSelectedTime('09:00');
    }
  }, [appointmentToEdit, isOpen, clients]);

  const filteredClients = useMemo(() => {
    if (!search.trim()) return [];
    return clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [search, clients]);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedClient = clients.find(c => c.name === search);
    const totalVal = parseFloat(totalPrice) || 0;
    const depVal = parseFloat(depositValue) || 0;

    const apptData: any = {
      ...(appointmentToEdit || {}),
      clientId: selectedClient?.id || 'guest',
      date: selectedDate,
      time: selectedTime,
      serviceType: procedure || 'Atendimento Personalizado',
      price: totalVal,
      depositValue: depVal,
      installments: installments,
      paymentStatus: depVal > 0 && depVal < totalVal ? 'parcial' : paymentStatus,
      status: 'scheduled'
    };

    await dataService.saveItem('appointments', apptData);

    if (selectedClient) {
      // Fix: Correcting the DossieEntry object to match the interface definition from types.ts
      const newDossieEntry: DossieEntry = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date(selectedDate).toLocaleDateString('pt-BR'),
        time: selectedTime,
        procedure: procedure || 'Atendimento Personalizado',
        value: totalVal,
        paymentMethod: installments > 1 ? 'CARTÃO' : 'PIX',
        analysis: {
          isWearingMascara: false,
          isPregnant: false,
          hasAllergies: false,
          thyroidGlaucomaIssues: false,
          oncologicalTreatment: false,
          recentProcedures: false,
          technique: procedure || 'Atendimento Personalizado',
          mapping: '-',
          style: '-',
          curvature: '-',
          thickness: '-',
          adhesiveUsed: '-',
          additionalNotes: `${observations}. Parcelamento: ${installments}x. Sinal: R$ ${depVal}.`,
        }
      };
      const updatedDossie = [newDossieEntry, ...(selectedClient.dossie || [])];
      await dataService.saveItem('clients', { ...selectedClient, dossie: updatedDossie, lastVisit: 'Recentemente' });
    }

    onClose();
    if (onSuccess) onSuccess();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1C1917]/95 backdrop-blur-[8px]" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl glass border border-[#BF953F]/20 rounded-[3rem] p-8 md:p-12 overflow-y-auto max-h-[90vh] no-scrollbar shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
        <header className="flex justify-between items-start mb-10">
           <div className="space-y-1">
             <p className="text-[9px] uppercase tracking-[0.5em] text-[#BF953F] font-bold">Gestão de Agenda</p>
             <h3 className="text-2xl font-serif text-white italic">{appointmentToEdit ? 'Refinar Agendamento' : 'Integrar Atendimento'}</h3>
           </div>
           <button onClick={onClose} className="w-10 h-10 rounded-full glass border-white/5 flex items-center justify-center text-stone-500 hover:text-white transition-all"><ICONS.Plus className="w-5 h-5 rotate-45" /></button>
        </header>

        <form onSubmit={handleConfirm} className="space-y-8">
          <div className="relative">
            <p className="text-[9px] uppercase tracking-widest text-stone-500 mb-2 ml-2">Localizar Cliente VIP</p>
            <div className="relative">
              <ICONS.Portfolio className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BF953F] opacity-40" />
              <input type="text" value={search} onFocus={() => setShowResults(true)} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar por nome..." className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-5 py-5 text-white outline-none focus:border-[#BF953F]/40 transition-all placeholder:text-stone-700" />
            </div>
            
            {showResults && (search.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-3 glass rounded-3xl p-3 z-50 shadow-2xl border-white/10 animate-in fade-in slide-in-from-top-2 duration-300">
                {filteredClients.length > 0 ? (
                  <div className="space-y-1">
                    {filteredClients.map(c => (
                      <button key={c.id} type="button" onClick={() => { setSearch(c.name); setShowResults(false); }} className="w-full p-4 text-left hover:bg-[#BF953F] hover:text-black rounded-2xl text-white text-[10px] uppercase tracking-widest font-bold transition-all flex justify-between items-center">
                        <span>{c.name}</span>
                        <span className="text-[8px] opacity-60">Selecionar</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <button type="button" onClick={() => onNavigateToVIP(search)} className="w-full p-6 text-center rounded-2xl border border-dashed border-[#BF953F]/30 hover:bg-[#BF953F]/10 transition-all group">
                    <p className="text-[10px] text-stone-400 uppercase tracking-widest">Cliente não encontrada</p>
                    <p className="text-[11px] text-[#BF953F] font-bold uppercase tracking-widest mt-2 group-hover:scale-105 transition-transform">+ Cadastrar {search}</p>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-widest text-stone-500 ml-2">Procedimento</label>
              <input required type="text" value={procedure} onChange={(e) => setProcedure(e.target.value)} placeholder="Ex: Volume Russo" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#BF953F]" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-widest text-stone-500 ml-2">Valor Total (R$)</label>
              <input required type="number" value={totalPrice} onChange={(e) => setTotalPrice(e.target.value)} placeholder="0,00" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#BF953F]" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="col-span-1 space-y-1">
              <label className="text-[9px] uppercase tracking-widest text-stone-500 ml-2">Data</label>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#BF953F] text-xs" />
            </div>
            <div className="col-span-1 space-y-1">
              <label className="text-[9px] uppercase tracking-widest text-stone-500 ml-2">Horário</label>
              <input type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#BF953F] text-xs" />
            </div>
            <div className="col-span-1 space-y-1">
              <label className="text-[9px] uppercase tracking-widest text-stone-500 ml-2">Parcelas</label>
              <select value={installments} onChange={(e) => setInstallments(parseInt(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#BF953F] text-xs appearance-none">
                {[1,2,3,4,5,6,10,12].map(n => <option key={n} value={n} className="bg-[#1C1917]">{n}x</option>)}
              </select>
            </div>
            <div className="col-span-1 space-y-1">
              <label className="text-[9px] uppercase tracking-widest text-stone-500 ml-2">Sinal (R$)</label>
              <input type="number" value={depositValue} onChange={(e) => setDepositValue(e.target.value)} placeholder="0,00" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#BF953F] text-xs" />
            </div>
          </div>

          <button type="submit" className="w-full gold-bg text-black py-6 rounded-3xl font-bold uppercase tracking-[0.4em] text-[10px] shadow-[0_10px_30px_rgba(191,149,63,0.3)] hover:scale-[1.02] active:scale-95 transition-all">Confirmar Protocolo Elite</button>
        </form>
      </div>
    </div>
  );
};

export default RegistrationModal;
