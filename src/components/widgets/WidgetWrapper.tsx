import { ReactNode } from 'react'

interface Props {
  title: string
  icon: ReactNode
  badge?: number | string
  footer?: ReactNode
  loading?: boolean
  children: ReactNode
  accentColor?: 'blue' | 'red' | 'gold' | 'green' | 'gray'
}

const ACCENT = {
  blue:  'from-blue-600 to-blue-700',
  red:   'from-red-600 to-red-700',
  gold:  'from-amber-500 to-amber-600',
  green: 'from-emerald-500 to-emerald-600',
  gray:  'from-gray-500 to-gray-600',
}

export function WidgetWrapper({ title, icon, badge, footer, loading, children, accentColor = 'blue' }: Props) {
  return (
    <div className="flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 overflow-hidden h-full">
      {/* Header */}
      <div className={`bg-gradient-to-r ${ACCENT[accentColor]} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2 text-white">
          <span className="w-4 h-4 shrink-0">{icon}</span>
          <span className="text-sm font-semibold tracking-wide">{title}</span>
        </div>
        {badge !== undefined && (
          <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 p-4 overflow-auto">
        {loading ? <SkeletonLines /> : children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
          {footer}
        </div>
      )}
    </div>
  )
}

function SkeletonLines() {
  return (
    <div className="space-y-3 animate-pulse">
      {[80, 60, 90, 50].map((w, i) => (
        <div key={i} className={`h-3 bg-gray-200 dark:bg-gray-700 rounded`} style={{ width: `${w}%` }} />
      ))}
    </div>
  )
}
