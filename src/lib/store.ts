import { writable, derived } from 'svelte/store';
import type { Transaction, Summary, Page, AppTheme } from './types';
import * as db from './db';
import { pingUser, supabase } from './analytics';

// Core State Stores
export const userSession = writable<any | null>(null);
export const isAuthLoading = writable<boolean>(true);
export const transactions = writable<Transaction[]>([]);
export const activePage = writable<Page>('dashboard');
export const showAddModal = writable<boolean>(false);
export const editingTransaction = writable<Transaction | null>(null);
export const theme = writable<AppTheme>(
  typeof window !== 'undefined'
    ? (localStorage.getItem('qb-theme') as AppTheme) || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : 'light'
);
export const installPrompt = writable<any | null>(null);

// Database Interaction Actions
export async function loadTransactions() {
  try {
    const list = await db.getTransactions();
    transactions.set(list);
  } catch (error) {
    console.error('Failed to load transactions:', error);
  }
}

export async function addTx(tx: Omit<Transaction, 'id'>) {
  try {
    await db.addTransaction(tx);
    await loadTransactions();
  } catch (error) {
    console.error('Failed to add transaction:', error);
    throw error;
  }
}

export async function updateTx(tx: Transaction) {
  try {
    await db.updateTransaction(tx);
    await loadTransactions();
  } catch (error) {
    console.error('Failed to update transaction:', error);
    throw error;
  }
}

export async function deleteTx(id: number) {
  try {
    await db.deleteTransaction(id);
    await loadTransactions();
  } catch (error) {
    console.error('Failed to delete transaction:', error);
    throw error;
  }
}

export async function clearTx() {
  try {
    await db.clearAllTransactions();
    transactions.set([]);
  } catch (error) {
    console.error('Failed to clear transactions:', error);
    throw error;
  }
}

// Derived Stores for UI Summary Metrics
export const summary = derived(transactions, ($transactions): Summary => {
  let income = 0;
  let expense = 0;

  $transactions.forEach((tx) => {
    if (tx.type === 'income') {
      income += tx.amount;
    } else {
      expense += tx.amount;
    }
  });

  return {
    balance: income - expense,
    income,
    expense
  };
});

// Derived store to calculate daily totals for the weekly mini-chart
export const weeklyData = derived(transactions, ($transactions) => {
  const data: Record<string, { income: number; expense: number }> = {};
  
  // Get date strings for the last 7 days (today down to 6 days ago)
  const last7Days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    last7Days.push(dateStr);
    data[dateStr] = { income: 0, expense: 0 };
  }

  // Populate last 7 days with transaction details
  $transactions.forEach((tx) => {
    if (data[tx.date]) {
      if (tx.type === 'income') {
        data[tx.date].income += tx.amount;
      } else {
        data[tx.date].expense += tx.amount;
      }
    }
  });

  // Convert to sorted array of daily summaries for the chart
  return last7Days.map(date => {
    const dateObj = new Date(date + 'T00:00:00');
    // Short weekday format (e.g., 'Mon', 'Tue')
    const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    return {
      date,
      dayLabel,
      income: data[date].income,
      expense: data[date].expense
    };
  });
});

// Helper to watch theme updates and apply body classes
theme.subscribe(($theme) => {
  if (typeof document !== 'undefined') {
    localStorage.setItem('qb-theme', $theme);
    
    // Remove all theme classes first
    const themeClasses = ['theme-light', 'theme-dark', 'theme-cute', 'theme-minimalist', 'theme-vintage', 'theme-forest', 'theme-cat'];
    themeClasses.forEach(cls => document.documentElement.classList.remove(cls));
    
    // Add current theme class
    document.documentElement.classList.add(`theme-${$theme}`);
    
    // Maintain standard dark class compatibility
    if ($theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
});

// Analytics tracking subscription
let lastPingTime = 0;
let lastPingTheme = '';
let lastPingCount = -1;

function triggerPing(themeVal: AppTheme, txList: Transaction[]) {
  const now = Date.now();
  const txCount = txList.length;
  
  // Throttle pings to at most once every 5 seconds, unless theme or txCount changed
  if (
    themeVal === lastPingTheme && 
    txCount === lastPingCount && 
    now - lastPingTime < 5000
  ) {
    return;
  }
  
  lastPingTime = now;
  lastPingTheme = themeVal;
  lastPingCount = txCount;
  
  pingUser(themeVal, txCount);
}

if (typeof window !== 'undefined') {
  let currentTheme: AppTheme = 'light';
  let currentTx: Transaction[] = [];
  
  theme.subscribe(($theme) => {
    currentTheme = $theme;
    triggerPing(currentTheme, currentTx);
  });
  
  transactions.subscribe(($transactions) => {
    currentTx = $transactions;
    triggerPing(currentTheme, currentTx);
  });

  // Deteksi apakah aplikasi dibuka sebagai PWA Standalone di HP
  const isPWA = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches || 
    (window.navigator as any).standalone === true
  );

  // Watch Auth State Changes
  const hasSupabaseCreds = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  if (!isPWA || !hasSupabaseCreds) {
    // Jalankan offline lokal jika dibuka di browser biasa / Supabase belum diatur
    userSession.set({ id: 'local-user', email: 'local@quickbudget.offline' });
    isAuthLoading.set(false);
  } else {
    // Wajibkan login jika dijalankan sebagai PWA Mandiri di HP
    supabase.auth.getSession().then(({ data: { session } }) => {
      userSession.set(session?.user ?? null);
      isAuthLoading.set(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      userSession.set(session?.user ?? null);
      isAuthLoading.set(false);
    });
  }
}

