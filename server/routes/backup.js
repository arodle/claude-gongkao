import { Router } from 'express'
import { getDb, persistDb } from '../db.js'

const router = Router()

// 健康检查
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

// 增量同步：接收前端上传的变更记录
router.post('/sync', async (req, res) => {
  try {
    const db = await getDb()
    const { userId, table, records } = req.body

    if (!userId || !table || !Array.isArray(records)) {
      return res.status(400).json({ error: '参数不完整' })
    }

    const validTables = ['knowledgeNodes', 'practiceRecords', 'psHistory', 'questions']
    if (!validTables.includes(table)) {
      return res.status(400).json({ error: '无效的表名' })
    }

    for (const record of records) {
      const id = `${userId}_${table}_${record.id}`
      const now = Math.floor(Date.now() / 1000)

      // sql.js uses ? placeholders
      db.run(
        `INSERT INTO backup_records (id, user_id, table_name, record_id, data, updated_at, synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id, table_name, record_id) DO UPDATE SET
           data = excluded.data,
           updated_at = excluded.updated_at,
           synced_at = excluded.synced_at`,
        [id, userId, table, record.id, JSON.stringify(record), record.updated_at ?? now, now]
      )
    }

    persistDb()

    res.json({ success: true, count: records.length })
  } catch (err) {
    console.error('同步失败:', err)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

// 全量恢复：返回指定用户的所有备份数据
router.get('/restore', async (req, res) => {
  try {
    const db = await getDb()
    const { userId } = req.query

    if (!userId) {
      return res.status(400).json({ error: '缺少 userId 参数' })
    }

    const stmt = db.prepare(
      'SELECT table_name, record_id, data FROM backup_records WHERE user_id = ? ORDER BY table_name, record_id'
    )
    stmt.bind([userId])

    const result = {
      knowledgeNodes: [],
      practiceRecords: [],
      psHistory: [],
      questions: [],
    }

    while (stmt.step()) {
      const row = stmt.getAsObject()
      try {
        const data = JSON.parse(row.data)
        if (result[row.table_name]) {
          result[row.table_name].push(data)
        }
      } catch { /* skip corrupted records */ }
    }
    stmt.free()

    res.json(result)
  } catch (err) {
    console.error('恢复失败:', err)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

export default router
