import { type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { MobileNav } from './MobileNav'

const NAV_ITEMS = [
  { path: '/', label: '知识导图', icon: '🗺' },
  { path: '/practice', label: '练习', icon: '✏' },
  { path: '/reports/trend', label: '报告', icon: '📊' },
  { path: '/user-center', label: '我的', icon: '👤' },
]

export function AppShell({ children }: { children: ReactNode }) {
  const { isOnline, isDbReady } = useApp()
  const location = useLocation()

  if (!isDbReady) {
    return (
      <div className="flex items-center justify-center h-full bg-surface-dark">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400">正在初始化知识图谱...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-surface-dark">
      {/* 顶部状态栏 */}
      <header className="flex items-center justify-between px-4 py-2 bg-surface-mid border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-cyan-300">公考知识图谱</span>
          <span className="text-xs text-slate-500 hidden sm:inline">| 智能学习平台</span>
        </div>
        <div className="flex items-center gap-4">
          {/* 桌面端导航 */}
          <nav className="hidden sm:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  location.pathname === item.path
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          {/* 在线状态徽标 */}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
              isOnline
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`}
            />
            {isOnline ? '在线' : '离线可用'}
          </span>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      {/* 移动端底部导航 */}
      <MobileNav items={NAV_ITEMS} currentPath={location.pathname} />
    </div>
  )
}
