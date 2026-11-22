/**
 * Node.js SQLite Database Initializer
 * Uses Node's built-in `node:sqlite` (available in Node 22+)
 */
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'graduation.db');
const schemaPath = path.join(__dirname, 'schema.sql');
const seedPath = path.join(__dirname, 'seed.sql');

console.log(`[DB] Đang kết nối SQLite database tại: ${dbPath}`);
const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

console.log(`[DB] Đang thực thi schema từ: ${schemaPath}`);
const schemaSql = fs.readFileSync(schemaPath, 'utf8');
db.exec(schemaSql);
console.log('✅ Đã tạo bảng và index thành công!');

if (fs.existsSync(seedPath)) {
  console.log(`[DB] Đang nạp dữ liệu mẫu ban đầu từ: ${seedPath}`);
  const seedSql = fs.readFileSync(seedPath, 'utf8');
  db.exec(seedSql);
  console.log('✅ Đã nạp dữ liệu mẫu thành công!');
}

// Verify counts
const invCount = db.prepare('SELECT count(*) as count FROM invitations').get();
const guestCount = db.prepare('SELECT count(*) as count FROM guests').get();
const wishCount = db.prepare('SELECT count(*) as count FROM guestbook_wishes').get();

console.log('----------------------------------------------------');
console.log(`📊 Thống kê Database:`);
console.log(`- Thiệp mời (invitations): ${invCount.count}`);
console.log(`- Khách mời (guests): ${guestCount.count}`);
console.log(`- Lời chúc (guestbook_wishes): ${wishCount.count}`);
console.log('----------------------------------------------------');
console.log('🎉 Khởi tạo cơ sở dữ liệu SQLite hoàn tất!');

db.close();

