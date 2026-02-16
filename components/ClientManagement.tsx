
import React, { useState, useRef, useEffect } from 'react';
import { ICONS } from '../constants';
import { Client, EyeShape, DossieEntry, AnalysisData } from '../types';
import { db, auth } from '../services/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  onSnapshot
} from 'firebase/firestore';

interface ClientManagementProps {
  prefilledName?: string;
  initialClientId?: string;
  onClearPrefill?: () => void;
  onBackToBooking?: () => void;
}

const ClientManagement: React.FC<ClientManagementProps> = ({ prefilledName, initialClientId, onClearPrefill }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClientForDossie, setSelectedClientForDossie] = useState<Client | null>(null);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  
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
    id: '', name: '', phone: '', email: '',
    birthday: '', instagram: '', facebook: '',
    gallery: [] 
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dossierPhotosRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Consulta Filtrada por ownerId
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, 'clients'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Client));
      setClients(clientsData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => { 
    if (prefilledName) { 
      handleOpenModal(null, prefilledName); 
      onClearPrefill?.(); 
    } 
  }, [prefilledName]);

  const filtered = clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleOpenModal = (client: Client | null = null, namePrefill: string = '') => {
    if (client) {
      setFormClient({ ...client });
    } else {
      setFormClient({ 
        id: '', name: namePrefill, phone: '', email: '',
        birthday: '', instagram: '', facebook: '',
        eyeShape: EyeShape.ALMOND, notes: '', mimos: '',
        gallery: [], lifestyleNotes: '', dossie: [],
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

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!formClient.name || !user) return;

    const clientData = {
      ...formClient,
      ownerId: user.uid, // Inclusão do ownerId
      gallery: formClient.gallery && formClient.gallery.length > 0 
        ? formClient.gallery 
        : ['https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=200&h=200&auto=format&fit=crop'],
    };

    try {
      if (formClient.id) {
        const { id, ...updateData } = clientData;
        await updateDoc(doc(db, 'clients', formClient.id), updateData);
      } else {
        const { id, ...newData } = clientData;
        await addDoc(collection(db, 'clients'), newData);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Erro ao salvar cliente:", err);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!selectedClientForDossie || !currentAnalysisEntryId) return;

    let finalSignature = analysisForm.signature;
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL();
      if (dataUrl.length > 1000) finalSignature = dataUrl;
    }

    const updatedDossie = selectedClientForDossie.dossie.map(d => {
      if (d.id === currentAnalysisEntryId) {
        return { ...d, analysis: { ...analysisForm, signature: finalSignature } };
      }
      return d;
    });

    try {
      await updateDoc(doc(db, 'clients', selectedClientForDossie.id), { dossie: updatedDossie });
      setIsAnalysisModalOpen(false);
    } catch (err) {
      console.error("Erro ao salvar análise:", err);
    }
  };

  const confirmDelete = async () => {
    if (clientToDelete) {
      try {
        await deleteDoc(doc(db, 'clients', clientToDelete));
        setClientToDelete(null);
        setIsDeleteConfirmOpen(false);
      } catch (err) {
        console.error("Erro ao deletar cliente:", err);
      }
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

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
    if ('touches' in e) e.preventDefault();
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
              <div className="w-full aspect-[4/3] md:aspect-video relative overflow-hidden cursor-pointer" onClick={() => setSelectedClientForDossie(client)}>
                <img src={client.gallery[0]} alt={client.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917] via-transparent to-transparent opacity-60"></div>
                <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={(e) => { e.stopPropagation(); handleOpenModal(client); }} className="w-8 h-8 rounded-full glass border-[#BF953F]/30 flex items-center justify-center text-[#BF953F] hover:bg-[#BF953F] hover:text-black transition-all">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                   </button>
                   <button onClick={(e) => { e.stopPropagation(); setClientToDelete(client.id); setIsDeleteConfirmOpen(true); }} className="w-8 h-8 rounded-full glass border-red-500/30 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
                <button onClick={() => setSelectedClientForDossie(client)} className="px-6 py-2 rounded-full border border-white/5 text-[9px] font-bold uppercase tracking-widest text-stone-400 hover:text-white hover:border-[#BF953F]/30 transition-all">Dossiê Completo</button>
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
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full glass flex items-center justify-center border-white/5 hover:border-[#BF953F]/30 transition-all"><ICONS.Plus className="w-5 h-5 rotate-45" /></button>
            </header>
            <form onSubmit={handleSaveClient} className="space-y-10">
              <div className="flex flex-col items-center space-y-4">
                <div onClick={() => fileInputRef.current?.click()} className="w-32 h-32 rounded-full border border-[#BF953F]/40 flex items-center justify-center overflow-hidden cursor-pointer relative group transition-all duration-700">
                  {formClient.gallery && formClient.gallery[0] ? <img src={formClient.gallery[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Preview" /> : <ICONS.Plus className="w-8 h-8 text-[#BF953F]/30" />}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-[0.3em] text-stone-500 font-bold ml-2">Nome Completo</label>
                  <input required value={formClient.name || ''} onChange={e => setFormClient({...formClient, name: e.target.value})} className="w-full bg-white/5 border border-[#BF953F]/20 rounded-2xl px-5 py-4 text-sm text-white font-serif outline-none focus:border-[#BF953F]" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-[0.3em] text-stone-500 font-bold ml-2">WhatsApp</label>
                  <input value={formClient.phone || ''} onChange={e => setFormClient({...formClient, phone: e.target.value})} className="w-full bg-white/5 border border-[#BF953F]/20 rounded-2xl px-5 py-4 text-sm text-white font-num outline-none focus:border-[#BF953F]" />
                </div>
              </div>
              <button type="submit" className="w-full gold-bg text-black py-6 rounded-2xl font-bold uppercase tracking-[0.4em] text-[10px] shadow-2xl active:scale-95 transition-all">Efetivar Registro de Domínio</button>
            </form>
          </div>
        </div>
      )}

      {/* Ficha de Análise - Mantida Conforme Solicitado */}
      {isAnalysisModalOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-[25px]" onClick={() => setIsAnalysisModalOpen(false)}></div>
          <div className="relative w-full max-w-lg bg-[#1A0F0E]/95 backdrop-blur-[25px] border border-[#BF953F]/40 p-8 md:p-10 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-500 max-h-[85vh] overflow-y-auto no-scrollbar">
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
                    <button type="button" onClick={() => setAnalysisForm(prev => ({ ...prev, [q.key]: true }))} className={`flex-1 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${analysisForm[q.key as keyof AnalysisData] === true ? 'gold-bg text-black' : 'text-stone-500'}`}>Sim</button>
                    <button type="button" onClick={() => setAnalysisForm(prev => ({ ...prev, [q.key]: false }))} className={`flex-1 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${analysisForm[q.key as keyof AnalysisData] === false ? 'gold-bg text-black' : 'text-stone-500'}`}>Não</button>
                  </div>
                </div>
              ))}
              <div className="space-y-4">
                <div className="flex justify-between items-end mb-2">
                  <label className="text-[9px] uppercase tracking-[0.3em] text-stone-500 font-bold ml-2">Assinatura Digital</label>
                  <button type="button" onClick={() => { const ctx = canvasRef.current?.getContext('2d'); ctx?.clearRect(0,0,450,160); }} className="text-[8px] uppercase tracking-widest text-[#BF953F]">Limpar</button>
                </div>
                <div className="relative h-40 w-full bg-[#1C1917]/80 rounded-[1.5rem] border border-[#BF953F]/30 overflow-hidden">
                   <canvas ref={canvasRef} width={450} height={160} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={() => setIsDrawing(false)} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={() => setIsDrawing(false)} className="w-full h-full" />
                </div>
              </div>
              <button onClick={handleSaveAnalysis} className="w-full gold-bg text-black py-5 rounded-2xl font-bold uppercase tracking-[0.4em] text-[10px] shadow-2xl active:scale-95 transition-all">Salvar Ficha de Domínio</button>
            </div>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95" onClick={() => setIsDeleteConfirmOpen(false)}></div>
          <div className="relative glass p-10 rounded-[2.5rem] border-red-500/20 text-center space-y-8 max-w-xs w-full">
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
