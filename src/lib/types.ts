export interface Transaction {
  id?: number;
  amount: number;
  type: 'income' | 'expense';
  note: string;
  category: string;
  date: string; // YYYY-MM-DD
  createdAt: number; // timestamp for sorting equal dates
}

export interface Summary {
  balance: number;
  income: number;
  expense: number;
}

export interface DailySummary {
  date: string;
  income: number;
  expense: number;
}

export type Page = 'dashboard' | 'history' | 'report' | 'settings';

export type AppTheme = 'light' | 'dark' | 'cute' | 'minimalist' | 'vintage' | 'forest' | 'cat';

