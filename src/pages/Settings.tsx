import { useAuth } from '../contexts/AuthContext'

export default function Settings() {
  const { lock } = useAuth()

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="text-xl font-light text-purple-100">Settings</h2>
      <p className="mt-1 text-sm text-purple-300/50">
        Your sanctuary, your rules
      </p>

      <div className="mt-8 space-y-4">
        <div className="rounded-xl border border-purple-800/30 bg-purple-950/20 p-6 text-center">
          <p className="text-sm text-purple-300/60">
            Full settings panel coming in Stage D
          </p>
          <p className="mt-2 text-xs text-purple-500/40">
            Change password, manage passkey, switch path, shadow name,
            export data, delete data
          </p>
        </div>

        <button
          onClick={lock}
          className="w-full rounded-lg border border-purple-700/40 bg-purple-950/40 px-4 py-3 text-sm text-purple-200 transition-all hover:border-purple-600/60 hover:bg-purple-900/30"
        >
          Lock Sanctuary
        </button>
      </div>
    </div>
  )
}
