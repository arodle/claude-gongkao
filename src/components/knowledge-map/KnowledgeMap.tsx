import { useEffect, useRef, useCallback } from 'react'
import { Graph } from '@antv/g6'
import { useApp } from '../../context/AppContext'
import { getHeatColor } from '../../utils/helpers'
import { NodeDetailDrawer } from './NodeDetailDrawer'
import { NodeContextMenu } from './NodeContextMenu'
import { MapControls } from './MapControls'
import { FlyAnimation } from './FlyAnimation'
import type { KnowledgeNode } from '../../types'
import { useState } from 'react'

interface G6Node {
  id: string
  data: KnowledgeNode
  style?: Record<string, unknown>
}

export function KnowledgeMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<Graph | null>(null)
  const { nodes, focusMode } = useApp()

  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [ctxMenuNode, setCtxMenuNode] = useState<{ node: KnowledgeNode; x: number; y: number } | null>(null)
  const [flyAnim, setFlyAnim] = useState<{ fromX: number; fromY: number; toNodeId: string } | null>(null)

  const initGraph = useCallback(() => {
    if (!containerRef.current || nodes.length === 0) return

    if (graphRef.current) {
      graphRef.current.destroy()
    }

    // 构建 G6 数据：nodes + edges
    const g6Nodes = nodes.map((n) => {
      const heat = getHeatColor(n.ps_score)
      const isWeak = n.ps_score < 80
      const dimmed = focusMode && !isWeak

      return {
        id: n.id,
        data: n,
        style: {
          labelText: n.name.length > 8 ? n.name.slice(0, 7) + '...' : n.name,
          labelFill: dimmed ? '#64748b' : '#e2e8f0',
          labelFontSize: 11,
          labelPlacement: 'bottom',
          labelOffsetY: 6,
          fill: dimmed ? '#334155' : heat.bg,
          stroke: dimmed ? '#475569' : heat.border,
          strokeWidth: isWeak ? 2 : 1,
          size: n.parent_id === null ? 50 : (isWeak ? 32 : 26),
          opacity: dimmed ? 0.35 : 1,
        },
      }
    })

    const g6Edges = nodes
      .filter((n) => n.parent_id)
      .map((n) => ({
        source: n.parent_id!,
        target: n.id,
        style: {
          stroke: focusMode ? '#334155' : '#475569',
          lineWidth: 1,
          endArrow: false,
        },
      }))

    const graph = new Graph({
      container: containerRef.current,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      data: { nodes: g6Nodes as any, edges: g6Edges as any },
      layout: {
        type: 'compact-box',
        direction: 'TB',
        getWidth: () => 80,
        getHeight: () => 40,
        getVGap: () => 30,
        getHGap: () => 35,
      },
      node: {
        type: 'circle',
        style: {
          labelText: (d: any) => d.style?.labelText ?? '',
          labelFill: (d: any) => d.style?.labelFill ?? '#e2e8f0',
          labelFontSize: 11,
          labelPlacement: 'bottom',
          labelOffsetY: 6,
          fill: (d: any) => d.style?.fill ?? '#0891b2',
          stroke: (d: any) => d.style?.stroke ?? '#06b6d4',
          strokeWidth: (d: any) => d.style?.strokeWidth ?? 1,
          size: (d: any) => d.style?.size ?? 26,
        },
      },
      edge: {
        type: 'cubic-horizontal',
        style: {
          stroke: (d: any) => d.style?.stroke ?? '#475569',
          lineWidth: 1,
          endArrow: false,
        },
      },
      behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
      animation: true,
      autoFit: 'view',
    })

    // 节点点击事件
    graph.on('node:click', (evt: any) => {
      const nodeData = evt.target?.id
      const node = nodes.find((n) => n.id === nodeData)
      if (node) {
        setSelectedNode(node)
        setDrawerOpen(true)
      }
    })

    // 右键菜单
    graph.on('node:contextmenu', (evt: any) => {
      evt.originalEvent?.preventDefault()
      const nodeData = evt.target?.id
      const node = nodes.find((n) => n.id === nodeData)
      if (node) {
        setCtxMenuNode({ node, x: evt.client?.x ?? evt.canvas.x, y: evt.client?.y ?? evt.canvas.y })
      }
    })

    graphRef.current = graph
  }, [nodes, focusMode])

  useEffect(() => {
    initGraph()
  }, [initGraph])

  // 窗口 resize 监听
  useEffect(() => {
    const handleResize = () => {
      if (graphRef.current && containerRef.current) {
        graphRef.current.setSize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight,
        )
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 暴露飞入动画方法
  useEffect(() => {
    (window as any).__triggerFlyAnimation = (fromX: number, fromY: number, toNodeId: string) => {
      const targetNode = nodes.find((n) => n.id === toNodeId)
      if (targetNode && graphRef.current) {
        // 获取目标节点在画布上的位置
        try {
          const pos = graphRef.current.getNodePosition(toNodeId)
          setFlyAnim({ fromX: pos[0], fromY: pos[1], toNodeId })
          // 触发高亮
          setTimeout(() => {
            graphRef.current?.setNodeState(toNodeId, 'highlight', true)
            setTimeout(() => graphRef.current?.setNodeState(toNodeId, 'highlight', false), 800)
          }, 600)
        } catch {
          setFlyAnim({ fromX, fromY, toNodeId })
        }
      }
    }
  }, [nodes])

  return (
    <div className="relative w-full h-full">
      {/* G6 渲染容器 */}
      <div ref={containerRef} className="g6-container" />

      {/* 控制面板 */}
      <MapControls graphRef={graphRef} />

      {/* 节点详情抽屉 */}
      <NodeDetailDrawer
        node={selectedNode}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      {/* 右键菜单 */}
      {ctxMenuNode && (
        <NodeContextMenu
          node={ctxMenuNode.node}
          x={ctxMenuNode.x}
          y={ctxMenuNode.y}
          onClose={() => setCtxMenuNode(null)}
          setDrawerNode={(n) => { setSelectedNode(n); setDrawerOpen(true) }}
        />
      )}

      {/* 错题飞入动效 */}
      {flyAnim && (
        <FlyAnimation
          toX={flyAnim.fromX}
          toY={flyAnim.fromY}
          nodeId={flyAnim.toNodeId}
          onComplete={() => setFlyAnim(null)}
        />
      )}
    </div>
  )
}
