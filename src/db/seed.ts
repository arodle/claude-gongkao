import type { KnowledgeNode } from '../types'
import { CURRENT_USER_ID, PS_INITIAL } from '../utils/constants'

// 通用公考知识体系：行测五大模块 → 细分知识点
// 共约 50 个节点
export function generateSeedKnowledgeNodes(): KnowledgeNode[] {
  const now = Date.now()
  const nodes: KnowledgeNode[] = []
  const uid = () => `node-${crypto.randomUUID().slice(0, 8)}`

  // 根节点
  const rootId = uid()
  nodes.push({
    id: rootId, user_id: CURRENT_USER_ID, name: '行测知识体系',
    parent_id: null, pos_x: 0, pos_y: 0, ps_score: PS_INITIAL,
    last_practiced_at: 0, color_tag: '#0891b2', updated_at: now,
  })

  const modules = [
    { name: '言语理解', x: -450, y: 120, children: [
      '主旨概括', '意图判断', '细节理解', '词句理解', '代词指代',
      '语句填空', '语句排序', '下文推断', '逻辑填空-语境', '逻辑填空-词语',
    ]},
    { name: '数量关系', x: -150, y: 120, children: [
      '工程问题', '行程问题', '经济利润', '排列组合', '概率问题',
      '容斥问题', '最值问题', '几何问题', '方程问题', '数列问题',
    ]},
    { name: '判断推理', x: 150, y: 120, children: [
      '图形推理-位置', '图形推理-样式', '图形推理-数量', '定义判断',
      '类比推理-语义', '类比推理-逻辑', '逻辑判断-必然性', '逻辑判断-可能性',
      '削弱加强', '前提假设',
    ]},
    { name: '资料分析', x: 450, y: 120, children: [
      '增速计算', '增长量计算', '基期计算', '平均数计算', '倍数计算',
      '比例计算', '综合分析', '图表解读', '混合增速', '年均增速',
    ]},
    { name: '常识判断', x: 0, y: 300, children: [
      '政治常识', '法律常识', '经济常识', '历史常识', '地理常识',
      '科技常识', '人文常识', '时政热点', '管理常识', '公文常识',
    ]},
  ]

  for (const mod of modules) {
    const modId = uid()
    nodes.push({
      id: modId, user_id: CURRENT_USER_ID, name: mod.name,
      parent_id: rootId, pos_x: mod.x, pos_y: mod.y, ps_score: PS_INITIAL,
      last_practiced_at: 0, color_tag: '#0891b2', updated_at: now,
    })
    for (let i = 0; i < mod.children.length; i++) {
      const childX = mod.x + (i - (mod.children.length - 1) / 2) * 60
      const childY = mod.y + 80
      nodes.push({
        id: uid(), user_id: CURRENT_USER_ID, name: mod.children[i],
        parent_id: modId, pos_x: childX, pos_y: childY, ps_score: PS_INITIAL,
        last_practiced_at: 0, color_tag: '#0891b2', updated_at: now,
      })
    }
  }

  return nodes
}
