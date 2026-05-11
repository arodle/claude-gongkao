import { PS_MIN, PS_MAX, SCENARIO_COEFFICIENTS, HALF_LIFE_MIN } from '../utils/constants'
import type { ScenarioType } from '../types'

/**
 * 计算遗忘半衰期 H
 * H = 3 + (min(currentPS, 150) / 150) * 12
 * PS=0 → H=3天, PS=80 → H≈9.4天, PS≥150 → H=15天
 */
export function calcHalfLife(ps: number): number {
  const clamped = Math.min(ps, 150)
  return HALF_LIFE_MIN + (clamped / 150) * 12
}

/**
 * 艾宾浩斯遗忘曲线：记忆保留率
 * R = e^(-t/H * ln2)
 * 其中 t 是距上次练习的天数，H 是半衰期
 */
export function retentionRate(daysSinceLastPractice: number, halfLife: number): number {
  if (daysSinceLastPractice <= 0) return 1
  return Math.exp(-daysSinceLastPractice / halfLife * Math.log(2))
}

/**
 * PS 掌握度核心算法
 *
 * @param currentPS 当前 PS 值 [0, 200]
 * @param isCorrect 本次答题是否正确
 * @param scenarioCoefficient 场景系数 (glance=0.5, practice=1.0, exam=1.5, review=0.8)
 * @param daysSinceLastPractice 距上次练习的天数（默认 0 = 连续练习）
 * @returns 新的 PS 值和变化量
 */
export function calculatePS(
  currentPS: number,
  isCorrect: boolean,
  scenarioCoefficient: number,
  daysSinceLastPractice: number = 0,
): { newPS: number; delta: number } {
  const H = calcHalfLife(currentPS)
  const R = retentionRate(daysSinceLastPractice, H)

  // 基础变化量
  const baseDelta = isCorrect ? 8 : -6

  // 遗忘衰减：记得越少，答对的增益越大（重新激活记忆），答错的惩罚也越大
  const decayFactor = 1 + (1 - R) * 0.5

  // 当前基础分水平调整：分数越低提升越快，分数越高提升越慢
  const levelFactor = 1 + Math.max(0, (80 - currentPS) / 80) * 0.3

  const rawDelta = baseDelta * scenarioCoefficient * decayFactor * levelFactor
  const delta = Math.round(rawDelta * 100) / 100

  let newPS = currentPS + delta
  newPS = Math.max(PS_MIN, Math.min(PS_MAX, newPS))
  newPS = Math.round(newPS * 100) / 100

  return { newPS, delta: newPS - currentPS }
}

/**
 * 便捷方法：根据场景类型计算 PS
 */
export function calculatePSByScenario(
  currentPS: number,
  isCorrect: boolean,
  scenario: ScenarioType,
  daysSinceLastPractice: number = 0,
): { newPS: number; delta: number } {
  const coeff = SCENARIO_COEFFICIENTS[scenario]
  return calculatePS(currentPS, isCorrect, coeff, daysSinceLastPractice)
}

/**
 * 批量乐观预估：答题后立即预估多个知识点的 PS 变化
 * 前端用于乐观更新导图颜色
 */
export function optimisticEstimate(
  nodePSMap: Map<string, number>,
  nodeIds: string[],
  isCorrect: boolean,
  scenario: ScenarioType,
): Map<string, { newPS: number; delta: number }> {
  const result = new Map<string, { newPS: number; delta: number }>()
  const coeff = SCENARIO_COEFFICIENTS[scenario]
  for (const nid of nodeIds) {
    const currentPS = nodePSMap.get(nid) ?? 50
    result.set(nid, calculatePS(currentPS, isCorrect, coeff, 0))
  }
  return result
}
