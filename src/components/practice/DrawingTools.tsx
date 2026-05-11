import { useState, useCallback } from 'react'

type ToolType = 'none' | 'highlight' | 'underline' | 'rect'

const TOOLS: { key: ToolType; label: string; color: string }[] = [
  { key: 'highlight', label: '高亮', color: '#fde047' },
  { key: 'underline', label: '下划线', color: '#38bdf8' },
  { key: 'rect', label: '框选', color: '#f472b6' },
]

export function DrawingTools() {
  const [activeTool, setActiveTool] = useState<ToolType>('none')

  const selectTool = useCallback((tool: ToolType) => {
    setActiveTool((prev) => (prev === tool ? 'none' : tool))
    // 画笔数据暂存 SessionStorage 的状态通过父组件管理
    sessionStorage.setItem('drawing_tool', tool === activeTool ? 'none' : tool)
  }, [activeTool])

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-surface-dark border-b border-slate-700/50">
      <span className="text-xs text-slate-500 mr-2">画笔工具（PC）:</span>
      {TOOLS.map((tool) => (
        <button
          key={tool.key}
          onClick={() => selectTool(tool.key)}
          className={`px-3 py-1 rounded text-xs font-medium transition-all ${
            activeTool === tool.key
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
              : 'text-slate-500 hover:text-slate-300 border border-transparent'
          }`}
          style={activeTool === tool.key ? { boxShadow: `0 0 8px ${tool.color}40` } : undefined}
        >
          <span
            className="inline-block w-3 h-3 rounded mr-1.5"
            style={{ backgroundColor: tool.color }}
          />
          {tool.label}
        </button>
      ))}
      {activeTool !== 'none' && (
        <span className="text-xs text-slate-500 ml-auto">
          在题目文本上拖动鼠标进行标注
        </span>
      )}
    </div>
  )
}
