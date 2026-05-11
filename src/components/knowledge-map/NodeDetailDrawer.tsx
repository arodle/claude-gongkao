import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../../context/AppContext'
import { getHeatColor, formatDate, daysSince } from '../../utils/helpers'
import type { KnowledgeNode } from '../../types'

interface Props {
  node: KnowledgeNode | null
  open: boolean
  onClose: () => void
}

export function NodeDetailDrawer({ node, open, onClose }: Props) {
  const { psHistory, records } = useApp()

  if (!node) return null

  const heat = getHeatColor(node.ps_score)
  const nodeHistory = psHistory
    .filter((h) => h.node_id === node.id)
    .sort((a, b) => b.recorded_at - a.recorded_at)
    .slice(0, 10)

  const nodeRecords = records
    .filter((r) => r.source_node_ids.includes(node.id))
    .slice(-10)
    .reverse()

  const daysAgo = daysSince(node.last_practiced_at)
  const correctionRate = nodeRecords.length > 0
    ? Math.round((nodeRecords.filter((r) => r.is_correct).length / nodeRecords.length) * 100)
    : null

  // PS 等级文案
  const psLevel = node.ps_score < 0 ? '极弱' :
    node.ps_score < 80 ? '薄弱' :
    node.ps_score < 150 ? '良好' : '掌握'

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-surface-mid border-l border-slate-700 shadow-2xl overflow-y-auto"
          >
            <div className="p-5">
              {/* 头部 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: heat.bg }}
                  />
                  <h3 className="text-lg font-semibold text-white">{node.name}</h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-slate-500 hover:text-slate-300 text-xl transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* PS 分数卡片 */}
              <div
                className="rounded-xl p-4 mb-4"
                style={{ backgroundColor: heat.bg + '20', borderColor: heat.bg + '40', borderWidth: 1 }}
              >
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-bold" style={{ color: heat.bg }}>
                    {node.ps_score.toFixed(1)}
                  </span>
                  <span className="text-sm text-slate-400 mb-1">PS 分数</span>
                  <span
                    className="ml-auto px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: heat.bg + '30', color: heat.bg }}
                  >
                    {psLevel}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-500 space-y-1">
                  <div>上次练习: {node.last_practiced_at ? `${daysAgo} 天前` : '从未练习'}</div>
                  <div>上次更新: {formatDate(node.updated_at)}</div>
                  {correctionRate !== null && (
                    <div>近10次正确率: {correctionRate}%</div>
                  )}
                </div>
              </div>

              {/* PS 趋势迷你图 */}
              {nodeHistory.length > 1 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-slate-400 mb-2">PS 变化</h4>
                  <div className="flex items-end gap-1 h-12">
                    {nodeHistory.map((h) => {
                      const ratio = h.ps_score / 200
                      return (
                        <div
                          key={h.id}
                          className="flex-1 rounded-t"
                          style={{
                            height: `${Math.max(ratio * 100, 4)}%`,
                            backgroundColor: getHeatColor(h.ps_score).bg,
                          }}
                          title={`${h.ps_score.toFixed(1)} @ ${formatDate(h.recorded_at)}`}
                        />
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 专项行动卡（占位） */}
              <div className="mb-4 rounded-lg bg-slate-800/50 p-3 border border-slate-700/50">
                <h4 className="text-sm font-medium text-cyan-400 mb-1">专项行动卡</h4>
                <p className="text-xs text-slate-500">
                  针对薄弱环节的强化训练建议将在后续版本中开放。
                </p>
              </div>

              {/* 最近记录 */}
              {nodeRecords.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-2">近期答题记录</h4>
                  <div className="space-y-1.5">
                    {nodeRecords.map((r) => (
                      <div
                        key={r.id}
                        className={`flex items-center justify-between px-3 py-2 rounded text-xs ${
                          r.is_correct ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        <span>{r.is_correct ? '✓ 正确' : '✗ 错误'}</span>
                        <span className="text-slate-500">{formatDate(r.updated_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
