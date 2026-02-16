
export interface AnalysisData {
  // Avaliação de Saúde
  isWearingMascara: boolean;
  isPregnant: boolean;
  hasAllergies: boolean;
  thyroidGlaucomaIssues: boolean;
  oncologicalTreatment: boolean;
  recentProcedures: boolean;
  
  // Ficha Técnica
  technique: string; // Fio a Fio, Volume Russo, etc.
  mapping: string; // Boneca, Esquilo, Gatinho, etc.
  style: string;
  curvature: string;
  thickness: string;
  adhesiveUsed: string;
  
  // Notas e Consentimento
  additionalNotes: string;
  signature?: string; // Base64 da assinatura manual
}

export interface DossieEntry {
  id: string;
  date: string;
  time: string;
  procedure: string;
  value: number;
  paymentMethod: string;
  analysis: AnalysisData;
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  instagram?: string;
  facebook?: string;
  birthday: string;
  eyeShape: EyeShape;
  notes: string;
  gallery: string[];
  dossie: DossieEntry[];
  lastVisit: string;
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
  userId: string;
  clientId: string;
  date: string;
  time: string;
  serviceType: string;
  price: number;
  paymentStatus?: 'pago' | 'parcial' | 'pendente';
  status: 'scheduled' | 'completed' | 'cancelled';
}
