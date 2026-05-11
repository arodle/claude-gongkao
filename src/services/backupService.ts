import { db } from '../db/database'
import { CURRENT_USER_ID, BACKUP_SYNC_INTERVAL, BACKUP_API } from '../utils/constants'

let syncTimer: ReturnType<typeof setInterval> | null = null

/**
 * 服务端静默备份：增量同步本地变更记录到服务端
 */
export async function syncToServer(): Promise<boolean> {
  try {
    const lastSyncAt = Number(localStorage.getItem('last_sync_at') ?? 0)
    const now = Date.now()

    const tables = ['knowledgeNodes', 'practiceRecords', 'psHistory', 'questions'] as const
    const changedRecords: Record<string, unknown[]> = {}

    for (const table of tables) {
      const records = await (db as any)[table]
        .where('updated_at')
        .above(lastSyncAt)
        .toArray() as unknown[]
      if (records.length > 0) {
        changedRecords[table] = records
      }
    }

    const totalChanges = Object.values(changedRecords).reduce((s, r) => s + r.length, 0)
    if (totalChanges === 0) {
      localStorage.setItem('last_sync_at', String(now))
      return true
    }

    for (const [table, records] of Object.entries(changedRecords)) {
      const resp = await fetch(`${BACKUP_API}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: CURRENT_USER_ID, table, records }),
      })
      if (!resp.ok) return false
    }

    localStorage.setItem('last_sync_at', String(now))
    return true
  } catch {
    return false
  }
}

/**
 * 从服务端恢复全量数据
 */
export async function restoreFromServer(): Promise<number> {
  const resp = await fetch(`${BACKUP_API}/restore?userId=${CURRENT_USER_ID}`)
  if (!resp.ok) throw new Error('服务器恢复失败')
  const data = await resp.json()

  await db.transaction('rw',
    [db.knowledgeNodes, db.practiceRecords, db.psHistory, db.questions],
    async () => {
      if (data.knowledgeNodes?.length) {
        await db.knowledgeNodes.clear()
        await db.knowledgeNodes.bulkAdd(data.knowledgeNodes)
      }
      if (data.practiceRecords?.length) {
        await db.practiceRecords.clear()
        await db.practiceRecords.bulkAdd(data.practiceRecords)
      }
      if (data.psHistory?.length) {
        await db.psHistory.clear()
        await db.psHistory.bulkAdd(data.psHistory)
      }
      if (data.questions?.length) {
        await db.questions.clear()
        await db.questions.bulkAdd(data.questions)
      }
    },
  )

  return (data.knowledgeNodes?.length ?? 0) + (data.practiceRecords?.length ?? 0) +
    (data.psHistory?.length ?? 0) + (data.questions?.length ?? 0)
}

/**
 * 检查服务端是否可访问
 */
export async function checkServerAvailable(): Promise<boolean> {
  try {
    const resp = await fetch(`${BACKUP_API}/health`, { method: 'GET', signal: AbortSignal.timeout(3000) })
    return resp.ok
  } catch {
    return false
  }
}

/**
 * 启动定期静默备份
 */
export function startAutoSync(): void {
  if (syncTimer) return
  syncTimer = setInterval(() => {
    syncToServer().catch(() => {})
  }, BACKUP_SYNC_INTERVAL)
}

/**
 * 停止定期静默备份
 */
export function stopAutoSync(): void {
  if (syncTimer) {
    clearInterval(syncTimer)
    syncTimer = null
  }
}

/**
 * 高风险操作前自动快照
 */
export async function createAutoSnapshot(): Promise<string> {
  const [nodes, records, psHistory, questions] = await Promise.all([
    db.knowledgeNodes.toArray(),
    db.practiceRecords.toArray(),
    db.psHistory.toArray(),
    db.questions.toArray(),
  ])

  const id = `snapshot_before_edit_${new Date().toISOString().replace(/[:.]/g, '')}`
  await db.snapshots.add({
    id,
    created_at: Date.now(),
    data: JSON.stringify({ nodes, records, psHistory, questions }),
  })

  return id
}
