// 当前用户 ID（硬编码）
export const CURRENT_USER_ID = 'user-001';

// PS 分数阈值
export const PS_THRESHOLDS = {
  DANGER: 0,    // < 0
  WARNING: 80,  // < 80
  CAUTION: 150, // < 150
  // >= 150 为掌握
} as const;

// 热力颜色映射
export const HEAT_COLORS = {
  DANGER: { bg: '#dc2626', border: '#ef4444', pulse: 'danger' as const },
  WARNING: { bg: '#ea580c', border: '#f97316', pulse: 'soft' as const },
  CAUTION: { bg: '#ca8a04', border: '#eab308', pulse: 'none' as const },
  STABLE: { bg: '#0891b2', border: '#06b6d4', pulse: 'none' as const },
  MASTER: { bg: '#059669', border: '#10b981', pulse: 'none' as const },
} as const;

// 场景系数
export const SCENARIO_COEFFICIENTS = {
  glance: 0.5,
  practice: 1.0,
  exam: 1.5,
  review: 0.8,
} as const;

// PS 值域
export const PS_MIN = 0;
export const PS_MAX = 200;
export const PS_INITIAL = 50;

// 遗忘半衰期 H = 3 + (min(PS, 150) / 150) * 12
export const HALF_LIFE_MIN = 3; // 天
export const HALF_LIFE_MAX = 15; // 天

// 备份相关
export const BACKUP_SYNC_INTERVAL = 5 * 60 * 1000; // 5 分钟
export const BACKUP_API = '/api/backup';

// 练习模式
export const PRACTICE_MODES = [
  { key: 'sequential', label: '顺序练习', description: '按题库顺序逐题练习', icon: '📋' },
  { key: 'random', label: '随机练习', description: '随机抽取题目练习', icon: '🎲' },
  { key: 'targeted', label: '靶向练习', description: '针对薄弱知识点集中训练', icon: '🎯' },
  { key: 'exam', label: '套卷模考', description: '模拟真实考试场景', icon: '📝' },
] as const;

// 维度定义（能力雷达图）
export const DIMENSIONS = [
  { key: 'verbal', label: '言语理解' },
  { key: 'quantity', label: '数量关系' },
  { key: 'logic', label: '判断推理' },
  { key: 'data', label: '资料分析' },
  { key: 'general', label: '常识判断' },
] as const;
