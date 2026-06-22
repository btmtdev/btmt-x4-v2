import { getShippingApiUrl } from "@/lib/env"
import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { AgGridReact } from "ag-grid-react"
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { SlidePanel } from "@/components/slide-panel"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { formatInvoiceNumber } from "@/services/shipping"
import InvoiceEditPage from "./invoice-edit"

ModuleRegistry.registerModules([AllCommunityModule])

const theme = themeQuartz.withParams({ fontFamily: ["BridgestoneType", "Google Sans", "sans-serif"], rowHeight: 28, headerHeight: 32, headerFontWeight: "bold", fontSize: "0.75rem" })

const STATUS_COLORS = { draft: "bg-gray-200 text-gray-700", released: "bg-blue-100 text-blue-700", sent_to_wh: "bg-amber-100 text-amber-700", wh_confirmed: "bg-green-100 text-green-700" }

function StatusBadge({ status }) {
  return <span className={`inline-block px-2 py-0.5 rounded text-sm font-semibold uppercase ${STATUS_COLORS[status] || "bg-gray-100"}`}>{status}</span>
}

export default function InvoicesPage() {
  const { t, i18n } = useTranslation()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterMonth, setFilterMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}` })
  const [panel, setPanel] = useState(null)
  const [invoice, setInvoice] = useState(null)
  const [panelWidth, setPanelWidth] = useState(80)
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => { load() }, [filterMonth])

  async function load() {
    setLoading(true)
    const res = await fetch(`${getShippingApiUrl()}/api/invoices?month=${filterMonth}`).then(r => r.json()).then(d => d.data) || []
    setData(res)
    setLoading(false)
  }

  const filtered = useMemo(() => {
    let list = data
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(r => (r.invoice_key || "").toLowerCase().includes(s) || (r.booking_no || "").toLowerCase().includes(s))
    }
    return list
  }, [data, search])

  function openPanel(row) {
    setInvoice(row)
    setPanel("detail")
  }

  async function handleDelete() {
    if (!confirmDelete) return
    await fetch(`${getShippingApiUrl()}/api/invoices/${encodeURIComponent(confirmDelete)}`, { method: "DELETE" })
    setConfirmDelete(null)
    load()
  }

  const colDefs = useMemo(() => [
    { field: "invoice_key", headerName: "INVOICE CODE", minWidth: 120, flex: 1, sort: "desc" },
    { headerName: "INVOICE NO", minWidth: 140, flex: 1.2, valueGetter: p => formatInvoiceNumber(p.data.invoice_key) },
    { field: "status", headerName: "STATUS", minWidth: 80, flex: 0.7, valueFormatter: p => (p.value || "").toUpperCase() },
    { field: "customer_key", headerName: "CUSTOMER", minWidth: 90, flex: 0.8 },
    { field: "etd", headerName: "ETD", minWidth: 100, flex: 0.8 },
    { field: "port_of_destination", headerName: "PORT", minWidth: 70, flex: 0.5 },
    { field: "edi_ship_to", headerName: "PORT NAME", minWidth: 150, flex: 2 },
    { headerName: "", minWidth: 60, maxWidth: 60, cellRenderer: p => p.data.item_count === 0 ? <button className="text-red-500 hover:text-red-700 text-sm font-semibold" onClick={e => { e.stopPropagation(); setConfirmDelete(p.data.invoice_key) }}>Delete</button> : null, sortable: false, filter: false },
  ], [])

  const defaultColDef = useMemo(() => ({ sortable: true, filter: true, resizable: true, suppressHeaderMenuButton: true }), [])
  const locale = useMemo(() => i18n.language === "th" ? { page: t("AG_GRID.PAGE"), of: t("AG_GRID.OF"), to: t("AG_GRID.TO"), more: t("AG_GRID.MORE"), firstPage: t("AG_GRID.FIRST_PAGE"), previousPage: t("AG_GRID.PREVIOUS_PAGE"), nextPage: t("AG_GRID.NEXT_PAGE"), lastPage: t("AG_GRID.LAST_PAGE"), filterOoo: t("AG_GRID.FILTER"), applyFilter: t("AG_GRID.APPLY"), clearFilter: t("AG_GRID.CLEAR"), resetFilter: t("AG_GRID.RESET"), cancelFilter: t("AG_GRID.CANCEL"), equals: t("AG_GRID.EQUALS"), notEqual: t("AG_GRID.NOT_EQUAL"), lessThan: t("AG_GRID.LESS_THAN"), greaterThan: t("AG_GRID.GREATER_THAN"), inRange: t("AG_GRID.IN_RANGE"), before: t("AG_GRID.BEFORE"), after: t("AG_GRID.AFTER"), contains: t("AG_GRID.CONTAINS"), notContains: t("AG_GRID.NOT_CONTAINS"), startsWith: t("AG_GRID.STARTS_WITH"), endsWith: t("AG_GRID.ENDS_WITH"), blank: t("AG_GRID.BLANK"), notBlank: t("AG_GRID.NOT_BLANK"), andCondition: t("AG_GRID.AND"), orCondition: t("AG_GRID.OR"), noRowsToShow: t("AG_GRID.NO_ROWS"), pageSizeSelectorLabel: t("AG_GRID.PAGE_SIZE") } : undefined, [i18n.language])

  if (loading) return <Spinner />

  return (
    <div className="h-full flex flex-col p-6 gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t("DOCFLOW.IV_TITLE")}</h2>
        <div className="flex items-center gap-2 text-sm">
          <select className="h-8 border rounded px-2 bg-background text-sm" value={filterMonth.split("-")[0]} onChange={e => setFilterMonth(e.target.value + "-" + filterMonth.split("-")[1])}>
            {Array.from({length: 5}, (_, i) => 2024 + i).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="h-8 border rounded px-2 bg-background text-sm" value={filterMonth.split("-")[1]} onChange={e => setFilterMonth(filterMonth.split("-")[0] + "-" + e.target.value)}>
            {Array.from({length: 12}, (_, i) => String(i+1).padStart(2,"0")).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <Input className="h-8 w-56 text-sm" placeholder={t("DOCFLOW.IV_SEARCH")} value={search} onChange={e => setSearch(e.target.value)} />
          <Button size="sm" className="text-sm" onClick={() => { setPanel("create"); setInvoice(null) }}>{t("DOCFLOW.IV_CREATE")}</Button>
        </div>
      </div>
      <div className="flex-1 min-h-0 text-sm">
        <AgGridReact theme={theme} rowData={filtered} columnDefs={colDefs} defaultColDef={defaultColDef} localeText={locale} suppressCellFocus suppressColumnVirtualisation rowSelection="single" pagination paginationPageSize={50} animateRows={false} onRowDoubleClicked={e => openPanel(e.data)} />
      </div>

      {panel === "create" && (
        <SlidePanel width={35} onClose={() => setPanel(null)} maxWidth={50} title={t("DOCFLOW.IV_CREATE")}>
          <InvoiceEditPage onClose={() => { setPanel(null); load() }} />
        </SlidePanel>
      )}

      {panel === "detail" && invoice && (
        <SlidePanel width={panelWidth} onClose={() => setPanel(null)} onResize={setPanelWidth} maxWidth={90} title={invoice.invoice_key}>
          <InvoiceEditPage invoiceKey={invoice.invoice_key} onClose={() => { setPanel(null); load() }} />
        </SlidePanel>
      )}

      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete} title="Delete Invoice" message={`Delete empty invoice ${confirmDelete}?`} confirmLabel="Delete" cancelLabel="Cancel" />
    </div>
  )
}
