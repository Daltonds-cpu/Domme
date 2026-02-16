
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, getDocs, setDoc, deleteDoc, query, where, getDoc, orderBy } from 'firebase/firestore';

const firebaseConfig = {
  // Fix: Using process.env to avoid ImportMeta type errors in this environment
  apiKey: (process.env as any).VITE_FIREBASE_API_KEY || "AIzaSyBLtOil56xWKHUX_xoDgyzyXXlf4aj4rkE",
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

  // Fix: Added getItem method to support Dashboard and other components
  async getItem(collectionName: string, id: string) {
    const user = auth.currentUser;
    if (!user) return null;
    try {
      const docRef = doc(db, collectionName, id);
      const snap = await getDoc(docRef);
      if (snap.exists() && (snap.data() as any).userId === user.uid) {
        return { id: snap.id, ...snap.data() };
      }
      return null;
    } catch (error) {
      console.error(`Erro ao buscar item em ${collectionName}:`, error);
      return null;
    }
  },

  async getClientHistory(clientId: string) {
    const user = auth.currentUser;
    if (!user) return [];
    
    try {
      const clientRef = doc(db, 'clients', clientId);
      const snap = await getDoc(clientRef);
      if (snap.exists() && (snap.data() as any).userId === user.uid) {
        return (snap.data() as any).dossie || [];
      }
      return [];
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      return [];
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
      userId: user.uid,
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

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);
