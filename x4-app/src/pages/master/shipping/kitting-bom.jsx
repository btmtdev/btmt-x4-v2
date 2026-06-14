import { useState, useEffect, useMemo, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { AgGridReact } from "ag-grid-react"
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { SlidePanel } from "@/components/slide-panel"
import { shippingService } from "@/services/shipping"
import { toast } from "@/lib/toast"
import { ConfirmDialog } from "@/components/confirm-dialog"

ModuleRegistry.registerModules([AllCommunityModule])

const TITLE_KEY = "MASTER.TITLE_KITTING_BOM"
const theme = themeQuartz.withParams({ fontFamily: ["BridgestoneType", "Google Sans", "sans-serif"], rowHeight: 28, headerHeight: 32, headerFontWeight: "bold", headerfontSize: "0.75rem", fontSize: "0.75rem" })

function groupByKey(items) {
  const map = {}
  for (const r of items) {
    if (!map[r.key]) map[r.key] = { key: r.key, kit_key: r.kit_key, product_key: r.product_key }
    if (r.component_type === "T") { map[r.key].tire = r.component_key }
    if (r.component_type === "C") { map[r.key].tube = r.component_key }
    if (r.component_type === "F") { map[r.key].flap = r.component_key }
  }
  return Object.values(map).map(r => ({ ...r, component_set: (r.tire ? "T" : "") + (r.tube ? "C" : "") + (r.flap ? "F" : "") }))
}

export default function KittingBomPage() {
  const { t, i18n } = useTranslation()
  const [rows, setRows] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [panel, setPanel] = useState(null)
  const [form, setForm] = useState({})
  const [panelWidth, setPanelWidth] = useState(35)
  const [showDelete, setShowDelete] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [data, prods] = await Promise.all([
      shippingService.kittingBoms.getAll(true),
      shippingService.lookup.products(),
    ])
    setProducts(prods || [])
    setRows(groupByKey(data || []))
    setLoading(false)
  }

  function openAdd() { setForm({}); setPanel("add") }
  function openEdit(row) { setForm({ ...row }); setPanel("edit") }
  function closePanel() { setPanel(null) }

  async function save(e) {
    e.preventDefault()
    // TODO: backend needs batch save for BOM
    closePanel(); load()
    toast.success(t("MASTER.SAVED"))
  }

  async function handleDelete() {
    if (!form.key) return
    await shippingService.kittingBoms.remove(form.key)
    closePanel(); load()
  }

  const colDefs = useMemo(() => [
    { field: "key", headerName: "BOM KEY", width: 130 },
    { field: "kit_key", headerName: "SET CODE", width: 100 },
    { field: "component_set", headerName: "SET", width: 80 },
    { field: "tire", headerName: "TIRE", flex: 1 },
    { field: "tube", headerName: "TUBE", flex: 1 },
    { field: "flap", headerName: "FLAP", flex: 1 },
  ], [])

  const defaultColDef = useMemo(() => ({ sortable: true, filter: true, resizable: true }), [])
  const onRowClicked = useCallback(e => openEdit(e.data), [])

  if (loading) return <Spinner />

  return (
    <div className="h-full flex flex-col p-6 gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t(TITLE_KEY)}</h2>
        <Button size="sm" onClick={openAdd}>+ {t("MASTER.ADD")}</Button>
      </div>
      <div className="flex-1 min-h-0 text-xs">
        <AgGridReact
          theme={theme}
          localeText={i18n.language === "th" ? { page: t("AG_GRID.PAGE"), of: t("AG_GRID.OF"), to: t("AG_GRID.TO"), more: t("AG_GRID.MORE"), firstPage: t("AG_GRID.FIRST_PAGE"), previousPage: t("AG_GRID.PREVIOUS_PAGE"), nextPage: t("AG_GRID.NEXT_PAGE"), lastPage: t("AG_GRID.LAST_PAGE"), filterOoo: t("AG_GRID.FILTER"), applyFilter: t("AG_GRID.APPLY"), clearFilter: t("AG_GRID.CLEAR"), resetFilter: t("AG_GRID.RESET"), cancelFilter: t("AG_GRID.CANCEL"), equals: t("AG_GRID.EQUALS"), notEqual: t("AG_GRID.NOT_EQUAL"), lessThan: t("AG_GRID.LESS_THAN"), greaterThan: t("AG_GRID.GREATER_THAN"), contains: t("AG_GRID.CONTAINS"), notContains: t("AG_GRID.NOT_CONTAINS"), startsWith: t("AG_GRID.STARTS_WITH"), endsWith: t("AG_GRID.ENDS_WITH"), blank: t("AG_GRID.BLANK"), notBlank: t("AG_GRID.NOT_BLANK"), andCondition: t("AG_GRID.AND"), orCondition: t("AG_GRID.OR"), noRowsToShow: t("AG_GRID.NO_ROWS"), pageSizeSelectorLabel: t("AG_GRID.PAGE_SIZE") } : undefined}
          rowData={rows}
          columnDefs={colDefs}
          defaultColDef={defaultColDef}
          onRowClicked={onRowClicked}
          rowSelection="single"
          suppressCellFocus
          pagination paginationPageSize={20}
          animateRows
        />
      </div>
      {panel && (
        <SlidePanel width={panelWidth} onClose={closePanel} onResize={setPanelWidth} title={panel === "add" ? t("MASTER.ADD") : t("MASTER.EDIT")}>
          <form onSubmit={save} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">BOM KEY</label>
                <Input className="text-xs h-9 bg-muted/50" readOnly value={(form.tire || "") + (form.kit_key || "")} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">SET CODE</label>
                <Input className="text-xs h-9" required value={form.kit_key ?? ""} onChange={e => setForm(p => ({ ...p, kit_key: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">COMPONENT SET</label>
                <select className="w-full border border-border rounded-md px-3 py-2 text-xs bg-background h-9" required value={form.component_set ?? ""} onChange={e => setForm(p => ({ ...p, component_set: e.target.value }))}>
                  <option value="">-</option>
                  <option value="TCF">TCF</option>
                  <option value="TC">TC</option>
                  <option value="TF">TF</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">TIRE</label>
                <select className="w-full border border-border rounded-md px-3 py-2 text-xs bg-background h-9" value={form.tire ?? ""} onChange={e => setForm(p => ({ ...p, tire: e.target.value || null }))}>
                  <option value="">-</option>
                  {products.filter(p => p.type === "T").map(o => <option key={o.key} value={o.key}>{o.key}</option>)}
                </select>
              </div>
              {(form.component_set === "TCF" || form.component_set === "TC") && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">TUBE</label>
                  <select className="w-full border border-border rounded-md px-3 py-2 text-xs bg-background h-9" value={form.tube ?? ""} onChange={e => setForm(p => ({ ...p, tube: e.target.value || null }))}>
                    <option value="">-</option>
                    {products.filter(p => p.type === "C").map(o => <option key={o.key} value={o.key}>{o.key}</option>)}
                  </select>
                </div>
              )}
              {(form.component_set === "TCF" || form.component_set === "TF") && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">FLAP</label>
                  <select className="w-full border border-border rounded-md px-3 py-2 text-xs bg-background h-9" value={form.flap ?? ""} onChange={e => setForm(p => ({ ...p, flap: e.target.value || null }))}>
                    <option value="">-</option>
                    {products.filter(p => p.type === "F").map(o => <option key={o.key} value={o.key}>{o.key}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="border-t px-5 py-3 flex items-center gap-2">
              {panel === "edit" && <Button type="button" variant="destructive" onClick={() => setShowDelete(true)}>{t("DELETE")}</Button>}
              <div className="flex-1" />
              <Button type="button" variant="outline" onClick={closePanel}>{t("MASTER.CANCEL")}</Button>
              <Button type="submit">{t("MASTER.SAVE")}</Button>
            </div>
          </form>
        <ConfirmDialog open={showDelete} onClose={() => setShowDelete(false)} onConfirm={() => { setShowDelete(false); handleDelete() }} title={t("DELETE")} message={t("MASTER.DELETE_CONFIRM")} confirmLabel={t("DELETE")} cancelLabel={t("MASTER.CANCEL")} />
        </SlidePanel>
      )}
    </div>
  )
}
