"use client"

import React from "react"

const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"

type Props = {
  children: React.ReactNode
}

type State = {
  error: Error | null
}

export class AdminChatCrashBoundary extends React.Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[786.Chat] admin workspace render crash", error, info)
  }

  private retry = () => {
    this.setState({ error: null })
  }

  private recoverWithoutActiveProject = () => {
    try {
      localStorage.removeItem(ACTIVE_PROJECT_ID_KEY)
    } catch {}
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    const message = this.state.error.message || String(this.state.error)

    return (
      <main className="flex min-h-screen items-center justify-center bg-[#071d2b] p-6 text-white">
        <div className="w-full max-w-2xl rounded-3xl border border-red-400/30 bg-[#130d18]/95 p-6 shadow-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-300">786.Chat workspace recovered</p>
          <h1 className="mt-3 text-2xl font-black">A project preview caused the dashboard render to stop.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Your saved project remains in Neon. Use recovery to reopen the dashboard without automatically loading the broken active preview.
          </p>
          <pre className="mt-5 max-h-56 overflow-auto whitespace-pre-wrap rounded-2xl border border-red-400/20 bg-black/30 p-4 text-xs leading-6 text-red-100">
            {message}
          </pre>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={this.retry}
              className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/15"
            >
              Retry dashboard
            </button>
            <button
              type="button"
              onClick={this.recoverWithoutActiveProject}
              className="rounded-2xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 hover:bg-cyan-200"
            >
              Recover dashboard safely
            </button>
          </div>
        </div>
      </main>
    )
  }
}
