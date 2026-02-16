
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, getDocs, setDoc, deleteDoc, query, where, getDoc } from 'firebase/firestore';

// Fix: Switched from import.meta.env to process.env to resolve TypeScript 'env' property errors on ImportMeta.
// This matches the standard environment configuration used for the Gemini API in this project.
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: "domme-5ad27.firebaseapp.com",
  projectId: "domme-5ad27",
  storageBucket: "domme-5ad27.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Erro na autenticação Google:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);

export const dataService = {
  /**
   * Recupera apenas documentos que pertencem ao usuário logado.
   */
  async getCollection(collectionName: string) {
    const user = auth.currentUser;
    if (!user) return [];
    
    try {
      const q = query(
        collection(db, collectionName), 
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
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
        return { id: docSnap.id, ...docSnap.data() as any };
      }
      return null;
    } catch (error) {
      console.error(`Erro ao buscar item ${id}:`, error);
      return null;
    }
  },

  /**
   * Salva o item injetando automaticamente o userId para segurança.
   */
  async saveItem(collectionName: string, item: any) {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");
    
    const id = item.id || Math.random().toString(36).substr(2, 9);
    const docRef = doc(db, collectionName, id);
    
    const payload = { 
      ...item, 
      id, 
      userId: user.uid, // Garantia de separação de dados
      updatedAt: new Date().toISOString() 
    };

    await setDoc(docRef, payload, { merge: true });
    return payload;
  },

  async deleteItem(collectionName: string, id: string) {
    const user = auth.currentUser;
    if (!user) return;
    
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  }
};

export default app;
