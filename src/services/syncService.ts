import { db } from '../db/database'
import { checkServerAvailable, restoreFromServer } from './backupService'

/**
 * 应用初始化时：如果本地数据为空且服务端可访问，从服务端拉取数据
 */
export async function initSync(): Promise<'local' | 'remote' | 'empty'> {
  const nodeCount = await db.knowledgeNodes.count()
  if (nodeCount > 0) return 'local'

  const serverAvailable = await checkServerAvailable()
  if (!serverAvailable) return 'empty'

  try {
    await restoreFromServer()
    return 'remote'
  } catch {
    return 'empty'
  }
}

/**
 * 在线状态监听器
 */
export function watchOnlineStatus(onChange: (online: boolean) => void): () => void {
  const handler = () => onChange(navigator.onLine)
  window.addEventListener('online', handler)
  window.addEventListener('offline', handler)
  return () => {
    window.removeEventListener('online', handler)
    window.removeEventListener('offline', handler)
  }
}
