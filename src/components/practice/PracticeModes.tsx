import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PRACTICE_MODES } from '../../utils/constants'
import { useApp } from '../../context/AppContext'

export function PracticeModes() {
  const navigate = useNavigate()
  const { nodes, questions } = useApp()

  const weakCount = nodes.filter((n) => n.ps_score < 80).length
  const questionCount = questions.length

  const handleStart = (mode: string) => {
    if (questionCount === 0 && mode !== 'exam') {
      alert('题库为空，请先导入题目或等待种子数据加载')
      return
    }
    navigate(`/practice/${mode}`)
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <h2 className="text-xl font-bold text-white mb-1">选择练习模式</h2>
      <p className="text-sm text-slate-500 mb-6">
        题库共 {questionCount} 题 | 薄弱知识点 {weakCount} 个
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        {PRACTICE_MODES.map((mode, idx) => (
          <motion.button
            key={mode.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            onClick={() => handleStart(mode.key)}
            disabled={questionCount === 0 && mode.key !== 'exam'}
            className="text-left p-5 rounded-xl border border-slate-700/50 bg-surface-mid hover:bg-surface-light transition-all hover:border-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed group"
          >
            <div className="text-3xl mb-2">{mode.icon}</div>
            <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors">
              {mode.label}
            </h3>
            <p className="text-sm text-slate-500 mt-1">{mode.description}</p>
            {mode.key === 'targeted' && weakCount > 0 && (
              <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400">
                {weakCount} 个薄弱点可练
              </span>
            )}
            {mode.key === 'targeted' && weakCount === 0 && (
              <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400">
                全部已掌握
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {questionCount === 0 && (
        <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 max-w-2xl">
          <p className="text-sm text-amber-400">
            题库为空。请前往 <button onClick={() => navigate('/user-center')} className="underline text-cyan-400">个人中心</button> 导入题目或检查种子数据是否加载完成。
          </p>
        </div>
      )}
    </div>
  )
}
