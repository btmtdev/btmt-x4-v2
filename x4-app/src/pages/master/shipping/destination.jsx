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

const CONFIG = {
  service: "destinations",
  idField: "key",
  fields: [
    { key: "key", label: "MASTER.KEY", readOnly: true },
    { key: "name", label: "MASTER.NAME" },
    { key: "customer_key", label: "MASTER.CUSTOMER_KEY", type: "lookup", lookup: "customers", valueKey: "key", displayKey: "key", required: true },
    { key: "country_key", label: "MASTER.COUNTRY_KEY", type: "lookup", lookup: "countries", valueKey: "key", displayKey: "name" },
    { key: "port_key", label: "MASTER.PORT_KEY", type: "lookup", lookup: "ports", valueKey: "key", displayKey: "name" },
    { key: "customer_area", label: "MASTER.CUSTOMER_AREA", hideGrid: true },
    { key: "agech_code", label: "MASTER.AGECH_CODE", hideGrid: true },
  ],
}
const TITLE_KEY = "MASTER.TITLE_DESTINATION"
const theme = themeQuartz.withParams({ fontFamily: ["BridgestoneType", "Google Sans", "sans-serif"], rowHeight: 28, headerHeight: 32, headerFontWeight: "bold", headerFontSize: "0.75rem", fontSize: "0.75rem" })

export default function DestinationPage() {
  const { t, i18n } = useTranslation()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [panel, setPanel] = useState(null)
  const [form, setForm] = useState({})
  const [lookups, setLookups] = useState({})
  const [panelWidth, setPanelWidth] = useState(30)
  const [showDelete, setShowDelete] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const data = await shippingService[CONFIG.service].getAll(true)
    setRows(data || [])
    setLoading(false)
  }

  async function loadLookups() {
    const needed = CONFIG.fields.filter(f => f.type === "lookup").map(f => f.lookup)
    const unique = [...new Set(needed)]
    const results = {}
    await Promise.all(unique.map(async k => { results[k] = await shippingService.lookup[k]() }))
    setLookups(results)
  }

  function openAdd() { setForm({}); setPanel("add"); loadLookups() }
  function openEdit(row) { setForm({ ...row }); setPanel("edit"); loadLookups() }
  function closePanel() { setPanel(null) }

  async function save(e) {
    e.preventDefault()
    const payload = { ...form }
    payload.key = (payload.customer_area || "") + (payload.agech_code || "")
    const id = payload[CONFIG.idField]
    if (panel === "edit") await shippingService[CONFIG.service].update(id, payload)
    else await shippingService[CONFIG.service].create(payload)
    closePanel(); load()
    toast.success(t("MASTER.SAVED"))
  }

  async function handleDelete() {
    const id = form[CONFIG.idField]
    if (!id) return
    await shippingService[CONFIG.service].remove(id)
    closePanel(); load()
  }

  const colDefs = useMemo(() => CONFIG.fields.filter(f => !f.hideGrid).map(f => ({
    field: f.key, headerName: f.label.split(".").pop().replace(/_/g, " ").toUpperCase(), flex: 1, minWidth: 100,
  })), [])

  const defaultColDef = useMemo(() => ({ sortable: true, filter: true, resizable: true }), [])
  const onRowClicked = useCallback(e => openEdit(e.data), [])

  if (loading) return <Spinner />

  return (
    <div className="h-full flex flex-col p-6 gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t(TITLE_KEY)}</h2>
        <Button size="sm" onClick={openAdd}>+ {t("MASTER.ADD")}</Button>
      </div>
      <div className="flex-1 min-h-0 text-sm">
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
                <label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">KEY</label>
                <Input className="text-sm h-9 bg-muted/50" readOnly value={(form.customer_area || "") + (form.agech_code || "")} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">NAME</label>
                <Input className="text-sm h-9" value={form.name ?? ""} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">CUSTOMER</label>
                <select className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background h-9" required value={form.customer_key ?? ""} onChange={e => setForm(p => ({ ...p, customer_key: e.target.value || null }))}>
                  <option value="">-</option>
                  {(lookups.customers || []).map(o => <option key={o.key} value={o.key}>{o.key}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">COUNTRY</label>
                <select className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background h-9" value={form.country_key ?? ""} onChange={e => setForm(p => ({ ...p, country_key: e.target.value || null }))}>
                  <option value="">-</option>
                  {(lookups.countries || []).map(o => <option key={o.key} value={o.key}>{o.key} - {o.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">CUSTOMER AREA</label>
                <Input className="text-sm h-9" value={form.customer_area ?? ""} onChange={e => setForm(p => ({ ...p, customer_area: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">AGECH CODE</label>
                <Input className="text-sm h-9" value={form.agech_code ?? ""} onChange={e => setForm(p => ({ ...p, agech_code: e.target.value }))} />
              </div>
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
