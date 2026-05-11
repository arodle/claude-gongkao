import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  toX: number
  toY: number
  nodeId: string
  onComplete: () => void
}

export function FlyAnimation({ toX, toY, nodeId, onComplete }: Props) {
  const [startPos] = useState(() => {
    // 从视口中心开始
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
  })

  useEffect(() => {
    const timer = setTimeout(onComplete, 1200)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <AnimatePresence>
      <motion.div
        key={nodeId}
        initial={{
          x: startPos.x,
          y: startPos.y,
          opacity: 1,
          scale: 1,
        }}
        animate={{
          x: toX,
          y: toY,
          opacity: 0,
          scale: 0.15,
        }}
        transition={{
          duration: 0.8,
          ease: 'easeIn',
        }}
        className="fixed z-50 pointer-events-none"
        style={{
          width: 16,
          height: 16,
          marginLeft: -8,
          marginTop: -8,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #ef4444, #dc2626)',
          boxShadow: '0 0 20px rgba(239,68,68,0.6), 0 0 40px rgba(239,68,68,0.3)',
        }}
      />
    </AnimatePresence>
  )
}

/** 从页面任意位置触发飞入动画 */
export function triggerFly(fromX: number, fromY: number, nodeId: string) {
  const fn = (window as any).__triggerFlyAnimation as Function | undefined
  if (fn) fn(fromX, fromY, nodeId)
}
