
/**
 * Domme Storage Service - Local Persistence Engine
 * Substitui o Firebase para garantir funcionamento 100% offline e sem erros de API.
 */

const getStorageData = (key: string): any[] => {
  const data = localStorage.getItem(`domme_v1_${key}`);
  return data ? JSON.parse(data) : [];
};

const setStorageData = (key: string, data: any[]) => {
  localStorage.setItem(`domme_v1_${key}`, JSON.stringify(data));
};

export const auth = {
  currentUser: {
    uid: 'master-user-local',
    displayName: 'Domme Master',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&auto=format&fit=crop'
  },
  onAuthStateChanged: (callback: (user: any) => void) => {
    const isLogged = localStorage.getItem('domme_logged') === 'true';
    callback(isLogged ? auth.currentUser : null);
    return () => {};
  }
};

export const loginLocal = () => {
  localStorage.setItem('domme_logged', 'true');
  window.location.reload();
};

export const logoutLocal = () => {
  localStorage.removeItem('domme_logged');
  window.location.reload();
};

export const dataService = {
  async getCollection(collectionName: string) {
    return getStorageData(collectionName);
  },

  async getItem(collectionName: string, id: string) {
    const collection = getStorageData(collectionName);
    return collection.find(item => item.id === id) || null;
  },

  async saveItem(collectionName: string, item: any) {
    const collection = getStorageData(collectionName);
    const id = item.id || Math.random().toString(36).substr(2, 9);
    
    const newItem = { 
      ...item, 
      id, 
      updatedAt: new Date().toISOString() 
    };

    const index = collection.findIndex(i => i.id === id);
    if (index > -1) {
      collection[index] = newItem;
    } else {
      collection.push(newItem);
    }

    setStorageData(collectionName, collection);
    return newItem;
  },

  async deleteItem(collectionName: string, id: string) {
    const collection = getStorageData(collectionName);
    const filtered = collection.filter(i => i.id !== id);
    setStorageData(collectionName, filtered);
  }
};
