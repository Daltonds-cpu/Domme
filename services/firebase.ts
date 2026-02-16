
/**
 * Local Data Service - Domme Lash Elite
 * Implementação via LocalStorage para garantir estabilidade e funcionamento offline.
 */

const getStore = (name: string): any[] => {
  const data = localStorage.getItem(`domme_v1_${name}`);
  return data ? JSON.parse(data) : [];
};

const setStore = (name: string, data: any[]) => {
  localStorage.setItem(`domme_v1_${name}`, JSON.stringify(data));
};

// Simulação de objeto de autenticação para manter compatibilidade com o restante do código
export const auth = {
  currentUser: { uid: 'local-master-user', displayName: 'Domme Master', photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&auto=format&fit=crop' }
};

export const loginWithGoogle = async () => {
  // Simulação de login bem-sucedido
  return auth.currentUser;
};

export const logout = () => {
  localStorage.removeItem('domme_auth_active');
  window.location.reload();
};

export const dataService = {
  async getCollection(collectionName: string) {
    return getStore(collectionName);
  },

  async getItem(collectionName: string, id: string) {
    const store = getStore(collectionName);
    return store.find(item => item.id === id) || null;
  },

  async saveItem(collectionName: string, item: any) {
    const store = getStore(collectionName);
    const id = item.id || Math.random().toString(36).substr(2, 9);
    
    const newItem = { 
      ...item, 
      id, 
      ownerId: 'local-master-user', 
      updatedAt: new Date().toISOString() 
    };

    const index = store.findIndex(i => i.id === id);
    if (index > -1) {
      store[index] = newItem;
    } else {
      store.push(newItem);
    }

    setStore(collectionName, store);
    return newItem;
  },

  async deleteItem(collectionName: string, id: string) {
    const store = getStore(collectionName);
    const filtered = store.filter(i => i.id !== id);
    setStore(collectionName, filtered);
  }
};

export const isConfigured = true;
export default {};
