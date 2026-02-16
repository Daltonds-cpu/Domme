
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ICONS } from '../constants';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Appointment, Client } from '../types';
import { dataService } from '../services/storage';

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

const FinanceDashboard: React.FC = () => {
  const [filter, setFilter] = useState<'dia' | 'semana' | 'mes' | 'ano'>('mes');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isReceivablesModalOpen, setIsReceivablesModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [appts, clis] = await Promise.all([
      dataService.getCollection('appointments'),
      dataService.getCollection('clients')
    ]);
    setAppointments(appts);
    setClients(clis);
  };

  const transactions: Transaction[] = useMemo(() => {
    return appointments.map(appt => {
      const client = clients.find(c => c.id === appt.clientId);
      const inflow = appt.paymentStatus === 'pago' ? appt.price : (appt.depositValue || 0);
      return {
        id: appt.id, clientId: appt.clientId, client: client ? client.name : 'Externo',
        procedure: appt.serviceType, total: appt.price, method: appt.paymentMethod || 'PIX',
        date: new Date(`${appt.date}T${appt.time}`), status: appt.paymentStatus === 'pago' ? 'Pago' : 'Pendente',
        inflow: inflow, receivable: appt.price - inflow
      };
    });
  }, [appointments, clients]);

  const filteredData = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      const diff = now.getTime() - t.date.getTime();
      const day = 86400000;
      if (filter === 'dia') return diff < day;
      if (filter === 'semana') return diff < day * 7;
      if (filter === 'mes') return diff < day * 30;
      return true;
    });
  }, [filter, transactions]);

  const metrics = useMemo(() => {
    const totalGross = filteredData.reduce((acc, t) => acc + t.total, 0);
    const totalInflow = filteredData.reduce((acc, t) => acc + t.inflow, 0);
    const totalReceivable = transactions.filter(t => t.receivable > 0).reduce((acc, t) => acc + t.receivable, 0);
    return { totalGross, totalInflow, totalReceivable, ticket: filteredData.length ? totalGross / filteredData.length : 0 };
  }, [filteredData, transactions]);

  const handleSettlePayment = async (transactionId: string) => {
    const appt = appointments.find(a => a.id === transactionId);
    if (!appt) return;
    
    const updatedAppt = { ...appt, paymentStatus: 'pago', depositValue: appt.price };
    await dataService.saveItem('appointments', updatedAppt);
    
    const client = clients.find(c => c.id === appt.clientId);
    if (client) {
      const updatedDossie = client.dossie.map(d => 
        d.date === new Date(appt.date).toLocaleDateString('pt-BR') && d.technique === appt.serviceType
        ? { ...d, notes: d.notes + " (Pagamento Total Confirmado)" } : d
      );
      await dataService.saveItem('clients', { ...client, dossie: updatedDossie });
    }
    
    loadData();
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-12 animate-in fade-in pb-24 md:pb-0">
      <header className="flex flex-col md:flex-row justify-between items-end">
        <div className="space-y-2 text-center md:text-left w-full md:w-auto">
          <p className="text-[9px] uppercase tracking-[0.4em] text-[#BF953F] font-bold">Métricas Financeiras</p>
          <h2 className="mobile-h1 font-serif text-white italic">Domínio de Lucro</h2>
        </div>
        <div className="flex glass p-1 rounded-2xl mt-6 md:mt-0">
          {(['dia', 'semana', 'mes', 'ano'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-6 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${filter === f ? 'gold-bg text-black' : 'text-stone-500'}`}>{f}</button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Faturamento Bruto', val: metrics.totalGross, color: '#BF953F' },
          { label: 'Caixa Realizado', val: metrics.totalInflow, color: '#FFF' },
          { label: 'A Receber', val: metrics.totalReceivable, color: '#BF953F', action: () => setIsReceivablesModalOpen(true) },
          { label: 'Ticket Médio', val: metrics.ticket, color: '#FFF' }
        ].map((m, i) => (
          <div key={i} onClick={m.action} className={`glass p-8 rounded-[2rem] border-white/5 ${m.action ? 'cursor-pointer hover:bg-white/5' : ''}`}>
            <p className="text-[9px] uppercase tracking-widest text-stone-500 mb-2">{m.label}</p>
            <h3 className="text-2xl font-num" style={{ color: m.color }}>{formatCurrency(m.val)}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-10 rounded-[2.5rem] h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[{n: 'Inicio', v: 0}, {n: 'Atual', v: metrics.totalInflow}]}>
              <XAxis dataKey="n" hide />
              <Tooltip />
              <Area type="monotone" dataKey="v" stroke="#BF953F" fillOpacity={0.1} fill="#BF953F" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="glass p-8 rounded-[2.5rem] flex flex-col h-[400px]">
          <h4 className="text-lg font-serif italic text-white mb-6">Últimas Transações</h4>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
            {filteredData.map(t => (
              <div key={t.id} className="flex justify-between items-center border-b border-white/5 pb-2">
                <div>
                  <p className="text-xs font-bold text-white uppercase">{t.client}</p>
                  <p className="text-[8px] text-stone-500">{t.procedure}</p>
                </div>
                <p className="text-xs font-num text-[#BF953F]">{formatCurrency(t.inflow)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isReceivablesModalOpen && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsReceivablesModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl glass p-10 rounded-[3rem] border-[#BF953F]/20 animate-in zoom-in duration-300">
            <h3 className="text-2xl font-serif text-white italic mb-8">Pendências VIP</h3>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
              {transactions.filter(t => t.receivable > 0).map(t => (
                <div key={t.id} className="flex justify-between items-center glass p-6 rounded-2xl">
                  <div>
                    <p className="text-xs font-bold text-white uppercase">{t.client}</p>
                    <p className="text-[10px] text-[#BF953F]">Falta: {formatCurrency(t.receivable)}</p>
                  </div>
                  <button onClick={() => handleSettlePayment(t.id)} className="w-10 h-10 rounded-full gold-bg flex items-center justify-center text-black"><ICONS.Plus className="w-5 h-5" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default FinanceDashboard;
