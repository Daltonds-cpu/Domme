
import React, { useState, useMemo, useEffect } from 'react';
import { ICONS } from '../constants';
import { Client, Appointment, DossieEntry } from '../types';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onNavigateToVIP: (name: string) => void;
  appointmentToEdit?: Appointment | null;
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  onNavigateToVIP,
  appointmentToEdit 
}) => {
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const [totalPrice, setTotalPrice] = useState<string>('');
  const [procedure, setProcedure] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [paymentMethod, setPaymentMethod] = useState<Appointment['paymentMethod']>('PIX');
  const [hasDeposit, setHasDeposit] = useState(false);
  const [depositValue, setDepositValue] = useState<string>('');
  const [installments, setInstallments] = useState(1);

  const clients: Client[] = useMemo(() => {
    const saved = localStorage.getItem('domme_clients');
    return saved ? JSON.parse(saved) : [];
  }, [isOpen]);

  useEffect(() => {
    if (appointmentToEdit) {
      const client = clients.find(c => c.id === appointmentToEdit.clientId);
      setSearch(client ? client.name : 'Cliente Externo');
      setTotalPrice(appointmentToEdit.price.toString());
      setProcedure(appointmentToEdit.serviceType);
      setSelectedDate(appointmentToEdit.date);
      setSelectedTime(appointmentToEdit.time);
      setPaymentMethod(appointmentToEdit.paymentMethod || 'PIX');
      setHasDeposit(!!(appointmentToEdit.depositValue && appointmentToEdit.depositValue > 0));
      setDepositValue(appointmentToEdit.depositValue?.toString() || '');
      setInstallments(appointmentToEdit.installments || 1);
    } else {
      setSearch('');
      setTotalPrice('');
      setProcedure('');
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setSelectedTime('09:00');
      setPaymentMethod('PIX');
      setHasDeposit(false);
      setDepositValue('');
      setInstallments(1);
    }
  }, [appointmentToEdit, isOpen, clients]);

  const remainingValue = useMemo(() => {
    const total = parseFloat(totalPrice) || 0;
    const dep = hasDeposit ? (parseFloat(depositValue) || 0) : 0;
    return Math.max(0, total - dep);
  }, [totalPrice, depositValue, hasDeposit]);

  const filteredClientsSearch = useMemo(() => {
    if (!search.trim()) return [];
    return clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [search, clients]);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedClient = clients.find(c => c.name === search);
    const totalVal = parseFloat(totalPrice) || 0;
    const depVal = hasDeposit ? (parseFloat(depositValue) || 0) : 0;
    const paymentStatus: Appointment['paymentStatus'] = depVal >= totalVal ? 'pago' : depVal > 0 ? 'parcial' : 'pendente';

    const savedAppts: Appointment[] = JSON.parse(localStorage.getItem('domme_appointments') || '[]');
    let updatedAppts: Appointment[];

    const appointmentId = appointmentToEdit ? appointmentToEdit.id : Math.random().toString(36).substr(2, 9);

    const apptData: Appointment = {
      id: appointmentId,
      clientId: selectedClient?.id || 'guest',
      date: selectedDate,
      time: selectedTime,
      durationMinutes: 90,
      serviceType: procedure || 'Atendimento Personalizado',
      status: 'scheduled',
      price: totalVal,
      depositValue: depVal,
      installments: paymentMethod === 'Cartão de Crédito' ? installments : undefined,
      paymentMethod,
      paymentStatus
    };

    if (appointmentToEdit) {
      updatedAppts = savedAppts.map(a => a.id === appointmentToEdit.id ? apptData : a);
    } else {
      updatedAppts = [apptData, ...savedAppts];
    }
    
    localStorage.setItem('domme_appointments', JSON.stringify(updatedAppts));

    if (selectedClient) {
      const notes = `Pagamento via ${paymentMethod}${paymentMethod === 'Cartão de Crédito' ? ` em ${installments}x` : ''}.${hasDeposit ? ` Sinal de R$ ${depVal.toFixed(2)} pago.` : ''} Valor restante: R$ ${remainingValue.toFixed(2)}.`;
      const updatedClients = clients.map(c => {
        if (c.id === selectedClient.id) {
          let updatedDossie: DossieEntry[];
          if (appointmentToEdit) {
            updatedDossie = c.dossie.map(d => {
              if (d.date === new Date(appointmentToEdit.date).toLocaleDateString('pt-BR') && d.technique === appointmentToEdit.serviceType) {
                return { 
                  ...d, 
                  date: new Date(selectedDate).toLocaleDateString('pt-BR'), 
                  time: selectedTime,
                  technique: procedure || 'Atendimento Personalizado', 
                  price: totalVal, 
                  notes: notes 
                };
              }
              return d;
            });
          } else {
            const newDossieEntry: DossieEntry = {
              id: Math.random().toString(36).substr(2, 9),
              date: new Date(selectedDate).toLocaleDateString('pt-BR'),
              time: selectedTime,
              technique: procedure || 'Atendimento Personalizado',
              curvature: '-', thickness: '-', price: totalVal, notes: notes, photos: []
            };
            updatedDossie = [newDossieEntry, ...c.dossie];
          }
          return { ...c, lastVisit: 'Hoje', dossie: updatedDossie };
        }
        return c;
      });
      localStorage.setItem('domme_clients', JSON.stringify(updatedClients));
    }

    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
      onClose();
      if (onSuccess) onSuccess();
    }, 1500);
  };

  if (!isOpen && !showSuccessToast) return null;

  return (
    <div className={`fixed inset-0 z-[3000] flex items-center justify-center transition-all duration-700 ${isOpen || showSuccessToast ? 'visible opacity-100' : 'invisible opacity-0'}`}>
      <div className="absolute inset-0 bg-[#1C1917]/90 backdrop-blur-[8px]" onClick={onClose}></div>
      
      {showSuccessToast && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[4000] glass px-8 py-4 rounded-full border-[#BF953F] border animate-in slide-in-from-top-10 duration-500 shadow-[0_10px_40px_rgba(191,149,63,0.4)] flex items-center space-x-3">
          <div className="w-2 h-2 rounded-full gold-bg animate-ping"></div>
          <p className="text-[10px] font-bold text-[#BF953F] uppercase tracking-[0.3em]">
            {appointmentToEdit ? 'Domínio atualizado com sucesso.' : 'Atendimento registrado com sucesso.'}
          </p>
        </div>
      )}

      <div className={`relative w-[92%] max-h-[80vh] md:max-w-4xl bg-[#1A0F0E]/95 border border-[#BF953F]/20 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl p-6 md:p-12 overflow-y-auto no-scrollbar transition-all transform ${isOpen ? 'scale-100' : 'scale-95'} mb-[80px] md:mb-0`}>
        <div className="flex justify-between items-start mb-6 md:mb-12">
          <div className="space-y-1">
             <p className="text-[9px] uppercase tracking-[0.5em] text-[#BF953F] font-bold">Protocolo de Luxo</p>
             <h3 className="text-xl md:text-4xl font-serif text-white italic">{appointmentToEdit ? 'Editar Atendimento VIP' : 'Registrar Atendimento'}</h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 md:w-12 md:h-12 rounded-full glass flex items-center justify-center border-white/5 hover:border-[#BF953F]/30 transition-all">
            <ICONS.Plus className="w-5 h-5 md:w-6 md:h-6 rotate-45" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="space-y-6 md:space-y-10">
          <div className="relative">
            <p className="text-[9px] uppercase tracking-[0.3em] text-stone-500 font-bold mb-3">Cliente VIP</p>
            <input 
              type="text" 
              value={search} 
              onFocus={() => setShowResults(true)} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Localizar cliente..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-[#BF953F] transition-all font-num" 
            />
            {showResults && search && (
              <div className="absolute top-full left-0 right-0 mt-2 glass rounded-2xl p-4 z-50 max-h-48 overflow-y-auto no-scrollbar shadow-2xl">
                {filteredClientsSearch.map(c => (
                  <button 
                    key={c.id} 
                    type="button"
                    onClick={() => { setSearch(c.name); setShowResults(false); }} 
                    className="w-full py-4 px-4 text-left hover:bg-[#BF953F] hover:text-black border-b border-white/5 last:border-0 text-white text-[11px] uppercase tracking-widest transition-all rounded-xl"
                  >
                    {c.name}
                  </button>
                ))}
                <button type="button" onClick={() => onNavigateToVIP(search)} className="w-full py-4 text-[#BF953F] text-[10px] font-bold uppercase tracking-widest hover:tracking-[0.5em] transition-all">+ Criar Novo Perfil VIP</button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-3">
              <p className="text-[9px] uppercase tracking-[0.3em] text-stone-500 font-bold mb-3">Procedimento Master</p>
              <input 
                type="text" 
                value={procedure} 
                onChange={(e) => setProcedure(e.target.value)} 
                placeholder="Ex: Volume Russo..." 
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-[#BF953F] transition-all" 
              />
            </div>

            <div className="space-y-3">
              <p className="text-[9px] uppercase tracking-[0.3em] text-stone-500 font-bold mb-3">Forma de Pagamento</p>
              <select 
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-[#BF953F] transition-all"
              >
                <option value="PIX">PIX</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <p className="text-[9px] uppercase tracking-[0.3em] text-stone-500 font-bold mb-3">Data</p>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white text-xs outline-none focus:border-[#BF953F] transition-all" />
              </div>
              <div className="space-y-3">
                <p className="text-[9px] uppercase tracking-[0.3em] text-stone-500 font-bold mb-3">Horário</p>
                <input type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white text-xs outline-none focus:border-[#BF953F] transition-all" />
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex justify-between items-center mb-3">
                  <p className="text-[9px] uppercase tracking-[0.3em] text-stone-500 font-bold">Investimento VIP</p>
                  <label className="flex items-center space-x-2 cursor-pointer">
                     <input type="checkbox" checked={hasDeposit} onChange={(e) => setHasDeposit(e.target.checked)} className="w-3 h-3 border-[#BF953F]/30 bg-transparent rounded focus:ring-0 checked:bg-[#BF953F]" />
                     <span className="text-[8px] uppercase tracking-widest text-stone-500">Sinal</span>
                  </label>
               </div>
               <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BF953F] font-num text-sm">R$</span>
                 <input type="number" value={totalPrice} onChange={(e) => setTotalPrice(e.target.value)} placeholder="0,00" className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-lg md:text-2xl font-serif text-white outline-none focus:border-[#BF953F] transition-all" />
               </div>
               {hasDeposit && (
                  <input type="number" value={depositValue} onChange={(e) => setDepositValue(e.target.value)} placeholder="Valor do Sinal..." className="w-full bg-[#BF953F]/5 border border-[#BF953F]/20 rounded-xl px-4 py-3 text-white text-xs animate-in slide-in-from-top-2" />
               )}
            </div>
          </div>
          <button type="submit" className="w-full gold-bg text-black py-5 md:py-7 rounded-2xl font-bold uppercase tracking-[0.3em] text-[10px] md:text-[11px] shadow-2xl active:scale-95 transition-all mt-4 mb-4">
            {appointmentToEdit ? 'Finalizar Ajustes Elite' : 'Confirmar Atendimento Elite'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegistrationModal;
