import { useState, useEffect, useMemo, useCallback } from "react"
import { useTranslation } from "react-i18next"
import * as icons from "lucide-react"
import { AgGridReact } from "ag-grid-react"
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { UserAvatar } from "@/components/user-avatar"
import { adminService } from "@/services/admin"

ModuleRegistry.registerModules([AllCommunityModule])

export default function RoleManagement() {
  const { t, i18n } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: "", description: "", permissionIds: [] })
  const [selectedRole, setSelectedRole] = useState(null)
  const [roleUsers, setRoleUsers] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [addUserId, setAddUserId] = useState("")
  const [addSearch, setAddSearch] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [userAvatars, setUserAvatars] = useState({})

  const nameKey = i18n.language === "th" ? "name_th" : "name_en"

  useEffect(() => { load() }, [])

  async function load() {
    const [r, p] = await Promise.all([adminService.getRoles(), adminService.getPermissions()])
    setRoles(r)
    setPermissions(p)
    setLoading(false)
  }

  async function openUserPanel(role) {
    setSelectedRole(role)
    const [users, all] = await Promise.all([adminService.getRoleUsers(role.key), adminService.getUsers()])
    setRoleUsers(users)
    setAllUsers(all)
    const usernames = all.map(u => u.key).filter(Boolean)
    fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:4000"}/api/settings/avatars`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: JSON.stringify({ usernames })
    }).then(r => r.json()).then(d => { if (d.data) setUserAvatars(d.data) }).catch(() => {})
  }

  async function addToRole() {
    if (!addUserId) return
    await adminService.addUserToRole(selectedRole.key, addUserId)
    setAddUserId("")
    setAddSearch("")
    openUserPanel(selectedRole)
  }

  async function removeFromRole(userId) {
    await adminService.removeUserFromRole(selectedRole.key, userId)
    openUserPanel(selectedRole)
  }

  function startCreate() {
    setForm({ name: "", description: "", permissionIds: [] })
    setEditing("new")
  }

  function startEdit(role) {
    setForm({ name: role.name, description: role.description || "", permissionIds: [...(role.permission_keys || [])] })
    setEditing(role.key)
  }

  async function save() {
    const dto = { name: form.name, description: form.description, permission_keys: form.permissionIds }
    if (editing === "new") await adminService.createRole(dto)
    else await adminService.updateRole(editing, dto)
    setEditing(null)
    load()
  }

  async function onCellValueChanged(e) {
    await adminService.updateRole(e.data.key, { key: e.data.key, name: e.data.name, description: e.data.description, permission_keys: e.data.permission_keys || [] })
  }

  async function remove() {
    await adminService.deleteRole(confirmDelete)
    setConfirmDelete(null)
    load()
  }

  function collectAllIds(node) {
    const ids = [node.key]
    if (node.children) node.children.forEach(c => ids.push(...collectAllIds(c)))
    return ids
  }

  function findNode(tree, id) {
    for (const n of tree) {
      if (n.key === id) return n
      if (n.children) { const found = findNode(n.children, id); if (found) return found }
    }
    return null
  }

  function togglePerm(id) {
    const node = findNode(permissions, id)
    const ids = node ? collectAllIds(node) : [id]
    setForm(f => {
      const adding = !f.permissionIds.includes(id)
      return {
        ...f,
        permissionIds: adding
          ? [...new Set([...f.permissionIds, ...ids])]
          : f.permissionIds.filter(x => !ids.includes(x))
      }
    })
  }

  const gridTheme = useMemo(() => themeQuartz.withParams({
    fontFamily: ["BridgestoneType", "Google Sans", "sans-serif"],
    fontSize: "0.75rem",
    rowHeight: 32,
    headerHeight: 32
  }), [])

  const ActionsRenderer = useCallback((p) => (
    <div className="flex gap-1 items-center h-full">
      <Button size="sm" mode="icon" variant="outline" title={t("ROLES.PERMISSIONS")} onClick={() => startEdit(p.data)}><icons.ShieldCheck className="size-4" /></Button>
      <Button size="sm" mode="icon" variant="outline" title="Users" onClick={() => openUserPanel(p.data)}><icons.Users className="size-4" /></Button>
      <Button size="sm" mode="icon" variant="destructive" title={t("DELETE")} onClick={() => setConfirmDelete(p.data.key)}><icons.Trash2 className="size-4" /></Button>
    </div>
  ), [])

  const columnDefs = useMemo(() => [
    { field: "name", headerName: t("ROLES.NAME"), filter: true, sortable: true, flex: 1, editable: true },
    { field: "description", headerName: t("ROLES.DESCRIPTION"), filter: true, sortable: true, flex: 2, editable: true },
    { headerName: t("ACTIONS"), width: 140, sortable: false, filter: false, cellRenderer: ActionsRenderer },
  ], [t, i18n.language])

  const localeText = useMemo(() => i18n.language === "th" ? {
    page: t("AG_GRID.PAGE"), of: t("AG_GRID.OF"), to: t("AG_GRID.TO"),
    more: t("AG_GRID.MORE"), firstPage: t("AG_GRID.FIRST_PAGE"),
    previousPage: t("AG_GRID.PREVIOUS_PAGE"), nextPage: t("AG_GRID.NEXT_PAGE"),
    lastPage: t("AG_GRID.LAST_PAGE"), filterOoo: t("AG_GRID.FILTER"),
    applyFilter: t("AG_GRID.APPLY"), clearFilter: t("AG_GRID.CLEAR"),
    resetFilter: t("AG_GRID.RESET"), cancelFilter: t("AG_GRID.CANCEL"),
    equals: t("AG_GRID.EQUALS"), notEqual: t("AG_GRID.NOT_EQUAL"),
    lessThan: t("AG_GRID.LESS_THAN"), greaterThan: t("AG_GRID.GREATER_THAN"),
    contains: t("AG_GRID.CONTAINS"), notContains: t("AG_GRID.NOT_CONTAINS"),
    startsWith: t("AG_GRID.STARTS_WITH"), endsWith: t("AG_GRID.ENDS_WITH"),
    blank: t("AG_GRID.BLANK"), notBlank: t("AG_GRID.NOT_BLANK"),
    andCondition: t("AG_GRID.AND"), orCondition: t("AG_GRID.OR"),
    noRowsToShow: t("AG_GRID.NO_ROWS"), pageSizeSelectorLabel: t("AG_GRID.PAGE_SIZE"),
  } : undefined, [t, i18n.language])

  if (loading) return <Spinner />

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("ROLES.TITLE")}</h2>
        <Button onClick={startCreate}>+ {t("ROLES.CREATE")}</Button>
      </div>
      <div style={{ height: 500, width: "100%" }}>
        <AgGridReact
          theme={gridTheme}
          localeText={localeText}
          rowData={roles}
          columnDefs={columnDefs}
          defaultColDef={{ resizable: true }}
          onCellValueChanged={onCellValueChanged}
          pagination={true}
          paginationPageSize={20}
          animateRows={true}
        />
      </div>

      {editing !== null && (
        <Dialog open onOpenChange={v => !v && setEditing(null)}>
          <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{editing === "new" ? t("ROLES.CREATE") : `${t("ROLES.PERMISSIONS")} : ${roles.find(r => r.key === editing)?.name || ""}`}</DialogTitle>
            </DialogHeader>
            {editing === "new" && (
              <div className="space-y-3 pb-3 border-b border-border">
                <Input placeholder={t("ROLES.NAME_PLACEHOLDER")} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <Input placeholder={t("ROLES.DESCRIPTION_PLACEHOLDER")} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            )}
            <div className="flex-1 overflow-auto">
              <div className="grid grid-cols-3 gap-3 py-2">
                {permissions.filter(p => p.is_authorized !== false).map(p1 => (
                  <div key={p1.key} className="border border-border rounded-lg overflow-hidden">
                    <label className="flex items-center gap-3 px-3 py-2 bg-muted/50 border-b border-border cursor-pointer font-medium text-xs">
                      <input type="checkbox" checked={form.permissionIds.includes(p1.key)} onChange={() => togglePerm(p1.key)} className="rounded size-4 shrink-0" />
                      {p1[nameKey]}
                    </label>
                    {p1.children?.filter(c => c.is_authorized !== false).length > 0 && (
                      <div className="p-2 space-y-0.5">
                        {p1.children.filter(c => c.is_authorized !== false).map(c => (
                          <PermCheckbox key={c.key} node={c} nameKey={nameKey} selected={form.permissionIds} toggle={togglePerm} depth={0} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>{t("CANCEL")}</Button>
              <Button onClick={save}>{t("SAVE")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {selectedRole && (
        <Dialog open onOpenChange={v => !v && setSelectedRole(null)}>
          <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{t("ROLES.USERS_IN", { name: selectedRole.name })} ({roleUsers.length})</DialogTitle>
            </DialogHeader>
            <div className="relative mb-3">
              <div className="flex gap-2">
                <Input placeholder={t("ROLES.SELECT_USER")} value={addSearch} onChange={e => { setAddSearch(e.target.value); setAddUserId("") }} />
                <Button onClick={addToRole} disabled={!addUserId}>{t("ADD")}</Button>
              </div>
              {addSearch && !addUserId && (
                <div className="absolute z-10 top-full left-0 right-12 mt-1 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-auto">
                  {allUsers.filter(u => !roleUsers.some(ru => ru.key === u.key) && (u.key.includes(addSearch.toLowerCase()) || (u.display_name_en || "").toLowerCase().includes(addSearch.toLowerCase()) || (u.display_name_th || "").includes(addSearch))).map(u => (
                    <button key={u.key} className="w-full text-left px-3 py-2 hover:bg-muted text-xs flex items-center gap-2" onClick={() => { setAddUserId(u.key); setAddSearch(u.display_name_en || u.display_name_th || u.key) }}>
                      <UserAvatar avatarUrl={userAvatars[u.key]} name={u.display_name_en || u.key} size="sm" />
                      <div>
                        <p className="font-medium">{i18n.language === "th" ? (u.display_name_th || u.display_name_en || u.key) : (u.display_name_en || u.display_name_th || u.key)}</p>
                        <p className="text-xs text-muted-foreground">{u.key}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-auto space-y-2">
              {roleUsers.map(u => (
                <div key={u.key} className="flex items-center gap-3 border rounded-lg px-3 py-2">
                  <UserAvatar avatarUrl={userAvatars[u.key]} name={u.display_name_en || u.key} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{i18n.language === "th" ? (u.display_name_th || u.display_name_en || u.key) : (u.display_name_en || u.display_name_th || u.key)}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.key}</p>
                  </div>
                  <button onClick={() => removeFromRole(u.key)} className="shrink-0 text-muted-foreground hover:text-red-500">
                    <icons.X className="size-4" />
                  </button>
                </div>
              ))}
              {roleUsers.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">{t("ROLES.NO_USERS")}</p>}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={remove}
        title={t("DELETE")}
        message={t("ROLES.CONFIRM_DELETE")}
        confirmLabel={t("DELETE")}
        cancelLabel={t("CANCEL")}
      />
    </div>
  )
}

function PermCheckbox({ node, nameKey, selected, toggle, depth = 0 }) {
  const [open, setOpen] = useState(false)
  const hasChildren = node.children?.filter(c => c.is_authorized !== false).length > 0
  const checked = selected.includes(node.key)
  return (
    <>
      <div className="flex items-center gap-1 py-1 px-1 rounded hover:bg-muted/50 text-xs" style={{ paddingLeft: depth * 20 }}>
        {hasChildren ? (
          <button onClick={() => setOpen(!open)} className="size-4 flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0">
            {open ? <icons.ChevronDown className="size-3" /> : <icons.ChevronRight className="size-3" />}
          </button>
        ) : <span className="size-4 shrink-0" />}
        <label className="flex items-center gap-3 flex-1 cursor-pointer">
          <input type="checkbox" checked={checked} onChange={() => toggle(node.key)} className="rounded size-4 shrink-0" />
          <span className={checked ? "font-medium" : "text-muted-foreground"}>{node[nameKey]}</span>
        </label>
      </div>
      {hasChildren && open && node.children.filter(c => c.is_authorized !== false).map(c => (
        <PermCheckbox key={c.key} node={c} nameKey={nameKey} selected={selected} toggle={toggle} depth={depth + 1} />
      ))}
    </>
  )
}
