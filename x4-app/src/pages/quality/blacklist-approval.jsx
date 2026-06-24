import { getQualityApiUrl } from "@/lib/env"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle } from "lucide-react"

const STATUS_COLORS = { Pending: "bg-amber-100 text-amber-700", Approved: "bg-green-100 text-green-700", Rejected: "bg-red-100 text-red-700" }

export default function BlacklistApprovalPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [approvedBy] = useState(() => { const u = JSON.parse(localStorage.getItem("user") || "{}"); return u.display_name_en || u.ad_username || "" })
  const [remark, setRemark] = useState("")
  const [processing, setProcessing] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const res = await fetch(`${getQualityApiUrl()}/api/blacklist?status=Pending`).then(r => r.json()).catch(() => [])
    setRequests(Array.isArray(res) ? res : [])
    setLoading(false)
  }

  async function handleAction(id, action) {
    if (!approvedBy) return
    setProcessing(true)
    await fetch(`${getQualityApiUrl()}/api/blacklist/${id}/${action}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved_by: approvedBy, remark })
    })
    setProcessing(false)
    setSelected(null)
    setRemark("")
    load()
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold">Blacklist Approval</h1>
      <p className="text-sm text-muted-foreground">Pending requests for inventory block</p>

      {loading ? <Spinner /> : requests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No pending requests</div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} className={`border rounded-lg p-4 cursor-pointer transition ${selected?.id === r.id ? "ring-2 ring-primary" : "hover:border-primary/40"}`} onClick={() => setSelected(r)}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm font-semibold">{r.request_no}</span>
                <Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <div>By: <span className="text-foreground">{r.requested_by}</span></div>
                <div>Date: <span className="text-foreground">{new Date(r.requested_date).toLocaleDateString()}</span></div>
                <div>Items: <span className="text-foreground font-semibold">{r.items?.length || 0}</span></div>
              </div>
              <div className="text-xs mt-1">Reason: <span className="text-foreground">{r.reason}</span></div>

              {selected?.id === r.id && (
                <div className="mt-3 border-t pt-3 space-y-2" onClick={e => e.stopPropagation()}>
                  <table className="w-full text-xs border rounded">
                    <thead className="bg-muted">
                      <tr><th className="p-1.5 text-left">Barcode</th><th className="p-1.5 text-left">Product</th><th className="p-1.5 text-right">Qty</th><th className="p-1.5 text-left">Location</th></tr>
                    </thead>
                    <tbody>
                      {r.items?.map(i => (
                        <tr key={i.id} className="border-t">
                          <td className="p-1.5 font-mono">{i.barcode}</td>
                          <td className="p-1.5">{i.product_code}</td>
                          <td className="p-1.5 text-right">{i.qty}</td>
                          <td className="p-1.5">{i.location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={approvedBy} readOnly className="h-8 text-xs bg-muted/50" />
                    <Input placeholder="Remark (optional)" value={remark} onChange={e => setRemark(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAction(r.id, "approve")} disabled={!approvedBy || processing} className="bg-green-600 hover:bg-green-700 gap-1">
                      <CheckCircle size={14} /> Approve & Block
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleAction(r.id, "reject")} disabled={!approvedBy || processing} className="gap-1">
                      <XCircle size={14} /> Reject
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
