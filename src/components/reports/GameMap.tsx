import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useApp } from '../../context/AppContext'
import { getHeatColor } from '../../utils/helpers'
import { useState } from 'react'
import type { KnowledgeNode } from '../../types'

export function GameMap() {
  const navigate = useNavigate()
  const { nodes } = useApp()
  const [hoveredNode, setHoveredNode] = useState<KnowledgeNode | null>(null)

  // 蜂窝网格：按 PS 分数排序展示所有叶子节点
  const leafNodes = nodes
    .filter((n) => !nodes.some((other) => other.parent_id === n.id))
    .sort((a, b) => a.ps_score - b.ps_score) // 薄弱优先

  const masteredCount = nodes.filter((n) => n.ps_score >= 150).length
  const progress = (total: number) => total > 0 ? Math.round((masteredCount / total) * 100) : 0

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">知识扫雷 · 全景图</h2>
          <p className="text-xs text-slate-500 mt-1">
            已掌握 {masteredCount}/{leafNodes.length} 个知识点 ({progress(leafNodes.length)}%)
          </p>
        </div>
        <button onClick={() => navigate('/reports/radar')} className="text-sm text-cyan-400 hover:text-cyan-300">
          雷达图 →
        </button>
      </div>

      {/* 进度条 */}
      <div className="w-full h-2 rounded-full bg-slate-700 mb-6 max-w-md">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress(leafNodes.length)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* 图例 */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-600" /> PS&lt;0</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-600" /> 0-80</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-600" /> 80-150</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-cyan-600" /> 150+</span>
      </div>

      {/* 蜂窝网格 */}
      <div className="flex flex-wrap gap-2 max-w-4xl">
        {leafNodes.map((n, idx) => {
          const heat = getHeatColor(n.ps_score)
          const isWeak = n.ps_score < 80
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.01 }}
              onMouseEnter={() => setHoveredNode(n)}
              onMouseLeave={() => setHoveredNode(null)}
              className="relative group cursor-pointer"
              style={{
                width: 56,
                height: 56,
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                backgroundColor: heat.bg,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              title={`${n.name}: PS ${n.ps_score.toFixed(1)}`}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[9px] leading-tight text-center text-white/90 px-1">
                  {n.name.length > 4 ? n.name.slice(0, 4) : n.name}
                </span>
              </div>
              {isWeak && (
                <div
                  className="absolute inset-0 rounded-full animate-pulse"
                  style={{
                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                    boxShadow: `0 0 10px ${heat.bg}80`,
                  }}
                />
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Hover 提示 */}
      {hoveredNode && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-surface-mid border border-slate-600 rounded-lg px-4 py-2 shadow-xl z-50 text-sm">
          <span className="text-white font-medium">{hoveredNode.name}</span>
          <span className="ml-2" style={{ color: getHeatColor(hoveredNode.ps_score).bg }}>
            PS {hoveredNode.ps_score.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  )
}
