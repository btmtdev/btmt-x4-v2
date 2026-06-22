import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import * as icons from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { adminService } from "@/services/admin"
import { toast } from "@/lib/toast"

export function PanelUserEdit({ user, onClose, onSaved }) {
  const { t, i18n } = useTranslation()
  const nameKey = i18n.language === "th" ? "name_th" : "name_en"
  const [editTab, setEditTab] = useState("roles")
  const [editForm, setEditForm] = useState({ displayName: "", password: "" })
  const [allRoles, setAllRoles] = useState([])
  const [permTree, setPermTree] = useState([])
  const [userRoleIds, setUserRoleIds] = useState([])
  const [overrides, setOverrides] = useState([])
  const [effective, setEffective] = useState([])

  useEffect(() => { loadData() }, [user.key])

  async function loadData(tab) {
    setEditTab(tab || "roles")
    setEditForm({ displayNameTh: user.display_name_th || "", displayNameEn: user.display_name_en || "", password: "" })
    const [roles, ur, perms, eff] = await Promise.all([
      adminService.getRoles(),
      adminService.getUserRoles(user.key),
      adminService.getPermissions(),
      adminService.getEffectivePermissions(user.key),
    ])
    setAllRoles(roles)
    setUserRoleIds(ur.roles)
    setOverrides(ur.overrides.map(o => ({ permissionId: o.permission_id, overrideType: o.override_type })))
    setPermTree(perms)
    setEffective(eff.map(p => p.key))
  }

  function toggleRole(key) { setUserRoleIds(c => c.includes(key) ? c.filter(x => x !== key) : [...c, key]) }

  function collectIds(node) {
    const ids = [node.key]
    if (node.children) node.children.forEach(c => ids.push(...collectIds(c)))
    return ids
  }


  function toggleOverride(node, type) {
    const ids = collectIds(node)
    setOverrides(ov => {
      const filtered = ov.filter(o => !ids.includes(o.permissionId))
      // If already set to this type, remove (toggle off)
      const current = ov.find(o => o.permissionId === node.key)
      if (current?.overrideType === type) return filtered
      // Otherwise set to the new type
      ids.forEach(id => filtered.push({ permissionId: id, overrideType: type }))
      return filtered
    })
  }

  async function saveRoles() { await adminService.setUserRoles(user.key, userRoleIds); onSaved(); onClose(); toast.success(t("PREFS.SAVED")) }
  async function saveOverrides() { await adminService.setUserOverrides(user.key, overrides); onSaved(); onClose(); toast.success(t("PREFS.SAVED")) }
  async function saveProfile() { await adminService.updateUserProfile(user.key, { display_name_th: editForm.displayNameTh, display_name_en: editForm.displayNameEn, password: editForm.password || undefined }); onSaved(); onClose(); toast.success(t("PREFS.SAVED")) }

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{user.key}</DialogTitle>
        </DialogHeader>
        <div className="flex border-b border-border">
          <button onClick={() => setEditTab("roles")} className={`flex-1 py-2 text-sm font-medium ${editTab === "roles" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>{t("USERS.ROLES")}</button>
          <button onClick={() => setEditTab("overrides")} className={`flex-1 py-2 text-sm font-medium ${editTab === "overrides" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>{t("USERS.OVERRIDES")}</button>
          {user.auth_mode === "local" && <button onClick={() => setEditTab("profile")} className={`flex-1 py-2 text-sm font-medium ${editTab === "profile" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>{t("USERS.PROFILE")}</button>}
        </div>
        <div className="flex-1 overflow-auto space-y-4 py-2">
          {editTab === "roles" && (
            <div className="space-y-1.5">
              {allRoles.map(r => (
                <label key={r.key} className={`flex items-center gap-3 px-4 py-2 rounded border text-sm cursor-pointer transition-colors ${userRoleIds.includes(r.key) ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}>
                  <input type="checkbox" className="sr-only" checked={userRoleIds.includes(r.key)} onChange={() => toggleRole(r.key)} />
                  <span className={`size-4 rounded border flex items-center justify-center shrink-0 ${userRoleIds.includes(r.key) ? "bg-primary border-primary text-white" : "border-gray-300"}`}>
                    {userRoleIds.includes(r.key) && <icons.Check className="size-3" />}
                  </span>
                  <div>
                    <p className={`${userRoleIds.includes(r.key) ? "text-primary font-medium" : "text-foreground"}`}>{r.name}</p>
                    {r.description && <p className="text-muted-foreground text-sm">{r.description}</p>}
                  </div>
                </label>
              ))}
            </div>
          )}
          {editTab === "overrides" && (
            <div className="grid grid-cols-3 gap-3">
              {permTree.filter(p => p.is_authorized !== false).map(p1 => (
                <div key={p1.key} className="border border-border rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border font-medium text-sm">
                    <OverrideBoxes permKey={p1.key} overrides={overrides} onToggle={type => toggleOverride(p1, type)} />
                    {p1[nameKey]}
                  </div>
                  {p1.children?.filter(c => c.is_authorized !== false).length > 0 && (
                    <div className="p-2 space-y-0.5">
                      {p1.children.filter(c => c.is_authorized !== false).map(c => (
                        <OverrideCheckbox key={c.key} node={c} nameKey={nameKey} overrides={overrides} toggleOverride={toggleOverride} depth={0} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {editTab === "profile" && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t("USERS.DISPLAY_NAME")} (EN)</label>
                <Input className="mt-1" value={editForm.displayNameEn} onChange={e => setEditForm(f => ({ ...f, displayNameEn: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t("USERS.DISPLAY_NAME")} (TH)</label>
                <Input className="mt-1" value={editForm.displayNameTh} onChange={e => setEditForm(f => ({ ...f, displayNameTh: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t("PASSWORD")}</label>
                <Input className="mt-1" type="password" placeholder="••••••••" value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("CANCEL")}</Button>
          <Button onClick={editTab === "roles" ? saveRoles : editTab === "overrides" ? saveOverrides : saveProfile}>{t("SAVE")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function OverrideBoxes({ permKey, overrides, onToggle }) {
  const o = overrides.find(x => x.permissionId === permKey)
  return (
    <div className="flex gap-0.5 shrink-0">
      <button type="button" onClick={() => onToggle("grant")} className={`size-5 rounded border text-sm font-bold flex items-center justify-center transition-colors ${o?.overrideType === "grant" ? "bg-emerald-500 border-emerald-500 text-white" : "border-border text-transparent hover:border-emerald-300 hover:text-emerald-300"}`}>+</button>
      <button type="button" onClick={() => onToggle("deny")} className={`size-5 rounded border text-sm font-bold flex items-center justify-center transition-colors ${o?.overrideType === "deny" ? "bg-red-500 border-red-500 text-white" : "border-border text-transparent hover:border-red-300 hover:text-red-300"}`}>−</button>
    </div>
  )
}

function OverrideCheckbox({ node, nameKey, overrides, toggleOverride, depth = 0 }) {
  const [open, setOpen] = useState(false)
  const hasChildren = node.children?.filter(c => c.is_authorized !== false).length > 0
  return (
    <>
      <div className="flex items-center gap-1.5 py-1 px-1 rounded hover:bg-muted/50 text-sm" style={{ paddingLeft: depth * 20 }}>
        {hasChildren ? (
          <button onClick={() => setOpen(!open)} className="size-4 flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0">
            {open ? <icons.ChevronDown className="size-3" /> : <icons.ChevronRight className="size-3" />}
          </button>
        ) : <span className="size-4 shrink-0" />}
        <OverrideBoxes permKey={node.key} overrides={overrides} onToggle={type => toggleOverride(node, type)} />
        <span className="text-sm">{node[nameKey]}</span>
      </div>
      {hasChildren && open && node.children.filter(c => c.is_authorized !== false).map(c => (
        <OverrideCheckbox key={c.key} node={c} nameKey={nameKey} overrides={overrides} toggleOverride={toggleOverride} depth={depth + 1} />
      ))}
    </>
  )
}
