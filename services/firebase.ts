
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, getDocs, setDoc, deleteDoc, query, where, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBLtOil56xWKHUX_xoDgyzyXXlf4aj4rkE",
  authDomain: "domme-5ad27.firebaseapp.com",
  projectId: "domme-5ad27",
  storageBucket: "domme-5ad27.firebasestorage.app",
  messagingSenderId: "1006381592174",
  appId: "1:1006381592174:web:e9df2202c764dc5dacc07f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

/**
 * Serviço de Dados com Isolamento por Usuário
 */
export const dataService = {
  async getCollection(collectionName: string) {
    const user = auth.currentUser;
    if (!user) return [];
    
    try {
      const q = query(
        collection(db, collectionName), 
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error(`Erro ao buscar ${collectionName}:`, error);
      return [];
    }
  },

  async getItem(collectionName: string, id: string) {
    const user = auth.currentUser;
    if (!user) return null;
    
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().userId === user.uid) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error(`Erro ao buscar item:`, error);
      return null;
    }
  },

  async saveItem(collectionName: string, item: any) {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");
    
    const id = item.id || Math.random().toString(36).substr(2, 9);
    const docRef = doc(db, collectionName, id);
    
    const payload = { 
      ...item, 
      id, 
      userId: user.uid, // Vínculo de propriedade do dado
      updatedAt: new Date().toISOString() 
    };

    await setDoc(docRef, payload, { merge: true });
    return payload;
  },

  async deleteItem(collectionName: string, id: string) {
    const user = auth.currentUser;
    if (!user) return;
    
    const docRef = doc(db, collectionName, id);
    // Nota: Regras de segurança no Firebase Console devem validar se o UID coincide
    await deleteDoc(docRef);
  }
};

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);
