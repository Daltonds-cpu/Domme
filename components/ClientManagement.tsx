
import React, { useState, useRef, useEffect } from 'react';
import { ICONS } from '../constants';
import { Client, EyeShape, DossieEntry, AnalysisData } from '../types';
import { dataService } from '../services/storage';

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
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [currentAnalysisEntryId, setCurrentAnalysisEntryId] = useState<string | null>(null);
  
  const [analysisForm, setAnalysisForm] = useState<AnalysisData>({
    isWearingMascara: false,
    isPregnant: false,
    recentProcedures: false,
    hasAllergies: false,
    hasVisionIssues: false,
    needsSpecialProcedure: false,
    additionalNotes: '',
    signature: ''
  });
  
  const [formClient, setFormClient] = useState<Partial<Client>>({ 
    name: '', phone: '', email: '', birthday: '', instagram: '', facebook: '', gallery: [] 
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    const data = await dataService.getCollection('clients');
    setClients(data);
    if (initialClientId) {
      const target = data.find((c: Client) => c.id === initialClientId);
      if (target) setSelectedClientForDossie(target);
    }
  };

  useEffect(() => { 
    if (prefilledName) { 
      handleOpenModal(null, prefilledName); 
      onClearPrefill?.(); 
    } 
  }, [prefilledName]);

  const filtered = clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleOpenModal = (client: Client | null = null, namePrefill: string = '') => {
    setFormClient(client || { 
      name: namePrefill, phone: '', email: '', birthday: '', instagram: '', facebook: '',
      eyeShape: EyeShape.ALMOND, notes: '', mimos: '', gallery: [], dossie: [], lastVisit: 'Novo'
    });
    setIsModalOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormClient(prev => ({ ...prev, gallery: [reader.result as string, ...(prev.gallery || [])] }));
      reader.readAsDataURL(file);
    }
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClient.name) return;
    await dataService.saveItem('clients', {
      ...formClient,
      gallery: formClient.gallery?.length ? formClient.gallery : ['https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=400&h=400&auto=format&fit=crop']
    });
    setIsModalOpen(false);
    loadClients();
  };

  const confirmDelete = async () => {
    if (clientToDelete) {
      await dataService.deleteItem('clients', clientToDelete);
      setClientToDelete(null);
      setIsDeleteConfirmOpen(false);
      loadClients();
    }
  };

  const startDrawing = (e: any) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#BF953F';
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
    if (e.touches) e.preventDefault();
  };

  const cleanHandle = (handle?: string) => {
    if (!handle) return '';
    return handle.replace('@', '').trim();
  };

  return (
    <div className="space-y-12 pb-24 md:pb-0 animate-in fade-in duration-1000">
      <header className="flex flex-col items-center justify-center text-center space-y-6">
        <div className="space-y-2">
          <p className="text-[9px] uppercase tracking-[0.4em] text-[#BF953F] font-bold">Base de Dados</p>
          <h2 className="mobile-h1 font-serif text-white italic">Portfólio de <span className="font-normal opacity-80">Estilo</span></h2>
        </div>
        <button onClick={() => handleOpenModal()} className="gold-bg text-black px-10 py-4 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all">Novo Perfil VIP</button>
      </header>

      <div className="relative glass rounded-full overflow-hidden border border-white/5">
        <ICONS.Portfolio className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BF953F] opacity-50" />
        <input type="text" placeholder="PESQUISAR CLIENTE..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-transparent pl-14 pr-8 py-5 text-[10px] text-white uppercase tracking-[0.3em] outline-none" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((client) => (
          <div key={client.id} className="relative bg-[#2D2926]/40 backdrop-blur-[25px] rounded-[2rem] border border-[#BF953F]/20 overflow-hidden group flex flex-col">
            <div className="w-full aspect-video relative overflow-hidden cursor-pointer" onClick={() => setSelectedClientForDossie(client)}>
              <img src={client.gallery[0]} alt={client.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
              <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={(e) => { e.stopPropagation(); handleOpenModal(client); }} className="w-8 h-8 rounded-full glass border-[#BF953F]/30 flex items-center justify-center text-[#BF953F] hover:bg-[#BF953F] hover:text-black transition-all"><ICONS.Plus className="w-3 h-3" /></button>
                 <button onClick={(e) => { e.stopPropagation(); setClientToDelete(client.id); setIsDeleteConfirmOpen(true); }} className="w-8 h-8 rounded-full glass border-red-500/30 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2"/></svg></button>
              </div>
            </div>
            <div className="p-6 text-center space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-serif text-white italic">{client.name}</h3>
                <p className="text-[8px] uppercase tracking-widest text-[#BF953F]/60 font-bold">{client.eyeShape} • {client.lastVisit}</p>
              </div>

              <div className="flex justify-center items-center space-x-6 pt-2">
                <a href={client.phone ? `https://wa.me/${client.phone.replace(/\D/g, '')}` : '#'} onClick={(e) => !client.phone && e.preventDefault()} className={`transition-all duration-500 ${client.phone ? 'text-[#25D366] drop-shadow-[0_0_8px_rgba(37,211,102,0.4)] scale-110' : 'text-stone-700 grayscale opacity-30'}`}><ICONS.WhatsApp className="w-5 h-5" /></a>
                <a href={client.instagram ? `https://instagram.com/${cleanHandle(client.instagram)}` : '#'} onClick={(e) => !client.instagram && e.preventDefault()} className={`transition-all duration-500 ${client.instagram ? 'text-[#E4405F] drop-shadow-[0_0_8px_rgba(228,64,95,0.4)] scale-110' : 'text-stone-700 grayscale opacity-30'}`}><ICONS.Instagram className="w-5 h-5" /></a>
                <a href={client.facebook ? `https://facebook.com/${cleanHandle(client.facebook)}` : '#'} onClick={(e) => !client.facebook && e.preventDefault()} className={`transition-all duration-500 ${client.facebook ? 'text-[#1877F2] drop-shadow-[0_0_8px_rgba(24,119,242,0.4)] scale-110' : 'text-stone-700 grayscale opacity-30'}`}><ICONS.Facebook className="w-5 h-5" /></a>
              </div>

              <button onClick={() => setSelectedClientForDossie(client)} className="w-full py-3 rounded-full border border-white/5 text-[9px] font-bold uppercase tracking-widest text-stone-400 hover:text-white hover:border-[#BF953F]/40 transition-all">Dossiê Completo</button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-[10px]" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl glass p-8 md:p-12 rounded-[3rem] border-[#BF953F]/40 animate-in zoom-in-95 duration-500 max-h-[90vh] overflow-y-auto no-scrollbar">
            <header className="flex justify-between items-start mb-10">
              <h3 className="text-2xl font-serif text-white italic">{formClient.id ? 'Refinar Perfil' : 'Novo Perfil VIP'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full glass flex items-center justify-center"><ICONS.Plus className="w-5 h-5 rotate-45" /></button>
            </header>
            <form onSubmit={handleSaveClient} className="space-y-8">
              <div className="flex flex-col items-center">
                <div onClick={() => fileInputRef.current?.click()} className="w-32 h-32 rounded-full border border-[#BF953F]/40 overflow-hidden cursor-pointer relative group">
                  {formClient.gallery?.[0] ? <img src={formClient.gallery[0]} className="w-full h-full object-cover" alt="" /> : <ICONS.Plus className="w-8 h-8 text-[#BF953F]/30 m-auto mt-11" />}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest text-stone-500 ml-2">Nome Completo</label>
                  <input required value={formClient.name || ''} onChange={e => setFormClient({...formClient, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#BF953F]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest text-stone-500 ml-2">WhatsApp</label>
                  <input placeholder="(00) 00000-0000" value={formClient.phone || ''} onChange={e => setFormClient({...formClient, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#BF953F]" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest text-stone-500 ml-2">Instagram</label>
                  <input placeholder="@exemplo" value={formClient.instagram || ''} onChange={e => setFormClient({...formClient, instagram: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#BF953F]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest text-stone-500 ml-2">Facebook</label>
                  <input placeholder="link ou nome" value={formClient.facebook || ''} onChange={e => setFormClient({...formClient, facebook: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#BF953F]" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest text-stone-500 ml-2">Aniversário</label>
                  <input type="date" value={formClient.birthday || ''} onChange={e => setFormClient({...formClient, birthday: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#BF953F]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest text-stone-500 ml-2">Formato do Olhar</label>
                  <select value={formClient.eyeShape || EyeShape.ALMOND} onChange={e => setFormClient({...formClient, eyeShape: e.target.value as EyeShape})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#BF953F] appearance-none">
                    {Object.values(EyeShape).map(shape => <option key={shape} value={shape} className="bg-[#1C1917]">{shape}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-widest text-stone-500 ml-2">Notas de Estilo & Preferências</label>
                <textarea rows={3} value={formClient.notes || ''} onChange={e => setFormClient({...formClient, notes: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#BF953F] resize-none"></textarea>
              </div>

              <button type="submit" className="w-full gold-bg text-black py-6 rounded-2xl font-bold uppercase tracking-[0.4em] text-[10px]">Efetivar Registro</button>
            </form>
          </div>
        </div>
      )}

      {selectedClientForDossie && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/98" onClick={() => setSelectedClientForDossie(null)}></div>
          <div className="relative w-full max-w-4xl glass p-8 md:p-12 rounded-[3rem] border-[#BF953F]/30 animate-in slide-in-from-bottom-10 duration-700 max-h-[85vh] overflow-y-auto no-scrollbar">
            <header className="flex flex-col md:flex-row justify-between items-center mb-12 space-y-6 md:space-y-0 text-center md:text-left">
              <div className="flex items-center space-x-6">
                <img src={selectedClientForDossie.gallery[0]} className="w-24 h-24 rounded-full border border-[#BF953F]/40 object-cover" alt="" />
                <div>
                  <h3 className="text-3xl font-serif text-white italic">{selectedClientForDossie.name}</h3>
                  <p className="text-[10px] uppercase tracking-[0.5em] text-[#BF953F] font-bold">Protocolo de Exclusividade</p>
                </div>
              </div>
              <button onClick={() => setSelectedClientForDossie(null)} className="px-8 py-3 rounded-full border border-white/10 text-[9px] font-bold uppercase tracking-widest text-stone-500 hover:text-white">Fechar Dossiê</button>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-10">
                <div className="space-y-6">
                  <h4 className="text-xl font-serif text-white italic border-b border-white/5 pb-2">Histórico de Atendimentos</h4>
                  {selectedClientForDossie.dossie?.length ? selectedClientForDossie.dossie.map((entry, idx) => (
                    <div key={idx} className="glass p-6 rounded-3xl border-white/5 space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] font-bold text-[#BF953F] uppercase tracking-widest">{entry.date}</p>
                        <p className="text-xs font-serif text-white italic">{entry.technique}</p>
                      </div>
                      <p className="text-[11px] text-stone-400 leading-relaxed italic">"{entry.notes}"</p>
                      {entry.analysis && (
                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                           <span className="text-[8px] uppercase tracking-widest text-[#BF953F] font-bold">Ficha de Análise Concluída</span>
                           <button onClick={() => { setAnalysisForm(entry.analysis!); setCurrentAnalysisEntryId(entry.id); setIsAnalysisModalOpen(true); }} className="text-[9px] text-white/50 underline">Ver Ficha</button>
                        </div>
                      )}
                    </div>
                  )) : <p className="text-stone-600 italic text-sm">Nenhum registro anterior.</p>}
                </div>
              </div>
              <div className="space-y-10">
                <div className="space-y-4">
                   <h4 className="text-xl font-serif text-white italic border-b border-white/5 pb-2">Galeria</h4>
                   <div className="grid grid-cols-2 gap-4">
                      {selectedClientForDossie.gallery.map((img, i) => (
                        <img key={i} src={img} className="w-full aspect-square object-cover rounded-2xl border border-white/5" alt="" />
                      ))}
                   </div>
                </div>
                <div className="space-y-4">
                   <h4 className="text-xl font-serif text-white italic border-b border-white/5 pb-2">Preferências</h4>
                   <p className="text-xs text-stone-400 leading-relaxed font-serif italic">"{selectedClientForDossie.notes || 'Sem observações especiais.'}"</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;
