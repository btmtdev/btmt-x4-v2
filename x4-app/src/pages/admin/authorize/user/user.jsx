import { useState, useEffect, useMemo, useCallback } from "react"
import { useTranslation } from "react-i18next"
import * as icons from "lucide-react"
import { AgGridReact } from "ag-grid-react"
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { adminService } from "@/services/admin"
import { UserAvatar } from "@/components/user-avatar"
import { timeAgo } from "@/components/time-ago"
import { PanelUserAdd } from "./panel-user-add"
import { PanelUserEdit } from "./panel-user-edit"
import { ModalDeleteConfirm } from "./modal-delete-confirm"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

ModuleRegistry.registerModules([AllCommunityModule])

export default function UserManagement() {
  const { t, i18n } = useTranslation()
  const [pageLoading, setPageLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmHardDelete, setConfirmHardDelete] = useState(null)
  const [showDeleted, setShowDeleted] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [deleteLogs, setDeleteLogs] = useState([])
  const [deleteSuccess, setDeleteSuccess] = useState(false)
  const [deleteCountdown, setDeleteCountdown] = useState("")
  const [authTab, setAuthTab] = useState("gateway")

  useEffect(() => { load() }, [])
  async function load() {
    const u = await adminService.getUsers()
    setUsers(u.filter(x => !x.is_pending))
    setPageLoading(false)
  }

  async function disable(id) { await adminService.updateUserStatus(id, "disabled"); load() }
  async function enable(id) { await adminService.updateUserStatus(id, "active"); load() }
  async function confirmRemove() { await adminService.deleteUser(confirmDelete); setConfirmDelete(null); load() }
  async function confirmHardRemove() {
    const id = confirmHardDelete
    const user = users.find(u => u.key === id)
    const name = user?.key || id
    setConfirmHardDelete(null)
    setDeleting(name)
    setDeleteLogs([])
    const steps = [t("USERS.DEL_SETTINGS"), t("USERS.DEL_PERMISSIONS"), t("USERS.DEL_ROLES"), t("USERS.DEL_SESSIONS"), t("USERS.DEL_PROFILE"), t("USERS.DEL_USER")]
    for (const step of steps) {
      setDeleteLogs(prev => [...prev, step])
      await new Promise(r => setTimeout(r, 250))
    }
    await adminService.hardDeleteUser(id)
    setDeleteSuccess(true)
    for (let i = 5; i > 0; i--) {
      setDeleteCountdown(`${t("USERS.DEL_DONE")} — ${t("USERS.DEL_CLOSING", { sec: i })}`)
      await new Promise(r => setTimeout(r, 1000))
    }
    setDeleting(null)
    setDeleteLogs([])
    setDeleteSuccess(false)
    setDeleteCountdown("")
    setShowDeleted(true)
    load()
  }

  const rowData = useMemo(() => users.filter(u => u.auth_mode === authTab && !u.is_deleted), [users, authTab])
  const deletedUsers = useMemo(() => users.filter(u => u.is_deleted), [users])

  async function unlock(key) {
    await adminService.updateUserStatus(key, "active")
    load()
  }

  const ActionsRenderer = useCallback((p) => (
    <div className="flex gap-1 items-center h-full">
      {(p.data.is_locked || p.data.failed_login_count > 0) && <Button size="sm" mode="icon" variant="outline" title="Unlock / Reset" onClick={() => unlock(p.data.key)}><icons.LockOpen className="size-4 text-amber-600" /></Button>}
      <Button size="sm" mode="icon" variant="outline" title="Settings" onClick={() => setSelectedUser(p.data)}><icons.UserCog className="size-4" /></Button>
      <Button size="sm" mode="icon" variant="destructive" title="Delete" onClick={() => setConfirmDelete(p.data.key)}><icons.Trash2 className="size-4" /></Button>
    </div>
  ), [])

  const StatusRenderer = useCallback((p) => {
    const u = p.data
    return (
      <label className="flex items-center h-full cursor-pointer">
        <input type="checkbox" checked={u.is_active} onChange={() => u.is_active ? disable(u.key) : enable(u.key)} className="size-4 rounded border-gray-300" />
      </label>
    )
  }, [])

  const components = useMemo(() => ({ actionsRenderer: ActionsRenderer, statusRenderer: StatusRenderer }), [])

  const columnDefs = useMemo(() => [
    { field: "key", headerName: t("USERNAME"), filter: true, sortable: true, flex: 1 },
    { headerName: t("USERS.NAME"), valueGetter: p => i18n.language === "th" ? (p.data.display_name_th || p.data.display_name_en || "-") : (p.data.display_name_en || p.data.display_name_th || "-"), filter: true, sortable: true, flex: 1.5 },
    { field: "dept_name", headerName: t("USERS.ORG"), filter: true, sortable: true, flex: 1, cellRenderer: p => p.value || "-" },
    { headerName: t("USERS.LAST_LOGIN"), sortable: true, flex: 1, valueGetter: p => p.data.last_logged_in, cellRenderer: p => p.value ? timeAgo(p.value, i18n.language, t) : "-" },
    { headerName: t("SUPPORT.STATUS"), width: 100, sortable: false, filter: false, cellRenderer: "statusRenderer" },
    { headerName: t("ACTIONS"), width: 150, sortable: false, filter: false, cellRenderer: "actionsRenderer" },
  ], [t, i18n.language])

  const gridTheme = useMemo(() => themeQuartz.withParams({
    fontFamily: ["BridgestoneType", "Google Sans", "sans-serif"],
    fontSize: "0.75rem",
    rowHeight: 32,
    headerHeight: 32
  }), [])

  const defaultColDef = useMemo(() => ({ resizable: true }), [])

  if (pageLoading) return <Spinner />

  return (
    <>
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("USER_MANAGEMENT")}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowDeleted(true)}><icons.UserX className="size-4 mr-1" />{deletedUsers.length}</Button>
          <Button onClick={() => setShowAdd(!showAdd)}>+ {t("USERS.ADD_USER")}</Button>
        </div>
      </div>

      <div className="flex border-b border-border">
        <button onClick={() => setAuthTab("gateway")} className={`px-4 py-2 text-xs font-medium flex items-center gap-1.5 ${authTab === "gateway" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>
          Gateway <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">{users.filter(u => u.auth_mode === "gateway" && !u.is_deleted).length}</span>
        </button>
        <button onClick={() => setAuthTab("local")} className={`px-4 py-2 text-xs font-medium flex items-center gap-1.5 ${authTab === "local" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>
          Local <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">{users.filter(u => u.auth_mode === "local" && !u.is_deleted).length}</span>
        </button>
      </div>

      <div style={{ height: 500, width: "100%" }}>
        <AgGridReact
          theme={gridTheme}
          localeText={i18n.language === "th" ? {
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
          } : undefined}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          components={components}
          pagination={true}
          paginationPageSize={20}
          animateRows={true}
        />
      </div>
    </div>

    {showAdd && <PanelUserAdd onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load() }} />}
    {selectedUser && <PanelUserEdit user={selectedUser} onClose={() => setSelectedUser(null)} onSaved={load} />}
    <ModalDeleteConfirm userId={confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={confirmRemove} />
    <ConfirmDialog open={!!confirmHardDelete || !!deleting} onClose={() => { if (!deleting) { setConfirmHardDelete(null); setShowDeleted(true) } }} onConfirm={confirmHardRemove} title={t("DELETE")} message={!deleting ? t("USERS.CONFIRM_HARD_DELETE") : null} confirmLabel={t("DELETE")} cancelLabel={t("CANCEL")} deleting={deleting} deleteLogs={deleteLogs} deleteSuccess={deleteSuccess} deleteCountdown={deleteCountdown} />

    {showDeleted && (
      <Dialog open onOpenChange={v => !v && setShowDeleted(false)}>
        <DialogContent className="max-w-md max-h-[70vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("USERS.DELETED_USERS")} ({deletedUsers.length})</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto space-y-2">
            {deletedUsers.map(u => (
              <div key={u.key} className="flex items-center gap-3 border rounded-lg px-3 py-2">
                <UserAvatar name={u.display_name_en || u.key} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{i18n.language === "th" ? (u.display_name_th || u.display_name_en || u.key) : (u.display_name_en || u.display_name_th || u.key)}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.key}</p>
                </div>
                <Button size="sm" mode="icon" variant="destructive" onClick={() => { setShowDeleted(false); setConfirmHardDelete(u.key) }}><icons.Trash2 className="size-4" /></Button>
              </div>
            ))}
            {deletedUsers.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">{t("AG_GRID.NO_ROWS")}</p>}
          </div>
        </DialogContent>
      </Dialog>
    )}
    </>
  )
}
