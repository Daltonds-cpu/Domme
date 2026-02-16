import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Configuração do Firebase para o Domme Lash Elite.
 * Restaurada para o padrão original de produção, utilizando process.env para as chaves fundamentais.
 */
const firebaseConfig = {
  apiKey: (process as any).env.FIREBASE_API_KEY,
  authDomain: (process as any).env.FIREBASE_AUTH_DOMAIN,
  projectId: (process as any).env.FIREBASE_PROJECT_ID,
  storageBucket: (process as any).env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (process as any).env.FIREBASE_MESSAGING_SENDER_ID,
  appId: (process as any).env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;