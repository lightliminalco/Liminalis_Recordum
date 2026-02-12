import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getAllEntries } from '../lib/db'
import type { JournalEntry } from '../lib/types'

export default function Record() {
  const { masterKey } = useAuth()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!masterKey) return
      const allEntries = await getAllEntries(masterKey)
      setEntries(allEntries)
      setIsLoading(false)
    }
    load()
  }, [masterKey])

  function getEntryPreview(entry: JournalEntry): string {
    if (entry.freeformText) {
      return entry.freeformText.slice(0, 120) + (entry.freeformText.length > 120 ? '...' : '')
    }
    if (entry.guidedResponses) {
      const firstResponse = Object.values(entry.guidedResponses)[0] ?? ''
      return firstResponse.slice(0, 120) + (firstResponse.length > 120 ? '...' : '')
    }
    return 'Empty entry'
  }

  function getEntryFullText(entry: JournalEntry): string {
    if (entry.freeformText) return entry.freeformText
    if (entry.guidedResponses) {
      return Object.entries(entry.guidedResponses)
        .map(([, value]) => value)
        .join('\n\n')
    }
    return ''
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const filtered = searchQuery.trim()
    ? entries.filter((entry) => {
        const text = getEntryFullText(entry).toLowerCase()
        return text.includes(searchQuery.toLowerCase())
      })
    : entries

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-400" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-light text-purple-100">The Record</h2>
          <p className="mt-1 text-sm text-purple-300/50">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'} in
            your journal
          </p>
        </div>
        {entries.length > 0 && (
          <div className="text-right">
            <p className="text-2xl font-light text-purple-200">
              {entries.length}
            </p>
            <p className="text-[10px] text-purple-500/40">days recorded</p>
          </div>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="mt-8 rounded-xl border border-purple-800/30 bg-purple-950/20 p-6 text-center">
          <p className="text-sm text-purple-300/60">
            Your record is empty. Start journaling to build your history.
          </p>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="mt-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your entries..."
              className="w-full rounded-lg border border-purple-800/30 bg-purple-950/20 px-3 py-2 text-sm text-purple-100 placeholder-purple-500/30 outline-none transition-colors focus:border-purple-600/50"
            />
          </div>

          {/* Entry list */}
          <div className="mt-4 space-y-2">
            {filtered.map((entry) => {
              const isExpanded = expandedId === entry.id
              return (
                <button
                  key={entry.id}
                  onClick={() =>
                    setExpandedId(isExpanded ? null : entry.id)
                  }
                  className="w-full rounded-xl border border-purple-800/30 bg-purple-950/20 p-4 text-left transition-all hover:border-purple-700/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-purple-300/70">
                          {formatDate(entry.timestamp)}
                        </span>
                        <span className="text-[10px] text-purple-500/30">
                          {formatTime(entry.timestamp)}
                        </span>
                        {entry.usedSpeechToText && (
                          <span className="text-[10px] text-purple-500/30">
                            (voice)
                          </span>
                        )}
                      </div>
                      {isExpanded ? (
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-purple-200/80">
                          {getEntryFullText(entry)}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-purple-300/50">
                          {getEntryPreview(entry)}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-center gap-1">
                      {entry.moodLevel && (
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor: `hsl(${280 - (entry.moodLevel - 1) * 20}, 60%, ${70 - (entry.moodLevel - 1) * 8}%)`,
                          }}
                          title={`Mood: ${entry.moodLevel}/5`}
                        />
                      )}
                    </div>
                  </div>
                  {isExpanded && entry.dailyAction && (
                    <div className="mt-3 rounded-lg border border-purple-800/20 bg-purple-900/10 p-2">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-purple-400/50">
                        Daily Action
                      </p>
                      <p className="mt-1 text-xs text-purple-300/60">
                        {entry.dailyAction}
                      </p>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {searchQuery && filtered.length === 0 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-purple-400/50">
                No entries match "{searchQuery}"
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
