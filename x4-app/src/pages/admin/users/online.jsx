import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useOnlineCount } from "@/hooks/use-online-count"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { UserAvatar } from "@/components/user-avatar"
import { Separator } from "@/components/ui/separator"
import { adminService } from "@/services/admin"

const HUB_API = (import.meta.env.VITE_HUB_URL ?? "http://localhost:4100") + "/api/online-sessions"
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000"

function formatDuration(connectedAt, t) {
  const ts = connectedAt?.endsWith("Z") ? connectedAt : (connectedAt || "") + "Z"
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (diff < 60) return `< 1 ${t("ONLINE_USERS.MIN")}`
  if (diff < 3600) return `${Math.floor(diff / 60)} ${t("ONLINE_USERS.MIN")}`
  return `${Math.floor(diff / 3600)} ${t("ONLINE_USERS.HR")} ${Math.floor((diff % 3600) / 60)} ${t("ONLINE_USERS.MIN")}`
}

export default function OnlineUsersPage() {
  const { t, i18n } = useTranslation()
  const count = useOnlineCount()
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState([])
  const [avatars, setAvatars] = useState({})
  const [users, setUsers] = useState({})

  useEffect(() => {
    const load = () => fetch(HUB_API).then(r => r.json()).then(d => { setSessions(d.data || []); if (d.data?.length > 0) setLoading(false) }).catch(() => setLoading(false))
    load()
    setTimeout(load, 1000)
    setTimeout(load, 2000)
    setTimeout(() => setLoading(false), 3000)
    const id = setInterval(load, 5000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    adminService.getUsers().then(list => {
      const map = {}
      list.forEach(u => { map[u.key] = u })
      setUsers(map)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const usernames = sessions.map(s => s.username).filter(Boolean)
    if (!usernames.length) return
    fetch(`${API_URL}/api/settings/avatars`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: JSON.stringify({ usernames })
    }).then(r => r.json()).then(d => { if (d.data) setAvatars(d.data) }).catch(() => {})
  }, [sessions])

  function getDisplayName(session) {
    const u = users[session.username]
    if (!u) return session.displayName || session.username || t("ONLINE_USERS.ANONYMOUS")
    if (i18n.language === "th") return u.display_name_th || u.display_name_en || session.username
    return u.display_name_en || u.display_name_th || session.username
  }

  if (loading) return <Spinner />

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <h1 className="text-base font-semibold">{t("ONLINE_USERS.TITLE")}</h1>
        <Badge variant="success" appearance="light" size="sm">{count} {t("ONLINE_USERS.ONLINE")}</Badge>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 && count === 0 && (
          <p className="text-center text-muted-foreground text-xs py-16">{t("ONLINE_USERS.NO_DATA")}</p>
        )}
        <div className="divide-y divide-border">
          {sessions.map((s, i) => {
            const u = users[s.username]
            return (
              <div key={i} className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50 transition-colors">
                <div className="relative shrink-0">
                  <UserAvatar avatarUrl={avatars[s.username]} name={u?.display_name_en || s.username} size="md" />
                  <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{getDisplayName(s)}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {s.username || t("ONLINE_USERS.ANONYMOUS")}
                    {u?.position && <> · {u.position}</>}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] text-green-600 font-medium">{formatDuration(u?.last_logged_in || s.connectedAt, t)}</p>
                  {s.browser && <p className="text-[10px] text-muted-foreground">{s.browser}</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
