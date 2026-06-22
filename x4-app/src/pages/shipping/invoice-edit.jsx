import { getShippingApiUrl } from "@/lib/env"
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { shippingService } from "@/services/shipping"
import { toast } from "@/lib/toast"
import InvoicePreRequire from "./invoice-steps/pre-require"
import InvoiceHeader from "./invoice-steps/header"
import InvoiceItems from "./invoice-steps/items"
import InvoicePacking from "./invoice-steps/packing"
import InvoiceLoading from "./invoice-steps/loading"
import InvoiceProcessing from "./invoice-steps/processing"

ModuleRegistry.registerModules([AllCommunityModule])

const STEP_KEYS_EDIT = ["STEP_ITEMS", "STEP_HEADER", "STEP_PACKING", "STEP_LOADING", "STEP_PROCESSING"]

export default function InvoiceEditPage({ onClose, invoiceKey: invoiceKeyProp }) {
  const { invoiceKey: invoiceKeyParam } = useParams()
  const invoiceKey = invoiceKeyProp || invoiceKeyParam
  const navigate = useNavigate()
  const { t } = useTranslation()
  const isNew = !invoiceKey || invoiceKey === "new"
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10) })()
  const [form, setForm] = useState({ invoice_key: "", etd: today, invoice_date: today, schedule: yesterday })
  const [items, setItems] = useState([])
  const [soBalance, setSoBalance] = useState([])
  const [packing, setPacking] = useState([])
  const [packingItems, setPackingItems] = useState([])
  const [lockedSeqs, setLockedSeqs] = useState(new Set())
  const [containerType, setContainerType] = useState("")
  const [containers, setContainers] = useState([])
  const [unitVolMap, setUnitVolMap] = useState({})
  const [productBrands, setProductBrands] = useState({})
  const [components, setComponents] = useState([])
  const [ports, setPorts] = useState([])
  const [carriers, setCarriers] = useState([])
  const [customers, setCustomers] = useState([])
  const [destinations, setDestinations] = useState([])
  const [countries, setCountries] = useState([])
  const [portsOfLoad, setPortsOfLoad] = useState([])

  useEffect(() => { loadLookups(); if (!isNew) loadInvoice() }, [])
  useEffect(() => { if (!isNew && step === 0 && soBalance.length === 0) loadSoBalance() }, [step])

  async function loadLookups() {
    const [p, ca, co, ct, dest, ctr, pol, prods] = await Promise.all([
      shippingService.lookup.ports(),
      shippingService.lookup.carriers(),
      shippingService.lookup.customers(),
      shippingService.lookup.containers(),
      shippingService.destinations.getAll(true),
      shippingService.lookup.countries(),
      fetch(`${getShippingApiUrl()}/api/masters/ports-of-load`).then(r => r.json()).then(d => d.data),
      fetch(`${getShippingApiUrl()}/api/masters/products`).then(r => r.json()).then(d => d.data),
    ])
    setPorts(p || []); setCarriers(ca || []); setCustomers(co || [])
    setContainers(ct || []); setDestinations(dest || []); setCountries(ctr || []); setPortsOfLoad(pol || [])
    const bmap = {}
    ;(prods || []).forEach(pr => { if (pr.brand) bmap[pr.key_ || pr.key] = pr.brand })
    setProductBrands(bmap)
  }

  async function loadInvoice() {
    setLoading(true)
    const res = await fetch(`${getShippingApiUrl()}/api/invoices/${encodeURIComponent(invoiceKey)}`).then(r => r.json()).then(d => d.data)
    if (res?.invoice) {
      setForm(res.invoice)
      setItems(res.items || []); setPacking(res.packing || []); setPackingItems(res.packing_items || [])
      setComponents(res.components || [])
      // Build unit volume map from components
      const comps = res.components || []
      const vmap = {}
      comps.forEach(c => { if (c.product_key && c.unit_volume) vmap[c.product_key] = c.unit_volume })
      setUnitVolMap(vmap)
    }
    setLoading(false)
  }

  async function loadSoBalance() {
    const bal = await shippingService.salesOrders.getBalance() || []
    setSoBalance(bal.filter(r => (r.qty_confirmed - r.qty_invoiced) > 0))
  }

  async function handleSave() {
    setSaving(true)
    let key = form.invoice_key || invoiceKey
    if (isNew && !key) {
      if (!form.etd) { toast.error("Please input ETD first"); setSaving(false); return }
      const res = await shippingService.invoices.nextNumber(form.etd)
      if (!res?.invoice_key) { toast.error("Failed to generate invoice code"); setSaving(false); return }
      key = res.invoice_key
      setForm(p => ({ ...p, invoice_key: key }))
    }
    const url = `${getShippingApiUrl()}/api/invoices${isNew ? "" : `/${encodeURIComponent(key)}`}`
    const payload = { ...form, invoice_key: key, items: items.map((it, i) => ({ ...it, invoice_item_no: i + 1 })) }
    await fetch(url, { method: isNew ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then(r => r.json())
    // Save packing
    if (packing.length > 0) {
      const packPayload = { packing: packing.map(p => ({ ...p, items: packingItems.filter(pi => pi.seq_no === p.seq_no) })) }
      await fetch(`${getShippingApiUrl()}/api/invoices/${encodeURIComponent(key)}/packing`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(packPayload) })
    }
    toast.success(isNew ? `${t("DOCFLOW.IV_CREATED")} — ${key}` : t("MASTER.SAVED"))
    setSaving(false)
    if (isNew) { if (onClose) onClose(); else navigate("/shipping/invoices") }
  }

  if (loading) return <Spinner />

  return (
    <div className="h-full flex flex-col">
      {/* Step tabs */}
      {!isNew && (
      <div className="flex border-b">
        {STEP_KEYS_EDIT.map((s, i) => (
          <button key={i} onClick={() => setStep(i)} className={`px-4 py-2.5 text-sm font-medium border-b-2 ${i === step ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t(`DOCFLOW.${s}`)}
          </button>
        ))}
      </div>
      )}

      {/* Step content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isNew && <InvoicePreRequire form={form} setForm={setForm} customers={customers} destinations={destinations} countries={countries} ports={ports} portsOfLoad={portsOfLoad} carriers={carriers} t={t} />}
        {!isNew && step === 0 && <InvoiceItems form={form} items={items} setItems={setItems} soBalance={soBalance} destinations={destinations} packingItems={packingItems} />}
        {!isNew && step === 1 && <InvoiceHeader form={form} setForm={setForm} ports={ports} portsOfLoad={portsOfLoad} carriers={carriers} items={items} productBrands={productBrands} components={components} t={t} />}
        {!isNew && step === 2 && <InvoicePacking invoiceKey={invoiceKey} items={items} packing={packing} setPacking={setPacking} packingItems={packingItems} setPackingItems={setPackingItems} lockedSeqs={lockedSeqs} setLockedSeqs={setLockedSeqs} containerType={containerType} setContainerType={setContainerType} containers={containers} unitVolMap={unitVolMap} t={t} revision={form.revision || 0} />}
        {!isNew && step === 3 && <InvoiceLoading packing={packing} setPacking={setPacking} t={t} />}
        {!isNew && step === 4 && <InvoiceProcessing invoiceKey={invoiceKey} form={form} items={items} setItems={setItems} packingItems={packingItems} onReload={loadInvoice} t={t} />}
      </div>

      {/* Navigation */}
      {isNew ? (
        <div className="border-t px-4 py-3 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => { if (onClose) onClose() }}>{t("CANCEL")}</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? "..." : t("DOCFLOW.IV_CREATE")}</Button>
        </div>
      ) : (
        <div className="border-t px-4 py-3 flex justify-end">
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving || form.status === "released"}>{saving ? "..." : t("MASTER.SAVE")}</Button>
        </div>
      )}
    </div>
  )
}
