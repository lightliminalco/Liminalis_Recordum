import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-shadow-950 px-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-900/30">
            <span className="text-2xl">&#x1f30c;</span>
          </div>
          <h2 className="text-lg font-light text-purple-100">
            Something shifted unexpectedly
          </h2>
          <p className="mt-2 text-sm text-purple-300/50">
            Your data is safe. Try refreshing the page.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false })
              window.location.reload()
            }}
            className="mt-6 rounded-lg bg-purple-700/50 px-6 py-2.5 text-sm text-purple-100 transition-colors hover:bg-purple-600/50"
          >
            Refresh
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
