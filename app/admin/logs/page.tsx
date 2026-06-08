"use client"

import { useEffect, useState } from "react"

type AdminLog = {
  id?: string
  admin_email?: string
  action?: string
  entity_type?: string
  entity_id?: string
  entity_name?: string
  created_at?: string
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/logs", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setLogs(Array.isArray(data.logs) ? data.logs : []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Logs</h1>
      <p className="text-muted-foreground">Track all admin actions and changes</p>

      {loading ? (
        <p>Loading logs...</p>
      ) : logs.length === 0 ? (
        <p className="text-muted-foreground">No logs found.</p>
      ) : (
        <div className="space-y-3">
          {logs.map((log, index) => (
            <div key={log.id || index} className="rounded-lg border border-white/10 p-4">
              <p><b>Admin:</b> {log.admin_email || "-"}</p>
              <p><b>Action:</b> {log.action || "-"}</p>
              <p><b>Entity:</b> {log.entity_name || log.entity_type || "-"}</p>
              <p><b>Date:</b> {log.created_at ? new Date(log.created_at).toLocaleString() : "-"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
