import { getShippingApiUrl } from "@/lib/env"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"

export default function InvoiceProcessing({ invoiceKey, form, items, setItems, packingItems, onReload, t }) {
  const [processing, setProcessing] = useState(false)
  const [printModal, setPrintModal] = useState(null)
  const [printOpts, setPrintOpts] = useState({ displayMode: "product", showCoo: false, showGrandTotal: false, showSummaryPage: false, linesPerPage: 20 })
  const isReleased = form.status === "released"

  const packedQty = {}
  packingItems.forEach(pi => { packedQty[`${pi.so_key}|${pi.so_line}`] = (packedQty[`${pi.so_key}|${pi.so_line}`] || 0) + (pi.qty || 0) })

  const forceUpdatePacked = () => {
    setItems(prev => prev.map(it => ({ ...it, qty: packedQty[`${it.so_key}|${it.so_line}`] || it.qty })))
    toast.success(t("DOCFLOW.PROC_UPDATED"))
  }

  const removeUnpacked = () => {
    setItems(prev => prev.filter(it => (packedQty[`${it.so_key}|${it.so_line}`] || 0) > 0))
    toast.success(t("DOCFLOW.PROC_REMOVED"))
  }

  const release = async () => {
    setProcessing(true)
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    const res = await fetch(`${getShippingApiUrl()}/api/shipments/release`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoice_key: invoiceKey, user_id: user.username || user.display_name || "unknown" })
    }).then(r => r.json())
    if (res.status) { toast.success(t("DOCFLOW.PROC_RELEASED")); if (onReload) onReload() }
    else toast.error(res.message || "Failed")
    setProcessing(false)
  }

  const switchToDraft = async () => {
    setProcessing(true)
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    const res = await fetch(`${getShippingApiUrl()}/api/shipments/pullback`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoice_key: invoiceKey, user_id: user.username || user.display_name || "unknown" })
    }).then(r => r.json())
    if (res.status) { toast.success(t("DOCFLOW.PROC_DRAFT")); if (onReload) onReload() }
    else toast.error(res.message || "Failed")
    setProcessing(false)
  }

  return (
    <div className="p-4 space-y-4 overflow-auto">
      {/* Status & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{t("DOCFLOW.PROC_STATUS")}:</span>
          <span className={`text-sm px-2 py-0.5 rounded font-medium uppercase ${isReleased ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-700"}`}>{form.status}</span>
        </div>
        <div className="flex gap-2">
          {!isReleased && (
            <>
              <Button size="sm" variant="outline" className="text-sm" onClick={forceUpdatePacked}>{t("DOCFLOW.PROC_FORCE_UPDATE")}</Button>
              <Button size="sm" variant="outline" className="text-sm text-red-500" onClick={removeUnpacked}>{t("DOCFLOW.PROC_REMOVE_UNPACKED")}</Button>
              <Button size="sm" className="text-sm" onClick={release} disabled={processing}>{processing ? "..." : t("DOCFLOW.PROC_RELEASE")}</Button>
            </>
          )}
          {isReleased && (
            <Button size="sm" variant="outline" className="text-sm" onClick={switchToDraft} disabled={processing}>{processing ? "..." : t("DOCFLOW.PROC_TO_DRAFT")}</Button>
          )}
        </div>
      </div>

      {isReleased && (
        <div className="bg-blue-50 border border-blue-200 rounded p-2 text-sm text-blue-700">
          {t("DOCFLOW.PROC_READONLY_MSG")}
        </div>
      )}

      {/* Items table */}
      <table className="w-full text-sm border rounded">
        <thead>
          <tr className="border-b bg-muted/30 text-muted-foreground">
            <th className="p-2 text-left">#</th>
            <th className="p-2 text-left">SO</th>
            <th className="p-2 text-left">LINE</th>
            <th className="p-2 text-left">PRODUCT</th>
            <th className="p-2 text-left">SET</th>
            <th className="p-2 text-right">QTY</th>
            <th className="p-2 text-right">PACKED</th>
            <th className="p-2 text-right">DIFF</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => {
            const packed = packedQty[`${it.so_key}|${it.so_line}`] || 0
            const diff = packed - it.qty
            return (
              <tr key={i} className={`border-b ${packed === 0 ? "bg-red-50" : diff !== 0 ? "bg-amber-50" : ""}`}>
                <td className="p-2">{i + 1}</td>
                <td className="p-2">{it.so_key}</td>
                <td className="p-2">{it.so_line}</td>
                <td className="p-2">{it.product_key}</td>
                <td className="p-2">{it.kit_key}</td>
                <td className="p-2 text-right">{it.qty}</td>
                <td className="p-2 text-right font-medium">{packed}</td>
                <td className={`p-2 text-right font-medium ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : ""}`}>{diff !== 0 ? (diff > 0 ? "+" : "") + diff : "—"}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Print / Export */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold text-muted-foreground">{t("DOCFLOW.PROC_DOCUMENTS")}:</span>
        {["PV","IV","PL","DL"].map(doc => (
          <Button key={doc} size="sm" variant="outline" className="text-sm" onClick={() => { setPrintOpts(p => ({ ...p, linesPerPage: doc === "DL" ? 16 : 20 })); setPrintModal(doc) }}>{doc}</Button>
        ))}
        <Button size="sm" variant="outline" className="text-sm" onClick={() => window.open(`${getShippingApiUrl()}/api/reports/sap/${encodeURIComponent(invoiceKey)}`, "_blank")}>SAP</Button>
        <Button size="sm" variant="outline" className="text-sm" onClick={() => window.open(`${getShippingApiUrl()}/api/reports/psp-h/${encodeURIComponent(invoiceKey)}`, "_blank")}>PSP-H</Button>
        <Button size="sm" variant="outline" className="text-sm" onClick={() => window.open(`${getShippingApiUrl()}/api/reports/psp-d/${encodeURIComponent(invoiceKey)}`, "_blank")}>PSP-D</Button>
      </div>

      {/* Print Modal */}
      {printModal && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setPrintModal(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[65] bg-background rounded-lg border shadow-xl w-[400px] p-5 space-y-4">
            <h3 className="font-semibold text-sm">{printModal} — {t("DOCFLOW.PROC_PRINT_SETTINGS")}</h3>
            <div className="space-y-3 text-sm">
              <div className="mb-4">
                <label className="block mb-2 text-sm font-semibold uppercase text-muted-foreground">DISPLAY MODE</label>
                <select className="w-full h-8 border rounded px-2 text-sm" value={printOpts.displayMode} onChange={e => setPrintOpts(p => ({ ...p, displayMode: e.target.value }))}>
                  <option value="component">Component Level</option>
                  <option value="product">Product Level</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-semibold uppercase text-muted-foreground">LINES PER PAGE</label>
                <input className="w-full h-8 border rounded px-2 text-sm" type="number" value={printOpts.linesPerPage} onChange={e => setPrintOpts(p => ({ ...p, linesPerPage: Number(e.target.value) }))} />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="printCoo" checked={printOpts.showCoo} onChange={e => setPrintOpts(p => ({ ...p, showCoo: e.target.checked }))} />
                <label htmlFor="printCoo" className="text-sm">แสดงประเทศแหล่งกำเนิดสินค้า</label>
              </div>
              {printModal === "PL" && (
                <>
                  <div className="flex items-center gap-2 pt-1">
                    <input type="checkbox" id="printGrandTotal" checked={printOpts.showGrandTotal} onChange={e => setPrintOpts(p => ({ ...p, showGrandTotal: e.target.checked }))} />
                    <label htmlFor="printGrandTotal" className="text-sm">แสดงยอดรวมทั้งหมดในหน้าสุดท้าย</label>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input type="checkbox" id="printSummary" checked={printOpts.showSummaryPage} onChange={e => setPrintOpts(p => ({ ...p, showSummaryPage: e.target.checked }))} />
                    <label htmlFor="printSummary" className="text-sm">แสดงหน้าสรุป</label>
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setPrintModal(null)}>{t("MASTER.CANCEL")}</Button>
              <Button size="sm" onClick={() => { const q = new URLSearchParams({ type: printOpts.displayMode === "component" ? "T" : "TCF", coo: printOpts.showCoo ? "1" : "0", split: printOpts.linesPerPage, allw: printOpts.showGrandTotal ? "1" : "0", sumpage: printOpts.showSummaryPage ? "1" : "0" }); window.open(`${getShippingApiUrl()}/api/reports/${printModal.toLowerCase()}/${encodeURIComponent(invoiceKey)}?${q}`, "_blank"); setPrintModal(null) }}>{t("DOCFLOW.PROC_PRINT")}</Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
