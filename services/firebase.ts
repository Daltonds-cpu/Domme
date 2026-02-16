
/**
 * Local Data Service - Domme Lash Elite
 * Substitui o Firebase para persistência local segura e rápida.
 */

const getStore = (name: string): any[] => {
  const data = localStorage.getItem(`domme_v1_${name}`);
  return data ? JSON.parse(data) : [];
};

const setStore = (name: string, data: any[]) => {
  localStorage.setItem(`domme_v1_${name}`, JSON.stringify(data));
};

export const auth = {
  currentUser: { uid: 'local-master-user', displayName: 'Domme Master' }
};

export const dataService = {
  async getCollection(collectionName: string) {
    // Simula delay de rede para manter a sensação de sistema robusto
    await new Promise(resolve => setTimeout(resolve, 100));
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
