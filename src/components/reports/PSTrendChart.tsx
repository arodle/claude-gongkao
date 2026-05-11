import { useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import * as echarts from 'echarts'
import { useApp } from '../../context/AppContext'
import { getHeatColor, formatDate } from '../../utils/helpers'

export function PSTrendChart() {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  const navigate = useNavigate()
  const { psHistory, nodes } = useApp()

  // 构建时间序列：每个节点一条线
  const chartData = useMemo(() => {
    // 取 PS 历史最多的前 10 个节点
    const nodeCounts = new Map<string, number>()
    for (const h of psHistory) {
      nodeCounts.set(h.node_id, (nodeCounts.get(h.node_id) ?? 0) + 1)
    }
    const topNodeIds = [...nodeCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([nid]) => nid)

    const nodeMap = new Map(nodes.map((n) => [n.id, n]))

    // 聚合所有时间点
    const allTimes = new Set<number>()
    const nodeSeries = new Map<string, Array<{ t: number; ps: number }>>()

    for (const h of psHistory) {
      if (!topNodeIds.includes(h.node_id)) continue
      allTimes.add(h.recorded_at)
      if (!nodeSeries.has(h.node_id)) nodeSeries.set(h.node_id, [])
      nodeSeries.get(h.node_id)!.push({ t: h.recorded_at, ps: h.ps_score })
    }

    const sortedTimes = [...allTimes].sort((a, b) => a - b)

    // 对每个节点，在时间轴上插值填充，保证曲线平滑不间断
    const series = [...nodeSeries.entries()].map(([nid, points]) => {
      points.sort((a, b) => a.t - b.t)
      const name = nodeMap.get(nid)?.name ?? nid
      const data = sortedTimes.map((t) => {
        // 找到最接近的时间点
        const match = points.find((p) => Math.abs(p.t - t) < 60000) // 1 分钟内
        if (match) return match.ps
        // 插值：找前后两个点
        let beforeIdx = -1
        for (let i = points.length - 1; i >= 0; i--) {
          if (points[i].t <= t) { beforeIdx = i; break }
        }
        let afterIdx = points.findIndex((p) => p.t >= t)
        if (afterIdx === -1) afterIdx = points.length - 1
        if (beforeIdx === -1) return points[0]?.ps ?? null
        if (beforeIdx === afterIdx) return points[beforeIdx].ps
        const ratio = (t - points[beforeIdx].t) / (points[afterIdx].t - points[beforeIdx].t)
        return +(points[beforeIdx].ps + (points[afterIdx].ps - points[beforeIdx].ps) * ratio).toFixed(1)
      })
      return { name, type: 'line' as const, data, smooth: true, symbol: 'circle', symbolSize: 3,
        lineStyle: { width: 2 },
        itemStyle: { color: getHeatColor(points[points.length - 1]?.ps ?? 50).bg },
      }
    })

    return { times: sortedTimes, series }
  }, [psHistory, nodes])

  useEffect(() => {
    if (!chartRef.current || chartData.series.length === 0) return

    if (chartInstance.current) chartInstance.current.dispose()

    const chart = echarts.init(chartRef.current, 'dark')
    chart.setOption({
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#1e293b',
        borderColor: '#475569',
        textStyle: { color: '#e2e8f0', fontSize: 12 },
      },
      legend: {
        type: 'scroll',
        bottom: 0,
        textStyle: { color: '#94a3b8', fontSize: 10 },
        data: chartData.series.map((s) => s.name),
      },
      grid: { left: 50, right: 20, top: 20, bottom: 40 },
      xAxis: {
        type: 'category',
        data: chartData.times.map((t) => formatDate(t)),
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#94a3b8', fontSize: 10, rotate: 45 },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 200,
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#94a3b8', fontSize: 10 },
        splitLine: { lineStyle: { color: '#334155' } },
      },
      series: chartData.series,
    })
    chartInstance.current = chart

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
    }
  }, [chartData])

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">PS 趋势曲线</h2>
        <button onClick={() => navigate('/reports/game-map')} className="text-sm text-cyan-400 hover:text-cyan-300">
          全景图 →
        </button>
      </div>
      {chartData.series.length > 0 ? (
        <div ref={chartRef} className="w-full h-96 sm:h-[500px] rounded-xl bg-surface-mid/50 border border-slate-700/50" />
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-3">
          <span className="text-4xl">📈</span>
          <p>暂无 PS 历史数据</p>
          <button onClick={() => navigate('/practice')} className="text-cyan-400 underline text-sm">开始练习</button>
        </div>
      )}
    </div>
  )
}
