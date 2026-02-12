
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ICONS } from '../constants';
import { Client, EyeShape, DossieEntry, AnalysisData } from '../types';

interface ClientManagementProps {
  prefilledName?: string;
  initialClientId?: string;
  onClearPrefill?: () => void;
  onBackToBooking?: () => void;
}

const INITIAL_PORTFOLIO: Client[] = [
  { 
    id: '1', name: 'Marina Ruy Barbosa', phone: '5511988776655', email: 'marina@ruybarbosa.com', instagram: 'https://instagram.com/marinaruybarbosa',
    lastVisit: '20/Nov', birthday: '1995-06-30', eyeShape: EyeShape.ALMOND, mimos: 'Vinho Rosé', notes: 'Mapping Esquilo 7-13mm.',
    gallery: ['https://images.unsplash.com/photo-1595152772835-219674b2a8a6?q=80&w=600&h=600&auto=format&fit=crop'], lifestyleNotes: 'Gala.',
    facebook: 'https://facebook.com/marinaruybarbosa',
    dossie: [{ id: 'd1', date: '20/11/2024', time: '14:30', technique: 'Volume Master', curvature: 'CC', thickness: '0.05', price: 450, notes: 'Pagamento via PIX. Sinal de R$ 50.00 pago. Valor restante: R$ 400.00.', photos: [] }]
  },
];

