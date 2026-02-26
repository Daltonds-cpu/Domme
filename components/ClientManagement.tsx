
import React, { useState, useRef, useEffect } from 'react';
import { ICONS } from '../constants';
import { Client, EyeShape, DossieEntry, AnalysisData } from '../types';
import { dataService } from '../services/firebase';
import SignatureCanvas from './SignatureCanvas';

interface ClientManagementProps {
  prefilledName?: string;
  initialClientId?: string;
  onClearPrefill?: () => void;
}

const ClientManagement: React.FC<ClientManagementProps> = ({ prefilledName, initialClientId, onClearPrefill }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClientForDossie, setSelectedClientForDossie] = useState<Client | null>(null);
  const [isNewAtendimentoOpen, setIsNewAtendimentoOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Estados para o Formulário de Novo Atendimento
  const [newEntry, setNewEntry] = useState<Partial<DossieEntry>>({
    procedure: '',
    value: 0,
    paymentMethod: 'PIX',
    analysis: {
      isWearingMascara: false,
      isPregnant: false,
      hasAllergies: false,
      thyroidGlaucomaIssues: false,
      oncologicalTreatment: false,
      recentProcedures: false,
      technique: '',
      mapping: '',
      style: '',
      curvature: '',
      thickness: '',
      adhesiveUsed: '',
      additionalNotes: '',
      signature: ''
    }
  });

  const [formClient, setFormClient] = useState<Partial<Client>>({ 
    name: '', phone: '', email: '', birthday: '', eyeShape: EyeShape.ALMOND, gallery: [], dossie: [], notes: '', photoUrl: '' 
  });

  useEffect(() => {
    loadClients();
    if (prefilledName) {
      setFormClient(prev => ({ ...prev, name: prefilledName }));
      setIsModalOpen(true);
    }
  }, [prefilledName]);

  const loadClients = async () => {
    const data = await dataService.getCollection('clients');
    setClients(data as Client[]);
    if (initialClientId) {
      const target = (data as Client[]).find(c => c.id === initialClientId);
      if (target) setSelectedClientForDossie(target);
    }
  };

  const handleSaveClient = async () => {
    if (!formClient.name || isUploading) return;
    const saved = await dataService.saveItem('clients', {
      ...formClient,
      lastVisit: 'Novo'
    });
    setClients(prev => [saved as Client, ...prev]);
    setIsModalOpen(false);
    setFormClient({ name: '', phone: '', email: '', birthday: '', eyeShape: EyeShape.ALMOND, gallery: [], dossie: [], notes: '' });
    if (onClearPrefill) onClearPrefill();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isGallery: boolean = true) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const clientId = selectedClientForDossie?.id || 'new_client';
      const url = await dataService.uploadImage(file, clientId);
      
      if (isGallery && selectedClientForDossie) {
        const updated = {
          ...selectedClientForDossie,
          gallery: [url, ...(selectedClientForDossie.gallery || [])],
          photoUrl: selectedClientForDossie.photoUrl || url // Set as profile pic if none exists
        };
        await dataService.saveItem('clients', updated);
        setSelectedClientForDossie(updated);
        loadClients();
      } else if (!isGallery) {
        setFormClient(prev => ({
          ...prev,
          photoUrl: url,
          gallery: [url, ...(prev.gallery || [])]
        }));
      }
    } catch (error) {
      console.error("Erro no upload:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveEntry = async () => {
    if (!selectedClientForDossie || !newEntry.procedure || isUploading) return;

    const entry: DossieEntry = {
      ...newEntry as DossieEntry,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toLocaleDateString('pt-BR'),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedClient = {
      ...selectedClientForDossie,
      dossie: [entry, ...(selectedClientForDossie.dossie || [])],
      lastVisit: 'Hoje'
    };

    await dataService.saveItem('clients', updatedClient);
    setSelectedClientForDossie(updatedClient);
    setIsNewAtendimentoOpen(false);
    loadClients();
  };

  const handleDeleteClient = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este perfil VIP? Esta ação é irreversível.')) {
      await dataService.deleteItem('clients', id);
      loadClients();
    }
  };

  const filtered = clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-12 pb-24 md:pb-0 animate-in fade-in duration-1000">
      <header className="flex flex-col items-center justify-center text-center space-y-6">
        <div className="space-y-2">
          <p className="text-[9px] uppercase tracking-[0.4em] text-[#BF953F] font-bold">Base de Dados</p>
          <h2 className="mobile-h1 font-serif text-white italic">Portfólio de <span className="font-normal opacity-80">Estilo</span></h2>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="gold-bg text-black px-10 py-4 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all">Novo Perfil VIP</button>
      </header>

      <div className="relative glass rounded-full overflow-hidden border border-white/5">
        <ICONS.Portfolio className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BF953F] opacity-50" />
        <input type="text" placeholder="PESQUISAR CLIENTE NO DOMÍNIO..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-transparent pl-14 pr-8 py-5 text-[10px] text-white uppercase tracking-[0.3em] outline-none" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((client) => (
          <div key={client.id} className="relative glass rounded-[2rem] border border-[#BF953F]/20 overflow-hidden group flex flex-col hover:border-[#BF953F]/50 transition-all duration-500">
            {/* Ações Rápidas */}
            <div className="absolute top-6 right-6 flex flex-col space-y-3 opacity-0 group-hover:opacity-100 transition-all duration-500 z-20 translate-x-4 group-hover:translate-x-0">
              <a 
                href={`https://wa.me/${client.phone.replace(/\D/g,'')}`} 
                target="_blank" 
                rel="noreferrer" 
                className="w-9 h-9 rounded-full glass border border-[#BF953F]/20 flex items-center justify-center text-[#BF953F] hover:bg-[#BF953F] hover:text-black transition-all shadow-lg"
                title="WhatsApp"
              >
                <ICONS.WhatsApp className="w-4 h-4" />
              </a>
              <button 
                onClick={() => setSelectedClientForDossie(client)} 
                className="w-9 h-9 rounded-full glass border border-[#BF953F]/20 flex items-center justify-center text-[#BF953F] hover:bg-[#BF953F] hover:text-black transition-all shadow-lg"
                title="Dossiê Elite"
              >
                <ICONS.Portfolio className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleDeleteClient(client.id)} 
                className="w-9 h-9 rounded-full glass border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg"
                title="Excluir Perfil"
              >
                <ICONS.Trash className="w-4 h-4" />
              </button>
            </div>

            <div className="p-8 text-center space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full border border-[#BF953F]/30 overflow-hidden flex items-center justify-center bg-white/5">
                {client.photoUrl || client.gallery?.[0] ? (
                  <img src={client.photoUrl || client.gallery?.[0]} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
                ) : (
                  <ICONS.Eye className="w-10 h-10 text-[#BF953F]/40" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-serif text-white italic">{client.name}</h3>
                <p className="text-[8px] uppercase tracking-widest text-[#BF953F]/60 font-bold">{client.eyeShape} • Visto: {client.lastVisit}</p>
              </div>
              <button onClick={() => setSelectedClientForDossie(client)} className="w-full py-4 rounded-full border border-white/5 text-[9px] font-bold uppercase tracking-widest text-stone-400 hover:text-white hover:border-[#BF953F]/40 transition-all">Acessar Dossiê Elite</button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: DOSSIÊ DO CLIENTE (HISTÓRICO) */}
      {selectedClientForDossie && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/98" onClick={() => setSelectedClientForDossie(null)}></div>
          <div className="relative w-full max-w-5xl glass p-8 md:p-14 rounded-[3rem] border-[#BF953F]/30 animate-in slide-in-from-bottom-10 duration-700 max-h-[90vh] overflow-y-auto no-scrollbar">
            <header className="flex flex-col md:flex-row justify-between items-center mb-12 space-y-6 md:space-y-0 border-b border-white/5 pb-8">
              <div className="flex items-center space-x-8">
                <div className="w-20 h-20 rounded-full border-2 border-[#BF953F]/40 overflow-hidden flex items-center justify-center bg-white/5">
                  {selectedClientForDossie.photoUrl || selectedClientForDossie.gallery?.[0] ? (
                    <img src={selectedClientForDossie.photoUrl || selectedClientForDossie.gallery?.[0]} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <ICONS.Eye className="w-8 h-8 text-[#BF953F]/40" />
                  )}
                </div>
                <div>
                  <h3 className="text-3xl font-serif text-white italic">{selectedClientForDossie.name}</h3>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-[9px] uppercase tracking-[0.3em] text-[#BF953F] font-bold">Dossiê de Atendimento</span>
                    <span className="w-1 h-1 rounded-full gold-bg"></span>
                    <span className="text-[9px] uppercase tracking-[0.3em] text-stone-500 font-bold">{selectedClientForDossie.eyeShape}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button onClick={() => setIsNewAtendimentoOpen(true)} className="gold-bg text-black px-8 py-3 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Novo Atendimento</button>
                <button onClick={() => setSelectedClientForDossie(null)} className="w-12 h-12 rounded-full glass flex items-center justify-center text-stone-500 hover:text-white"><ICONS.Plus className="w-5 h-5 rotate-45" /></button>
              </div>
            </header>

            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] uppercase tracking-widest text-stone-500">Galeria de Estilo</h4>
                <label className="cursor-pointer gold-bg text-black px-4 py-2 rounded-full text-[8px] font-bold uppercase tracking-widest hover:scale-105 transition-all">
                  {isUploading ? 'Enviando...' : 'Adicionar Foto'}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, true)} disabled={isUploading} />
                </label>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                {selectedClientForDossie.gallery?.map((img, i) => (
                  <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-white/10">
                    <img src={img} className="w-full h-full object-cover" alt="" />
                  </div>
                ))}
              </div>

              {selectedClientForDossie.dossie?.length > 0 ? (
                selectedClientForDossie.dossie.map((entry, idx) => (
                  <div key={idx} className="glass p-8 rounded-[2rem] border-white/5 space-y-8 hover:border-[#BF953F]/20 transition-all group animate-in fade-in slide-in-from-left-4" style={{animationDelay: `${idx * 100}ms`}}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                      <div>
                        <p className="text-[10px] font-bold text-[#BF953F] uppercase tracking-[0.3em]">{entry.date} às {entry.time}</p>
                        <h4 className="text-xl font-serif text-white italic mt-1">{entry.procedure}</h4>
                      </div>
                      <div className="flex items-center space-x-8">
                        <div className="text-right">
                          <p className="text-[9px] uppercase text-stone-500 tracking-widest">Investimento</p>
                          <p className="text-lg font-num text-white">R$ {entry.value.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] uppercase text-stone-500 tracking-widest">Método</p>
                          <p className="text-xs uppercase tracking-widest text-[#BF953F]">{entry.paymentMethod}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-white/5">
                      <div>
                        <p className="text-[8px] uppercase tracking-widest text-stone-500 mb-1">Técnica / Mapping</p>
                        <p className="text-[10px] text-white font-medium uppercase">{entry.analysis.technique} / {entry.analysis.mapping}</p>
                      </div>
                      <div>
                        <p className="text-[8px] uppercase tracking-widest text-stone-500 mb-1">Curvatura / Espessura</p>
                        <p className="text-[10px] text-white font-medium uppercase">{entry.analysis.curvature} / {entry.analysis.thickness}</p>
                      </div>
                      <div>
                        <p className="text-[8px] uppercase tracking-widest text-stone-500 mb-1">Adesivo</p>
                        <p className="text-[10px] text-white font-medium uppercase">{entry.analysis.adhesiveUsed}</p>
                      </div>
                      <div>
                        <p className="text-[8px] uppercase tracking-widest text-stone-500 mb-1">Saúde Ocular</p>
                        <p className="text-[10px] text-white font-medium">Protocolo Seguro</p>
                      </div>
                    </div>

                    {entry.analysis.additionalNotes && (
                      <div className="bg-white/[0.02] p-4 rounded-xl">
                        <p className="text-[11px] text-stone-400 italic">"{entry.analysis.additionalNotes}"</p>
                      </div>
                    )}
                    
                    {entry.analysis.signature && (
                      <div className="flex items-center justify-end space-x-4 opacity-40">
                         <p className="text-[8px] uppercase tracking-widest">Assinado Digitalmente</p>
                         <img src={entry.analysis.signature} className="h-8 grayscale invert border-b border-[#BF953F]/40" alt="Assinatura" />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-20 opacity-30">
                  <ICONS.Presence className="w-12 h-12 mx-auto mb-4" />
                  <p className="font-serif italic text-lg">Nenhum registro encontrado neste dossiê.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVO ATENDIMENTO (FICHA TÉCNICA) */}
      {isNewAtendimentoOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsNewAtendimentoOpen(false)}></div>
          <div className="relative w-full max-w-3xl glass p-8 md:p-12 rounded-[3.5rem] border-[#BF953F]/40 animate-in zoom-in-95 duration-500 max-h-[85vh] overflow-y-auto no-scrollbar">
            <header className="mb-10 text-center">
              <p className="text-[10px] uppercase tracking-[0.5em] text-[#BF953F] font-bold">Protocolo Técnico</p>
              <h3 className="text-2xl font-serif text-white italic mt-2">Nova Ficha de Atendimento</h3>
            </header>

            <div className="space-y-10">
              {/* Seção Financeira */}
              <div className="space-y-4">
                <h4 className="text-[10px] uppercase tracking-widest text-stone-500 border-b border-white/10 pb-2">Informações Base</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-stone-600 ml-2">Procedimento</label>
                    <input value={newEntry.procedure} onChange={e => setNewEntry({...newEntry, procedure: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-sm outline-none focus:border-[#BF953F]" placeholder="Ex: Volume Russo" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-stone-600 ml-2">Investimento (R$)</label>
                    <input type="number" value={newEntry.value} onChange={e => setNewEntry({...newEntry, value: parseFloat(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-sm outline-none focus:border-[#BF953F]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-stone-600 ml-2">Pagamento</label>
                    <select value={newEntry.paymentMethod} onChange={e => setNewEntry({...newEntry, paymentMethod: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-sm outline-none focus:border-[#BF953F] appearance-none">
                      <option value="PIX">PIX</option>
                      <option value="CARTÃO">CARTÃO</option>
                      <option value="DINHEIRO">DINHEIRO</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Seção Saúde Ocular */}
              <div className="space-y-4">
                <h4 className="text-[10px] uppercase tracking-widest text-stone-500 border-b border-white/10 pb-2">Avaliação de Saúde (Anamnese)</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Uso de Rímel', key: 'isWearingMascara' },
                    { label: 'Gestante/Lactante', key: 'isPregnant' },
                    { label: 'Histórico Alérgico', key: 'hasAllergies' },
                    { label: 'Tireoide/Glaucoma', key: 'thyroidGlaucomaIssues' },
                    { label: 'Trat. Oncológico', key: 'oncologicalTreatment' },
                    { label: 'Proced. Recentes', key: 'recentProcedures' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center space-x-3 cursor-pointer group">
                      <div 
                        onClick={() => setNewEntry({
                          ...newEntry, 
                          analysis: { ...newEntry.analysis!, [item.key]: !newEntry.analysis![item.key as keyof AnalysisData] }
                        })}
                        className={`w-4 h-4 rounded border ${newEntry.analysis?.[item.key as keyof AnalysisData] ? 'gold-bg border-transparent' : 'border-white/20'} transition-all flex items-center justify-center`}
                      >
                        {newEntry.analysis?.[item.key as keyof AnalysisData] && <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="3" /></svg>}
                      </div>
                      <span className="text-[10px] uppercase tracking-widest text-stone-400 group-hover:text-white transition-colors">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Seção Técnica */}
              <div className="space-y-4">
                <h4 className="text-[10px] uppercase tracking-widest text-stone-500 border-b border-white/10 pb-2">Configuração Estética (Mapping)</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-stone-600 ml-2">Mapping</label>
                    <input placeholder="Ex: Esquilo" value={newEntry.analysis?.mapping} onChange={e => setNewEntry({...newEntry, analysis: {...newEntry.analysis!, mapping: e.target.value}})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-xs outline-none focus:border-[#BF953F]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-stone-600 ml-2">Curvatura</label>
                    <input placeholder="Ex: C+ / D" value={newEntry.analysis?.curvature} onChange={e => setNewEntry({...newEntry, analysis: {...newEntry.analysis!, curvature: e.target.value}})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-xs outline-none focus:border-[#BF953F]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-stone-600 ml-2">Espessura</label>
                    <input placeholder="Ex: 0.07" value={newEntry.analysis?.thickness} onChange={e => setNewEntry({...newEntry, analysis: {...newEntry.analysis!, thickness: e.target.value}})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-xs outline-none focus:border-[#BF953F]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-stone-600 ml-2">Estilo/Efeito</label>
                    <input placeholder="Ex: Kim K" value={newEntry.analysis?.style} onChange={e => setNewEntry({...newEntry, analysis: {...newEntry.analysis!, style: e.target.value}})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-xs outline-none focus:border-[#BF953F]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-stone-600 ml-2">Adesivo</label>
                    <input placeholder="Ex: Sky Gold" value={newEntry.analysis?.adhesiveUsed} onChange={e => setNewEntry({...newEntry, analysis: {...newEntry.analysis!, adhesiveUsed: e.target.value}})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-xs outline-none focus:border-[#BF953F]" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] uppercase tracking-widest text-stone-500 border-b border-white/10 pb-2">Consentimento & Assinatura</h4>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest text-stone-600 ml-2">Observações Adicionais</label>
                  <textarea rows={2} value={newEntry.analysis?.additionalNotes} onChange={e => setNewEntry({...newEntry, analysis: {...newEntry.analysis!, additionalNotes: e.target.value}})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-xs outline-none focus:border-[#BF953F] resize-none" placeholder="Intercorrências ou preferências da cliente..."></textarea>
                </div>
                
                <SignatureCanvas onSave={(sig) => setNewEntry({...newEntry, analysis: {...newEntry.analysis!, signature: sig}})} />
              </div>

              <button onClick={handleSaveEntry} className="w-full gold-bg text-black py-6 rounded-[2rem] font-bold uppercase tracking-[0.4em] text-[10px] shadow-2xl hover:scale-[1.02] transition-all">Efetivar Atendimento Elite</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVO PERFIL VIP (CADASTRO DE CLIENTE) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl glass p-8 md:p-12 rounded-[3.5rem] border-[#BF953F]/40 animate-in zoom-in-95 duration-500 max-h-[85vh] overflow-y-auto no-scrollbar">
            <header className="mb-10 text-center">
              <p className="text-[10px] uppercase tracking-[0.5em] text-[#BF953F] font-bold">Iniciação VIP</p>
              <h3 className="text-2xl font-serif text-white italic mt-2">Novo Perfil de Cliente</h3>
            </header>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest text-stone-600 ml-2">Nome Completo</label>
                  <input value={formClient.name} onChange={e => setFormClient({...formClient, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-sm outline-none focus:border-[#BF953F]" placeholder="Ex: Maria Silva" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest text-stone-600 ml-2">WhatsApp</label>
                  <input value={formClient.phone} onChange={e => setFormClient({...formClient, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-sm outline-none focus:border-[#BF953F]" placeholder="(00) 00000-0000" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest text-stone-600 ml-2">Data de Nascimento</label>
                  <input type="date" value={formClient.birthday} onChange={e => setFormClient({...formClient, birthday: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-sm outline-none focus:border-[#BF953F]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest text-stone-600 ml-2">Formato do Olho</label>
                  <select value={formClient.eyeShape} onChange={e => setFormClient({...formClient, eyeShape: e.target.value as EyeShape})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-sm outline-none focus:border-[#BF953F] appearance-none">
                    {Object.values(EyeShape).map(shape => <option key={shape} value={shape}>{shape}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-widest text-stone-600 ml-2">Notas de Estilo</label>
                <textarea rows={2} value={formClient.notes} onChange={e => setFormClient({...formClient, notes: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-xs outline-none focus:border-[#BF953F] resize-none" placeholder="Preferências, curvaturas favoritas, etc..."></textarea>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] uppercase tracking-widest text-stone-500">Foto de Referência</h4>
                  <label className="cursor-pointer gold-bg text-black px-4 py-2 rounded-full text-[8px] font-bold uppercase tracking-widest hover:scale-105 transition-all">
                    {isUploading ? 'Enviando...' : 'Upload Foto'}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, false)} disabled={isUploading} />
                  </label>
                </div>
                {formClient.gallery && formClient.gallery.length > 0 && (
                  <div className="grid grid-cols-4 gap-4">
                    {formClient.gallery.map((img, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden border border-white/10">
                        <img src={img} className="w-full h-full object-cover" alt="" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={handleSaveClient} className="w-full gold-bg text-black py-6 rounded-[2rem] font-bold uppercase tracking-[0.4em] text-[10px] shadow-2xl hover:scale-[1.02] transition-all">Efetivar Cadastro VIP</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;
