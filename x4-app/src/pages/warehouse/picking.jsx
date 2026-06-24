import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

const WAREHOUSE_URL = import.meta.env.VITE_WAREHOUSE_API_URL ?? "/warehouse"

const REQ_CODES = {
  S01:"WRAPPING",S02:"USE CORRUGATED CARTON FOR TUBE(IRAN)",S03:"LACE STACKING VANNING FOR PSR 13 INCH",
  S04:"SILVER WRAPPING(IRAN)",S05:"RED CIRCLE AND PURCHASE ORDER NO.",S06:"SIZE LABEL NOT NECESSARY",
  S08:"REQUIRED FRESH PRODUCTION TIRES",S09:"OE UNIFORMITY / SIZE LABEL / SHIP INDEPENDENTLY",
  S10:"SEPARATE LOADING FOR DIRECT CUSTOMER",S14:"WHITE BAND",S15:"TIS LABEL PSR",S16:"TIS LABEL LSR/LTS/TBS/TBR",
  S17:"OE UNIFORMITY BALANCE",S18:"OE UNIFORMITY / SIZE LABEL",S19:"LIGHT POINT MARK",
  S21:"SERIAL NO.",S22:"WITHIN 20 MONTHS",S28:"LACE STACK IF VANNING",S29:"TEST REPORT",
  S32:"WITHIN 3 MONTHS",S45:"RED RIBBON + TEST TIRE LABEL",S47:"NO RAY DOWN",
  S70:"PSR(G) FRESHNESS RULE",S71:"WITHIN 4 MONTHS",S72:"WITHIN 6 MONTHS",S73:"WITHIN 10 MONTHS",
  S76:"WITHIN 12 MONTHS",S77:"SPACER REQUIRED",T01:"LASHING BELT+SPECIAL OE",T02:"LASHING BELT",
  T08:"WITHIN 8 MONTHS",T12:"WITHIN 1 MONTH",T13:"WITHIN 14 MONTHS",
}

