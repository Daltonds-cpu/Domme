
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

/**
 * Configuração do Firebase para o Domme Lash Elite.
 * As variáveis devem ser configuradas no Vercel (VITE_FIREBASE_...).
 */
// Fix: Use process.env to resolve 'Property env does not exist on type ImportMeta' errors and align with environment variable access standards
const firebaseConfig = {
  apiKey: (process as any).env.VITE_FIREBASE_API_KEY || "AIzaSy...", // Fallback ou placeholder
  authDomain: (process as any).env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: (process as any).env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: (process as any).env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (process as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: (process as any).env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
