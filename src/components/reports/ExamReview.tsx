import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { getHeatColor, formatDate } from '../../utils/helpers'
import { useMemo } from 'react'

export function ExamReview() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { records, nodes, questions } = useApp()

  // 模拟：取最近一批 exam 模式的练习记录作为套卷
  const examRecords = useMemo(() => {
    if (id) return records.filter((r) => r.id === id)
    // 取最近一次 exam 场景的记录
    const examRecs = records.filter((r) => r.scenario === 'exam')
    if (examRecs.length === 0) return []
    // 找最近一批连续 exam 记录
    const sorted = [...examRecs].sort((a, b) => b.updated_at - a.updated_at)
    const batchEnd = sorted[0]?.updated_at ?? 0
    // 1 小时内的当作同一批
    return sorted.filter((r) => batchEnd - r.updated_at < 3600000)
  }, [records, id])

  const totalQuestions = examRecords.length
  const correctCount = examRecords.filter((r) => r.is_correct).length
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0

  // 分析涉及的薄弱节点
  const weakNodeIds = new Set<string>()
  for (const r of examRecords) {
    if (!r.is_correct) {
      for (const nid of r.source_node_ids) weakNodeIds.add(nid)
    }
  }
  const weakNodes = nodes.filter((n) => weakNodeIds.has(n.id))

  if (totalQuestions === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
        <span className="text-4xl">📊</span>
        <p>暂无套卷记录</p>
        <button onClick={() => navigate('/practice')} className="text-cyan-400 underline text-sm">去练习</button>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white text-sm mb-4">
        ← 返回
      </button>

      <h2 className="text-xl font-bold text-white mb-1">套卷复盘报告</h2>
      <p className="text-sm text-slate-500 mb-6">
        {formatDate(examRecords[0]?.updated_at ?? 0)}
      </p>

      {/* 分数卡片 */}
      <div className="grid grid-cols-3 gap-3 mb-6 max-w-md">
        <div className="bg-surface-mid rounded-xl p-4 text-center border border-slate-700/50">
          <div className="text-3xl font-bold text-white">{score}</div>
          <div className="text-xs text-slate-500 mt-1">得分</div>
        </div>
        <div className="bg-surface-mid rounded-xl p-4 text-center border border-slate-700/50">
          <div className="text-3xl font-bold text-emerald-400">{correctCount}</div>
          <div className="text-xs text-slate-500 mt-1">正确</div>
        </div>
        <div className="bg-surface-mid rounded-xl p-4 text-center border border-slate-700/50">
          <div className="text-3xl font-bold text-red-400">{totalQuestions - correctCount}</div>
          <div className="text-xs text-slate-500 mt-1">错误</div>
        </div>
      </div>

      {/* 薄弱节点 */}
      {weakNodes.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-red-400 mb-3">
            ⚠ 本次暴露的薄弱知识点 ({weakNodes.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {weakNodes.map((n) => {
              const heat = getHeatColor(n.ps_score)
              return (
                <div
                  key={n.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
                  style={{ backgroundColor: heat.bg + '20', borderColor: heat.bg + '40', borderWidth: 1 }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: heat.bg }} />
                  <span className="text-slate-200">{n.name}</span>
                  <span className="text-xs" style={{ color: heat.bg }}>
                    PS {n.ps_score.toFixed(1)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 详细答题记录 */}
      <div>
        <h3 className="text-sm font-medium text-slate-400 mb-3">答题明细</h3>
        <div className="space-y-2">
          {examRecords.map((r) => {
            const q = questions.find((q) => q.id === r.question_id)
            return (
              <div
                key={r.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  r.is_correct ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-red-500/5 border border-red-500/10'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <span className={r.is_correct ? 'text-emerald-400' : 'text-red-400'}>
                    {r.is_correct ? '✓' : '✗'}
                  </span>
                  <span className="ml-2 text-sm text-slate-300 truncate">
                    {q?.stem?.slice(0, 50) ?? `题目 ${r.question_id}`}...
                  </span>
                </div>
                <span className="text-xs text-slate-600 ml-3 shrink-0">
                  {(r.answer_time ?? 0).toFixed(0)}s
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
