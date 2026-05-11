import Dexie, { type Table } from 'dexie'
import type { KnowledgeNode, PracticeRecord, PSHistory, Question, Snapshot } from '../types'

export class SkillMapDB extends Dexie {
  knowledgeNodes!: Table<KnowledgeNode, string>
  practiceRecords!: Table<PracticeRecord, string>
  psHistory!: Table<PSHistory, string>
  questions!: Table<Question, string>
  snapshots!: Table<Snapshot, string>

  constructor() {
    super('SkillMapDB')

    this.version(1).stores({
      knowledgeNodes: 'id, user_id, parent_id, updated_at',
      practiceRecords: 'id, user_id, question_id, updated_at',
      psHistory: 'id, node_id, user_id, recorded_at',
      questions: 'id, user_id, source, updated_at',
      snapshots: 'id, created_at',
    })
  }
}

export const db = new SkillMapDB()
