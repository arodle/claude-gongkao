import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useApp } from '../../context/AppContext'
import { useToast } from '../shared/Toast'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { exportAllData, importFromJSON, importFromZip } from '../../services/exportService'
import { restoreFromServer, createAutoSnapshot, syncToServer, startAutoSync, stopAutoSync, checkServerAvailable } from '../../services/backupService'
import { db } from '../../db/database'
import { formatDateTime } from '../../utils/helpers'

export function DataManagement() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { nodes, records, psHistory, questions, snapshots, refreshNodes, refreshRecords, refreshQuestions, refreshPSHistory } = useApp()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const questionFileRef = useRef<HTMLInputElement>(null)

  // 对话框状态
  const [restoreDialog, setRestoreDialog] = useState<{ type: 'file' | 'server' | 'snapshot'; id?: string } | null>(null)
  const [serverAvailable, setServerAvailable] = useState(false)

  useEffect(() => {
    checkServerAvailable().then(setServerAvailable)
    startAutoSync()
    return () => stopAutoSync()
  }, [])

  // 导出全部数据
  const handleExport = async () => {
    try {
      toast('正在打包数据...', 'info')
      await exportAllData()
      toast('导出成功！', 'success')
    } catch (err) {
      toast('导出失败：' + (err as Error).message, 'error')
    }
  }

  // 从上传文件恢复
  const handleFileRestore = async (file: File) => {
    try {
      let backupData
      if (file.name.endsWith('.zip')) {
        backupData = await importFromZip(file)
      } else {
        backupData = await importFromJSON(file)
      }

      await db.transaction('rw',
        [db.knowledgeNodes, db.practiceRecords, db.psHistory, db.questions],
        async () => {
          await db.knowledgeNodes.clear()
          await db.practiceRecords.clear()
          await db.psHistory.clear()
          await db.questions.clear()
          await db.knowledgeNodes.bulkAdd(backupData.knowledge_nodes)
          await db.practiceRecords.bulkAdd(backupData.practice_records)
          await db.psHistory.bulkAdd(backupData.ps_history)
          await db.questions.bulkAdd(backupData.questions)
        },
      )

      await Promise.all([refreshNodes(), refreshRecords(), refreshQuestions(), refreshPSHistory()])
      toast(`恢复成功！已恢复 ${backupData.knowledge_nodes.length} 个节点`, 'success')
    } catch (err) {
      toast('恢复失败：' + (err as Error).message, 'error')
    }
  }

  // 从服务器恢复
  const handleServerRestore = async () => {
    try {
      const count = await restoreFromServer()
      await Promise.all([refreshNodes(), refreshRecords(), refreshQuestions(), refreshPSHistory()])
      toast(`从服务器恢复成功！共 ${count} 条记录`, 'success')
    } catch (err) {
      toast('服务器恢复失败：' + (err as Error).message, 'error')
    }
    setRestoreDialog(null)
  }

  // 从快照恢复
  const handleSnapshotRestore = async (id: string) => {
    const snapshot = await db.snapshots.get(id)
    if (!snapshot) { toast('快照不存在', 'error'); return }

    const { nodes, records, psHistory, questions } = JSON.parse(snapshot.data)
    await db.transaction('rw',
      [db.knowledgeNodes, db.practiceRecords, db.psHistory, db.questions],
      async () => {
        await db.knowledgeNodes.clear()
        await db.practiceRecords.clear()
        await db.psHistory.clear()
        await db.questions.clear()
        await db.knowledgeNodes.bulkAdd(nodes)
        await db.practiceRecords.bulkAdd(records)
        await db.psHistory.bulkAdd(psHistory)
        await db.questions.bulkAdd(questions)
      },
    )

    await Promise.all([refreshNodes(), refreshRecords(), refreshQuestions(), refreshPSHistory()])
    toast('快照恢复成功！', 'success')
    setRestoreDialog(null)
  }

  // 导入题目
  const handleImportQuestions = async (file: File) => {
    try {
      const text = await file.text()
      let newQuestions

      if (file.name.endsWith('.json')) {
        const data = JSON.parse(text)
        const arr = Array.isArray(data) ? data : (data.题库 ?? data.questions ?? [])
        newQuestions = arr.map((q: any, i: number) => ({
          id: `q-import-${Date.now()}-${i}`,
          user_id: 'user-001',
          stem: q.stem ?? q.题干 ?? '',
          options: Array.isArray(q.options) ? q.options : (q.选项 ?? []),
          correct_answer: q.correct_answer ?? q.正确答案索引 ?? 0,
          source_node_ids: Array.isArray(q.source_node_ids) ? q.source_node_ids : (q.关联知识点ID ?? []),
          question_type: q.question_type ?? q.题型 ?? 'single_choice',
          source: 'imported' as const,
          updated_at: Date.now(),
        }))
      } else if (file.name.endsWith('.csv')) {
        const lines = text.split('\n').filter((l) => l.trim())
        // 首行为标题行，跳过
        newQuestions = lines.slice(1).map((line, i) => {
          const cols = line.split(',')
          return {
            id: `q-import-${Date.now()}-${i}`,
            user_id: 'user-001',
            stem: (cols[0] ?? '').replace(/^"|"$/g, ''),
            options: (cols[1] ?? '').replace(/^"|"$/g, '').split('|'),
            correct_answer: parseInt(cols[2] ?? '0'),
            source_node_ids: (cols[3] ?? '').replace(/^"|"$/g, '').split('|').filter(Boolean),
            question_type: (cols[4] ?? 'single_choice').trim() as 'single_choice',
            source: 'imported' as const,
            updated_at: Date.now(),
          }
        })
      } else {
        toast('不支持的文件格式，请使用 JSON 或 CSV', 'error')
        return
      }

      await db.questions.bulkAdd(newQuestions)
      await refreshQuestions()
      toast(`成功导入 ${newQuestions.length} 道题目！`, 'success')
    } catch (err) {
      toast('导入失败：' + (err as Error).message, 'error')
    }
  }

  // 手动同步
  const handleSync = async () => {
    toast('正在同步...', 'info')
    const ok = await syncToServer()
    toast(ok ? '同步完成！' : '同步失败，请检查服务器连接', ok ? 'success' : 'error')
  }

  // 手动快照
  const handleSnapshot = async () => {
    await createAutoSnapshot()
    toast('已创建当前数据快照', 'success')
  }

  const statCards = [
    { label: '知识节点', value: nodes.length, color: '#06b6d4' },
    { label: '练习记录', value: records.length, color: '#8b5cf6' },
    { label: 'PS 历史', value: psHistory.length, color: '#f59e0b' },
    { label: '题库数量', value: questions.length, color: '#10b981' },
  ]

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <h2 className="text-xl font-bold text-white mb-1">个人中心 · 数据管理</h2>
      <p className="text-sm text-slate-500 mb-6">管理你的学习数据，备份与恢复</p>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {statCards.map((card) => (
          <div key={card.label} className="bg-surface-mid rounded-xl p-4 border border-slate-700/50">
            <div className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</div>
            <div className="text-xs text-slate-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* 操作按钮组 */}
      <div className="space-y-4 max-w-lg">
        {/* 导出 */}
        <div className="bg-surface-mid rounded-xl p-4 border border-slate-700/50">
          <h3 className="text-sm font-medium text-white mb-2">数据导出</h3>
          <p className="text-xs text-slate-500 mb-3">
            导出全部数据为 ZIP 文件，包含 JSON、CSV 格式，脱机后人工可读。
          </p>
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-cyan-600 text-white hover:bg-cyan-500 transition-colors"
          >
            导出全部数据 (ZIP)
          </button>
        </div>

        {/* 恢复 */}
        <div className="bg-surface-mid rounded-xl p-4 border border-slate-700/50">
          <h3 className="text-sm font-medium text-white mb-2">数据恢复</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-lg text-sm bg-surface-light text-slate-300 hover:bg-slate-600 transition-colors"
            >
              从备份文件恢复
            </button>
            {serverAvailable && (
              <button
                onClick={() => setRestoreDialog({ type: 'server' })}
                className="px-4 py-2 rounded-lg text-sm bg-surface-light text-slate-300 hover:bg-slate-600 transition-colors"
              >
                从服务器恢复
              </button>
            )}
            <button
              onClick={handleSnapshot}
              className="px-4 py-2 rounded-lg text-sm bg-surface-light text-slate-300 hover:bg-slate-600 transition-colors"
            >
              创建快照
            </button>
            <button
              onClick={handleSync}
              className="px-4 py-2 rounded-lg text-sm bg-surface-light text-slate-300 hover:bg-slate-600 transition-colors"
              disabled={!serverAvailable}
            >
              手动同步到服务器
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) setRestoreDialog({ type: 'file' })
                e.target.value = ''
              }}
            />
          </div>
        </div>

        {/* 导入题目 */}
        <div className="bg-surface-mid rounded-xl p-4 border border-slate-700/50">
          <h3 className="text-sm font-medium text-white mb-2">导入题目</h3>
          <p className="text-xs text-slate-500 mb-3">
            支持 JSON 和 CSV 格式。JSON: [{`{stem, options[], correct_answer, source_node_ids[], question_type}`}]
            <br />CSV: stem,options(|分隔),correct_answer,source_node_ids(|分隔),question_type
          </p>
          <button
            onClick={() => questionFileRef.current?.click()}
            className="px-4 py-2 rounded-lg text-sm bg-surface-light text-slate-300 hover:bg-slate-600 transition-colors"
          >
            导入题目
          </button>
          <input
            ref={questionFileRef}
            type="file"
            accept=".json,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImportQuestions(file)
              e.target.value = ''
            }}
          />
        </div>

        {/* 快照列表 */}
        {snapshots.length > 0 && (
          <div className="bg-surface-mid rounded-xl p-4 border border-slate-700/50">
            <h3 className="text-sm font-medium text-white mb-3">历史快照 ({snapshots.length})</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {[...snapshots]
                .sort((a, b) => b.created_at - a.created_at)
                .slice(0, 10)
                .map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded bg-slate-800/50">
                    <span className="text-xs text-slate-400">{formatDateTime(s.created_at)}</span>
                    <button
                      onClick={() => setRestoreDialog({ type: 'snapshot', id: s.id })}
                      className="text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      恢复
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* 确认对话框 */}
      <ConfirmDialog
        open={restoreDialog?.type === 'file'}
        title="确认恢复数据"
        message="当前所有数据将被备份文件中的数据覆盖，此操作不可撤销。确定继续吗？"
        confirmLabel="确认恢复"
        danger
        onConfirm={() => {
          const file = fileInputRef.current
          // 需要存储文件引用
          setRestoreDialog(null)
        }}
        onCancel={() => setRestoreDialog(null)}
      />

      <ConfirmDialog
        open={restoreDialog?.type === 'server'}
        title="从服务器恢复"
        message="将下载服务器上的备份数据并覆盖本地所有数据。确定继续吗？"
        confirmLabel="确认恢复"
        danger
        onConfirm={handleServerRestore}
        onCancel={() => setRestoreDialog(null)}
      />

      <ConfirmDialog
        open={restoreDialog?.type === 'snapshot'}
        title="恢复快照"
        message="将恢复到该快照时的数据状态，当前数据将被覆盖。确定继续吗？"
        confirmLabel="确认恢复"
        danger
        onConfirm={() => {
          if (restoreDialog?.id) handleSnapshotRestore(restoreDialog.id)
        }}
        onCancel={() => setRestoreDialog(null)}
      />
    </div>
  )
}
