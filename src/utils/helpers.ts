import type { NodeHeatColor } from '../types'
import { HEAT_COLORS } from './constants'

/** 生成唯一 ID */
export function uid(prefix: string = ''): string {
  return `${prefix}${crypto.randomUUID().slice(0, 8)}`
}

/** 获取 PS 分数对应的热力颜色 */
export function getHeatColor(ps: number): NodeHeatColor {
  if (ps < 0) return HEAT_COLORS.DANGER
  if (ps < 80) return HEAT_COLORS.WARNING
  if (ps < 150) return HEAT_COLORS.CAUTION
  return HEAT_COLORS.MASTER
}

/** 格式化时间戳为可读日期 */
export function formatDate(ts: number): string {
  if (!ts) return '-'
  return new Date(ts).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/** 格式化时间戳为可读日期时间 */
export function formatDateTime(ts: number): string {
  if (!ts) return '-'
  return new Date(ts).toLocaleString('zh-CN')
}

/** 距离上次练习的天数 */
export function daysSince(ts: number): number {
  if (!ts) return 999
  return Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24))
}

/** 截断文本 */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max) + '...'
}

/** 从树节点构建邻接表 */
export function buildNodeTree(
  nodes: Array<{ id: string; parent_id: string | null }>,
): Map<string, string[]> {
  const childrenMap = new Map<string, string[]>()
  for (const node of nodes) {
    const pid = node.parent_id ?? '__root__'
    if (!childrenMap.has(pid)) childrenMap.set(pid, [])
    childrenMap.get(pid)!.push(node.id)
  }
  return childrenMap
}

/** 防抖 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/** 节流 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  interval: number,
): (...args: Parameters<T>) => void {
  let last = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - last >= interval) {
      last = now
      fn(...args)
    }
  }
}
