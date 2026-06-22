import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { adminService } from "@/services/admin"
import { toast } from "@/lib/toast"

export default function TesterManagement() {
  const { t } = useTranslation()
  const [testers, setTesters] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [addKey, setAddKey] = useState("")

  useEffect(() => { load() }, [])

  async function load() {
    const [testerList, userList] = await Promise.all([
      adminService.getTesters(),
      adminService.getUsers(),
    ])
    setTesters(testerList)
    setUsers(userList.filter(u => !u.is_deleted))
    setLoading(false)
  }

  async function addTester() {
    if (!addKey) return
    await adminService.addTester(addKey)
    setAddKey("")
    load()
  }

  async function removeTester(userKey) {
    await adminService.removeTester(userKey)
    load()
  }

  const availableUsers = users.filter(u => !testers.some(t => t.user_key === u.key))

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner /></div>

  return (
    <div className="p-5 space-y-4 max-w-2xl">
      <div className="flex items-center gap-2">
        <select
          className="flex-1 h-9 border border-input rounded-md px-3 text-sm bg-background"
          value={addKey}
          onChange={e => setAddKey(e.target.value)}
        >
          <option value="">{t("TESTERS.SELECT_USER") === "TESTERS.SELECT_USER" ? "Select user..." : t("TESTERS.SELECT_USER")}</option>
          {availableUsers.map(u => (
            <option key={u.key} value={u.key}>{u.key} — {u.display_name_en || u.display_name_th || ""}</option>
          ))}
        </select>
        <Button size="sm" onClick={addTester} disabled={!addKey}>
          <Plus className="size-4 me-1" /> Add
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-2 font-medium">User</th>
              <th className="text-left px-4 py-2 font-medium">Name</th>
              <th className="w-16"></th>
            </tr>
          </thead>
          <tbody>
            {testers.map(t => {
              const u = users.find(u => u.key === t.user_key)
              return (
                <tr key={t.user_key} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-2 font-mono text-sm">{t.user_key}</td>
                  <td className="px-4 py-2 text-muted-foreground">{u?.display_name_en || u?.display_name_th || "—"}</td>
                  <td className="px-4 py-2">
                    <Button variant="ghost" mode="icon" className="size-7 text-destructive" onClick={() => removeTester(t.user_key)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              )
            })}
            {!testers.length && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No testers configured</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
