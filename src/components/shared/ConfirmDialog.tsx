import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open, title, message, confirmLabel = '确认', cancelLabel = '取消',
  danger = false, onConfirm, onCancel,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-surface-mid border border-slate-600 rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-slate-400 text-sm mb-6">{message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 rounded-lg text-sm text-white transition-colors ${
                  danger
                    ? 'bg-red-600 hover:bg-red-500'
                    : 'bg-cyan-600 hover:bg-cyan-500'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
