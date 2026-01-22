
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  SCAN = 'SCAN',
  RESULTS = 'RESULTS',
  MAP = 'MAP',
  REWARDS = 'REWARDS',
  DIY = 'DIY'
}

export interface WasteAnalysis {
  itemName: string;
  material: string;
  isRecyclable: boolean;
  municipalityRules: string;
  upcyclingIdeas: string[];
  resaleValue?: string;
  nearbyCentersQuery: string;
  pointsPotential: number;
}

export interface GroundingLink {
  title: string;
  uri: string;
}

export interface UserStats {
  points: number;
  streak: number;
  divertedWasteKg: number;
  scansCount: number;
}

export interface RewardItem {
  id: string;
  name: string;
  cost: number;
  description: string;
  icon: string;
}