export default function PickingPage() {
  const [pending, setPending] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [allocations, setAllocations] = useState([])
  const [form, setForm] = useState({
    sales_id: "", delivery_date: new Date().toISOString().slice(0, 10),
    truck_plate_no: "", transport_company_code: "", driver_code: "",
    delivery_place: "", transport_type: "",
  })
  const [loading, setLoading] = useState(false)
  const [gcosNo, setGcosNo] = useState(null)

  useEffect(() => { loadPending() }, [])

  const parseDocNo = (docNo) => {
    if (!docNo || docNo.length < 18) return { invoice: docNo, packing: "", item: "" }
    return { invoice: docNo.substring(3, 9), packing: docNo.substring(9, 11), item: String(parseInt(docNo.substring(11, 16)) || 1) }
  }

  const loadPending = () => {
    fetch(`${WAREHOUSE_URL}/api/picking/pending`).then(r => r.json()).then(res => { if (res.status) setPending(res.data) }).catch(() => {})
  }

  const toggle = (i) => { const next = new Set(selected); next.has(i) ? next.delete(i) : next.add(i); setSelected(next) }
  const selectAll = () => { selected.size === pending.length ? setSelected(new Set()) : setSelected(new Set(pending.map((_, i) => i))) }

  // Auto-load allocations when selection changes
  useEffect(() => {
    if (selected.size === 0) { setAllocations([]); return }
    const items = [...new Set([...selected].map(i => {
      const p = pending[i]; const st = (p.StockType || "").trim()
      return JSON.stringify({ gt_code: p.GT_Code, grade: p.Grade, ct_flag: st.length >= 1 ? st[0] : "", kk_flag: st.length >= 2 ? st[1] : "" })
    }))].map(s => JSON.parse(s))
    fetch(`${WAREHOUSE_URL}/api/picking/allocate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(items) })
      .then(r => r.json()).then(res => {
        if (res.status) {
          const required = {}
          ;[...selected].forEach(i => { const key = `${pending[i].GT_Code}|${pending[i].Grade}`; required[key] = (required[key] || 0) + (pending[i].Remain_Qty || 0) })
          const remaining = { ...required }
          const data = (res.data || []).map(row => {
            const key = `${row.GT_Code}|${row.Grade}`
            if (remaining[key] > 0) { const pick = Math.min(row.Available_Quantity, remaining[key]); remaining[key] -= pick; return { ...row, _selected: true, _pickQty: pick } }
            return row
          })
          setAllocations(data)
        }
      }).catch(() => {})
  }, [selected])

  const toggleAlloc = (i) => {
    const updated = [...allocations]
    updated[i] = { ...updated[i], _selected: !updated[i]._selected, _pickQty: !updated[i]._selected ? updated[i].Available_Quantity : 0 }
    setAllocations(updated)
  }
  const updatePickQty = (i, val) => {
    const updated = [...allocations]
    updated[i] = { ...updated[i], _pickQty: Math.min(Math.max(0, parseInt(val) || 0), updated[i].Available_Quantity) }
    setAllocations(updated)
  }

  const createDoc = async () => {
    if (selected.size === 0) return
    setLoading(true)
    const items = [...selected].map(i => ({
      document_type: pending[i].Document_Type, document_no: pending[i].Document_No,
      gt_code: pending[i].GT_Code, ct_flag: pending[i].CT_Flag, kk_flag: pending[i].KK_Flag,
      grade: pending[i].Grade, normal_tyre_flag: pending[i].Normal_Tyre_Flag,
      order_qty: pending[i].Remain_Qty, std_weight: 0,
    }))
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    const res = await fetch(`${WAREHOUSE_URL}/api/picking`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, wh_code: pending[[...selected][0]]?.WH_Code, issued_by: user.key || "SYSTEM", items })
    }).then(r => r.json()).catch(() => null)
    if (res?.status) { setGcosNo(res.data.gcos_no); setSelected(new Set()); loadPending() }
    setLoading(false)
  }

  const printDoc = () => { window.open(`${WAREHOUSE_URL}/api/picking/${gcosNo}/print`, "_blank") }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Picking Document (GCOS)</h1>

      {gcosNo && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-800 text-sm flex items-center justify-between">
          <span>✅ GCOS <span className="font-bold">{gcosNo}</span> created</span>
          <Button size="sm" onClick={printDoc}><Printer size={14} className="mr-1" /> Print</Button>
        </div>
      )}

      {/* Section 1: Pending Delivery Items */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">① Delivery Items ({pending.length})</h2>
          <Button size="sm" variant="outline" onClick={selectAll}>{selected.size === pending.length ? "Deselect All" : "Select All"}</Button>
        </div>
        <div className="border rounded-lg overflow-auto max-h-[35vh]">
          <table className="w-full text-sm">
            <thead className="bg-muted sticky top-0">
              <tr>
                <th className="px-2 py-2 w-8"></th>
                <th className="px-2 py-2 text-left">Invoice</th>
                <th className="px-2 py-2 text-left">PL</th>
                <th className="px-2 py-2 text-left">Item</th>
                <th className="px-2 py-2 text-left">GT Code</th>
                <th className="px-2 py-2 text-left">Grade</th>
                <th className="px-2 py-2 text-left">Type</th>
                <th className="px-2 py-2 text-left">Requirements</th>
                <th className="px-2 py-2 text-right">Remain</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((item, i) => {
                const doc = parseDocNo(item.Document_No)
                const reqs = [item.Req1, item.Req2].filter(r => r && r.trim()).map(r => REQ_CODES[r.trim()] || r.trim())
                return (
                <tr key={i} className={`border-t cursor-pointer hover:bg-muted/50 ${selected.has(i) ? "bg-primary/5" : ""}`} onClick={() => toggle(i)}>
                  <td className="px-2 py-1.5 text-center"><input type="checkbox" checked={selected.has(i)} onChange={() => toggle(i)} className="size-4 accent-primary" /></td>
                  <td className="px-2 py-1.5 font-mono">{doc.invoice}</td>
                  <td className="px-2 py-1.5">{doc.packing}</td>
                  <td className="px-2 py-1.5">{doc.item}</td>
                  <td className="px-2 py-1.5">{item.GT_Code}</td>
                  <td className="px-2 py-1.5">{item.Grade}</td>
                  <td className="px-2 py-1.5">{item.StockType ? <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-xs font-mono">{item.StockType}</span> : ""}</td>
                  <td className="px-2 py-1.5 text-xs text-muted-foreground">{reqs.join(", ")}</td>
                  <td className="px-2 py-1.5 text-right font-semibold">{item.Remain_Qty}</td>
                </tr>
                )
              })}
              {pending.length === 0 && <tr><td colSpan={9} className="px-4 py-6 text-center text-muted-foreground">No pending items</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Allocate Inventory */}
      {selected.size > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">② Allocate Inventory</h2>
            <span className="text-xs text-muted-foreground">
              Total pick: <span className="font-semibold">{allocations.reduce((sum, r) => sum + (r._selected ? (r._pickQty || 0) : 0), 0)}</span>
            </span>
          </div>
          <div className="border rounded-lg overflow-auto max-h-[30vh]">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="px-2 py-2 w-8"></th>
                  <th className="px-2 py-2 text-left">Zone</th>
                  <th className="px-2 py-2 text-left">Address</th>
                  <th className="px-2 py-2 text-left">GT Code</th>
                  <th className="px-2 py-2 text-left">Grade</th>
                  <th className="px-2 py-2 text-right">Available</th>
                  <th className="px-2 py-2 text-left">Prod Date</th>
                  <th className="px-2 py-2 text-right">Age (M)</th>
                  <th className="px-2 py-2 text-right">Pick Qty</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((row, i) => {
                  const age = row.Age_Months ?? 0
                  const ageColor = age <= 3 ? "text-green-700" : age <= 6 ? "text-yellow-700" : age <= 12 ? "text-orange-600" : "text-red-600"
                  return (
                  <tr key={i} className={`border-t ${row._selected ? "bg-primary/5" : ""}`}>
                    <td className="px-2 py-1.5 text-center"><input type="checkbox" checked={!!row._selected} onChange={() => toggleAlloc(i)} className="size-4 accent-primary" /></td>
                    <td className="px-2 py-1.5">{row.Zone_Code}</td>
                    <td className="px-2 py-1.5 font-mono">{row.Address_Code}</td>
                    <td className="px-2 py-1.5">{row.GT_Code}</td>
                    <td className="px-2 py-1.5">{row.Grade}</td>
                    <td className="px-2 py-1.5 text-right">{row.Available_Quantity}</td>
                    <td className="px-2 py-1.5 text-xs">{row.First_In_Date ? new Date(row.First_In_Date).toLocaleDateString() : ""}</td>
                    <td className={`px-2 py-1.5 text-right font-semibold ${ageColor}`}>{age}</td>
                    <td className="px-2 py-1.5 text-right">
                      <input type="number" min="0" max={row.Available_Quantity} className="border rounded px-2 py-0.5 w-16 text-right"
                        value={row._pickQty ?? ""} onChange={e => updatePickQty(i, e.target.value)} disabled={!row._selected} />
                    </td>
                  </tr>
                  )
                })}
                {allocations.length === 0 && <tr><td colSpan={9} className="px-4 py-4 text-center text-muted-foreground">No stock available</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 3: Create Document */}
      {selected.size > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">③ Create Document</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Sales ID" value={form.sales_id} onChange={v => setForm({ ...form, sales_id: v })} />
            <Field label="Delivery Date" type="date" value={form.delivery_date} onChange={v => setForm({ ...form, delivery_date: v })} />
            <Field label="Truck Plate" value={form.truck_plate_no} onChange={v => setForm({ ...form, truck_plate_no: v })} />
            <Field label="Transport Co." value={form.transport_company_code} onChange={v => setForm({ ...form, transport_company_code: v })} />
            <Field label="Driver Code" value={form.driver_code} onChange={v => setForm({ ...form, driver_code: v })} />
            <Field label="Delivery Place" value={form.delivery_place} onChange={v => setForm({ ...form, delivery_place: v })} />
            <Field label="Transport Type" value={form.transport_type} onChange={v => setForm({ ...form, transport_type: v })} />
          </div>
          <Button onClick={createDoc} disabled={loading || allocations.filter(r => r._selected && r._pickQty > 0).length === 0}>
            {loading ? "Creating..." : "Create GCOS & Print"}
          </Button>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <input type={type} className="border rounded px-2 py-1.5 w-full text-sm" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}
