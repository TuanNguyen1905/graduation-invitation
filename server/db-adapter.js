/**
 * Database Adapter Selector
 * Ưu tiên Cloud Firestore khi có biến môi trường Firebase (Vercel / Production).
 * Fallback sang SQLite cục bộ khi chạy dev offline chưa cấu hình Firebase.
 */
import { createFirestoreAdapter, hasFirebaseConfig } from './db-firestore.js';
import { createSqliteAdapter } from './db-sqlite.js';

let cachedAdapter = null;

export async function getDbAdapter() {
  if (cachedAdapter) return cachedAdapter;

  if (hasFirebaseConfig()) {
    cachedAdapter = createFirestoreAdapter();
    return cachedAdapter;
  }

  if (process.env.VERCEL) {
    throw new Error('Chưa cấu hình biến môi trường Firebase trên Vercel (FIREBASE_SERVICE_ACCOUNT hoặc FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY).');
  }

  cachedAdapter = await createSqliteAdapter();
  return cachedAdapter;
}
