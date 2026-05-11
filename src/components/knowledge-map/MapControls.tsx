import { useApp } from '../../context/AppContext'

interface Props {
  graphRef: React.RefObject<import('@antv/g6').Graph | null>
}

export function MapControls({ graphRef }: Props) {
  const { focusMode, setFocusMode, editMode, setEditMode, createSnapshot, nodes } = useApp()

  const handleZoomIn = () => {
    const graph = graphRef.current
    if (graph) {
      const current = graph.getZoom()
      graph.zoomTo(current * 1.3)
    }
  }

  const handleZoomOut = () => {
    const graph = graphRef.current
    if (graph) {
      const current = graph.getZoom()
      graph.zoomTo(current * 0.7)
    }
  }

  const handleFitView = () => {
    graphRef.current?.fitView()
  }

  const weakCount = nodes.filter((n) => n.ps_score < 80).length
  const totalCount = nodes.length

  return (
    <div className="absolute bottom-20 sm:bottom-4 left-4 flex flex-col gap-2">
      {/* 缩放控制 */}
      <div className="flex flex-col gap-1 bg-surface-mid/90 backdrop-blur rounded-lg p-1.5 border border-slate-600/50">
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 flex items-center justify-center text-slate-300 hover:bg-slate-700 rounded text-lg transition-colors"
          title="放大"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 flex items-center justify-center text-slate-300 hover:bg-slate-700 rounded text-lg transition-colors"
          title="缩小"
        >
          −
        </button>
        <button
          onClick={handleFitView}
          className="w-8 h-8 flex items-center justify-center text-slate-300 hover:bg-slate-700 rounded text-sm transition-colors"
          title="适应视图"
        >
          ⊞
        </button>
      </div>

      {/* 焦点模式 */}
      <button
        onClick={() => setFocusMode(!focusMode)}
        className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
          focusMode
            ? 'bg-red-500/20 border-red-500/50 text-red-400'
            : 'bg-surface-mid/90 border-slate-600/50 text-slate-400 hover:text-slate-200'
        }`}
      >
        {focusMode ? '退出焦点模式' : `薄弱点 (${weakCount})`}
      </button>

      {/* 编辑模式 */}
      <button
        onClick={async () => {
          if (!editMode) {
            await createSnapshot()
          }
          setEditMode(!editMode)
        }}
        className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
          editMode
            ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
            : 'bg-surface-mid/90 border-slate-600/50 text-slate-400 hover:text-slate-200'
        }`}
      >
        {editMode ? '退出编辑' : '编辑模式'}
      </button>

      {/* 节点统计 */}
      <div className="bg-surface-mid/90 backdrop-blur rounded-lg px-3 py-2 border border-slate-600/50 text-xs text-slate-400">
        {totalCount} 个节点
      </div>
    </div>
  )
}
