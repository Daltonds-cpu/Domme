
export interface AnalysisData {
  // Avaliação de Saúde
  hasAllergies: boolean;
  allergyDetails?: string;
  recentProcedures: boolean;
  isPregnant: boolean;
  hasEyeConditions: boolean;
  usesContactLenses: boolean;
  oncologicalTreatment: boolean;
  usesGrowthMeds: boolean;
  
  // Hábitos e Estilo de Vida
  intenseLifestyle: boolean;
  sleepingPosition: string;
  makeupHabits: boolean;
  lashTics: boolean;
  
  // Alinhamento de Expectativas
  previousExperience: boolean;
  negativeReaction?: string;
  desiredVolume: string;
  desiredStyle: string;
  
  // Ficha Técnica
  technique: string;
  mapping: string;
  style: string;
  curvature: string;
  thickness: string;
  adhesiveUsed: string;
  
  // Notas e Consentimento
  additionalNotes: string;
  signature?: string; // URL do Firebase Storage
}

export interface DossieEntry {
  id: string;
  date: string;
  time: string;
  procedure: string;
  value: number;
  paymentMethod: string;
  photoUrl?: string;
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
  photoUrl?: string;
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
  depositValue?: number;
  installments?: number;
  paymentMethod?: string;
  paymentStatus?: 'pago' | 'parcial' | 'pendente';
  status: 'scheduled' | 'completed' | 'cancelled';
}
