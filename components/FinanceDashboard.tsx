
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ICONS } from '../constants';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Appointment, Client } from '../types';

interface Transaction {
  id: string;
  clientId: string;
  client: string;
  procedure: string;
  total: number;
  method: string;
  date: Date;
  status: 'Pago' | 'Pendente';
  inflow: number; 
  receivable: number; 
}

const useCountUp = (target: number, duration: number = 800) => {
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null);
  const initialValue = useRef(0);

  useEffect(() => {
    initialValue.current = count;
    startTime.current = null;
    let animationFrame: number;
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = timestamp - startTime.current;
      const percentage = Math.min(progress / duration, 1);
      const ease = 1 - Math.pow(1 - percentage, 4);
      const currentCount = initialValue.current + (target - initialValue.current) * ease;
      setCount(currentCount);
      if (percentage < 1) animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration]);
  return count;
};

const FinanceDashboard: React.FC = () => {
  const [filter, setFilter] = useState<'dia' | 'semana' | 'mes' | 'ano'>('mes');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isReceivablesModalOpen, setIsReceivablesModalOpen] = useState(false);

  const loadData = () => {
    const savedAppts = localStorage.getItem('domme_appointments');
    const savedClients = localStorage.getItem('domme_clients');
    if (savedAppts) setAppointments(JSON.parse(savedAppts));
    if (savedClients) setClients(JSON.parse(savedClients));
  };

  useEffect(() => {
    loadData();
  }, []);

  const transactions: Transaction[] = useMemo(() => {
    return appointments.map(appt => {
      const client = clients.find(c => c.id === appt.clientId);
      let inflow = appt.depositValue || 0;
      if (appt.paymentStatus === 'pago') inflow = appt.price;
      const receivable = appt.price - inflow;

      return {
        id: appt.id, clientId: appt.clientId, client: client ? client.name : 'Cliente Externo',
        procedure: appt.serviceType, total: appt.price, method: appt.paymentMethod || 'PIX',
        date: new Date(`${appt.date}T${appt.time}`), status: appt.paymentStatus === 'pago' ? 'Pago' : 'Pendente',
        inflow: inflow, receivable: receivable
      };
    });
  }, [appointments, clients]);

  const filteredData = useMemo(() => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const startOfWeekDate = new Date(today);
    startOfWeekDate.setDate(today.getDate() - today.getDay());
    startOfWeekDate.setHours(0, 0, 0, 0);
    const startOfMonthTime = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
    const startOfYearTime = new Date(today.getFullYear(), 0, 1).getTime();

    return transactions.filter(t => {
      const tTime = t.date.getTime();
      switch (filter) {
        case 'dia': return tTime >= startOfToday;
        case 'semana': return tTime >= startOfWeekDate.getTime();
        case 'mes': return tTime >= startOfMonthTime;
        case 'ano': return tTime >= startOfYearTime;
        default: return true;
      }
    });
  }, [filter, transactions]);

  const receivablesList = useMemo(() => {
    return transactions.filter(t => t.receivable > 0);
  }, [transactions]);

  const metrics = useMemo(() => {
    const totalGross = filteredData.reduce((acc, t) => acc + t.total, 0);
    const totalInflow = filteredData.reduce((acc, t) => acc + t.inflow, 0);
    const totalReceivable = filteredData.reduce((acc, t) => acc + t.receivable, 0);
    const ticketMedio = filteredData.length > 0 ? totalGross / filteredData.length : 0;
    return { totalGross, totalInflow, totalReceivable, ticketMedio };
  }, [filteredData]);

  const handleSettlePayment = (transactionId: string) => {
    const targetAppt = appointments.find(a => a.id === transactionId);
    if (!targetAppt) return;
    const updatedAppts = appointments.map(appt => appt.id === transactionId ? { ...appt, paymentStatus: 'pago', depositValue: appt.price } as Appointment : appt);
    localStorage.setItem('domme_appointments', JSON.stringify(updatedAppts));
    
    const updatedClients = clients.map(c => {
      if (c.id === targetAppt.clientId) {
        const updatedDossie = c.dossie.map(d => {
          if (d.date === new Date(targetAppt.date).toLocaleDateString('pt-BR') && d.technique === targetAppt.serviceType) {
            return { ...d, notes: d.notes.replace(/Valor restante: R\$ .*/, 'Pagamento integral recebido.') };
          }
          return d;
        });
        return { ...c, dossie: updatedDossie };
      }
      return c;
    });
    localStorage.setItem('domme_clients', JSON.stringify(updatedClients));
    setAppointments(updatedAppts);
    setClients(updatedClients);
  };

  const animatedGross = useCountUp(metrics.totalGross);
  const animatedInflow = useCountUp(metrics.totalInflow);
  const animatedReceivable = useCountUp(metrics.totalReceivable);
  const animatedTicket = useCountUp(metrics.ticketMedio);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const chartData = useMemo(() => {
    if (filter === 'dia') {
      return [
        { name: 'Manhã', value: filteredData.filter(t => t.date.getHours() < 12).reduce((a, b) => a + b.inflow, 0) },
        { name: 'Tarde', value: filteredData.filter(t => t.date.getHours() >= 12 && t.date.getHours() < 18).reduce((a, b) => a + b.inflow, 0) },
        { name: 'Noite', value: filteredData.filter(t => t.date.getHours() >= 18).reduce((a, b) => a + b.inflow, 0) },
      ];
    }
    const labels = filter === 'semana' ? ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] : filter === 'mes' ? ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'] : ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return labels.map((name, idx) => ({ name, value: filteredData.length > 0 ? (idx + 1) * 200 : 0 }));
  }, [filter, filteredData]);

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-24 md:pb-0">
      <header className="flex flex-col md:flex-row md:items-end justify-between space-y-6 md:space-y-0 text-center md:text-left">
        <div className="space-y-2">
          <p className="text-[9px] uppercase tracking-[0.4em] text-[#BF953F] font-bold">Saúde Financeira</p>
          <h2 className="mobile-h1 font-serif text-white italic">Métricas de Luxo</h2>
        </div>
        <div className="flex glass p-1 rounded-2xl overflow-x-auto no-scrollbar max-w-max mx-auto md:mx-0">
          {(['dia', 'semana', 'mes', 'ano'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-5 md:px-6 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${filter === f ? 'gold-bg text-black shadow-lg shadow-[#BF953F]/40' : 'text-stone-500 hover:text-white hover:bg-white/5'}`}>{f === 'dia' ? 'Hoje' : f === 'semana' ? 'Esta Semana' : f === 'mes' ? 'Este Mês' : 'Ano'}</button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] transition-all duration-500 hover:bg-white/[0.05] text-center md:text-left">
          <p className="text-[9px] font-bold text-stone-500 uppercase tracking-[0.3em] mb-4">Faturamento Bruto</p>
          <h3 className="text-2xl md:text-3xl font-num text-[#BF953F] font-normal">{formatCurrency(animatedGross)}</h3>
        </div>
        <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] transition-all duration-500 hover:bg-white/[0.05] text-center md:text-left">
          <p className="text-[9px] font-bold text-stone-500 uppercase tracking-[0.3em] mb-4">Caixa Real (Inflow)</p>
          <h3 className="text-2xl md:text-3xl font-num text-white font-light">{formatCurrency(animatedInflow)}</h3>
        </div>
        <button 
          onClick={() => setIsReceivablesModalOpen(true)}
          className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] transition-all duration-500 hover:bg-[#BF953F]/5 border-[#BF953F]/20 text-center md:text-left"
        >
          <p className="text-[9px] font-bold text-stone-500 uppercase tracking-[0.3em] mb-4">Saldo Devedor</p>
          <h3 className="text-2xl md:text-3xl font-num text-white font-light">{formatCurrency(animatedReceivable)}</h3>
          <p className="text-[8px] text-[#BF953F] uppercase tracking-widest mt-2 font-bold">Gerir Pendências</p>
        </button>
        <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] transition-all duration-500 hover:bg-white/[0.05] text-center md:text-left">
          <p className="text-[9px] font-bold text-stone-500 uppercase tracking-[0.3em] mb-4">Ticket Médio</p>
          <h3 className="text-2xl md:text-3xl font-num text-white font-light">{formatCurrency(animatedTicket)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
        <div className="lg:col-span-2 glass p-8 md:p-10 rounded-[2.5rem] relative">
          <h4 className="text-lg md:text-xl font-serif text-white italic mb-10 text-center md:text-left">Fluxo de Caixa</h4>
          <div className="h-[250px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs><linearGradient id="goldArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#BF953F" stopOpacity={0.3}/><stop offset="100%" stopColor="#BF953F" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#57534E'}} />
                <YAxis hide />
                <Tooltip contentStyle={{ backgroundColor: '#1C1917', borderRadius: '20px', border: '1px solid rgba(191,149,63,0.2)' }} />
                <Area type="monotone" dataKey="value" stroke="#BF953F" strokeWidth={2} fill="url(#goldArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-8 md:p-10 rounded-[2.5rem] flex flex-col">
          <h4 className="text-lg md:text-xl font-serif text-white italic mb-8 text-center md:text-left">Transações VIP</h4>
          <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar">
            {filteredData.length > 0 ? filteredData.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-transparent hover:border-white/5 transition-all">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-white tracking-widest uppercase truncate">{t.client}</p>
                  <p className="text-[8px] text-stone-500 uppercase tracking-widest mt-0.5">{t.procedure}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-serif text-[#BF953F]">{formatCurrency(t.inflow)}</p>
                </div>
              </div>
            )) : <div className="h-full flex flex-col items-center justify-center opacity-30 text-center text-[10px] uppercase tracking-widest">Sem movimentação</div>}
          </div>
        </div>
      </div>

      {isReceivablesModalOpen && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center transition-all duration-300">
           <div className="absolute inset-0 bg-[#1C1917]/95 backdrop-blur-[8px]" onClick={() => setIsReceivablesModalOpen(false)}></div>
           <div className="relative w-[92%] max-w-5xl bg-[#1A0F0E]/95 border border-[#BF953F]/20 rounded-[2.5rem] md:rounded-[3rem] flex flex-col overflow-hidden animate-in zoom-in duration-500 max-h-[80vh] mb-[80px] md:mb-0">
              <header className="p-6 md:p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                <div className="space-y-1">
                  <p className="text-[9px] uppercase tracking-[0.5em] text-[#BF953F] font-bold">Recuperação de Capital</p>
                  <h3 className="text-xl md:text-3xl font-serif text-white italic">Saldo Devedor VIP</h3>
                </div>
                <button onClick={() => setIsReceivablesModalOpen(false)} className="w-10 h-10 md:w-12 md:h-12 rounded-full glass flex items-center justify-center text-stone-500 hover:text-white transition-all">
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar">
                {receivablesList.length > 0 ? (
                  <div className="space-y-4">
                    {receivablesList.map((t) => (
                      <div key={t.id} className="glass p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-white/5 flex flex-col md:flex-row md:items-center justify-between hover:border-[#BF953F]/40 transition-all group">
                         <div className="flex items-center space-x-6 mb-4 md:mb-0">
                            <div className="text-center min-w-[50px] md:min-w-[60px]">
                               <p className="text-[10px] text-stone-600 uppercase tracking-widest font-num">{t.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>
                            </div>
                            <div className="h-8 w-[1px] bg-white/5 hidden md:block"></div>
                            <div className="min-w-0">
                               <h5 className="text-base md:text-lg font-serif italic text-white group-hover:text-[#BF953F] transition-colors truncate">{t.client}</h5>
                               <p className="text-[9px] uppercase tracking-widest text-stone-500 truncate">{t.procedure}</p>
                            </div>
                         </div>
                         <div className="flex items-center justify-between md:space-x-12 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                            <div className="text-right">
                               <p className="text-[7px] text-[#BF953F] uppercase tracking-widest font-bold">A Receber</p>
                               <p className="text-sm md:text-lg font-num text-[#BF953F] font-bold">{formatCurrency(t.receivable)}</p>
                            </div>
                            <button onClick={() => handleSettlePayment(t.id)} className="ml-4 md:ml-6 w-10 h-10 md:w-12 md:h-12 rounded-full gold-bg flex items-center justify-center text-black shadow-lg hover:scale-110 active:scale-95 transition-all">
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                            </button>
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center opacity-30 text-center space-y-4">
                     <ICONS.Finance className="w-12 h-12 stroke-stone-600" />
                     <p className="text-sm font-serif italic text-white">Domínio Financeiro Absoluto.</p>
                     <p className="text-[9px] uppercase tracking-widest text-stone-600">Sem pendências.</p>
                  </div>
                )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
export default FinanceDashboard;
