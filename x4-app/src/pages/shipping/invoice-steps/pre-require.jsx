import { Input } from "@/components/ui/input"

export default function InvoicePreRequire({ form, setForm, customers, destinations, countries, ports, portsOfLoad, carriers, t }) {
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-semibold uppercase text-muted-foreground">CUSTOMER</label>
          <select className="w-full h-8 border rounded px-2 text-sm bg-background" value={form.customer_key ?? ""} onChange={e => {
            const cust = customers.find(c => (c.key_ || c.key) === e.target.value)
            const defPol = portsOfLoad.find(p => p.is_default)
            setForm(p => ({
              ...p, customer_key: e.target.value, _countryFilter: "", port_of_destination: "",
              consigned_to_1: cust?.name ?? "", consigned_to_2: cust?.address1 ?? "", consigned_to_3: cust?.address2 ?? "",
              term_of_pay_1: cust?.term_of_pay_1 ?? "", term_of_pay_2: cust?.term_of_pay_2 ?? "", term_of_pay_3: cust?.term_of_pay_3 ?? "",
              trade_term: cust?.trade_term ?? "", ship_from: cust?.ship_from ?? "",
              ship_mark_1: cust?.ship_mark_1 ?? "", ship_mark_2: cust?.ship_mark_2 ?? "", ship_mark_3: cust?.ship_mark_3 ?? "",
              ship_mark_4: cust?.ship_mark_4 ?? "", ship_mark_5: cust?.ship_mark_5 ?? "",
              port_of_load: defPol?.key_ || defPol?.key || p.port_of_load || "",
              edi_ship_from: defPol?.edi_name || "",
            }))
          }}>
            <option value="">{t("SUPPORT.SELECT")}</option>
            {customers.map(c => <option key={c.key_ || c.key} value={c.key_ || c.key}>{c.key_ || c.key}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold uppercase text-muted-foreground">COUNTRY</label>
          <select className="w-full h-8 border rounded px-2 text-sm bg-background" value={form._countryFilter ?? ""} onChange={e => setForm(p => ({ ...p, _countryFilter: e.target.value, port_of_destination: "", port_of_discharge: "" }))} disabled={!form.customer_key}>
            <option value="">{t("SUPPORT.SELECT")}</option>
            {[...new Set(destinations.filter(d => d.customer_key === form.customer_key).map(d => d.country_key).filter(Boolean))].sort().map(ck => {
              const cn = countries.find(x => (x.key_ || x.key) === ck)
              return <option key={ck} value={ck}>{ck} — {cn?.name || ck}</option>
            })}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold uppercase text-muted-foreground">PORT OF DESTINATION</label>
          <select className="w-full h-8 border rounded px-2 text-sm bg-background" value={form.port_of_destination ?? ""} onChange={e => { const portKey = e.target.value; const port = ports.find(p => (p.key_ || p.key) === portKey); setForm(p => ({ ...p, port_of_destination: portKey, port_of_discharge: portKey ? (p._countryFilter || "") + portKey : "", edi_ship_to: port?.name || "" })) }} disabled={!form._countryFilter}>
            <option value="">{t("SUPPORT.SELECT")}</option>
            {Object.values(Object.fromEntries(destinations.filter(d => d.customer_key === form.customer_key && d.country_key === form._countryFilter).map(d => [d.port_key, d]))).sort((a, b) => (a.name || "").localeCompare(b.name || "")).map(d => (
              <option key={d.port_key} value={d.port_key}>{d.port_key} — {d.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold uppercase text-muted-foreground">PORT OF DISCHARGE</label>
          <select className="w-full h-8 border rounded px-2 text-sm bg-background" value={form.port_of_discharge ?? ""} onChange={e => { const val = e.target.value; const port = ports.find(p => (p.country_key || "") + (p.key_ || p.key) === val); setForm(p => ({ ...p, port_of_discharge: val, edi_ship_to: port?.name || "" })) }} disabled={!form._countryFilter}>
            <option value="">{t("SUPPORT.SELECT")}</option>
            {(() => {
              const countryPorts = ports.filter(p => p.is_discharge && p.country_key === form._countryFilter)
              const podPort = form.port_of_destination && !countryPorts.some(p => (p.key_ || p.key) === form.port_of_destination)
                ? ports.find(p => (p.key_ || p.key) === form.port_of_destination) : null
              const list = podPort ? [...countryPorts, podPort] : countryPorts
              return list.sort((a, b) => (a.name || "").localeCompare(b.name || "")).map(p => <option key={p.key_ || p.key} value={(p.country_key || "") + (p.key_ || p.key)}>{(p.country_key || "") + (p.key_ || p.key)} — {p.name}</option>)
            })()}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold uppercase text-muted-foreground">PORT OF LOAD</label>
          <select className="w-full h-8 border rounded px-2 text-sm bg-background" value={form.port_of_load ?? ""} onChange={e => { const pol = portsOfLoad.find(p => (p.key_ || p.key) === e.target.value); setForm(p => ({ ...p, port_of_load: e.target.value, edi_ship_from: pol?.edi_name || "" })) }}>
            <option value="">{t("SUPPORT.SELECT")}</option>
            {portsOfLoad.map(p => <option key={p.key_ || p.key} value={p.key_ || p.key}>{(p.key_ || p.key)} — {p.name || p.edi_name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold uppercase text-muted-foreground">CARRIER</label>
          <select className="w-full h-8 border rounded px-2 text-sm bg-background" value={form.carrier_key ?? ""} onChange={e => setForm(p => ({ ...p, carrier_key: e.target.value }))}>
            <option value="">{t("SUPPORT.SELECT")}</option>
            {carriers.map(o => <option key={o.key_ || o.key} value={o.key_ || o.key}>{(o.key_ || o.key)} — {o.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold uppercase text-muted-foreground">ETD</label>
          <Input className="text-sm h-8" type="date" value={form.etd ?? ""} onChange={e => { const etd = e.target.value; const d = new Date(etd); d.setDate(d.getDate() - 1); setForm(p => ({ ...p, etd, schedule: d.toISOString().slice(0, 10) })) }} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold uppercase text-muted-foreground">INVOICE DATE</label>
          <Input className="text-sm h-8" type="date" value={form.invoice_date ?? ""} onChange={e => setForm(p => ({ ...p, invoice_date: e.target.value }))} />
        </div>
      </div>
    </div>
  )
}