const ClientManagement: React.FC<ClientManagementProps> = ({ prefilledName, initialClientId, onClearPrefill }) => {
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('domme_clients');
    return saved ? JSON.parse(saved) : INITIAL_PORTFOLIO;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClientForDossie, setSelectedClientForDossie] = useState<Client | null>(null);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  
  // States for Analysis Form
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
    id: '', 
    name: '', 
    phone: '', 
    email: '',
    birthday: '', 
    instagram: '', 
    facebook: '',
    gallery: [] 
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dossierPhotosRef = useRef<HTMLInputElement>(null);
  
  // Signature Canvas Ref & Logic
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => { 
    localStorage.setItem('domme_clients', JSON.stringify(clients)); 
  }, [clients]);

  useEffect(() => { 
    if (prefilledName) { 
      handleOpenModal(null, prefilledName); 
      onClearPrefill?.(); 
    } 
  }, [prefilledName]);

  useEffect(() => { 
    if (initialClientId) { 
      const c = clients.find(cl => cl.id === initialClientId); 
      if (c) setSelectedClientForDossie(c); 
      onClearPrefill?.(); 
    } 
  }, [initialClientId, clients]);

  const filtered = clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleOpenModal = (client: Client | null = null, namePrefill: string = '') => {
    if (client) {
      setFormClient({ ...client });
    } else {
      setFormClient({ 
        id: '', 
        name: namePrefill, 
        phone: '',
        email: '',
        birthday: '',
        instagram: '',
        facebook: '',
        eyeShape: EyeShape.ALMOND,
        notes: '',
        mimos: '',
        gallery: [],
        lifestyleNotes: '',
        dossie: [],
        lastVisit: 'Novo'
      });
    }
    setIsModalOpen(true);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setFormClient(prev => ({ ...prev, gallery: [base64] }));
    }
  };

  const handleDossiePhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>, entryId: string) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0 || !selectedClientForDossie) return;

    const base64Photos = await Promise.all(files.map((f: File) => fileToBase64(f)));
    
    const updatedClients = clients.map(c => {
      if (c.id === selectedClientForDossie.id) {
        const updatedDossie = c.dossie.map(d => {
          if (d.id === entryId) {
            return { ...d, photos: [...(d.photos || []), ...base64Photos] };
          }
          return d;
        });
        const updatedClient = { ...c, dossie: updatedDossie };
        setSelectedClientForDossie(updatedClient);
        return updatedClient;
      }
      return c;
    });
    setClients(updatedClients);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClient.name || formClient.name.trim() === '') return;

    if (formClient.id) {
      setClients(prev => prev.map(c => c.id === formClient.id ? formClient as Client : c));
    } else {
      const newClient: Client = {
        ...(formClient as Client),
        id: Math.random().toString(36).substr(2, 9),
        gallery: formClient.gallery && formClient.gallery.length > 0 
          ? formClient.gallery 
          : ['https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=200&h=200&auto=format&fit=crop'],
        dossie: [],
        lastVisit: 'Hoje'
      };
      setClients(prev => [newClient, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleOpenAnalysis = (entry: DossieEntry) => {
    setCurrentAnalysisEntryId(entry.id);
    if (entry.analysis) {
      setAnalysisForm({ ...entry.analysis });
    } else {
      setAnalysisForm({
        isWearingMascara: false,
        isPregnant: false,
        recentProcedures: false,
        hasAllergies: false,
        hasVisionIssues: false,
        needsSpecialProcedure: false,
        additionalNotes: '',
        signature: ''
      });
    }
    setIsAnalysisModalOpen(true);
  };

  const handleSaveAnalysis = () => {
    if (!selectedClientForDossie || !currentAnalysisEntryId) return;

    let finalSignature = analysisForm.signature;
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL();
      if (dataUrl.length > 1000) { 
        finalSignature = dataUrl;
      }
    }

    const updatedClients = clients.map(c => {
      if (c.id === selectedClientForDossie.id) {
        const updatedDossie = c.dossie.map(d => {
          if (d.id === currentAnalysisEntryId) {
            return { ...d, analysis: { ...analysisForm, signature: finalSignature } };
          }
          return d;
        });
        const updatedClient = { ...c, dossie: updatedDossie };
        setSelectedClientForDossie(updatedClient);
        return updatedClient;
      }
      return c;
    });

    setClients(updatedClients);
    setIsAnalysisModalOpen(false);
  };

  const handleDeleteClient = (id: string) => {
    setClientToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (clientToDelete) {
      setClients(prev => prev.filter(c => c.id !== clientToDelete));
      setClientToDelete(null);
      setIsDeleteConfirmOpen(false);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const cleanPhoneForWhatsApp = (p?: string) => {
    if (!p) return '';
    const digits = p.replace(/\D/g, '');
    return digits.startsWith('55') ? digits : `55${digits}`;
  };

  const getInstagramUrl = (val?: string) => {
    if (!val) return '#';
    if (val.startsWith('http')) return val;
    return `https://instagram.com/${val.replace('@', '')}`;
  };

  const getFacebookUrl = (val?: string) => {
    if (!val) return '#';
    if (val.startsWith('http')) return val;
    return `https://facebook.com/${val}`;
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#BF953F';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    
    if ('touches' in e) {
      e.preventDefault();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setAnalysisForm(prev => ({ ...prev, signature: '' }));
  };

  return (
    <div className="space-y-12 pb-24 md:pb-0 animate-in fade-in duration-1000">
      <header className="flex flex-col items-center justify-center text-center space-y-6">
        <div className="space-y-2">
          <p className="text-[9px] uppercase tracking-[0.4em] text-[#BF953F] font-bold">Base de Dados</p>
          <h2 className="mobile-h1 font-serif text-white italic">Portfólio de <span className="font-normal opacity-80">Estilo</span></h2>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="gold-bg text-black px-10 py-4 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(191,149,63,0.3)]"
        >
          Novo Perfil VIP
        </button>
      </header>

      <div className="relative glass rounded-full overflow-hidden border border-white/5">
        <ICONS.Portfolio className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BF953F] opacity-50" />
        <input 
          type="text" 
          placeholder="PESQUISAR CLIENTE..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent pl-14 pr-8 py-5 text-[10px] text-white uppercase tracking-[0.3em] outline-none focus:bg-white/[0.02] transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((client) => {
          const hasPhone = !!(client.phone && client.phone.trim() !== '');
          const hasInsta = !!(client.instagram && client.instagram.trim() !== '');
          const hasFB = !!(client.facebook && client.facebook.trim() !== '');

          return (
            <div key={client.id} className="cliente-card relative bg-[#2D2926]/40 backdrop-blur-[25px] rounded-[2rem] border border-[#BF953F]/20 overflow-hidden transition-all duration-700 hover:shadow-[0_15px_40px_rgba(191,149,63,0.1)] group flex flex-col text-center">
              
              <div 
                className="w-full aspect-[4/3] md:aspect-video relative overflow-hidden cursor-pointer"
                onClick={() => setSelectedClientForDossie(client)}
              >
                <img 
                  src={client.gallery[0]} 
                  alt={client.name} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917] via-transparent to-transparent opacity-60"></div>
                
                <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={(e) => { e.stopPropagation(); handleOpenModal(client); }} className="w-8 h-8 rounded-full glass border-[#BF953F]/30 flex items-center justify-center text-[#BF953F] hover:bg-[#BF953F] hover:text-black transition-all">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                   </button>
                   <button onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id); }} className="w-8 h-8 rounded-full glass border-red-500/30 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                   </button>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col items-center justify-between text-center space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xl md:text-2xl font-serif text-white italic group-hover:text-[#BF953F] transition-colors">{client.name}</h3>
                  <div className="flex items-center justify-center space-x-3">
                    <p className="text-[8px] uppercase tracking-widest text-[#BF953F]/60 font-bold">{client.eyeShape}</p>
                    <span className="w-1 h-1 rounded-full bg-white/10"></span>
                    <p className="text-[8px] uppercase tracking-widest text-stone-500">Visita: {client.lastVisit}</p>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedClientForDossie(client)}
                  className="px-6 py-2 rounded-full border border-white/5 text-[9px] font-bold uppercase tracking-widest text-stone-400 hover:text-white hover:border-[#BF953F]/30 transition-all"
                >
                  Dossiê Completo
                </button>

                <div className="pt-4 w-full flex justify-center items-center gap-8 border-t border-white/5">
                  <a 
                    href={hasPhone ? `https://wa.me/${cleanPhoneForWhatsApp(client.phone)}` : '#'} 
                    target={hasPhone ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    onClick={(e) => !hasPhone && e.preventDefault()}
                    className={`${hasPhone ? 'text-[#D4AF37] hover:scale-125' : 'text-white/20 cursor-default'} transition-all duration-300`}
                  >
                    <ICONS.WhatsApp className="w-4 h-4" />
                  </a>
                  <a 
                    href={hasInsta ? getInstagramUrl(client.instagram) : '#'} 
                    target={hasInsta ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    onClick={(e) => !hasInsta && e.preventDefault()}
                    className={`${hasInsta ? 'text-[#D4AF37] hover:scale-125' : 'text-white/20 cursor-default'} transition-all duration-300`}
                  >
                    <ICONS.Instagram className="w-4 h-4" />
                  </a>
                  <a 
                    href={hasFB ? getFacebookUrl(client.facebook) : '#'} 
                    target={hasFB ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    onClick={(e) => !hasFB && e.preventDefault()}
                    className={`${hasFB ? 'text-[#D4AF37] hover:scale-125' : 'text-white/20 cursor-default'} transition-all duration-300`}
                  >
                    <ICONS.Facebook className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-[25px]" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-[#1A0F0E]/90 backdrop-blur-[25px] border border-[#BF953F]/40 p-8 md:p-12 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-500 max-h-[85vh] overflow-y-auto no-scrollbar mb-[100px] md:mb-0">
            <header className="flex justify-between items-start mb-10">
              <div className="space-y-1">
                <p className="text-[9px] uppercase tracking-[0.5em] text-[#BF953F] font-bold">Registro de Elite</p>
                <h3 className="text-2xl md:text-3xl font-serif text-white italic leading-tight">{formClient.id ? 'Refinar Perfil' : 'Nova Identidade VIP'}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full glass flex items-center justify-center border-white/5 hover:border-[#BF953F]/30 transition-all">
                <ICONS.Plus className="w-5 h-5 rotate-45" />
              </button>
            </header>

            <form onSubmit={handleSaveClient} className="space-y-10">
              <div className="flex flex-col items-center space-y-4">
                <p className="text-[9px] uppercase tracking-[0.3em] text-stone-500 font-bold">Retrato de Estilo</p>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-32 h-32 rounded-full border border-[#BF953F]/40 flex items-center justify-center overflow-hidden cursor-pointer relative group transition-all duration-700 hover:border-[#BF953F]"
                >
                  {formClient.gallery && formClient.gallery[0] ? (
                    <img src={formClient.gallery[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Preview" />
                  ) : (
                    <ICONS.Plus className="w-8 h-8 text-[#BF953F]/30 group-hover:text-[#BF953F] transition-colors" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-[8px] text-white uppercase tracking-widest font-bold">Alterar</p>
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handlePhotoUpload} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-[0.3em] text-stone-500 font-bold ml-2">Nome Completo</label>
                  <input 
                    required 
                    value={formClient.name || ''} 
                    onChange={e => setFormClient({...formClient, name: e.target.value})} 
                    className="w-full bg-white/5 border border-[#BF953F]/20 rounded-2xl px-5 py-4 text-sm text-white font-serif outline-none focus:border-[#BF953F] transition-all" 
                    placeholder="Nome da Cliente (Obrigatório)"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-[0.3em] text-stone-500 font-bold ml-2">WhatsApp</label>
                  <input 
                    value={formClient.phone || ''} 
                    onChange={e => setFormClient({...formClient, phone: e.target.value})} 
                    className="w-full bg-white/5 border border-[#BF953F]/20 rounded-2xl px-5 py-4 text-sm text-white font-num outline-none focus:border-[#BF953F] transition-all" 
                    placeholder="55..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-[0.3em] text-stone-500 font-bold ml-2">E-mail</label>
                  <input 
                    type="email"
                    value={formClient.email || ''} 
                    onChange={e => setFormClient({...formClient, email: e.target.value})} 
                    className="w-full bg-white/5 border border-[#BF953F]/20 rounded-2xl px-5 py-4 text-sm text-white font-serif outline-none focus:border-[#BF953F] transition-all" 
                    placeholder="exemplo@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-[0.3em] text-stone-500 font-bold ml-2">Instagram</label>
                  <input 
                    value={formClient.instagram || ''} 
                    onChange={e => setFormClient({...formClient, instagram: e.target.value})} 
                    className="w-full bg-white/5 border border-[#BF953F]/20 rounded-2xl px-5 py-4 text-sm text-white font-serif outline-none focus:border-[#BF953F] transition-all" 
                    placeholder="@perfil"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-[0.3em] text-stone-500 font-bold ml-2">Facebook (Link)</label>
                  <input 
                    value={formClient.facebook || ''} 
                    onChange={e => setFormClient({...formClient, facebook: e.target.value})} 
                    className="w-full bg-white/5 border border-[#BF953F]/20 rounded-2xl px-5 py-4 text-sm text-white font-serif outline-none focus:border-[#BF953F] transition-all" 
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-[0.3em] text-stone-500 font-bold ml-2">Aniversário</label>
                  <input 
                    type="date" 
                    value={formClient.birthday || ''} 
                    onChange={e => setFormClient({...formClient, birthday: e.target.value})} 
                    className="w-full bg-white/5 border border-[#BF953F]/20 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-[#BF953F] transition-all" 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[9px] uppercase tracking-[0.3em] text-stone-500 font-bold ml-2">Arquitetura Ocular</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.values(EyeShape).map(shape => (
                    <button 
                      key={shape} 
                      type="button" 
                      onClick={() => setFormClient({...formClient, eyeShape: shape})}
                      className={`py-4 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all ${formClient.eyeShape === shape ? 'border-[#BF953F] bg-[#BF953F]/10 text-[#BF953F]' : 'border-white/5 text-stone-600 hover:border-white/20'}`}
                    >
                      {shape}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full gold-bg text-black py-6 rounded-2xl font-bold uppercase tracking-[0.4em] text-[10px] shadow-2xl active:scale-95 hover:scale-[1.02] transition-all"
              >
                Efetivar Registro de Domínio
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedClientForDossie && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-[25px]" onClick={() => setSelectedClientForDossie(null)}></div>
          <div className="relative w-full max-w-4xl bg-[#1A0F0E]/95 backdrop-blur-[25px] border border-[#BF953F]/40 rounded-[3rem] flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-10 mb-[100px] md:mb-0 shadow-2xl shadow-black/80">
            <header className="p-8 md:p-12 border-b border-white/5 flex justify-between items-center bg-[#2D2926]/20">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 rounded-full overflow-hidden border border-[#BF953F]/40 shadow-[0_0_25px_rgba(191,149,63,0.2)]">
                  <img src={selectedClientForDossie.gallery[0]} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" alt={selectedClientForDossie.name} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl md:text-3xl font-serif text-white italic">{selectedClientForDossie.name}</h3>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-[#BF953F] font-bold">Dossiê Técnico & Atendimentos</p>
                </div>
              </div>
              <button onClick={() => setSelectedClientForDossie(null)} className="w-12 h-12 rounded-full glass border-white/10 flex items-center justify-center text-stone-500 hover:text-white transition-all"><ICONS.Plus className="w-6 h-6 rotate-45" /></button>
            </header>

            <div className="flex-1 overflow-y-auto p-8 md:p-12 no-scrollbar space-y-8 bg-gradient-to-b from-transparent to-[#1C1917]/20">
              {selectedClientForDossie.dossie && selectedClientForDossie.dossie.length > 0 ? (
                selectedClientForDossie.dossie
                  .sort((a, b) => {
                    const dateA = new Date(a.date.split('/').reverse().join('-')).getTime();
                    const dateB = new Date(b.date.split('/').reverse().join('-')).getTime();
                    return dateB - dateA;
                  })
                  .map((entry) => (
                    <div key={entry.id} className="bg-[#2D2926]/30 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/5 space-y-6 transition-all duration-700 hover:border-[#BF953F]/30 hover:bg-[#2D2926]/50">
                      
                      <div 
                        className="flex justify-between items-center cursor-pointer group"
                        onClick={() => setExpandedEntryId(expandedEntryId === entry.id ? null : entry.id)}
                      >
                        <div className="flex items-center space-x-6">
                          <div className="text-center bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                            <p className="text-sm font-num text-[#BF953F] font-bold tracking-widest">{entry.date}</p>
                            {entry.time && <p className="text-[9px] text-stone-500 font-num tracking-wider">às {entry.time}</p>}
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] text-stone-500 uppercase tracking-[0.2em] font-bold">Procedimento Master</p>
                            <p className="text-lg font-serif italic text-white group-hover:text-[#BF953F] transition-colors">{entry.technique}</p>
                          </div>
                        </div>
                        <div className="text-right flex items-center space-x-6">
                          <div className="hidden md:block">
                            <p className="text-[9px] text-stone-500 uppercase tracking-[0.2em] font-bold">Valor</p>
                            <p className="text-lg font-num text-[#BF953F] font-normal">{formatCurrency(entry.price)}</p>
                          </div>
                          <div className={`w-8 h-8 rounded-full border border-white/5 flex items-center justify-center transition-transform duration-500 ${expandedEntryId === entry.id ? 'rotate-180 bg-[#BF953F]/10' : ''}`}>
                            <svg className="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                          </div>
                        </div>
                      </div>

                      {expandedEntryId === entry.id && (
                        <div className="animate-in slide-in-from-top-4 duration-700 space-y-10 pt-8 border-t border-white/5">
                          
                          <div className="space-y-6">
                            <div>
                              <p className="text-[8px] text-stone-500 uppercase mb-2 tracking-[0.3em] font-bold">Notas de Domínio & Protocolo de Atendimento</p>
                              <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                                <p className="text-[12px] text-stone-300 italic leading-relaxed">{entry.notes}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-4">
                             <button 
                               onClick={() => handleOpenAnalysis(entry)}
                               className="glass px-6 py-2.5 rounded-full border border-[#BF953F]/30 text-[9px] text-[#BF953F] uppercase tracking-[0.2em] font-bold hover:bg-[#BF953F] hover:text-black transition-all shadow-lg flex items-center"
                             >
                               <span className="mr-2">📝</span> Ficha de Análise
                             </button>
                             <button 
                                onClick={() => dossierPhotosRef.current?.click()}
                                className="glass px-6 py-2.5 rounded-full border border-white/10 text-[9px] text-white uppercase tracking-[0.2em] font-bold hover:bg-white/5 transition-all shadow-lg flex items-center"
                              >
                                <span className="mr-2">📸</span> Incluir Imagens
                              </button>
                          </div>

                          {entry.analysis?.signature && (
                            <div className="space-y-4 border-t border-white/5 pt-6">
                               <p className="text-[9px] text-[#BF953F] uppercase tracking-[0.4em] font-bold">Comprovante de Consentimento Digital</p>
                               <div className="bg-stone-900/40 p-4 rounded-2xl border border-white/5 max-w-xs">
                                  <img src={entry.analysis.signature} className="w-full h-auto opacity-70 contrast-125" alt="Assinatura Digital" />
                               </div>
                            </div>
                          )}

                          <div className="space-y-6">
                             <p className="text-[9px] text-[#BF953F] uppercase tracking-[0.4em] font-bold flex items-center">
                                Galeria de Excelência
                             </p>
                             <div className="grid grid-cols-3 md:grid-cols-6 gap-5">
                                {entry.photos && entry.photos.map((photo, idx) => (
                                  <div 
                                    key={idx} 
                                    onClick={() => setViewingPhoto(photo)} 
                                    className="aspect-square rounded-2xl overflow-hidden border border-white/5 cursor-pointer hover:border-[#BF953F]/40 transition-all group relative hover:scale-105"
                                  >
                                    <img src={photo} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" alt="Lash Result" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                       <ICONS.Plus className="w-5 h-5 text-white" />
                                    </div>
                                  </div>
                                ))}
                                {(!entry.photos || entry.photos.length === 0) && (
                                  <div className="col-span-full py-12 text-center glass rounded-[2rem] border border-dashed border-white/5 opacity-40">
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500 italic">Nenhum registro visual adicionado para este atendimento.</p>
                                  </div>
                                )}
                             </div>
                             <input 
                               type="file" 
                               multiple 
                               ref={dossierPhotosRef} 
                               className="hidden" 
                               accept="image/*" 
                               onChange={(e) => handleDossiePhotosUpload(e, entry.id)} 
                             />
                          </div>
                        </div>
                      )}
                    </div>
                )
              )) : (
                <div className="h-80 flex flex-col items-center justify-center space-y-6 opacity-30 text-center">
                  <div className="w-20 h-20 rounded-full border border-dashed border-[#BF953F]/40 flex items-center justify-center">
                    <ICONS.Dashboard className="w-10 h-10 stroke-stone-600" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-serif italic text-white">O olhar aguarda seu primeiro domínio.</p>
                    <p className="text-[10px] uppercase tracking-[0.5em] text-stone-600">Nenhum atendimento histórico registrado.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isAnalysisModalOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-[25px]" onClick={() => setIsAnalysisModalOpen(false)}></div>
          <div className="relative w-full max-w-lg bg-[#1A0F0E]/95 backdrop-blur-[25px] border border-[#BF953F]/40 p-8 md:p-10 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-500 max-h-[85vh] overflow-y-auto no-scrollbar mb-[80px] md:mb-0">
            <header className="text-center mb-8">
              <p className="text-[9px] uppercase tracking-[0.5em] text-[#BF953F] font-bold">Protocolo Técnico</p>
              <h3 className="text-2xl font-serif text-white italic">Ficha de Análise</h3>
            </header>

            <div className="space-y-8">
              {[
                { label: 'Está de rímel?', key: 'isWearingMascara' },
                { label: 'É gestante?', key: 'isPregnant' },
                { label: 'Fez algum procedimento recentemente?', key: 'recentProcedures' },
                { label: 'Possui alergia a produtos?', key: 'hasAllergies' },
                { label: 'Tem problemas de visão?', key: 'hasVisionIssues' },
                { label: 'Existe procedimento necessário especificar?', key: 'needsSpecialProcedure' }
              ].map((q) => (
                <div key={q.key} className="flex flex-col items-center space-y-3">
                  <p className="text-[11px] text-white/80 font-serif italic tracking-wide">{q.label}</p>
                  <div className="flex glass p-1 rounded-full border-white/5 w-40">
                    <button 
                      type="button"
                      onClick={() => setAnalysisForm(prev => ({ ...prev, [q.key]: true }))}
                      className={`flex-1 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${analysisForm[q.key as keyof AnalysisData] === true ? 'gold-bg text-black' : 'text-stone-500'}`}
                    >
                      Sim
                    </button>
                    <button 
                      type="button"
                      onClick={() => setAnalysisForm(prev => ({ ...prev, [q.key]: false }))}
                      className={`flex-1 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${analysisForm[q.key as keyof AnalysisData] === false ? 'gold-bg text-black' : 'text-stone-500'}`}
                    >
                      Não
                    </button>
                  </div>
                </div>
              ))}

              <div className="space-y-3">
                <label className="text-[9px] uppercase tracking-[0.3em] text-stone-500 font-bold ml-2">Observações Adicionais</label>
                <textarea 
                  value={analysisForm.additionalNotes}
                  onChange={(e) => setAnalysisForm(prev => ({ ...prev, additionalNotes: e.target.value }))}
                  className="w-full h-24 bg-white/5 border border-[#BF953F]/20 rounded-2xl p-4 text-xs text-white outline-none focus:border-[#BF953F] transition-all resize-none italic"
                  placeholder="Descreva detalhes importantes aqui..."
                />
              </div>

              <div className="space-y-4 border-t border-white/5 pt-8">
                <p className="text-[9px] uppercase tracking-[0.3em] text-[#BF953F] font-bold mb-2">Termo de Autorização</p>
                <div className="glass p-5 rounded-2xl border-white/5 bg-[#2D2926]/30 italic text-[10px] text-stone-400 leading-relaxed text-center">
                  "Autorizo a realização do procedimento de extensão de cílios e declaro que as informações acima são verdadeiras. Estou ciente dos cuidados pós-procedimento necessários."
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end mb-2">
                  <label className="text-[9px] uppercase tracking-[0.3em] text-stone-500 font-bold ml-2">Assinatura Digital</label>
                  <button 
                    type="button" 
                    onClick={clearSignature}
                    className="text-[8px] uppercase tracking-widest text-[#BF953F] hover:text-white transition-colors"
                  >
                    Limpar Assinatura
                  </button>
                </div>
                <div className="relative h-40 w-full bg-[#1C1917]/80 rounded-[1.5rem] border border-[#BF953F]/30 overflow-hidden cursor-crosshair">
                   <canvas 
                    ref={canvasRef}
                    width={450}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-full"
                   />
                </div>
              </div>

              <button 
                onClick={handleSaveAnalysis}
                className="w-full gold-bg text-black py-5 rounded-2xl font-bold uppercase tracking-[0.4em] text-[10px] shadow-2xl active:scale-95 transition-all"
              >
                Salvar Ficha de Domínio
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingPhoto && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/98 backdrop-blur-3xl" onClick={() => setViewingPhoto(null)}></div>
           <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-700">
             <img src={viewingPhoto} className="max-w-full max-h-full object-contain rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,0.8)] border border-white/10" alt="Vista Ampliada" />
             <button onClick={() => setViewingPhoto(null)} className="absolute top-0 -right-2 md:-right-12 w-12 h-12 rounded-full glass border-white/20 flex items-center justify-center text-white hover:text-[#BF953F] transition-all"><ICONS.Plus className="w-6 h-6 rotate-45" /></button>
           </div>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95" onClick={() => setIsDeleteConfirmOpen(false)}></div>
          <div className="relative glass p-10 rounded-[2.5rem] border-red-500/20 text-center space-y-8 max-w-xs w-full mb-[100px] md:mb-0">
            <h4 className="text-xl font-serif text-white italic">Remover Perfil?</h4>
            <div className="flex flex-col space-y-4">
              <button onClick={confirmDelete} className="w-full py-4 rounded-xl bg-red-600 text-white font-bold uppercase tracking-widest text-[9px]">Confirmar Exclusão</button>
              <button onClick={() => setIsDeleteConfirmOpen(false)} className="w-full py-4 rounded-xl glass text-stone-400 font-bold uppercase tracking-widest text-[9px]">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;
