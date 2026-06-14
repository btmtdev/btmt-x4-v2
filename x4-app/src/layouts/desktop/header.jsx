import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Menu, Power, ChevronRight } from "lucide-react"
import * as icons from "lucide-react"
import { authService } from "@/services/auth"
import { adminService } from "@/services/admin"
import { UserAvatar } from "@/components/user-avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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
  const avatarInputRef = useRef(null)
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  useEffect(() => {
    if (user.key) {
      adminService.getUserSettings(user.key).then(prefs => {
        if (prefs.avatar_url) setAvatarUrl(prefs.avatar_url)
      }).catch(() => {})
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
      const BASE_URL = import.meta.env.VITE_API_URL ?? ""
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
    <header className="flex items-stretch fixed z-30 top-0 start-0 end-0 shrink-0 bg-white border-b border-border h-(--header-height)">
      <div className="container-fluid grow flex items-stretch justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <Button variant="ghost" mode="icon" className="size-8 lg:hidden" onClick={mobileToggle}>
            <Menu className="size-4.5" />
          </Button>
          <Link to="/" className="flex items-center gap-2">
            <span className="flex items-center gap-2">
              <span className="text-base font-black tracking-tighter text-primary">X4</span>
              <span className="text-[10px] font-medium text-muted-foreground border border-border rounded px-1.5 py-0.5 uppercase tracking-wider">BTMT</span>
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2.5">
          <LangSwitcher />
          <Separator orientation="vertical" className="h-5" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="relative size-8">
                  <UserAvatar avatarUrl={avatarUrl} name={user.display_name_en || user.key} size="sm" />
                  <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-green-500 border-2 border-background" />
                </div>
                <span className="text-sm font-medium text-foreground hidden sm:block">
                  {getDisplayName()}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="flex items-center gap-3 p-3">
                <div className="relative group cursor-pointer shrink-0" onClick={() => avatarInputRef.current?.click()}>
                  <UserAvatar avatarUrl={avatarUrl} name={user.display_name_en || user.key} size="lg" />
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <icons.Camera className="size-4 text-white" />
                  </div>
                  <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{getDisplayName()}</p>
                  <p className="text-xs text-muted-foreground">{user.key}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowPrefs(true)}>
                <ChevronRight className="size-4 text-muted-foreground me-1" />
                {t("PREFERENCES")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <Power className="size-4 me-2" />
                {t("LOGOUT")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
    {showPrefs && <PreferencesPanel userId={user.key} onClose={() => setShowPrefs(false)} />}
    </>
  )
}
