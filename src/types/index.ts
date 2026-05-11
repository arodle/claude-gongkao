// ===== 核心数据模型 =====

export interface KnowledgeNode {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  pos_x: number;
  pos_y: number;
  ps_score: number;
  last_practiced_at: number;
  color_tag: string;
  updated_at: number;
}

export type ScenarioType = 'glance' | 'practice' | 'exam' | 'review';

export interface PracticeRecord {
  id: string;
  user_id: string;
  question_id: string;
  is_correct: boolean;
  answer_time: number;
  source_node_ids: string[];
  scenario: ScenarioType;
  updated_at: number;
}

export interface PSHistory {
  id: string;
  node_id: string;
  ps_score: number;
  recorded_at: number;
  user_id: string;
}

export interface Question {
  id: string;
  user_id: string;
  stem: string;
  options: string[]; // JSON 数组
  correct_answer: number; // 正确选项索引
  source_node_ids: string[];
  question_type: 'single_choice' | 'multi_choice';
  source: 'builtin' | 'imported';
  updated_at: number;
}

export interface Snapshot {
  id: string;
  created_at: number;
  data: string; // JSON 序列化的三表数据
}

// ===== 前端视图模型 =====

export interface PracticeMode {
  key: string;
  label: string;
  description: string;
  icon: string;
}

export interface NodeHeatColor {
  bg: string;
  border: string;
  pulse: 'danger' | 'soft' | 'none';
}

export interface FlyAnimationData {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  nodeId: string;
}

export interface ExamReport {
  totalQuestions: number;
  correctCount: number;
  score: number;
  weakNodes: KnowledgeNode[];
  records: PracticeRecord[];
}

export interface BackupFile {
  knowledge_nodes: KnowledgeNode[];
  practice_records: PracticeRecord[];
  ps_history: PSHistory[];
  questions: Question[];
}

export interface BackupConfig {
  serverUrl: string;
  lastSyncAt: number;
  userId: string;
}
