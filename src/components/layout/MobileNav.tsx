import { Link } from 'react-router-dom'

interface NavItem {
  path: string
  label: string
  icon: string
}

export function MobileNav({ items, currentPath }: { items: NavItem[]; currentPath: string }) {
  return (
    <nav className="sm:hidden flex items-center justify-around bg-surface-mid border-t border-slate-700 shrink-0 pb-safe">
      {items.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`flex flex-col items-center py-1.5 px-3 text-xs transition-colors ${
            currentPath === item.path
              ? 'text-cyan-300'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <span className="text-lg">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}
