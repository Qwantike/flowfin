export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum RecurrenceFrequency {
  NONE = 'NONE',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMESTRIAL = 'SEMESTRIAL',
  YEARLY = 'YEARLY'
}

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  label?: string;
  date: string; // ISO format YYYY-MM-DD
}

export interface ChartDataPoint {
  id: string;
  name: string;
  value: number;
  color: string;
}

// --- Wealth Management Types ---

export enum AssetCategory {
  LIQUIDITY = 'LIQUIDITY', // Livrets, Cash
  INVESTMENT = 'INVESTMENT', // PEA, CTO, Assurance Vie
  REAL_ESTATE = 'REAL_ESTATE', // Immobilier
  CRYPTO = 'CRYPTO'
}

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  value: number; // Valeur actuelle estimée
  yield: number; // Rendement annuel en %
  
  // Specific fields for Real Estate
  realEstateDetails?: {
    monthlyRent: number;
    hasLoan: boolean;
    loanAmount: number; // Montant initial
    loanRate: number; // Taux d'intérêt
    loanDurationYears: number;
    loanStartDate: string; // YYYY-MM-DD
  };
}