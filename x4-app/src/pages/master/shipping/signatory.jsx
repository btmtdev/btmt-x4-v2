import { getApiUrl } from "@/lib/env"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
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
  service: "signatories",
  idField: "id",
  fields: [
    { key: "company_key", label: "MASTER.COMPANY_KEY", type: "lookup", lookup: "companies", valueKey: "key", displayKey: "name", hideGrid: true },
    { key: "name", label: "MASTER.NAME", required: true },
    { key: "position", label: "MASTER.POSITION" },
    { key: "effective_from", label: "MASTER.EFFECTIVE_FROM", type: "date" },
    { key: "signature_url", label: "MASTER.SIGNATURE_URL", type: "file", hideGrid: true },
    { key: "stamp_url", label: "MASTER.STAMP_URL", type: "file", hideGrid: true },
  ],
}
const TITLE_KEY = "MASTER.TITLE_SIGNATORY"
const theme = themeQuartz.withParams({ fontFamily: ["BridgestoneType", "Google Sans", "sans-serif"], rowHeight: 28, headerHeight: 32, headerFontWeight: "bold", headerfontSize: "0.75rem", fontSize: "0.75rem" })

export default function SignatoryPage() {
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

  function openAdd() {
    setForm({ effective_from: new Date().toISOString().slice(0, 10) })
    setPanel("add"); loadLookups()
  }
  function openEdit(row) { setForm({ ...row }); setPanel("edit"); loadLookups() }
  function closePanel() { setPanel(null) }

  async function save(e) {
    e.preventDefault()
    const payload = { ...form }
    const id = payload[CONFIG.idField]
    if (id) await shippingService[CONFIG.service].update(id, payload)
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
  })), [t])

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
          localeText={i18n.language === "th" ? { page: t("AG_GRID.PAGE"), of: t("AG_GRID.OF"), to: t("AG_GRID.TO"), more: t("AG_GRID.MORE"), firstPage: t("AG_GRID.FIRST_PAGE"), previousPage: t("AG_GRID.PREVIOUS_PAGE"), nextPage: t("AG_GRID.NEXT_PAGE"), lastPage: t("AG_GRID.LAST_PAGE"), filterOoo: t("AG_GRID.FILTER"), applyFilter: t("AG_GRID.APPLY"), clearFilter: t("AG_GRID.CLEAR"), resetFilter: t("AG_GRID.RESET"), cancelFilter: t("AG_GRID.CANCEL"), equals: t("AG_GRID.EQUALS"), notEqual: t("AG_GRID.NOT_EQUAL"), lessThan: t("AG_GRID.LESS_THAN"), lessThanOrEqual: t("AG_GRID.LESS_THAN_OR_EQUAL"), greaterThan: t("AG_GRID.GREATER_THAN"), greaterThanOrEqual: t("AG_GRID.GREATER_THAN_OR_EQUAL"), inRange: t("AG_GRID.IN_RANGE"), before: t("AG_GRID.BEFORE"), after: t("AG_GRID.AFTER"), contains: t("AG_GRID.CONTAINS"), notContains: t("AG_GRID.NOT_CONTAINS"), startsWith: t("AG_GRID.STARTS_WITH"), endsWith: t("AG_GRID.ENDS_WITH"), blank: t("AG_GRID.BLANK"), notBlank: t("AG_GRID.NOT_BLANK"), andCondition: t("AG_GRID.AND"), orCondition: t("AG_GRID.OR"), noRowsToShow: t("AG_GRID.NO_ROWS"), pageSizeSelectorLabel: t("AG_GRID.PAGE_SIZE") } : undefined}
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
              {CONFIG.fields.map(f => (
                <div key={f.key} className="space-y-1">
                  <label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{f.label.split(".").pop().replace(/_/g, " ").toUpperCase()}</label>
                  {f.type === "select" ? (
                    <select className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background h-9" value={form[f.key] ?? ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}>
                      <option value="">-</option>
                      {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : f.type === "lookup" ? (
                    <select className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background h-9" value={form[f.key] ?? ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value === "" ? null : isNaN(e.target.value) ? e.target.value : Number(e.target.value) }))}>
                      <option value="">-</option>
                      {(lookups[f.lookup] || []).map(o => <option key={o[f.valueKey]} value={o[f.valueKey]}>{o[f.valueKey]} - {o[f.displayKey]}</option>)}
                    </select>
                  ) : f.type === "file" ? (
                    <div className="space-y-2">
                      <label className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-border rounded-md p-4 cursor-pointer hover:bg-muted/30 hover:border-primary/50 transition-colors">
                        {form[f.key] ? (
                          <img src={form[f.key]} alt="" className="max-h-24" />
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-8 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                            <span className="text-sm text-muted-foreground">{t("MASTER.UPLOAD_DESC")}</span>
                          </>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={async e => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const fd = new FormData()
                          fd.append("file", file)
                          fd.append("prefix", "x4-signatures")
                          const res = await fetch(`${getApiUrl()}/api/upload`, { method: "POST", body: fd })
                          const data = await res.json()
                          const url = data.url || data.data?.url
                          if (url) setForm(p => ({ ...p, [f.key]: url }))
                          e.target.value = ""
                        }} />
                      </label>
                      {form[f.key] && <button type="button" onClick={() => setForm(p => ({ ...p, [f.key]: null }))} className="text-sm text-destructive hover:underline">{t("MASTER.REMOVE")}</button>}
                    </div>
                  ) : (
                    <Input className="text-sm h-9" type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"} step="any" required={f.required} value={form[f.key] ?? ""} onChange={e => setForm(p => ({ ...p, [f.key]: f.type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value }))} />
                  )}
                </div>
              ))}
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
