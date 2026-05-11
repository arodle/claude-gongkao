import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface ToastMessage {
  id: string
  text: string
  type: 'info' | 'success' | 'error'
}

interface ToastContextValue {
  toast: (text: string, type?: 'info' | 'success' | 'error') => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([])

  const toast = useCallback((text: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = crypto.randomUUID().slice(0, 6)
    setMessages((prev) => [...prev, { id, text, type }])
  }, [])

  useEffect(() => {
    if (messages.length === 0) return
    const timer = setTimeout(() => {
      setMessages((prev) => prev.slice(1))
    }, 3000)
    return () => clearTimeout(timer)
  }, [messages])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className={`px-4 py-2 rounded-lg shadow-lg text-sm pointer-events-auto ${
                msg.type === 'error' ? 'bg-red-500/90 text-white' :
                msg.type === 'success' ? 'bg-emerald-500/90 text-white' :
                'bg-slate-700/90 text-slate-100'
              }`}
            >
              {msg.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
