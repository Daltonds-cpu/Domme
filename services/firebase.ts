
/**
 * DOMME LASH - MOTOR DE DADOS LOCAL
 * Este arquivo foi limpo de qualquer dependência externa (Firebase/Cloud).
 * O sistema opera agora em modo puramente local para máxima privacidade.
 */

export const auth = {
  get currentUser() {
    const session = localStorage.getItem('domme_auth_session');
    return session === 'active' ? { uid: 'master-user-local' } : null;
  }
};

export const dataService = {
  /**
   * Obtém uma coleção de dados do LocalStorage
   */
  async getCollection(collectionName: string) {
    const local = localStorage.getItem(`domme_${collectionName}`);
    return local ? JSON.parse(local) : [];
  },

  /**
   * Salva ou atualiza um item no LocalStorage
   */
  async saveItem(collectionName: string, item: any) {
    const data = await this.getCollection(collectionName);
    let updatedData;

    if (item.id) {
      // Atualização
      updatedData = data.map((i: any) => i.id === item.id ? { ...i, ...item } : i);
    } else {
      // Criação
      const newItem = { 
        ...item, 
        id: Math.random().toString(36).substr(2, 9), 
        ownerId: auth.currentUser?.uid || 'local' 
      };
      updatedData = [newItem, ...data];
    }

    localStorage.setItem(`domme_${collectionName}`, JSON.stringify(updatedData));
    return updatedData;
  },

  /**
   * Remove um item do LocalStorage
   */
  async deleteItem(collectionName: string, id: string) {
    const data = await this.getCollection(collectionName);
    const updatedData = data.filter((i: any) => i.id !== id);
    localStorage.setItem(`domme_${collectionName}`, JSON.stringify(updatedData));
    return updatedData;
  }
};

export const isConfigured = true;
export default {};
