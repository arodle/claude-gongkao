import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import type { Question } from '../../types'

interface Props {
  question: Question
}

export function QuestionSource({ question }: Props) {
  const [activeTab, setActiveTab] = useState<'trace' | 'trap' | 'skill'>('trace')
  const { nodes } = useApp()

  // 找到关联的知识点名称
  const linkedNodes = nodes.filter((n) => question.source_node_ids.includes(n.id))

  const tabs = [
    { key: 'trace' as const, label: '出题思路' },
    { key: 'trap' as const, label: '常见陷阱' },
    { key: 'skill' as const, label: '技巧关联' },
  ]

  return (
    <div className="border-t border-slate-700 bg-surface-dark/50 px-4 py-3">
      {/* 关联知识点 */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="text-xs text-slate-500">关联知识点:</span>
        {linkedNodes.length > 0 ? (
          linkedNodes.map((n) => (
            <span
              key={n.id}
              className="px-2 py-0.5 rounded text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
            >
              {n.name}
            </span>
          ))
        ) : (
          <span className="text-xs text-slate-600">无</span>
        )}
      </div>

      {/* 标签页 */}
      <div className="flex gap-1 mb-2 border-b border-slate-700/50">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容（静态示例占位） */}
      <div className="text-xs text-slate-500 leading-relaxed">
        {activeTab === 'trace' && (
          <div className="space-y-2">
            <p>本题考察对核心概念的理解与辨析能力。</p>
            <p className="text-slate-600">
              出题思路：通过设置干扰项来测试对知识点的精确掌握程度，选项设计遵循常见错误模式。
            </p>
            <p className="text-slate-500 italic mt-2">
              （详细的出题思路溯源将在后续版本中完善）
            </p>
          </div>
        )}
        {activeTab === 'trap' && (
          <div className="space-y-2">
            <p>常见陷阱类型：</p>
            <ul className="list-disc list-inside space-y-1 text-slate-500">
              <li>偷换概念：选项使用相似但不相同的概念</li>
              <li>以偏概全：用部分情况替代整体</li>
              <li>绝对化表述：使用"所有""一定"等过于绝对的词语</li>
              <li>因果倒置：混淆因果关系中的因与果</li>
            </ul>
          </div>
        )}
        {activeTab === 'skill' && (
          <div className="space-y-2">
            <p>关联解题技巧：</p>
            <ul className="list-disc list-inside space-y-1 text-slate-500">
              <li>题干关键词定位法</li>
              <li>排除法：先行剔除明显错误选项</li>
              <li>对比择优法：在剩余选项中对比差异</li>
              <li>反例验证法：对推理题构造反例检验</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
