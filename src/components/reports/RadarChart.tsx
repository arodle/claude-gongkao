import { useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import * as echarts from 'echarts'
import { useApp } from '../../context/AppContext'
import { DIMENSIONS } from '../../utils/constants'

// 知识点名称到维度的映射
const NODE_DIMENSION_MAP: Record<string, string> = {
  '言语理解': 'verbal', '主旨概括': 'verbal', '意图判断': 'verbal', '细节理解': 'verbal',
  '词句理解': 'verbal', '代词指代': 'verbal', '语句填空': 'verbal', '语句排序': 'verbal',
  '下文推断': 'verbal', '逻辑填空-语境': 'verbal', '逻辑填空-词语': 'verbal',
  '数量关系': 'quantity', '工程问题': 'quantity', '行程问题': 'quantity', '经济利润': 'quantity',
  '排列组合': 'quantity', '概率问题': 'quantity', '容斥问题': 'quantity', '最值问题': 'quantity',
  '几何问题': 'quantity', '方程问题': 'quantity', '数列问题': 'quantity',
  '判断推理': 'logic', '图形推理-位置': 'logic', '图形推理-样式': 'logic', '图形推理-数量': 'logic',
  '定义判断': 'logic', '类比推理-语义': 'logic', '类比推理-逻辑': 'logic',
  '逻辑判断-必然性': 'logic', '逻辑判断-可能性': 'logic', '削弱加强': 'logic', '前提假设': 'logic',
  '资料分析': 'data', '增速计算': 'data', '增长量计算': 'data', '基期计算': 'data',
  '平均数计算': 'data', '倍数计算': 'data', '比例计算': 'data', '综合分析': 'data',
  '图表解读': 'data', '混合增速': 'data', '年均增速': 'data',
  '常识判断': 'general', '政治常识': 'general', '法律常识': 'general', '经济常识': 'general',
  '历史常识': 'general', '地理常识': 'general', '科技常识': 'general', '人文常识': 'general',
  '时政热点': 'general', '管理常识': 'general', '公文常识': 'general',
}

export function RadarChart() {
  const chartRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { nodes } = useApp()

  // 按维度聚合 PS 分数
  const radarData = useMemo(() => {
    const dimScores: Record<string, number[]> = {}
    for (const d of DIMENSIONS) dimScores[d.key] = []

    for (const n of nodes) {
      const dim = NODE_DIMENSION_MAP[n.name] ?? NODE_DIMENSION_MAP[n.name.split('-')[0] ?? ''] ?? 'verbal'
      dimScores[dim]?.push(n.ps_score)
    }

    return DIMENSIONS.map((d) => {
      const scores = dimScores[d.key] ?? []
      const avg = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 50
      return { name: d.label, max: 200, value: +avg.toFixed(1) }
    })
  }, [nodes])

  useEffect(() => {
    if (!chartRef.current) return

    const chart = echarts.init(chartRef.current, 'dark')
    chart.setOption({
      tooltip: {
        trigger: 'item',
        backgroundColor: '#1e293b',
        borderColor: '#475569',
        textStyle: { color: '#e2e8f0', fontSize: 12 },
      },
      legend: {
        bottom: 0,
        textStyle: { color: '#94a3b8', fontSize: 10 },
      },
      radar: {
        center: ['50%', '45%'],
        radius: '65%',
        indicator: radarData.map((d) => ({
          name: d.name,
          max: d.max,
        })),
        axisName: { color: '#94a3b8', fontSize: 11 },
        splitArea: {
          areaStyle: { color: ['#1e293b', '#0f172a'] },
        },
        splitLine: { lineStyle: { color: '#334155' } },
        axisLine: { lineStyle: { color: '#475569' } },
      },
      series: [{
        type: 'radar',
        name: '能力矩阵',
        data: [{ value: radarData.map((d) => d.value), name: '当前水平' }],
        symbol: 'circle',
        symbolSize: 5,
        areaStyle: { color: 'rgba(6, 182, 212, 0.15)' },
        lineStyle: { color: '#06b6d4', width: 2 },
        itemStyle: { color: '#06b6d4' },
      }],
    })

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
    }
  }, [radarData])

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">能力矩阵雷达图</h2>
        <button onClick={() => navigate('/reports/trend')} className="text-sm text-cyan-400 hover:text-cyan-300">
          趋势图 →
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4 max-w-lg">
        {radarData.map((d, i) => {
          const color = d.value < 80 ? '#ea580c' : d.value < 150 ? '#ca8a04' : '#059669'
          return (
            <div key={i} className="bg-surface-mid rounded-lg p-3 text-center border border-slate-700/50">
              <div className="text-2xl font-bold" style={{ color }}>{d.value}</div>
              <div className="text-xs text-slate-500 mt-1">{d.name}</div>
            </div>
          )
        })}
      </div>
      <div ref={chartRef} className="w-full h-80 sm:h-[450px] rounded-xl bg-surface-mid/50 border border-slate-700/50" />
    </div>
  )
}
