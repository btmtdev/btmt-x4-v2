import { useState } from "react"
import { Input } from "@/components/ui/input"
import { RefreshCw } from "lucide-react"

function generateDescOfGoods(items, productBrands = {}, components = []) {
  const brandMap = { BS: "BRIDGESTONE", FS: "FIRESTONE", DT: "DAYTON" }
  const typeMap = { T: "TIRES", C: "TUBES", F: "FLAPS" }
  const brands = new Set()
  const types = new Set()
  for (const it of items) {
    const brand = productBrands[it.product_key]?.toUpperCase()
    if (brand && brandMap[brand]) brands.add(brand)
  }
  // Get types from components (covers kitting)
  for (const c of components) {
    const ct = (c.component_type || "").toUpperCase()
    if (typeMap[ct]) types.add(ct)
  }
  // Fallback: if no components, use item product_type
  if (types.size === 0) {
    for (const it of items) {
      const st = (it.product_type || "").toUpperCase()
      for (const ch of st) { if (typeMap[ch]) types.add(ch) }
    }
  }
  const joinWords = (arr) => arr.length <= 1 ? arr.join("") : arr.slice(0, -1).join(", ") + " AND " + arr[arr.length - 1]
  const brandStr = joinWords([...brands].map(b => brandMap[b]).filter(Boolean))
  const typeStr = joinWords([...types].map(t => typeMap[t]).filter(Boolean))
  if (!brandStr && !typeStr) return ""
  return `${brandStr}${brandStr ? " BRAND " : ""}${typeStr}`.trim()
}

