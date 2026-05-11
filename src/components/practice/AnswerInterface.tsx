import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../../context/AppContext'
import { optimisticEstimate } from '../../services/psCalculator'
import { DrawingTools } from './DrawingTools'
import { QuestionSource } from './QuestionSource'
import { triggerFly } from '../knowledge-map/FlyAnimation'
import type { Question, ScenarioType } from '../../types'

export function AnswerInterface() {
  const { mode } = useParams<{ mode: string }>()
  const navigate = useNavigate()
  const { nodes, questions, updateNodePS, addPracticeRecord, addPSHistory, isOnline } = useApp()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [answerStartTime, setAnswerStartTime] = useState(Date.now())
  const [showSource, setShowSource] = useState(false)
  const [showDrawing, setShowDrawing] = useState(false)

  // 根据模式获取题目列表
  const questionList = useCallback((): Question[] => {
    if (mode === 'random') {
      return [...questions].sort(() => Math.random() - 0.5)
    }
    if (mode === 'targeted') {
      // 优先选择薄弱知识点关联的题目
      const weakNodeIds = new Set(nodes.filter((n) => n.ps_score < 80).map((n) => n.id))
      const targeted = questions.filter((q) => q.source_node_ids.some((nid) => weakNodeIds.has(nid)))
      const rest = questions.filter((q) => !q.source_node_ids.some((nid) => weakNodeIds.has(nid)))
      return [...targeted.sort(() => Math.random() - 0.5), ...rest.sort(() => Math.random() - 0.5)]
    }
    if (mode === 'exam') {
      // 套卷模考：取所有题（或 120 题的子集）
      return [...questions].sort(() => Math.random() - 0.5).slice(0, Math.min(120, questions.length))
    }
    // sequential
    return questions
  }, [mode, nodes, questions])

  const [qList, setQList] = useState<Question[]>([])
  const [examStartTime, setExamStartTime] = useState(Date.now())

  useEffect(() => {
    setQList(questionList())
    setExamStartTime(Date.now())
    setCurrentIndex(0)
    setSubmitted(false)
    setSelectedAnswer(null)
  }, [mode, questions.length])

  const currentQuestion = qList[currentIndex]
  const isExam = mode === 'exam'
  const totalQuestions = qList.length

  const scenarioCoefficient = isExam ? 1.5 : 1.0

  const handleSubmit = useCallback(async () => {
    if (!currentQuestion || selectedAnswer === null || submitted) return

    setSubmitted(true)
    const isCorrect = selectedAnswer === currentQuestion.correct_answer
    const answerTime = (Date.now() - answerStartTime) / 1000

    // 记录练习
    await addPracticeRecord({
      question_id: currentQuestion.id,
      is_correct: isCorrect,
      answer_time: answerTime,
      source_node_ids: currentQuestion.source_node_ids,
      scenario: (isExam ? 'exam' : 'practice') as ScenarioType,
    })

    // 乐观更新：立即计算预估 PS 变化并更新节点颜色
    const nodePSMap = new Map<string, number>()
    for (const n of nodes) nodePSMap.set(n.id, n.ps_score)
    const estimates = optimisticEstimate(
      nodePSMap,
      currentQuestion.source_node_ids,
      isCorrect,
      isExam ? 'exam' : 'practice',
    )

    for (const [nid, { newPS }] of estimates) {
      await updateNodePS(nid, newPS)
      await addPSHistory({
        node_id: nid,
        ps_score: newPS,
        recorded_at: Date.now(),
      })
    }

    // 错题飞入动效
    if (!isCorrect && currentQuestion.source_node_ids.length > 0) {
      const targetNodeId = currentQuestion.source_node_ids[0]
      triggerFly(window.innerWidth / 2, window.innerHeight / 2, targetNodeId)
    }
  }, [currentQuestion, selectedAnswer, submitted, nodes, updateNodePS, addPracticeRecord, addPSHistory, answerStartTime, isExam])

  const handleNext = () => {
    if (currentIndex + 1 < totalQuestions) {
      setCurrentIndex((i) => i + 1)
      setSelectedAnswer(null)
      setSubmitted(false)
      setShowSource(false)
      setAnswerStartTime(Date.now())
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1)
      setSelectedAnswer(null)
      setSubmitted(false)
      setShowSource(false)
      setAnswerStartTime(Date.now())
    }
  }

  if (totalQuestions === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
        <span className="text-4xl">📭</span>
        <p>题库中没有题目</p>
        <button onClick={() => navigate('/practice')} className="text-cyan-400 underline text-sm">返回模式选择</button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* 顶部信息栏 */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-mid border-b border-slate-700 shrink-0">
        <button onClick={() => navigate('/practice')} className="text-slate-400 hover:text-white text-sm">
          ← 退出
        </button>
        <span className="text-sm text-slate-400">
          {currentIndex + 1} / {totalQuestions}
          {isExam && ' · 模考模式'}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDrawing(!showDrawing)}
            className={`text-xs px-2 py-1 rounded ${showDrawing ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500'}`}
          >
            画笔
          </button>
          <button
            onClick={() => setShowSource(!showSource)}
            className={`text-xs px-2 py-1 rounded ${showSource ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500'}`}
          >
            溯源
          </button>
        </div>
      </div>

      {/* 画笔工具 */}
      {showDrawing && <DrawingTools />}

      {/* 题目区 */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            {/* 题干 */}
            <div className="text-white text-base sm:text-lg leading-relaxed whitespace-pre-wrap mb-6">
              {currentQuestion.stem}
            </div>

            {/* 选项 */}
            <div className="space-y-3">
              {currentQuestion.options.map((opt, idx) => {
                let optionStyle = 'border-slate-600/50 hover:border-slate-500 bg-surface-mid/50'
                if (submitted) {
                  if (idx === currentQuestion.correct_answer) {
                    optionStyle = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                  } else if (idx === selectedAnswer && !currentQuestion.options.every((_, i) => selectedAnswer !== i || i === currentQuestion.correct_answer)) {
                    optionStyle = 'border-red-500/50 bg-red-500/10 text-red-300'
                  }
                } else if (idx === selectedAnswer) {
                  optionStyle = 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                }

                return (
                  <button
                    key={idx}
                    onClick={() => !submitted && setSelectedAnswer(idx)}
                    disabled={submitted}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${optionStyle}`}
                  >
                    <span className="inline-block w-7 h-7 rounded-full bg-slate-700 text-center leading-7 text-xs text-slate-400 mr-3">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-slate-200">{opt}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 出题溯源面板 */}
      {showSource && <QuestionSource question={currentQuestion} />}

      {/* 底部操作栏 */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface-mid border-t border-slate-700 shrink-0">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
        >
          上一题
        </button>

        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={selectedAnswer === null}
            className="px-6 py-2 rounded-lg text-sm font-medium bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            提交答案
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-6 py-2 rounded-lg text-sm font-medium bg-cyan-600 text-white hover:bg-cyan-500 transition-colors"
          >
            {currentIndex + 1 < totalQuestions ? '下一题' : (isExam ? '提交试卷' : '完成练习')}
          </button>
        )}

        <button
          onClick={handleNext}
          disabled={currentIndex + 1 >= totalQuestions || !submitted}
          className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
        >
          下一题
        </button>
      </div>

      {/* 提交反馈 */}
      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`px-4 py-2 text-center text-sm font-medium ${
            selectedAnswer === currentQuestion.correct_answer
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-red-500/20 text-red-400'
          }`}
        >
          {selectedAnswer === currentQuestion.correct_answer ? '✓ 回答正确！' : `✗ 回答错误，正确答案是 ${String.fromCharCode(65 + currentQuestion.correct_answer)}`}
        </motion.div>
      )}
    </div>
  )
}
