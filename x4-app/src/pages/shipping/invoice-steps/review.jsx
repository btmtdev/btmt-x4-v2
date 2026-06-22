export default function InvoiceReview({ form, items, packing, packingItems, invoiceKey }) {
  return (
    <div className="p-4 space-y-4 overflow-auto text-sm">
      <h4 className="font-semibold">Invoice: {form.invoice_key || invoiceKey}</h4>
      <div className="grid grid-cols-4 gap-2">
        {["booking_no", "port_of_destination", "carrier_key", "etd", "eta", "trade_term"].map(k => (
          <div key={k}><span className="text-muted-foreground uppercase text-sm">{k.replace(/_/g, " ")}:</span> <span>{form[k] || "—"}</span></div>
        ))}
      </div>
      <h4 className="font-semibold mt-4">Items ({items.length})</h4>
      <table className="w-full text-sm border">
        <thead><tr className="bg-muted/30 border-b"><th className="p-1">#</th><th className="p-1">SO</th><th className="p-1">PRODUCT</th><th className="p-1 text-right">QTY</th></tr></thead>
        <tbody>{items.map((it, i) => <tr key={i} className="border-b"><td className="p-1">{i + 1}</td><td className="p-1">{it.so_key}/{it.so_line}</td><td className="p-1">{it.product_key}</td><td className="p-1 text-right">{it.qty}</td></tr>)}</tbody>
      </table>
      <h4 className="font-semibold mt-4">Packing ({packing.length} containers)</h4>
      {packing.map(p => (
        <div key={p.seq_no} className="border rounded p-2 mb-1">
          <span className="font-semibold">#{p.seq_no}</span> <span className="text-muted-foreground">{p.container_type}</span>
          <span className="ml-2">{packingItems.filter(pi => pi.seq_no === p.seq_no).reduce((s, pi) => s + pi.qty, 0)} pcs</span>
        </div>
      ))}
    </div>
  )
}
