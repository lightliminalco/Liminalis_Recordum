import { type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const NAV_ITEMS = [
  { path: '/journal', label: 'Journal', icon: '&#x270D;' },
  { path: '/balance', label: 'Balance', icon: '&#x2696;' },
  { path: '/record', label: 'Record', icon: '&#x1f4dc;' },
  { path: '/meditate', label: 'Meditate', icon: '&#x1f54a;' },
  { path: '/lifeline', label: 'Lifeline', icon: '&#x2764;' },
]

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { lock } = useAuth()

  return (
    <div className="flex min-h-dvh flex-col bg-shadow-950">
      {/* Top bar */}
      <header className="safe-top flex items-center justify-between border-b border-purple-900/20 px-4 py-3">
        <h1
          className="cursor-pointer text-sm font-light tracking-wider text-purple-300/70"
          onClick={() => navigate('/journal')}
        >
          Liminalis
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/settings')}
            className="text-purple-400/50 transition-colors hover:text-purple-300"
            aria-label="Settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </button>
          <button
            onClick={lock}
            className="text-purple-400/50 transition-colors hover:text-purple-300"
            aria-label="Lock"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-4 py-6">{children}</main>

      {/* Bottom navigation */}
      <nav className="safe-bottom border-t border-purple-900/20 bg-shadow-950/95 backdrop-blur-sm">
        <div className="flex items-center justify-around py-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.path)
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 transition-colors ${
                  isActive
                    ? 'text-purple-300'
                    : 'text-purple-500/40 hover:text-purple-400/60'
                }`}
              >
                <span
                  className="text-lg"
                  dangerouslySetInnerHTML={{ __html: item.icon }}
                />
                <span className="text-[10px] font-medium tracking-wide">
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
