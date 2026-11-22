/**
 * Local Development REST API Server cho GradInvite
 * Tự động chọn Cloud Firestore (nếu có biến môi trường Firebase trong .env) hoặc SQLite cục bộ.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDbAdapter } from './db-adapter.js';
import { handleApiRequest } from './router.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env khi chạy local dev
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(envPath);
  } catch {
    // ignore malformed .env lines
  }
}

const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const PORT = process.env.PORT || 3001;

const server = http.createServer((req, res) =>
  handleApiRequest(req, res, {
    getAdapter: getDbAdapter,
    allowDiskUpload: true,
    uploadsDir
  })
);

server.listen(PORT, async () => {
  try {
    const adapter = await getDbAdapter();
    console.log(`🚀 GradInvite REST API Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`🗄️  Database mode: ${adapter.kind === 'firestore' ? 'Firebase Cloud Firestore' : `Local SQLite (${adapter.dbPath})`}`);
  } catch (err) {
    console.error('❌ Lỗi khởi tạo database adapter:', err.message);
  }
});
