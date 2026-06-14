import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import * as icons from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { adminService } from "@/services/admin"

export default function PermissionManagement() {
  const { t, i18n } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [permissions, setPermissions] = useState([])
  const [flat, setFlat] = useState([])
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [reparent, setReparent] = useState(null)
  const [newParent, setNewParent] = useState("")
  const [parentOptions, setParentOptions] = useState([])
  const nameKey = i18n.language === "th" ? "name_th" : "name_en"

  useEffect(() => { load() }, [])

  async function load() {
    const tree = await adminService.getPermissions()
    setPermissions(tree)
    setFlat(flattenTree(tree))
    setLoading(false)
  }

  function flattenTree(tree, out = []) {
    for (const p of tree) { out.push(p); if (p.children) flattenTree(p.children, out) }
    return out
  }

  async function remove() {
    await adminService.deletePermission(confirmDelete)
    setConfirmDelete(null)
    load()
  }

  async function startReparent(node) {
    setReparent(node)
    setNewParent(node.parent_id || "")
    const list = await adminService.getPermissionsFlat(2)
    setParentOptions(list.filter(p => !p.is_default && p.id !== node.id))
  }

  async function saveReparent() {
    const parentItem = parentOptions.find(p => p.id === Number(newParent))
    const level = newParent ? (parentItem?.level || 0) + 1 : 1
    await adminService.updatePermission(reparent.id, { name_th: reparent.name_th, name_en: reparent.name_en, path: reparent.path, parent_id: newParent ? Number(newParent) : null, level, have_divider: reparent.have_divider || false, sort_order: reparent.sort_order || 10, icon: reparent.icon })
    setReparent(null)
    load()
  }

  async function move(perm, direction) {
    const siblings = flat.filter(p => p.parent_id === perm.parent_id).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    const idx = siblings.findIndex(s => s.id === perm.id)
    const swapIdx = idx + direction
    if (swapIdx < 0 || swapIdx >= siblings.length) return
    const temp = siblings[idx]
    siblings[idx] = siblings[swapIdx]
    siblings[swapIdx] = temp
    const items = siblings.map((s, i) => ({ id: s.id, sort_order: (i + 1) * 10 }))
    await adminService.reorderPermissions(items)
    load()
  }

  if (loading) return <Spinner />

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("ROLES.PERMISSIONS")}</h2>
      </div>
      <div className="border rounded-lg divide-y overflow-auto">
        {permissions.filter(p => !p.is_default).map((p1, i, arr) => (
          <PermNode key={p1.id} node={p1} nameKey={nameKey} depth={0} onDelete={setConfirmDelete} onMove={move} onReparent={startReparent} isFirst={i === 0} isLast={i === arr.length - 1} />
        ))}
      </div>

      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={remove} title={t("DELETE")} message={t("ROLES.CONFIRM_DELETE")} confirmLabel={t("DELETE")} cancelLabel={t("CANCEL")} />

      {reparent && (
        <Dialog open onOpenChange={v => !v && setReparent(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{t("PERMISSIONS.MOVE")}: {reparent[nameKey]}</DialogTitle>
            </DialogHeader>
            <div>
              <label className="text-xs font-medium">{t("PERMISSIONS.NEW_PARENT")}</label>
              <select className="mt-1 w-full h-9 rounded border text-xs px-2" value={newParent} onChange={e => setNewParent(e.target.value)}>
                <option value="">— {t("PERMISSIONS.ROOT")} —</option>
                {parentOptions.filter(p => p.level === 1).map(p1 => [
                  <option key={p1.id} value={p1.id}>{p1[nameKey]}</option>,
                  ...parentOptions.filter(p2 => p2.parent_id === p1.id).map(p2 => (
                    <option key={p2.id} value={p2.id}>{"\u00A0\u00A0\u00A0\u00A0"}{p2[nameKey]}</option>
                  ))
                ])}
              </select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReparent(null)}>{t("CANCEL")}</Button>
              <Button onClick={saveReparent}>{t("SAVE")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function PermNode({ node, nameKey, depth, onDelete, onMove, onReparent, isFirst, isLast }) {
  const [open, setOpen] = useState(depth === 0)
  const hasChildren = node.children?.filter(c => !c.is_default).length > 0

  return (
    <>
      <div className="flex items-center py-1 px-3 hover:bg-muted/30 group">
        <div className="flex items-center gap-2 w-[400px] shrink-0" style={{ paddingLeft: depth * 24 }}>
          {hasChildren ? (
            <button onClick={() => setOpen(!open)} className="size-5 flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0">
              {open ? <icons.ChevronDown className="size-4" /> : <icons.ChevronRight className="size-4" />}
            </button>
          ) : <span className="size-5 shrink-0" />}
          <span className="text-xs font-medium truncate">{node[nameKey]}</span>
        </div>
        <span className="text-xs text-muted-foreground flex-1 truncate">{node.path || ""}</span>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => onMove(node, -1)} disabled={isFirst} className="size-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed"><icons.ArrowUp className="size-3.5" /></button>
          <button onClick={() => onMove(node, 1)} disabled={isLast} className="size-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed"><icons.ArrowDown className="size-3.5" /></button>
          <button onClick={() => onReparent(node)} className="size-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground"><icons.FolderInput className="size-3.5" /></button>
          <button onClick={() => onDelete(node.id)} className="size-6 flex items-center justify-center rounded hover:bg-muted text-red-500"><icons.Trash2 className="size-3.5" /></button>
        </div>
      </div>
      {hasChildren && open && node.children.filter(c => !c.is_default).map((c, i, arr) => (
        <PermNode key={c.id} node={c} nameKey={nameKey} depth={depth + 1} onDelete={onDelete} onMove={onMove} onReparent={onReparent} isFirst={i === 0} isLast={i === arr.length - 1} />
      ))}
    </>
  )
}
