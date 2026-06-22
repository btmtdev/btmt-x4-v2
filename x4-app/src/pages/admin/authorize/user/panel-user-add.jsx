import { useState } from "react"
import { useTranslation } from "react-i18next"
import * as icons from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { adminService } from "@/services/admin"

export function PanelUserAdd({ onClose, onSaved }) {
  const { t } = useTranslation()
  const [authMode, setAuthMode] = useState("gateway")
  const [form, setForm] = useState({ username: "", password: "", displayNameEn: "", displayNameTh: "" })
  const [profile, setProfile] = useState(null)
  const [lookupId, setLookupId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function lookupProfile() {
    if (!lookupId) return
    setLoading(true)
    setError("")
    try {
      const p = await adminService.lookupGatewayProfile(lookupId)
      setProfile(p)
      setForm(f => ({ ...f, username: p.emp_code || lookupId }))
    } catch (err) { setProfile(null); setError(t(`ERROR.${err.message}`) !== `ERROR.${err.message}` ? t(`ERROR.${err.message}`) : err.message) }
    setLoading(false)
  }

  async function addUser(e) {
    e.preventDefault()
    setError("")
    try {
      if (authMode === "local")
        await adminService.createUser({ key: form.username, auth_mode: "local", password: form.password, display_name_en: form.displayNameEn, display_name_th: form.displayNameTh })
      else
        await adminService.createUser({ key: profile.emp_code, auth_mode: "gateway", display_name_th: profile.display_name_th, display_name_en: profile.display_name_en, ad_username: profile.ad_username, emp_code: profile.emp_code, position: profile.position, dept_code: profile.dept_code, dept_name: profile.dept_name, email: profile.email, company: "BTMT" })
      onSaved()
    } catch (err) {
      setError(t(`ERROR.${err.message}`) || err.message)
    }
  }

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("USERS.ADD_USER")}</DialogTitle>
        </DialogHeader>
        <div className="flex border-b border-border">
          <button onClick={() => setAuthMode("gateway")} className={`flex-1 py-2 text-sm font-medium ${authMode === "gateway" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>Gateway</button>
          <button onClick={() => setAuthMode("local")} className={`flex-1 py-2 text-sm font-medium ${authMode === "local" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>Local</button>
        </div>
        <div className="space-y-4 pt-3">
          {authMode === "local" && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t("USERNAME")}</label>
                <Input className="mt-1" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t("PASSWORD")}</label>
                <Input className="mt-1" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t("USERS.DISPLAY_NAME")} (EN)</label>
                <Input className="mt-1" value={form.displayNameEn} onChange={e => setForm(f => ({ ...f, displayNameEn: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t("USERS.DISPLAY_NAME")} (TH)</label>
                <Input className="mt-1" value={form.displayNameTh} onChange={e => setForm(f => ({ ...f, displayNameTh: e.target.value }))} />
              </div>
            </div>
          )}
          {authMode === "gateway" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t("USERS.LOOKUP_EMPLOYEE")}</label>
                <div className="flex gap-2 mt-1">
                  <Input placeholder={t("USERS.LOOKUP_PLACEHOLDER")} value={lookupId} onChange={e => { setLookupId(e.target.value); setProfile(null); setError("") }} onKeyDown={e => e.key === "Enter" && lookupProfile()} />
                  <Button type="button" variant="outline" onClick={lookupProfile} disabled={loading}>
                    {loading ? <icons.Loader2 className="size-4 animate-spin" /> : <icons.Search className="size-4" />}
                  </Button>
                </div>
              </div>
              {profile && (
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="bg-muted/50 px-3 py-2 flex items-center gap-2 border-b border-border">
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <icons.UserCheck className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-tight">{profile.display_name_en || profile.display_name_th}</p>
                      <p className="text-sm text-muted-foreground">{profile.emp_code}</p>
                    </div>
                  </div>
                  <div className="px-3 py-2 space-y-1.5 text-sm">
                    {profile.ad_username && <div className="flex justify-between"><span className="text-muted-foreground">{t("USERS.AD_USER")}</span><span className="font-medium text-right">{profile.ad_username}</span></div>}
                    {profile.email && <div className="flex justify-between"><span className="text-muted-foreground">{t("USERS.EMAIL")}</span><span className="font-medium text-right">{profile.email}</span></div>}
                    <div className="flex justify-between"><span className="text-muted-foreground">{t("USERS.ORG")}</span><span className="font-medium text-right">{profile.dept_name || "-"}</span></div>
                    {profile.position && <div className="flex justify-between"><span className="text-muted-foreground">{t("USERS.POSITION")}</span><span className="font-medium text-right">{profile.position}</span></div>}
                    <div className="flex justify-between"><span className="text-muted-foreground">{t("SUPPORT.STATUS")}</span><span className={`font-medium ${profile.work_status === "Active" ? "text-green-600" : "text-red-500"}`}>{profile.work_status || "-"}</span></div>
                  </div>
                  {profile.work_status && profile.work_status !== "Active" && (
                    <div className="px-3 py-2 bg-red-50 border-t border-border text-sm text-red-600">{t("USERS.NOT_ACTIVE_WARNING")}</div>
                  )}
                  {error && (
                    <div className="px-3 py-2 bg-red-50 border-t border-border text-sm text-red-600">{error}</div>
                  )}
                </div>
              )}
              {!profile && error && (
                <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("CANCEL")}</Button>
          <Button onClick={addUser} disabled={authMode === "gateway" && (!profile || (profile.work_status && profile.work_status !== "Active"))}>{t("SAVE")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
