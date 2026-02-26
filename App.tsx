
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import ClientManagement from './components/ClientManagement';
import ScheduleTimeline from './components/ScheduleTimeline';
import FinanceDashboard from './components/FinanceDashboard';
import MoreTab from './components/MoreTab';
import LoginPage from './components/LoginPage';
import { auth } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

interface UserProfile {
  name: string;
  avatar: string;
  title: string;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [prefilledClientName, setPrefilledClientName] = useState('');
  const [initialSelectedClientId, setInitialSelectedClientId] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Domme Master',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&auto=format&fit=crop',
    title: 'Senior Lash Master'
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        setUserProfile(prev => ({
          ...prev,
          name: user.displayName || prev.name,
          avatar: user.photoURL || prev.avatar
        }));
      }
      setIsLoadingAuth(false);
    });

    // Listener para o evento de instalação PWA
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const renderContent = () => {
    if (!currentUser) return null;

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            onNavigateToRegistration={(name) => {
              setPrefilledClientName(name);
              setActiveTab('clients');
            }} 
            onNavigateToSchedule={() => setActiveTab('schedule')}
            onNavigateToClient={(id) => {
              setInitialSelectedClientId(id);
              setActiveTab('clients');
            }}
          />
        );
      case 'clients':
        return (
          <ClientManagement 
            prefilledName={prefilledClientName} 
            initialClientId={initialSelectedClientId}
            onClearPrefill={() => {
              setPrefilledClientName('');
              setInitialSelectedClientId('');
            }}
          />
        );
      case 'schedule':
        return <ScheduleTimeline onNavigateToClient={(id) => { setInitialSelectedClientId(id); setActiveTab('clients'); }} />;
      case 'finance':
        return <FinanceDashboard />;
      case 'more':
        return (
          <MoreTab 
            onUpdateProfile={(p) => setUserProfile(prev => ({ ...prev, ...p }))} 
            userProfile={userProfile} 
            deferredPrompt={deferredPrompt}
          />
        );
      default:
        return <Dashboard />;
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#1C1917] flex flex-col items-center justify-center space-y-6 text-center px-6">
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 border-2 border-[#BF953F]/20 rounded-full"></div>
          <div className="absolute inset-0 border-2 border-[#BF953F] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-[10px] uppercase tracking-[0.6em] text-[#BF953F] animate-pulse">Sincronizando Domínio de Luxo</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLoginSuccess={() => {}} />;
  }

  return (
    <div className="flex min-h-screen bg-[#1C1917] text-[#EAE0D5] relative selection:bg-[#BF953F]/30 overflow-x-hidden animate-in fade-in duration-1000">
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-5%] right-[-10%] w-[60%] h-[50%] bg-[#BF953F] rounded-full blur-[150px] opacity-[0.03]"></div>
        <div className="absolute bottom-[-5%] left-[-10%] w-[50%] h-[40%] bg-[#4A3F35] rounded-full blur-[120px] opacity-[0.05]"></div>
      </div>
      
      <div className="hidden md:block">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userProfile={userProfile} />
      </div>

      <main className="flex-1 px-6 py-10 md:px-16 md:py-16 relative z-10 safe-pt">
        <div className="max-w-[1400px] mx-auto h-full">{renderContent()}</div>
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
