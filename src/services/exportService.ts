import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { db } from '../db/database'
import { CURRENT_USER_ID } from '../utils/constants'
import type { BackupFile, BackupConfig } from '../types'

/**
 * 导出一个包含三表数据的 ZIP 文件
 */
export async function exportAllData(): Promise<void> {
  const [knowledgeNodes, practiceRecords, psHistory, questions] = await Promise.all([
    db.knowledgeNodes.toArray(),
    db.practiceRecords.toArray(),
    db.psHistory.toArray(),
    db.questions.toArray(),
  ])

  const dateStr = new Date().toISOString().slice(0, 10)

  // JSON 备份（含中文键名映射，便于人工可读）
  const jsonReadable = {
    导出日期: new Date().toISOString(),
    用户ID: CURRENT_USER_ID,
    数据统计: {
      知识点数量: knowledgeNodes.length,
      练习记录数量: practiceRecords.length,
      PS历史记录数量: psHistory.length,
      题库数量: questions.length,
    },
    知识点列表: knowledgeNodes.map((n) => ({
      知识点ID: n.id,
      名称: n.name,
      父节点ID: n.parent_id,
      X坐标: n.pos_x,
      Y坐标: n.pos_y,
      PS分数: n.ps_score,
      最近练习时间: n.last_practiced_at ? new Date(n.last_practiced_at).toISOString() : null,
      颜色标记: n.color_tag,
      更新时间: new Date(n.updated_at).toISOString(),
    })),
    练习记录: practiceRecords.map((r) => ({
      记录ID: r.id,
      题目ID: r.question_id,
      是否正确: r.is_correct,
      答题用时_秒: r.answer_time,
      关联知识点ID: r.source_node_ids,
      场景: r.scenario,
      更新时间: new Date(r.updated_at).toISOString(),
    })),
    PS历史: psHistory.map((h) => ({
      记录ID: h.id,
      知识点ID: h.node_id,
      PS分数: h.ps_score,
      记录时间: new Date(h.recorded_at).toISOString(),
    })),
    题库: questions.map((q) => ({
      题目ID: q.id,
      题干: q.stem,
      选项: q.options,
      正确答案索引: q.correct_answer,
      关联知识点ID: q.source_node_ids,
      题型: q.question_type,
      来源: q.source,
    })),
  }

  // PS 时间序列 CSV
  const psCsvLines = ['日期,知识点ID,PS分数']
  for (const h of psHistory) {
    psCsvLines.push(`${new Date(h.recorded_at).toISOString()},${h.node_id},${h.ps_score}`)
  }
  const psCsv = psCsvLines.join('\n')

  // 题库 CSV
  const qCsvLines = ['题目ID,题干,选项,正确答案索引,关联知识点ID,题型']
  for (const q of questions) {
    const options = q.options.join('|')
    const nodeIds = q.source_node_ids.join('|')
    qCsvLines.push(`${q.id},"${q.stem.replace(/"/g, '""')}","${options}",${q.correct_answer},"${nodeIds}",${q.question_type}`)
  }
  const qCsv = qCsvLines.join('\n')

  // 备份配置
  const backupConfig: BackupConfig = {
    serverUrl: window.location.origin + '/api/backup',
    lastSyncAt: Date.now(),
    userId: CURRENT_USER_ID,
  }

  const zip = new JSZip()
  zip.file(`skillmap_backup_${dateStr}.json`, JSON.stringify(jsonReadable, null, 2))
  zip.file(`ps_timeline.csv`, psCsv)
  zip.file(`question_bank_export.csv`, qCsv)
  zip.file(`backup_config.json`, JSON.stringify(backupConfig, null, 2))

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  saveAs(blob, `skillmap_backup_${dateStr}.zip`)
}

/**
 * 从 JSON 文件恢复数据
 */
export async function importFromJSON(file: File): Promise<BackupFile> {
  const text = await file.text()
  const data = JSON.parse(text)

  // 支持两种格式：原始扁平格式 或 可读格式
  let knowledgeNodes, practiceRecords, psHistory, questions

  if (data.知识点列表) {
    // 可读格式
    knowledgeNodes = data.知识点列表.map((n: any) => ({
      id: n.知识点ID,
      user_id: CURRENT_USER_ID,
      name: n.名称,
      parent_id: n.父节点ID,
      pos_x: n.X坐标,
      pos_y: n.Y坐标,
      ps_score: n.PS分数,
      last_practiced_at: n.最近练习时间 ? new Date(n.最近练习时间).getTime() : 0,
      color_tag: n.颜色标记,
      updated_at: n.更新时间 ? new Date(n.更新时间).getTime() : Date.now(),
    }))
    practiceRecords = data.练习记录?.map((r: any) => ({
      id: r.记录ID,
      user_id: CURRENT_USER_ID,
      question_id: r.题目ID,
      is_correct: r.是否正确,
      answer_time: r.答题用时_秒,
      source_node_ids: r.关联知识点ID,
      scenario: r.场景,
      updated_at: r.更新时间 ? new Date(r.更新时间).getTime() : Date.now(),
    })) ?? []
    psHistory = data.PS历史?.map((h: any) => ({
      id: h.记录ID,
      node_id: h.知识点ID,
      ps_score: h.PS分数,
      recorded_at: h.记录时间 ? new Date(h.记录时间).getTime() : Date.now(),
      user_id: CURRENT_USER_ID,
    })) ?? []
    questions = data.题库?.map((q: any) => ({
      id: q.题目ID,
      user_id: CURRENT_USER_ID,
      stem: q.题干,
      options: q.选项,
      correct_answer: q.正确答案索引,
      source_node_ids: q.关联知识点ID,
      question_type: q.题型,
      source: q.来源 ?? 'imported',
      updated_at: Date.now(),
    })) ?? []
  } else {
    // 扁平格式
    knowledgeNodes = data.knowledge_nodes ?? []
    practiceRecords = data.practice_records ?? []
    psHistory = data.ps_history ?? []
    questions = data.questions ?? []
  }

  return { knowledge_nodes: knowledgeNodes, practice_records: practiceRecords, ps_history: psHistory, questions }
}

/**
 * 从 ZIP 文件恢复数据
 */
export async function importFromZip(file: File): Promise<BackupFile> {
  const zip = await JSZip.loadAsync(file)
  const jsonFile = Object.keys(zip.files).find((n) => n.endsWith('.json') && n.includes('backup'))
  if (!jsonFile) throw new Error('ZIP 文件中未找到备份 JSON')
  const jsonText = await zip.file(jsonFile)!.async('string')
  const data = JSON.parse(jsonText)
  return await importFromJSON(new File([JSON.stringify(data)], 'backup.json', { type: 'application/json' }))
}
