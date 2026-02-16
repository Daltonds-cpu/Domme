
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import ClientManagement from './components/ClientManagement';
import ScheduleTimeline from './components/ScheduleTimeline';
import FinanceDashboard from './components/FinanceDashboard';
import MoreTab from './components/MoreTab';
import LoginPage from './components/LoginPage';

interface UserProfile {
  name: string;
  avatar: string;
  title: string;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [prefilledClientName, setPrefilledClientName] = useState('');
  const [initialSelectedClientId, setInitialSelectedClientId] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('domme_user_profile');
    return saved ? JSON.parse(saved) : {
      name: 'Domme Master',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&auto=format&fit=crop',
      title: 'Senior Lash Master'
    };
  });

  useEffect(() => {
    // Verifica autenticação local
    const token = localStorage.getItem('domme_auth_token');
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            onNavigateToRegistration={(name) => {
              setPrefilledClientName(name);
              setActiveTab('clients');
            }} 
            onNavigateToSchedule={() => setActiveTab('schedule')}
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
            onUpdateProfile={(p) => {
              const newProfile = {...userProfile, ...p};
              setUserProfile(newProfile);
              localStorage.setItem('domme_user_profile', JSON.stringify(newProfile));
            }} 
            userProfile={userProfile} 
          />
        );
      default:
        return <Dashboard />;
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#1C1917] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#BF953F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex min-h-screen bg-[#1C1917] text-[#EAE0D5] relative selection:bg-[#BF953F]/30 overflow-x-hidden animate-in fade-in duration-1000">
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-5%] right-[-10%] w-[60%] h-[50%] bg-[#BF953F] rounded-full blur-[150px] opacity-[0.04]"></div>
        <div className="absolute bottom-[-5%] left-[-10%] w-[50%] h-[40%] bg-[#4A3F35] rounded-full blur-[120px] opacity-[0.06]"></div>
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
