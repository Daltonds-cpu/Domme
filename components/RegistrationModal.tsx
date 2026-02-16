
import React, { useState, useMemo, useEffect } from 'react';
import { ICONS } from '../constants';
import { Client, Appointment, DossieEntry } from '../types';
import { db, auth } from '../services/firebase';
import { collection, addDoc, updateDoc, doc, query, where, getDocs } from 'firebase/firestore';

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
  const [clients, setClients] = useState<Client[]>([]);

  const [totalPrice, setTotalPrice] = useState<string>('');
  const [procedure, setProcedure] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [paymentMethod, setPaymentMethod] = useState<Appointment['paymentMethod']>('PIX');
  const [hasDeposit, setHasDeposit] = useState(false);
  const [depositValue, setDepositValue] = useState<string>('');
  const [installments, setInstallments] = useState(1);

  useEffect(() => {
    const loadClients = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const q = query(collection(db, 'clients'), where('ownerId', '==', user.uid));
      const snap = await getDocs(q);
      setClients(snap.docs.map(d => ({ ...d.data(), id: d.id } as Client)));
    };
    if (isOpen) loadClients();
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

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const selectedClient = clients.find(c => c.name === search);
    const totalVal = parseFloat(totalPrice) || 0;
    const depVal = hasDeposit ? (parseFloat(depositValue) || 0) : 0;
    const paymentStatus: Appointment['paymentStatus'] = depVal >= totalVal ? 'pago' : depVal > 0 ? 'parcial' : 'pendente';

    const apptData: any = {
      ownerId: user.uid,
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

    try {
      if (appointmentToEdit) {
        await updateDoc(doc(db, 'appointments', appointmentToEdit.id), apptData);
      } else {
        await addDoc(collection(db, 'appointments'), apptData);
      }

      if (selectedClient) {
        const notes = `Pagamento via ${paymentMethod}${paymentMethod === 'Cartão de Crédito' ? ` em ${installments}x` : ''}.${hasDeposit ? ` Sinal de R$ ${depVal.toFixed(2)} pago.` : ''} Valor restante: R$ ${remainingValue.toFixed(2)}.`;
        
        let updatedDossie: DossieEntry[];
        if (appointmentToEdit) {
          updatedDossie = selectedClient.dossie.map(d => {
            if (d.date === new Date(appointmentToEdit.date).toLocaleDateString('pt-BR') && d.technique === appointmentToEdit.serviceType) {
              return { 
                ...d, date: new Date(selectedDate).toLocaleDateString('pt-BR'), 
                time: selectedTime, technique: procedure || 'Atendimento Personalizado', 
                price: totalVal, notes: notes 
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
          updatedDossie = [newDossieEntry, ...selectedClient.dossie];
        }
        await updateDoc(doc(db, 'clients', selectedClient.id), { lastVisit: 'Hoje', dossie: updatedDossie });
      }

      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      console.error("Erro ao agendar:", err);
    }
  };

  if (!isOpen && !showSuccessToast) return null;

  return (
    <div className={`fixed inset-0 z-[3000] flex items-center justify-center transition-all duration-700 ${isOpen || showSuccessToast ? 'visible opacity-100' : 'invisible opacity-0'}`}>
      <div className="absolute inset-0 bg-[#1C1917]/90 backdrop-blur-[8px]" onClick={onClose}></div>
      {showSuccessToast && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[4000] glass px-8 py-4 rounded-full border-[#BF953F] border animate-in slide-in-from-top-10 flex items-center space-x-3">
          <div className="w-2 h-2 rounded-full gold-bg animate-ping"></div>
          <p className="text-[10px] font-bold text-[#BF953F] uppercase tracking-[0.3em]">Domínio atualizado com sucesso.</p>
        </div>
      )}
      <div className="relative w-[92%] max-h-[80vh] md:max-w-4xl bg-[#1A0F0E]/95 border border-[#BF953F]/20 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl p-6 md:p-12 overflow-y-auto no-scrollbar mb-[80px] md:mb-0">
        <header className="flex justify-between items-start mb-6 md:mb-12">
          <div className="space-y-1">
             <p className="text-[9px] uppercase tracking-[0.5em] text-[#BF953F] font-bold">Protocolo de Luxo</p>
             <h3 className="text-xl md:text-4xl font-serif text-white italic">{appointmentToEdit ? 'Editar Atendimento VIP' : 'Registrar Atendimento'}</h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full glass flex items-center justify-center"><ICONS.Plus className="w-5 h-5 rotate-45" /></button>
        </header>
        <form onSubmit={handleConfirm} className="space-y-6 md:space-y-10">
          <div className="relative">
            <p className="text-[9px] uppercase tracking-[0.3em] text-stone-500 font-bold mb-3">Cliente VIP</p>
            <input type="text" value={search} onFocus={() => setShowResults(true)} onChange={(e) => setSearch(e.target.value)} placeholder="Localizar cliente..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-[#BF953F]" />
            {showResults && search && (
              <div className="absolute top-full left-0 right-0 mt-2 glass rounded-2xl p-4 z-50 max-h-48 overflow-y-auto no-scrollbar shadow-2xl">
                {filteredClientsSearch.map(c => (
                  <button key={c.id} type="button" onClick={() => { setSearch(c.name); setShowResults(false); }} className="w-full py-4 px-4 text-left hover:bg-[#BF953F] hover:text-black rounded-xl text-white text-[11px] uppercase tracking-widest">{c.name}</button>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-3">
              <p className="text-[9px] uppercase tracking-[0.3em] text-stone-500 font-bold mb-3">Procedimento Master</p>
              <input type="text" value={procedure} onChange={(e) => setProcedure(e.target.value)} placeholder="Ex: Volume Russo..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none" />
            </div>
            <div className="space-y-4">
               <p className="text-[9px] uppercase tracking-[0.3em] text-stone-500 font-bold mb-3">Investimento VIP</p>
               <input type="number" value={totalPrice} onChange={(e) => setTotalPrice(e.target.value)} placeholder="0,00" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none" />
            </div>
          </div>
          <button type="submit" className="w-full gold-bg text-black py-5 md:py-7 rounded-2xl font-bold uppercase tracking-[0.3em] text-[10px] md:text-[11px] shadow-2xl active:scale-95 transition-all">Confirmar Atendimento Elite</button>
        </form>
      </div>
    </div>
  );
};

export default RegistrationModal;
