import { getQualityApiUrl, getWarehouseApiUrl, getTsgShipmentApiUrl } from "@/lib/env"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Search, Trash2, ShoppingCart, Send } from "lucide-react"

const STATUS_COLORS = { Pending: "bg-amber-100 text-amber-700", Approved: "bg-green-100 text-green-700", Rejected: "bg-red-100 text-red-700" }

export default function BlacklistPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [detail, setDetail] = useState(null)

  useEffect(() => { loadRequests() }, [])

  async function loadRequests() {
    setLoading(true)
    const res = await fetch(`${getQualityApiUrl()}/api/blacklist`).then(r => r.json()).catch(() => [])
    setRequests(Array.isArray(res) ? res : [])
    setLoading(false)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Blacklist Request</h1>
        <Button onClick={() => setShowCreate(true)}>+ New Request</Button>
      </div>

      {loading ? <Spinner /> : (
        <table className="w-full text-sm border rounded">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">Request No</th>
              <th className="p-2 text-left">Requested By</th>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Reason</th>
              <th className="p-2 text-center">Items</th>
              <th className="p-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id} className="border-t hover:bg-muted/50 cursor-pointer" onClick={() => setDetail(r)}>
                <td className="p-2 font-mono text-xs">{r.request_no}</td>
                <td className="p-2">{r.requested_by}</td>
                <td className="p-2 text-xs">{new Date(r.requested_date).toLocaleDateString()}</td>
                <td className="p-2 text-xs">{r.reason}</td>
                <td className="p-2 text-center">{r.items?.length || 0}</td>
                <td className="p-2"><Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge></td>
              </tr>
            ))}
            {requests.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No requests yet</td></tr>}
          </tbody>
        </table>
      )}

      {showCreate && <CreateRequestDialog onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadRequests() }} />}
      {detail && <DetailDialog request={detail} onClose={() => setDetail(null)} onUpdated={() => { setDetail(null); loadRequests() }} />}
    </div>
  )
}

