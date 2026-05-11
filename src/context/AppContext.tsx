import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { db } from '../db/database'
import { generateSeedKnowledgeNodes } from '../db/seed'
import { buildSeedQuestions } from '../db/seedQuestions'
import { CURRENT_USER_ID } from '../utils/constants'
import type { KnowledgeNode, PracticeRecord, PSHistory, Question, Snapshot } from '../types'

interface AppState {
  nodes: KnowledgeNode[]
  records: PracticeRecord[]
  psHistory: PSHistory[]
  questions: Question[]
  snapshots: Snapshot[]
  isOnline: boolean
  isDbReady: boolean
  focusMode: boolean
  editMode: boolean
}

interface AppContextValue extends AppState {
  refreshNodes: () => Promise<void>
  refreshRecords: () => Promise<void>
  refreshQuestions: () => Promise<void>
  refreshPSHistory: () => Promise<void>
  setFocusMode: (v: boolean) => void
  setEditMode: (v: boolean) => void
  setIsOnline: (v: boolean) => void
  updateNodePS: (nodeId: string, newPS: number) => Promise<void>
  addPracticeRecord: (r: Omit<PracticeRecord, 'id' | 'user_id' | 'updated_at'>) => Promise<string>
  addPSHistory: (entry: Omit<PSHistory, 'id' | 'user_id'>) => Promise<void>
  createSnapshot: () => Promise<string>
  restoreSnapshot: (id: string) => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    nodes: [], records: [], psHistory: [], questions: [], snapshots: [],
    isOnline: navigator.onLine, isDbReady: false, focusMode: false, editMode: false,
  })

  // 初始化数据库 + 种子数据
  useEffect(() => {
    async function init() {
      const nodeCount = await db.knowledgeNodes.count()
      if (nodeCount === 0) {
        // 首次启动：写入种子知识图谱
        const seedNodes = generateSeedKnowledgeNodes()
        await db.knowledgeNodes.bulkAdd(seedNodes)

        // 构建名称→ID映射，写入种子题库
        const nodeMap = new Map<string, string>()
        for (const n of seedNodes) nodeMap.set(n.name, n.id)
        const seedQuestions = buildSeedQuestions(nodeMap)
        await db.questions.bulkAdd(seedQuestions)

        // 初始 PS 历史记录
        const now = Date.now()
        const historyEntries: PSHistory[] = seedNodes.map((n) => ({
          id: `psh-${crypto.randomUUID().slice(0, 8)}`,
          node_id: n.id,
          ps_score: n.ps_score,
          recorded_at: now,
          user_id: CURRENT_USER_ID,
        }))
        await db.psHistory.bulkAdd(historyEntries)
      }

      const [nodes, records, psHistory, questions, snapshots] = await Promise.all([
        db.knowledgeNodes.toArray(),
        db.practiceRecords.toArray(),
        db.psHistory.toArray(),
        db.questions.toArray(),
        db.snapshots.toArray(),
      ])

      setState((s) => ({ ...s, nodes, records, psHistory, questions, snapshots, isDbReady: true }))
    }
    init()
  }, [])

  const refreshNodes = useCallback(async () => {
    const nodes = await db.knowledgeNodes.toArray()
    setState((s) => ({ ...s, nodes }))
  }, [])

  const refreshRecords = useCallback(async () => {
    const records = await db.practiceRecords.toArray()
    setState((s) => ({ ...s, records }))
  }, [])

  const refreshQuestions = useCallback(async () => {
    const questions = await db.questions.toArray()
    setState((s) => ({ ...s, questions }))
  }, [])

  const refreshPSHistory = useCallback(async () => {
    const psHistory = await db.psHistory.toArray()
    setState((s) => ({ ...s, psHistory }))
  }, [])

  const setFocusMode = useCallback((v: boolean) => setState((s) => ({ ...s, focusMode: v })), [])
  const setEditMode = useCallback((v: boolean) => setState((s) => ({ ...s, editMode: v })), [])
  const setIsOnline = useCallback((v: boolean) => setState((s) => ({ ...s, isOnline: v })), [])

  const updateNodePS = useCallback(async (nodeId: string, newPS: number) => {
    const now = Date.now()
    await db.knowledgeNodes.update(nodeId, {
      ps_score: newPS,
      last_practiced_at: now,
      updated_at: now,
    })
    setState((s) => ({
      ...s,
      nodes: s.nodes.map((n) =>
        n.id === nodeId ? { ...n, ps_score: newPS, last_practiced_at: now, updated_at: now } : n,
      ),
    }))
  }, [])

  const addPracticeRecord = useCallback(async (r: Omit<PracticeRecord, 'id' | 'user_id' | 'updated_at'>) => {
    const now = Date.now()
    const record: PracticeRecord = {
      id: `pr-${crypto.randomUUID().slice(0, 8)}`,
      user_id: CURRENT_USER_ID,
      ...r,
      updated_at: now,
    }
    await db.practiceRecords.add(record)
    setState((s) => ({ ...s, records: [...s.records, record] }))
    return record.id
  }, [])

  const addPSHistory = useCallback(async (entry: Omit<PSHistory, 'id' | 'user_id'>) => {
    const record: PSHistory = {
      id: `psh-${crypto.randomUUID().slice(0, 8)}`,
      user_id: CURRENT_USER_ID,
      ...entry,
    }
    await db.psHistory.add(record)
    setState((s) => ({ ...s, psHistory: [...s.psHistory, record] }))
  }, [])

  const createSnapshot = useCallback(async () => {
    const [nodes, records, psHistory, questions] = await Promise.all([
      db.knowledgeNodes.toArray(),
      db.practiceRecords.toArray(),
      db.psHistory.toArray(),
      db.questions.toArray(),
    ])
    const id = `snapshot_${new Date().toISOString().replace(/[:.]/g, '')}`
    const snapshot: Snapshot = {
      id,
      created_at: Date.now(),
      data: JSON.stringify({ nodes, records, psHistory, questions }),
    }
    await db.snapshots.add(snapshot)
    setState((s) => ({ ...s, snapshots: [...s.snapshots, snapshot] }))
    return id
  }, [])

  const restoreSnapshot = useCallback(async (id: string) => {
    const snapshot = await db.snapshots.get(id)
    if (!snapshot) throw new Error('快照不存在')
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
    const [newNodes, newRecords, newPSHistory, newQuestions] = await Promise.all([
      db.knowledgeNodes.toArray(),
      db.practiceRecords.toArray(),
      db.psHistory.toArray(),
      db.questions.toArray(),
    ])
    setState((s) => ({
      ...s,
      nodes: newNodes,
      records: newRecords,
      psHistory: newPSHistory,
      questions: newQuestions,
    }))
  }, [])

  return (
    <AppContext.Provider
      value={{
        ...state,
        refreshNodes, refreshRecords, refreshQuestions, refreshPSHistory,
        setFocusMode, setEditMode, setIsOnline,
        updateNodePS, addPracticeRecord, addPSHistory,
        createSnapshot, restoreSnapshot,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
