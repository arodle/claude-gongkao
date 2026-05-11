import { motion } from 'framer-motion'

interface Props {
  isCorrect: boolean
  delta: number
  nodeNames: string[]
}

export function SubmitFeedback({ isCorrect, delta, nodeNames }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`px-4 py-2 text-sm ${
        isCorrect
          ? 'bg-emerald-500/10 border-t border-emerald-500/20 text-emerald-400'
          : 'bg-red-500/10 border-t border-red-500/20 text-red-400'
      }`}
    >
      <div className="flex items-center gap-2">
        <span>{isCorrect ? '✓ 正确' : '✗ 错误'}</span>
        <span className="text-slate-500">
          | PS {delta >= 0 ? '+' : ''}{delta.toFixed(1)}
        </span>
        <span className="text-slate-600 text-xs">
          ({nodeNames.slice(0, 3).join(', ')})
        </span>
      </div>
    </motion.div>
  )
}
