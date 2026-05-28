import type { Transaction } from './types';

const DB_NAME = 'QuickBudgetDB';
const DB_VERSION = 1;
const STORE_NAME = 'transactions';

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('type', 'type', { unique: false });
      }
    };
  });
}

export async function addTransaction(transaction: Omit<Transaction, 'id'>): Promise<number> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transactionObj = db.transaction(STORE_NAME, 'readwrite');
    const store = transactionObj.objectStore(STORE_NAME);
    const request = store.add(transaction);

    request.onsuccess = () => {
      resolve(request.result as number);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function getTransactions(): Promise<Transaction[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      // Sort by date (descending), then by createdAt (descending)
      const list = (request.result as Transaction[]).sort((a, b) => {
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date);
        }
        return b.createdAt - a.createdAt;
      });
      resolve(list);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function updateTransaction(transaction: Transaction): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    if (transaction.id === undefined) {
      reject(new Error('Transaction ID is required for updates'));
      return;
    }
    const transactionObj = db.transaction(STORE_NAME, 'readwrite');
    const store = transactionObj.objectStore(STORE_NAME);
    const request = store.put(transaction);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function deleteTransaction(id: number): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function clearAllTransactions(): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}
