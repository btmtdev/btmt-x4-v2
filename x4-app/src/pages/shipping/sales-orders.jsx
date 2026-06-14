import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { AgGridReact } from "ag-grid-react"
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { SlidePanel } from "@/components/slide-panel"
import { shippingService, formatInvoiceNumber } from "@/services/shipping"
import { toast } from "@/lib/toast"

ModuleRegistry.registerModules([AllCommunityModule])

const theme = themeQuartz.withParams({ fontFamily: ["BridgestoneType", "Google Sans", "sans-serif"], rowHeight: 28, headerHeight: 32, headerFontWeight: "bold", fontSize: "0.75rem" })

export default function SalesOrderPage() {
  const { t, i18n } = useTranslation()
  const [allData, setAllData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterPeriod, setFilterPeriod] = useState("")
  const [filterStatus, setFilterStatus] = useState("open")
  const [panel, setPanel] = useState(null)
  const [form, setForm] = useState({})
  const [revisions, setRevisions] = useState([])
  const [panelWidth, setPanelWidth] = useState(80)
  const [importModal, setImportModal] = useState(false)
  const [importData, setImportData] = useState([])
  const [importExclude, setImportExclude] = useState(new Set())
  const [importing, setImporting] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setAllData(await shippingService.salesOrders.getAll() || [])
    setLoading(false)
  }

  const periods = useMemo(() => [...new Set(allData.map(r => r.production_period).filter(Boolean))].sort().reverse(), [allData])

  const filtered = useMemo(() => {
    let list = allData
    if (filterPeriod) list = list.filter(r => r.production_period === filterPeriod)
    if (filterStatus === "open") list = list.filter(r => (r.qty_confirmed || 0) - (r.qty_invoiced || 0) > 0)
    if (filterStatus === "closed") list = list.filter(r => (r.qty_confirmed || 0) - (r.qty_invoiced || 0) === 0)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(r => (r.so_key || "").toLowerCase().includes(s) || (r.destination_key || "").toLowerCase().includes(s) || (r.product_key || "").toLowerCase().includes(s) || (r.kit_key || "").toLowerCase().includes(s))
    }
    return list
  }, [allData, search, filterPeriod, filterStatus])

  const [panelTab, setPanelTab] = useState("detail")
  const [soInvoices, setSoInvoices] = useState([])

  async function openPanel(row) {
    setForm({ ...row })
    setPanel("edit")
    setPanelTab("detail")
    const res = await shippingService.salesOrders.get(row.so_key, row.so_line)
    setRevisions(res?.revisions || [])
    // Load invoices containing this SO
    const invRes = await fetch(`${import.meta.env.VITE_SHIPPING_API_URL ?? "http://localhost:4001"}/api/invoices?so_key=${encodeURIComponent(row.so_key)}&so_line=${encodeURIComponent(row.so_line)}`).then(r => r.json()).then(d => d.data).catch(() => [])
    setSoInvoices(invRes || [])
  }

  async function saveForm() {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    await shippingService.salesOrders.update(form.so_key, form.so_line, {
      qty_confirmed: form.qty_confirmed,
      production_period: form.production_period,
      stock_type: form.stock_type,
      req1: form.req1,
      req2: form.req2,
      remark: form.remark,
      changed_by: user.username || user.display_name || "",
    })
    toast.success(t("SO.SAVED"))
    const fresh = await shippingService.salesOrders.getAll() || []
    setAllData(fresh)
    const res = await shippingService.salesOrders.get(form.so_key, form.so_line)
    setRevisions(res?.revisions || [])
    if (res?.order) setForm(res.order)
  }

  function closePanel() { setPanel(null); setRevisions([]) }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const lines = ev.target.result.split(/\r?\n/).filter(l => l.trim())
      const parsed = lines.map(line => {
        const cols = line.split("\t").map(c => c.trim())
        const soKey = cols[0]
        const soLine = cols[1]
        const existing = allData.find(r => r.so_key === soKey && r.so_line === soLine)
        return {
          so_key: soKey, so_line: soLine, product_key: cols[2], kit_key: cols[3], qty: Number(cols[4]),
          so_date: cols[5] ? `${cols[5].slice(0,4)}-${cols[5].slice(4,6)}-${cols[5].slice(6,8)}` : null,
          country_name: cols[6], to_city: cols[7], currency: cols[8], production_period: cols[9],
          customer_area: cols[10], agech_code: cols[11],
          so_process_date: cols[12] ? `${cols[12].slice(0,4)}-${cols[12].slice(4,6)}-${cols[12].slice(6,8)}` : null,
          so_type: cols[13], stock_type: cols[14], req1: cols[15], req2: cols[16],
          destination_key: (cols[10] || "") + (cols[11] || ""),
          old_qty: existing?.qty_confirmed ?? null,
          is_new: !existing,
        }
      })
      setImportData(parsed)
      setImportExclude(new Set())
      setImportModal(true)
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  async function confirmImport() {
    setImporting(true)
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    const items = importData.filter((_, i) => !importExclude.has(i)).map(r => ({
      so_key: r.so_key, so_line: r.so_line, product_key: r.product_key, kit_key: r.kit_key, qty: r.qty,
      so_date: r.so_date, country_name: r.country_name, to_city: r.to_city, currency: r.currency,
      production_period: r.production_period, customer_area: r.customer_area, agech_code: r.agech_code,
      so_type: r.so_type, stock_type: r.stock_type, req1: r.req1, req2: r.req2, destination_key: r.destination_key,
    }))
    await shippingService.salesOrders.import({ items, changed_by: user.username || user.display_name || "" })
    setImporting(false)
    setImportModal(false)
    toast.success(t("SO.IMPORT_SUCCESS"))
    load()
  }

  const colDefs = useMemo(() => [
    { field: "so_key", headerName: "SO NO", flex: 1.2 },
    { field: "so_line", headerName: "LINE", flex: 0.5 },
    { field: "so_type", headerName: "TYPE", flex: 0.5 },
    { field: "destination_key", headerName: "DESTINATION", flex: 1 },
    { field: "product_key", headerName: "PRODUCT", flex: 1.2 },
    { field: "kit_key", headerName: "SET CODE", flex: 0.5 },
    { field: "production_period", headerName: "PERIOD", flex: 0.8 },
    { field: "qty_confirmed", headerName: "CONFIRM", flex: 0.7, type: "rightAligned" },
    { headerName: "REMAIN", flex: 0.7, type: "rightAligned", valueGetter: p => (p.data.qty_confirmed || 0) - (p.data.qty_invoiced || 0) },
  ], [])

  const defaultColDef = useMemo(() => ({ sortable: true, filter: true, resizable: true, suppressHeaderMenuButton: true }), [])
  const autoSize = useMemo(() => ({ type: "fitGridWidth" }), [])
  const locale = useMemo(() => i18n.language === "th" ? { page: t("AG_GRID.PAGE"), of: t("AG_GRID.OF"), to: t("AG_GRID.TO"), more: t("AG_GRID.MORE"), firstPage: t("AG_GRID.FIRST_PAGE"), previousPage: t("AG_GRID.PREVIOUS_PAGE"), nextPage: t("AG_GRID.NEXT_PAGE"), lastPage: t("AG_GRID.LAST_PAGE"), filterOoo: t("AG_GRID.FILTER"), applyFilter: t("AG_GRID.APPLY"), clearFilter: t("AG_GRID.CLEAR"), resetFilter: t("AG_GRID.RESET"), cancelFilter: t("AG_GRID.CANCEL"), equals: t("AG_GRID.EQUALS"), notEqual: t("AG_GRID.NOT_EQUAL"), lessThan: t("AG_GRID.LESS_THAN"), greaterThan: t("AG_GRID.GREATER_THAN"), contains: t("AG_GRID.CONTAINS"), notContains: t("AG_GRID.NOT_CONTAINS"), startsWith: t("AG_GRID.STARTS_WITH"), endsWith: t("AG_GRID.ENDS_WITH"), blank: t("AG_GRID.BLANK"), notBlank: t("AG_GRID.NOT_BLANK"), andCondition: t("AG_GRID.AND"), orCondition: t("AG_GRID.OR"), noRowsToShow: t("AG_GRID.NO_ROWS"), pageSizeSelectorLabel: t("AG_GRID.PAGE_SIZE") } : undefined, [i18n.language])

  if (loading) return <Spinner />

  return (
    <div className="h-full flex flex-col p-6 gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t("SO.TITLE")}</h2>
        <div className="flex items-center gap-2 text-xs">
          <select className="h-8 border rounded px-2 bg-background text-xs" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="open">{t("SO.OPEN")}</option>
            <option value="closed">{t("SO.CLOSED")}</option>
            <option value="all">{t("ALL")}</option>
          </select>
          <select className="h-8 border rounded px-2 bg-background text-xs" value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}>
            <option value="">{t("SO.ALL_PERIODS")}</option>
            {periods.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <Input className="h-8 w-56 text-xs" placeholder={t("SO.SEARCH_PLACEHOLDER")} value={search} onChange={e => setSearch(e.target.value)} />
          <Button size="sm" className="text-xs" onClick={() => document.getElementById("so-file-input").click()}>{t("SO.IMPORT")}</Button>
          <input id="so-file-input" type="file" accept=".txt,.csv" className="hidden" onChange={handleFileSelect} />
        </div>
      </div>
      <div className="flex-1 min-h-0 text-xs">
        <AgGridReact theme={theme} rowData={filtered} columnDefs={colDefs} defaultColDef={defaultColDef} autoSizeStrategy={autoSize} localeText={locale} suppressCellFocus rowSelection="single" pagination paginationPageSize={100} animateRows={false} onRowDoubleClicked={e => openPanel(e.data)} getRowStyle={p => ((p.data.qty_confirmed || 0) - (p.data.qty_invoiced || 0)) === 0 ? { background: "#f0f0f0", opacity: 0.5 } : undefined} />
      </div>

      {panel && (
        <SlidePanel width={panelWidth} onClose={closePanel} onResize={setPanelWidth} maxWidth={90} title={`${form.so_key} / ${form.so_line}`}>
          <div className="flex-1 overflow-y-auto">
            {/* Tabs */}
            <div className="flex border-b">
              <button onClick={() => setPanelTab("detail")} className={`px-4 py-2 text-xs font-medium border-b-2 ${panelTab === "detail" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>{t("SO.TAB_DETAIL")}</button>
              <button onClick={() => setPanelTab("invoices")} className={`px-4 py-2 text-xs font-medium border-b-2 ${panelTab === "invoices" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>{t("SO.TAB_INVOICES")} ({soInvoices.length})</button>
            </div>

            {panelTab === "detail" && (<>
            {/* Revision Table */}
            <div className="overflow-x-auto border-b p-4">
              <h4 className="text-xs font-semibold mb-2">{t("SO.HISTORY")}</h4>
              {revisions.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">{t("SO.NO_REVISIONS")}</p>
              ) : (
                <table className="w-full text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-1.5 pr-2">REV</th>
                      <th className="py-1.5 pr-2">DATE</th>
                      <th className="py-1.5 pr-2">PRODUCT</th>
                      <th className="py-1.5 pr-2">SET CODE</th>
                      <th className="py-1.5 pr-2 text-right">QTY</th>
                      <th className="py-1.5 pr-2">TO CITY</th>
                      <th className="py-1.5 pr-2">PERIOD</th>
                      <th className="py-1.5 pr-2">CUST AREA</th>
                      <th className="py-1.5 pr-2">AGECH</th>
                      <th className="py-1.5 pr-2">TYPE</th>
                      <th className="py-1.5 pr-2">STOCK</th>
                      <th className="py-1.5 pr-2">REQ1</th>
                      <th className="py-1.5">REQ2</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revisions.map((r, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-1.5 pr-2">{r.revision}</td>
                        <td className="py-1.5 pr-2">{r.revision_date?.slice(0, 10)}</td>
                        <td className="py-1.5 pr-2">{r.product_key}</td>
                        <td className="py-1.5 pr-2">{r.kit_key}</td>
                        <td className="py-1.5 pr-2 text-right">{r.qty}</td>
                        <td className="py-1.5 pr-2">{r.to_city}</td>
                        <td className="py-1.5 pr-2">{r.production_period}</td>
                        <td className="py-1.5 pr-2">{r.customer_area}</td>
                        <td className="py-1.5 pr-2">{r.agech_code}</td>
                        <td className="py-1.5 pr-2">{r.so_type}</td>
                        <td className="py-1.5 pr-2">{r.stock_type}</td>
                        <td className="py-1.5 pr-2">{r.req1}</td>
                        <td className="py-1.5">{r.req2}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Edit Fields */}
            <div className="p-5 space-y-3">
              <h4 className="text-xs font-semibold">{t("MASTER.EDIT")}</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 col-span-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">QTY CONFIRMED</label>
                  <Input className="text-xs h-9" type="number" value={form.qty_confirmed ?? 0} onChange={e => setForm(p => ({ ...p, qty_confirmed: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">PRODUCTION PERIOD</label>
                  <Input className="text-xs h-9" value={form.production_period ?? ""} onChange={e => setForm(p => ({ ...p, production_period: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">STOCK TYPE</label>
                  <Input className="text-xs h-9" value={form.stock_type ?? ""} onChange={e => setForm(p => ({ ...p, stock_type: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">REQ1</label>
                  <Input className="text-xs h-9" value={form.req1 ?? ""} onChange={e => setForm(p => ({ ...p, req1: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">REQ2</label>
                  <Input className="text-xs h-9" value={form.req2 ?? ""} onChange={e => setForm(p => ({ ...p, req2: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">REMARK</label>
                <Input className="text-xs h-9" value={form.remark ?? ""} onChange={e => setForm(p => ({ ...p, remark: e.target.value }))} />
              </div>
            </div>
            </>)}

            {panelTab === "invoices" && (
              <div className="p-4">
                {soInvoices.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t("SO.NO_INVOICES")}</p>
                ) : (
                  <table className="w-full text-xs border rounded">
                    <thead><tr className="border-b bg-muted/30 text-muted-foreground">
                      <th className="p-2 text-left">CODE</th>
                      <th className="p-2 text-left">INVOICE NO</th>
                      <th className="p-2 text-left">PRODUCT</th>
                      <th className="p-2 text-left">SET</th>
                      <th className="p-2 text-left">DEST</th>
                      <th className="p-2 text-left">DEST NAME</th>
                      <th className="p-2 text-left">PORT</th>
                      <th className="p-2 text-right">QTY</th>
                    </tr></thead>
                    <tbody>
                      {soInvoices.map((inv, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-2">{inv.invoice_key}</td>
                          <td className="p-2 font-medium">{formatInvoiceNumber(inv.invoice_key)}</td>
                          <td className="p-2">{inv.product_key}</td>
                          <td className="p-2">{inv.kit_key}</td>
                          <td className="p-2">{inv.destination_key}</td>
                          <td className="p-2">{inv.destination_name}</td>
                          <td className="p-2">{inv.port_of_destination}</td>
                          <td className="p-2 text-right">{inv.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
          <div className="border-t px-5 py-3 flex justify-end gap-2">
            <Button variant="outline" onClick={closePanel}>{t("MASTER.CANCEL")}</Button>
            <Button onClick={saveForm}>{t("MASTER.SAVE")}</Button>
          </div>
        </SlidePanel>
      )}

      {/* Import Modal */}
      {importModal && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setImportModal(false)} />
          <div className="fixed inset-4 z-[65] bg-background rounded-lg border shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold">{t("SO.IMPORT")} ({importData.length - importExclude.size} / {importData.length})</h3>
              <button onClick={() => setImportModal(false)} className="text-muted-foreground hover:text-foreground text-lg">&times;</button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <table className="w-full text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-1.5 pr-2"></th>
                    <th className="py-1.5 pr-2">STATUS</th>
                    <th className="py-1.5 pr-2">SO NO</th>
                    <th className="py-1.5 pr-2">LINE</th>
                    <th className="py-1.5 pr-2">PRODUCT</th>
                    <th className="py-1.5 pr-2">SET</th>
                    <th className="py-1.5 pr-2 text-right">OLD QTY</th>
                    <th className="py-1.5 pr-2 text-right">NEW QTY</th>
                    <th className="py-1.5 pr-2 text-right">DIFF</th>
                    <th className="py-1.5 pr-2">PERIOD</th>
                    <th className="py-1.5 pr-2">DEST</th>
                    <th className="py-1.5 pr-2">TYPE</th>
                    <th className="py-1.5 pr-2">STOCK</th>
                    <th className="py-1.5 pr-2">REQ1</th>
                    <th className="py-1.5">REQ2</th>
                  </tr>
                </thead>
                <tbody>
                  {importData.map((r, i) => (
                    <tr key={i} className={`border-b border-border/50 ${importExclude.has(i) ? "opacity-30" : r.is_new ? "bg-green-50" : r.old_qty !== r.qty ? "bg-amber-50" : ""}`}>
                      <td className="py-1.5 pr-2"><button onClick={() => setImportExclude(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s })} className="text-muted-foreground hover:text-destructive">{importExclude.has(i) ? "↩" : "✕"}</button></td>
                      <td className="py-1.5 pr-2">{r.is_new ? <span className="text-green-600 font-medium">NEW</span> : r.old_qty !== r.qty ? <span className="text-amber-600 font-medium">CHANGED</span> : <span className="text-muted-foreground">—</span>}</td>
                      <td className="py-1.5 pr-2">{r.so_key}</td>
                      <td className="py-1.5 pr-2">{r.so_line}</td>
                      <td className="py-1.5 pr-2">{r.product_key}</td>
                      <td className="py-1.5 pr-2">{r.kit_key}</td>
                      <td className="py-1.5 pr-2 text-right">{r.old_qty ?? "—"}</td>
                      <td className="py-1.5 pr-2 text-right font-medium">{r.qty}</td>
                      <td className="py-1.5 pr-2 text-right">{r.old_qty != null ? r.qty - r.old_qty : "—"}</td>
                      <td className="py-1.5 pr-2">{r.production_period}</td>
                      <td className="py-1.5 pr-2">{r.destination_key}</td>
                      <td className="py-1.5 pr-2">{r.so_type}</td>
                      <td className="py-1.5 pr-2">{r.stock_type}</td>
                      <td className="py-1.5 pr-2">{r.req1}</td>
                      <td className="py-1.5">{r.req2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t px-6 py-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setImportModal(false)}>{t("MASTER.CANCEL")}</Button>
              <Button onClick={confirmImport} disabled={importing}>{importing ? "..." : t("SO.IMPORT")}</Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
