import { useState, useEffect } from "react"
import { toast } from "@/lib/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

import { getApiUrl } from "@/lib/env"

const BASE_URL = getApiUrl()

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: { "Content-Type": "application/json" }, ...options })
  const data = await res.json()
  if (!data.status) throw new Error(data.error?.error_code || "ERROR")
  return data.data
}

export default function SystemSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState([])
  const [editing, setEditing] = useState({})

  useEffect(() => { load() }, [])

  function load() {
    request("/api/settings").then(setSettings).finally(() => setLoading(false))
  }

  if (loading) return <Spinner />

  async function save(key) {
    await request(`/api/settings/${key}`, { method: "PUT", body: JSON.stringify({ value: editing[key] }) })
    toast.success("Saved")
    setEditing(e => { const n = { ...e }; delete n[key]; return n })
    load()
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-lg font-semibold">System Settings</h1>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Key</th>
              <th className="text-left px-4 py-2 font-medium">Value</th>
              <th className="text-left px-4 py-2 font-medium">Description</th>
              <th className="px-4 py-2 w-20" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {settings.map(s => (
              <tr key={s.key_}>
                <td className="px-4 py-2 font-mono text-sm">{s.key_}</td>
                <td className="px-4 py-2">
                  <Input
                    className="h-8 w-40"
                    value={editing[s.key_] ?? s.value}
                    onChange={e => setEditing({ ...editing, [s.key_]: e.target.value })}
                  />
                </td>
                <td className="px-4 py-2 text-muted-foreground">{s.description}</td>
                <td className="px-4 py-2">
                  {editing[s.key_] != null && editing[s.key_] !== s.value && (
                    <Button size="sm" onClick={() => save(s.key_)}>Save</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