export default function InvoiceHeader({ form, setForm, ports, portsOfLoad, carriers, items, productBrands = {}, components = [], t }) {
  const [headerTab, setHeaderTab] = useState("shipping")

  const f = (key, label, type = "text", disabled = false) => (
    <div className="space-y-1" key={key}>
      <label className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</label>
      <Input className="text-xs h-8" type={type} value={form[key] ?? ""} disabled={disabled} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
    </div>
  )

  const tabs = [
    { key: "shipping", label: "Shipping" },
    { key: "shipmark", label: "Shipping Mark" },
    { key: "other", label: "Remark" },
  ]

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-1 border-b">
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setHeaderTab(tb.key)} className={`px-3 py-1.5 text-xs font-semibold border-b-2 ${headerTab === tb.key ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>{tb.label}</button>
        ))}
      </div>
      {headerTab === "shipping" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {f("customer_key", "Customer", "text", true)}
            {f("port_of_destination", "Port of Destination", "text", true)}
            <div className="space-y-1" key="port_of_discharge">
              <label className="text-[10px] font-semibold uppercase text-muted-foreground">Port of Discharge</label>
              <select className="w-full h-8 border rounded px-2 text-xs bg-background" value={form.port_of_discharge ?? ""} onChange={e => { const val = e.target.value; const port = ports.find(p => (p.country_key || "") + (p.key_ || p.key) === val); setForm(p => ({ ...p, port_of_discharge: val, edi_ship_to: port?.name || "" })) }}>
                <option value="">{t("SUPPORT.SELECT")}</option>
                {(() => { const countryPorts = ports.filter(p => p.is_discharge && p.country_key === form.country_code); const podPort = form.port_of_destination && !countryPorts.some(p => (p.key_ || p.key) === form.port_of_destination) ? ports.find(p => (p.key_ || p.key) === form.port_of_destination) : null; const list = podPort ? [...countryPorts, podPort] : countryPorts; return list.sort((a, b) => (a.name || "").localeCompare(b.name || "")).map(p => <option key={p.key_ || p.key} value={(p.country_key || "") + (p.key_ || p.key)}>{(p.country_key || "") + (p.key_ || p.key)} — {p.name}</option>) })()}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1" key="port_of_load">
              <label className="text-[10px] font-semibold uppercase text-muted-foreground">Port of Load</label>
              <select className="w-full h-8 border rounded px-2 text-xs bg-background" value={form.port_of_load ?? ""} onChange={e => { const pol = portsOfLoad.find(p => (p.key_ || p.key) === e.target.value); setForm(p => ({ ...p, port_of_load: e.target.value, edi_ship_from: pol?.edi_name || "" })) }}>
                <option value="">{t("SUPPORT.SELECT")}</option>
                {portsOfLoad.map(p => <option key={p.key_ || p.key} value={p.key_ || p.key}>{(p.key_ || p.key)} — {p.name || p.edi_name}</option>)}
              </select>
            </div>
            <div className="space-y-1" key="carrier_key">
              <label className="text-[10px] font-semibold uppercase text-muted-foreground">Carrier</label>
              <select className="w-full h-8 border rounded px-2 text-xs bg-background" value={form.carrier_key ?? ""} onChange={e => setForm(p => ({ ...p, carrier_key: e.target.value }))}>
                <option value="">{t("SUPPORT.SELECT")}</option>
                {carriers.map(o => <option key={o.key_ || o.key} value={o.key_ || o.key}>{(o.key_ || o.key)} — {o.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {f("schedule", "Loading Date", "date")}
            {f("etd", "ETD", "date")}
            {f("eta", "ETA", "date")}
            {f("invoice_date", "Invoice Date", "date")}
          </div>
          <div className="grid grid-cols-5 gap-3">
            <div className="space-y-1 col-span-2" key="feeder_vessel">
              <label className="text-[10px] font-semibold uppercase text-muted-foreground">Feeder Vessel</label>
              <Input className="text-xs h-8" value={form.feeder_vessel ?? ""} onChange={e => setForm(p => ({ ...p, feeder_vessel: e.target.value }))} />
            </div>
            <div className="space-y-1 col-span-2" key="mother_vessel">
              <label className="text-[10px] font-semibold uppercase text-muted-foreground">Mother Vessel</label>
              <Input className="text-xs h-8" value={form.mother_vessel ?? ""} onChange={e => setForm(p => ({ ...p, mother_vessel: e.target.value }))} />
            </div>
            {f("voyage_no", "Voyage No")}
          </div>
          <div className="grid grid-cols-5 gap-3">
            <div className="space-y-1 col-span-2" key="booking_no">
              <label className="text-[10px] font-semibold uppercase text-muted-foreground">Booking No</label>
              <Input className="text-xs h-8" value={form.booking_no ?? ""} onChange={e => setForm(p => ({ ...p, booking_no: e.target.value }))} />
            </div>
            <div className="space-y-1 col-span-2" key="bl_no">
              <label className="text-[10px] font-semibold uppercase text-muted-foreground">B/L No</label>
              <Input className="text-xs h-8" value={form.bl_no ?? ""} onChange={e => setForm(p => ({ ...p, bl_no: e.target.value }))} />
            </div>
            {f("confirm_date", "Confirm Date", "date")}
          </div>
          <div className="grid grid-cols-5 gap-3">
            <div className="space-y-1 col-span-2" key="contract_no">
              <label className="text-[10px] font-semibold uppercase text-muted-foreground">Contract No</label>
              <Input className="text-xs h-8" value={form.contract_no ?? ""} onChange={e => setForm(p => ({ ...p, contract_no: e.target.value }))} />
            </div>
            <div className="space-y-1 col-span-2" key="lc_no">
              <label className="text-[10px] font-semibold uppercase text-muted-foreground">L/C No</label>
              <Input className="text-xs h-8" value={form.lc_no ?? ""} onChange={e => setForm(p => ({ ...p, lc_no: e.target.value }))} />
            </div>
            {f("lc_date", "L/C Date", "date")}
          </div>
          <div className="space-y-2">
            <div className="space-y-1" key="desc_of_goods1">
              <label className="text-[10px] font-semibold uppercase text-muted-foreground">Desc of Goods 1</label>
              <div className="flex gap-1">
                <Input className="text-xs h-8 flex-1" value={form.desc_of_goods1 ?? ""} onChange={e => setForm(p => ({ ...p, desc_of_goods1: e.target.value }))} />
                <button className="h-8 w-8 border rounded flex items-center justify-center text-muted-foreground hover:text-foreground" onClick={() => setForm(p => ({ ...p, desc_of_goods1: generateDescOfGoods(items || [], productBrands, components) }))} title="Generate"><RefreshCw size={14} /></button>
              </div>
            </div>
            {f("desc_of_goods2", "Desc of Goods 2")}
          </div>
        </div>
      )}
      {headerTab === "shipmark" && (
        <div className="space-y-2">
          {f("ship_mark1", "Shipping Mark 1")}
          {f("ship_mark2", "Shipping Mark 2")}
          {f("ship_mark3", "Shipping Mark 3")}
          {f("ship_mark4", "Shipping Mark 4")}
          {f("ship_mark5", "Shipping Mark 5")}
        </div>
      )}
      {headerTab === "other" && (
        <div className="space-y-2">
          {f("shiping_remark1", "Remark 1")}
          {f("shiping_remark2", "Remark 2")}
        </div>
      )}
    </div>
  )
}
