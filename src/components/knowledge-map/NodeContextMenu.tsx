import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { KnowledgeNode } from '../../types'

interface Props {
  node: KnowledgeNode
  x: number
  y: number
  onClose: () => void
  setDrawerNode: (n: KnowledgeNode) => void
}

export function NodeContextMenu({ node, x, y, onClose, setDrawerNode }: Props) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // 延迟添加监听，避免立即触发关闭
    setTimeout(() => document.addEventListener('click', handleClick), 0)
    return () => document.removeEventListener('click', handleClick)
  }, [onClose])

  const isWeak = node.ps_score < 80

  const menuItems = [
    {
      label: isWeak ? '🔴 薄弱点 - 需要加强' : '✓ 已掌握',
      action: () => setDrawerNode(node),
    },
    {
      label: '📈 查看历史掌握曲线',
      action: () => {
        setDrawerNode(node)
        onClose()
      },
    },
    {
      label: '🎯 加入今日计划',
      action: () => {
        onClose()
      },
    },
  ]

  // 调整菜单位置确保不超出屏幕
  const adjustedX = Math.min(x, window.innerWidth - 220)
  const adjustedY = Math.min(y, window.innerHeight - 160)

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.12 }}
        className="fixed z-50 min-w-[200px] bg-surface-mid border border-slate-600 rounded-lg shadow-xl py-1 overflow-hidden"
        style={{ left: adjustedX, top: adjustedY }}
      >
        <div className="px-3 py-2 border-b border-slate-700/50">
          <span className="text-sm font-medium text-white">{node.name}</span>
          <span className="ml-2 text-xs text-slate-500">PS: {node.ps_score.toFixed(1)}</span>
        </div>
        {menuItems.map((item, idx) => (
          <button
            key={idx}
            onClick={item.action}
            className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
          >
            {item.label}
          </button>
        ))}
      </motion.div>
    </AnimatePresence>
  )
}
