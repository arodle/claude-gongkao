import initSqlJs from 'sql.js'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DB_PATH = join(__dirname, 'backup.db')

let db = null

export async function getDb() {
  if (db) return db

  const SQL = await initSqlJs()

  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  // 创建表
  db.run(`
    CREATE TABLE IF NOT EXISTS backup_records (
      id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      synced_at INTEGER DEFAULT (unixepoch()),
      PRIMARY KEY (user_id, table_name, record_id)
    )
  `)

  // 创建索引
  db.run(`CREATE INDEX IF NOT EXISTS idx_backup_user ON backup_records(user_id)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_backup_table ON backup_records(user_id, table_name)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_backup_updated ON backup_records(updated_at)`)

  saveDb()

  return db
}

function saveDb() {
  if (db) {
    const data = db.export()
    writeFileSync(DB_PATH, Buffer.from(data))
  }
}

// 在每次写入后自动保存
export function persistDb() {
  saveDb()
}

// 关闭数据库
export function closeDb() {
  if (db) {
    db.close()
    db = null
  }
}
