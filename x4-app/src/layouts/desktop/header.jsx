import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Menu, Power, Search, Settings } from "lucide-react"
import * as icons from "lucide-react"
import { authService } from "@/services/auth"
import { adminService } from "@/services/admin"
import { getApiUrl } from "@/lib/env"
import { getEnvName, setEnvName, ENV_LIST } from "@/lib/env"
import { UserAvatar } from "@/components/user-avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import LangSwitcher from "@/components/lang-switcher"
import { Link } from "react-router-dom"
import { useLayout } from "./layout"
import { PreferencesPanel } from "./preferences-panel"

export function Header({ menu, nameKey }) {
  const { isMobile, mobileToggle } = useLayout()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [showPrefs, setShowPrefs] = useState(false)
  const [showEnvConfirm, setShowEnvConfirm] = useState(false)
  const [isTester, setIsTester] = useState(false)
  const avatarInputRef = useRef(null)
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  useEffect(() => {
    if (user.key) {
      adminService.getUserSettings(user.key).then(prefs => {
        if (prefs.avatar_url) setAvatarUrl(prefs.avatar_url)
      }).catch(() => {})
      adminService.checkTester(user.key).then(r => setIsTester(r.is_tester)).catch(() => {})
    }
  }, [])

  async function handleLogout() {
    await authService.logout()
    navigate("/auth/login")
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("prefix", "x4-avatars")
      const BASE_URL = getApiUrl()
      const res = await fetch(`${BASE_URL}/api/upload`, { method: "POST", body: form })
      const text = await res.text()
      if (!text) return
      const data = JSON.parse(text)
      const url = data.url || data.data?.url
      if (url) {
        await adminService.setUserSettings(user.key, { avatar_url: url })
        setAvatarUrl(url)
      }
    } catch (err) { console.error("Avatar upload failed:", err) }
    e.target.value = ""
  }

  function getDisplayName() {
    return (i18n.language === "th" ? user.display_name_th : user.display_name_en) || user.display_name_en || user.key
  }

  return (
    <>
    <header className="flex items-center fixed z-30 top-0 start-0 end-0 shrink-0 bg-white shadow-sm h-(--header-height) px-3">
      {/* Left: hamburger + brand */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" mode="icon" className="size-8 lg:hidden" onClick={mobileToggle}>
          <Menu className="size-4" />
        </Button>
        <Link to="/" className="flex items-center gap-1.5">
          <span className="text-sm font-bold tracking-tight text-primary">X4</span>
          <span className="text-xs font-medium text-muted-foreground">BTMT</span>
        </Link>
      </div>

      {/* Right: actions + avatar */}
      <div className="ml-auto flex items-center gap-1">
        {isTester && <button
          onClick={() => setShowEnvConfirm(true)}
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md border transition-colors hover:bg-accent"
        >
          <span className={`size-2 rounded-full ${getEnvName() === "development" ? "bg-amber-500" : getEnvName() === "uat" ? "bg-blue-500" : "bg-emerald-500"}`} />
          {getEnvName() === "development" ? "DEV" : getEnvName() === "uat" ? "UAT" : "PROD"}
        </button>}
        <LangSwitcher />
        <Button variant="ghost" mode="icon" className="size-8 text-muted-foreground hover:text-foreground" onClick={() => setShowPrefs(true)}>
          <Settings className="size-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full hover:bg-accent transition-colors p-0.5 ms-1">
              <div className="relative size-7">
                <UserAvatar avatarUrl={avatarUrl} name={user.display_name_en || user.key} size="sm" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <div className="flex items-center gap-3 p-3">
              <div className="relative group cursor-pointer shrink-0" onClick={() => avatarInputRef.current?.click()}>
                <UserAvatar avatarUrl={avatarUrl} name={user.display_name_en || user.key} size="lg" />
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <icons.Camera className="size-4 text-white" />
                </div>
                <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{getDisplayName()}</p>
                <p className="text-xs text-muted-foreground truncate">{user.key}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <Power className="size-4 me-2" />
              {t("LOGOUT")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
    {showPrefs && <PreferencesPanel userId={user.key} onClose={() => setShowPrefs(false)} />}
    {showEnvConfirm && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30" onClick={() => setShowEnvConfirm(false)}>
        <div className="bg-background rounded-lg border shadow-lg p-5 w-80 space-y-4" onClick={e => e.stopPropagation()}>
          <h4 className="text-sm font-semibold">{t("SWITCH_ENV_TITLE")}</h4>
          <div className="flex flex-col gap-1.5">
            {ENV_LIST.map(env => (
              <button
                key={env}
                disabled={env === getEnvName()}
                onClick={() => setEnvName(env)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors ${env === getEnvName() ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:bg-accent"}`}
              >
                <span className={`size-2 rounded-full ${env === "development" ? "bg-amber-500" : env === "uat" ? "bg-blue-500" : "bg-emerald-500"}`} />
                {env === "development" ? "Development (localhost)" : env === "uat" ? "UAT (staging)" : "Production"}
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowEnvConfirm(false)}>{t("CANCEL")}</Button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
