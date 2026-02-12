
export interface AnalysisData {
  isWearingMascara: boolean;
  isPregnant: boolean;
  recentProcedures: boolean;
  hasAllergies: boolean;
  hasVisionIssues: boolean;
  needsSpecialProcedure: boolean;
  additionalNotes: string;
  signature?: string; // Base64 da assinatura
}

export interface DossieEntry {
  id: string;
  date: string;
  time?: string;
  technique: string;
  curvature: string;
  thickness: string;
  price: number;
  notes: string;
  photos: string[];
  analysis?: AnalysisData;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  instagram?: string;
  facebook?: string;
  birthday: string; // Format: YYYY-MM-DD
  lastVisit: string;
  eyeShape: EyeShape;
  notes: string;
  mimos: string; // Birthday gifts or special treatment
  gallery: string[]; // URLs to high-res images
  lifestyleNotes: string; // Deterministic lifestyle details
  dossie: DossieEntry[];
}

export enum EyeShape {
  ALMOND = 'Almendoada',
  ROUND = 'Redonda',
  HOODED = 'Caída',
  MONOLID = 'Oriental',
  DOWNTURNED = 'Descendente',
  UPTURNED = 'Ascendente'
}

export interface Appointment {
  id: string;
  clientId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMinutes: number;
  serviceType: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  price: number;
  depositValue?: number;
  installments?: number;
  paymentMethod?: 'Dinheiro' | 'PIX' | 'Cartão de Crédito' | 'Cartão de Débito';
  paymentStatus?: 'pago' | 'parcial' | 'pendente';
}