function CreateRequestDialog({ onClose, onCreated }) {
  const [reason, setReason] = useState("")
  const [requestedBy] = useState(() => { const u = JSON.parse(localStorage.getItem("user") || "{}"); return u.display_name_en || u.ad_username || "" })
  const [items, setItems] = useState([])
  const [searchMode, setSearchMode] = useState("inventory")
  const [searchBarcode, setSearchBarcode] = useState("")
  const [searchProduct, setSearchProduct] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [products, setProducts] = useState([])
  const [productFilter, setProductFilter] = useState("")
  const [showProductList, setShowProductList] = useState(false)

  useEffect(() => {
    fetch(`${getQualityApiUrl()}/api/blacklist/products`).then(r => r.json()).then(setProducts).catch(() => {})
  }, [])

  async function searchInventory() {
    setSearching(true)
    const params = new URLSearchParams()
    if (searchProduct) params.set("product", searchProduct)
    if (dateFrom) params.set("date_from", dateFrom)
    if (dateTo) params.set("date_to", dateTo)
    if (searchBarcode) params.set("tag_no", searchBarcode)
    const res = await fetch(`${getQualityApiUrl()}/api/blacklist/inventory-search?${params}`).then(r => r.json()).catch(() => [])
    const list = Array.isArray(res) ? res : []
    setSearchResults(list)
    setSearching(false)
  }

  async function searchBarcodeTsg() {
    setSearching(true)
    const params = new URLSearchParams()
    if (searchBarcode) params.set("barcode", searchBarcode)
    if (searchProduct) params.set("product", searchProduct)
    if (dateFrom) params.set("date_from", dateFrom)
    if (dateTo) params.set("date_to", dateTo)
    const res = await fetch(`${getTsgShipmentApiUrl()}/api/shipment/search?${params}`).then(r => r.json()).catch(() => [])
    const list = Array.isArray(res) ? res : []
    setSearchResults(list)
    setSearching(false)
  }

  function handleSearch() {
    if (searchMode === "inventory") {
      if (!searchProduct && !dateFrom && !dateTo && !searchBarcode) return
      searchInventory()
    } else {
      if (!searchBarcode && !searchProduct && !dateFrom) return
      searchBarcodeTsg()
    }
  }

  function clearSearch() { setSearchBarcode(""); setSearchProduct(""); setDateFrom(""); setDateTo(""); setSearchResults([]) }
  function addItem(item) { if (!items.find(i => i.barcode === item.barcode)) setItems([...items, item]) }
  function removeItem(barcode) { setItems(items.filter(i => i.barcode !== barcode)) }
  function toggleItem(item, checked) { checked ? addItem(item) : removeItem(item.barcode) }

  async function submit() {
    if (!requestedBy || !reason || items.length === 0) return
    setSubmitting(true)
    await fetch(`${getQualityApiUrl()}/api/blacklist`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requested_by: requestedBy, reason, items })
    })
    setSubmitting(false)
    onCreated()
  }

  function normalizeRow(r) {
    const bc = (r.barcode || r.BARCODE || "").trim()
    return { barcode: bc, product_code: r.product_code || bc.substring(0, 4), product_name: r.pattern || r.bstl_code || "", qty: r.qty || 1, received_date: r.received_date || r.AGENT_DATE, location: r.zone ? `${r.zone}-${r.location}` : r.MACHINENO ? `M${r.MACHINENO}` : "", is_hold: r.is_hold }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[1100px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader><DialogTitle>New Blacklist Request</DialogTitle></DialogHeader>

        {/* Request Info */}
        <div className="grid grid-cols-2 gap-3 px-1">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Requested By</label>
            <Input value={requestedBy} readOnly className="bg-muted/50" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Reason</label>
            <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Why block these items?" />
          </div>
        </div>

        {/* Two-column layout: Search | Cart */}
        <div className="flex gap-3 flex-1 overflow-hidden min-h-0 px-1">

          {/* Left: Search Panel */}
          <div className="flex-1 flex flex-col border rounded-lg overflow-hidden">
            <div className="bg-muted/50 p-3 space-y-2 border-b">
              {/* Mode Toggle */}
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                  <input type="radio" name="mode" className="accent-primary" checked={searchMode === "inventory"} onChange={() => { setSearchMode("inventory"); setSearchResults([]) }} />
                  Inventory (Warehouse)
                </label>
                <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                  <input type="radio" name="mode" className="accent-primary" checked={searchMode === "barcode"} onChange={() => { setSearchMode("barcode"); setSearchResults([]) }} />
                  Barcode (TSG)
                </label>
              </div>
              {/* Filters */}
              <div className="grid grid-cols-2 gap-2">
                {searchMode === "inventory" ? (
                  <>
                    <div className="relative">
                      <Input placeholder="Product Code" value={searchProduct} className="h-8 text-xs"
                        onChange={e => { setSearchProduct(e.target.value); setShowProductList(true) }}
                        onFocus={() => { if (searchProduct) setShowProductList(true) }} onBlur={() => setTimeout(() => setShowProductList(false), 150)} />
                      {showProductList && (
                        <div className="absolute z-10 top-full left-0 right-0 max-h-40 overflow-auto bg-white border rounded shadow-lg mt-0.5">
                          {products.filter(p => p.toLowerCase().includes(searchProduct.toLowerCase())).slice(0, 30).map(p => (
                            <div key={p} className="px-2 py-1 text-xs hover:bg-muted cursor-pointer" onMouseDown={() => { setSearchProduct(p); setShowProductList(false) }}>{p}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Input placeholder="Tag No" value={searchBarcode} onChange={e => setSearchBarcode(e.target.value)} className="h-8 text-xs" />
                  </>
                ) : (
                  <>
                    <Input placeholder="Barcode" value={searchBarcode} onChange={e => setSearchBarcode(e.target.value)} className="h-8 text-xs" />
                    <Input placeholder="Product Code" value={searchProduct} onChange={e => setSearchProduct(e.target.value)} className="h-8 text-xs" />
                  </>
                )}
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-xs" />
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSearch} disabled={searching} className="gap-1">
                  <Search size={14} /> {searching ? "Searching..." : "Search"}
                </Button>
                <Button size="sm" variant="ghost" onClick={clearSearch}>Clear</Button>
                {searchResults.length > 0 && <span className="text-xs text-muted-foreground self-center ml-auto">{searchResults.length} results</span>}
              </div>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-auto">
              {searchResults.length > 0 ? (
                <table className="w-full text-xs">
                  <thead className="bg-muted/30 sticky top-0">
                    <tr>
                      <th className="p-1.5 w-7">
                        <input type="checkbox"
                          checked={searchResults.every(r => items.some(i => i.barcode === normalizeRow(r).barcode))}
                          onChange={e => {
                            const rows = searchResults.map(normalizeRow)
                            if (e.target.checked) { setItems(prev => [...prev, ...rows.filter(r => !prev.some(i => i.barcode === r.barcode))]) }
                            else { const codes = new Set(rows.map(r => r.barcode)); setItems(items.filter(i => !codes.has(i.barcode))) }
                          }} />
                      </th>
                      <th className="p-1.5 text-left">Barcode</th>
                      <th className="p-1.5 text-left">Product</th>
                      <th className="p-1.5 text-left">Pattern</th>
                      <th className="p-1.5 text-left">Date</th>
                      <th className="p-1.5 text-right">Qty</th>
                      <th className="p-1.5 text-left">Loc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((r, idx) => {
                      const row = normalizeRow(r)
                      const checked = items.some(i => i.barcode === row.barcode)
                      return (
                        <tr key={row.barcode + idx} className={`border-t hover:bg-muted/30 ${checked ? "bg-primary/5" : ""}`}>
                          <td className="p-1.5"><input type="checkbox" checked={checked} onChange={e => toggleItem(row, e.target.checked)} /></td>
                          <td className="p-1.5 font-mono">{row.barcode}</td>
                          <td className="p-1.5">{row.product_code}</td>
                          <td className="p-1.5 text-muted-foreground">{row.product_name}</td>
                          <td className="p-1.5">{row.received_date ? new Date(row.received_date).toLocaleDateString() : ""}</td>
                          <td className="p-1.5 text-right">{row.qty}</td>
                          <td className="p-1.5">{row.location}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  <Search size={16} className="mr-2 opacity-40" /> Search to find items
                </div>
              )}
            </div>
          </div>

          {/* Right: Cart */}
          <div className="w-[340px] flex flex-col border rounded-lg overflow-hidden">
            <div className="bg-muted/50 p-3 border-b flex items-center gap-2">
              <ShoppingCart size={14} />
              <span className="text-sm font-semibold">Block List</span>
              <Badge variant="secondary" className="ml-auto">{items.length}</Badge>
            </div>
            <div className="flex-1 overflow-auto">
              {items.length > 0 ? (
                <table className="w-full text-xs">
                  <tbody>
                    {items.map(i => (
                      <tr key={i.barcode} className="border-b hover:bg-muted/30">
                        <td className="p-1.5 font-mono">{i.barcode}</td>
                        <td className="p-1.5 text-muted-foreground">{i.product_code}</td>
                        <td className="p-1.5 text-right">{i.qty}</td>
                        <td className="p-1 w-7">
                          <button onClick={() => removeItem(i.barcode)} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                  No items selected
                </div>
              )}
            </div>
            {items.length > 0 && (
              <div className="border-t p-2">
                <Button size="sm" variant="ghost" className="w-full text-xs text-red-500 hover:text-red-700" onClick={() => setItems([])}>
                  <Trash2 size={12} className="mr-1" /> Clear All
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="border-t pt-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || !requestedBy || !reason || items.length === 0} className="gap-1">
            <Send size={14} /> {submitting ? "Submitting..." : `Submit (${items.length} items)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DetailDialog({ request, onClose, onUpdated }) {
  const [remark, setRemark] = useState("")
  const [approvedBy, setApprovedBy] = useState("")

  async function handleAction(action) {
    await fetch(`${getQualityApiUrl()}/api/blacklist/${request.id}/${action}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved_by: approvedBy, remark })
    })
    onUpdated()
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Request: {request.request_no}</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-3 gap-3">
            <div><span className="text-muted-foreground text-xs block">Requested By</span>{request.requested_by}</div>
            <div><span className="text-muted-foreground text-xs block">Date</span>{new Date(request.requested_date).toLocaleDateString()}</div>
            <div><span className="text-muted-foreground text-xs block">Status</span><Badge className={STATUS_COLORS[request.status]}>{request.status}</Badge></div>
          </div>
          <div><span className="text-muted-foreground text-xs block">Reason</span>{request.reason}</div>

          <table className="w-full text-xs border rounded">
            <thead className="bg-muted">
              <tr><th className="p-2 text-left">Barcode</th><th className="p-2 text-left">Product</th><th className="p-2 text-right">Qty</th><th className="p-2 text-left">Location</th></tr>
            </thead>
            <tbody>
              {request.items?.map(i => (
                <tr key={i.id} className="border-t">
                  <td className="p-2 font-mono">{i.barcode}</td>
                  <td className="p-2">{i.product_code}{i.product_name ? ` - ${i.product_name}` : ""}</td>
                  <td className="p-2 text-right">{i.qty}</td>
                  <td className="p-2">{i.location}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {request.status === "Pending" && (
            <div className="border-t pt-3 space-y-3">
              <Input placeholder="Your name" value={approvedBy} onChange={e => setApprovedBy(e.target.value)} />
              <Textarea placeholder="Remark (optional)" value={remark} onChange={e => setRemark(e.target.value)} rows={2} />
              <div className="flex gap-2">
                <Button onClick={() => handleAction("approve")} disabled={!approvedBy} className="bg-green-600 hover:bg-green-700 gap-1">
                  <Send size={14} /> Approve & Send to Warehouse
                </Button>
                <Button variant="destructive" onClick={() => handleAction("reject")} disabled={!approvedBy}>Reject</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
