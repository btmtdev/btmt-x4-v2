import { AgGridReact } from "ag-grid-react"
import { themeQuartz } from "ag-grid-community"

const theme = themeQuartz.withParams({ fontFamily: ["BridgestoneType", "Google Sans", "sans-serif"], rowHeight: 28, headerHeight: 32, headerFontWeight: "bold", fontSize: "0.75rem", pinnedRowBottomBorderWidth: 3, pinnedRowBottomBorderColor: "#333" })

export default function InvoiceItems({ form, items, setItems, soBalance, destinations, packingItems = [] }) {
  const validDestKeys = new Set(destinations.filter(d => d.port_key === form.port_of_destination).map(d => d.key_ || d.key))
  const filteredBalance = soBalance.filter(r => validDestKeys.has(r.destination_key))

  // Merge: SO balance + current invoice items not in balance
  const balanceKeys = new Set(filteredBalance.map(r => `${r.so_key}|${r.so_line}`))
  const missingItems = items.filter(it => !balanceKeys.has(`${it.so_key}|${it.so_line}`)).map(it => ({
    ...it, qty_confirmed: it.qty, qty_invoiced: it.qty, destination_key: it.destination_key || ""
  }))
  const merged = [...filteredBalance, ...missingItems]

  const allRows = merged.map(r => {
    const selected = items.some(it => it.so_key === r.so_key && it.so_line === r.so_line)
    const item = items.find(it => it.so_key === r.so_key && it.so_line === r.so_line)
    return { ...r, selected, qty_use: item?.qty ?? (r.qty_confirmed - r.qty_invoiced) }
  })

  const pinnedRows = allRows.filter(r => r.selected)
  const bottomRows = allRows.filter(r => !r.selected)

  const toggleItem = (row) => {
    if (row.selected) {
      const isPacked = packingItems.some(pi => pi.so_key === row.so_key && pi.so_line === row.so_line)
      if (isPacked) return
      setItems(prev => prev.filter(it => !(it.so_key === row.so_key && it.so_line === row.so_line)))
    } else {
      setItems(prev => [...prev, {
        so_key: row.so_key, so_line: row.so_line, product_key: row.product_key,
        kit_key: row.kit_key, description: row.product_key, qty: row.qty_confirmed - row.qty_invoiced,
        stock_type: row.stock_type, req1: row.req1, req2: row.req2,
      }])
    }
  }

  const updateQty = (soKey, soLine, qty) => {
    setItems(prev => prev.map(it => it.so_key === soKey && it.so_line === soLine ? { ...it, qty: Number(qty) } : it))
  }

  return (
    <div className="flex flex-col p-4 h-full">
      <div className="flex-1 min-h-0">
        <AgGridReact theme={theme} rowData={bottomRows} pinnedTopRowData={pinnedRows} columnDefs={[
          { headerName: "", width: 60, maxWidth: 60, minWidth: 60, cellStyle: { display: "flex", alignItems: "center", justifyContent: "center" }, cellRenderer: p => <input type="checkbox" checked={p.data.selected} onChange={() => toggleItem(p.data)} /> },
          { field: "so_key", headerName: "SO", flex: 1 },
          { field: "so_line", headerName: "LINE", flex: 0.5 },
          { field: "destination_key", headerName: "DEST", flex: 0.8 },
          { field: "product_key", headerName: "PRODUCT", flex: 1 },
          { field: "kit_key", headerName: "SET", flex: 0.5 },
          { field: "qty_confirmed", headerName: "CONFIRM", flex: 0.6, type: "rightAligned" },
          { headerName: "REMAIN", flex: 0.6, type: "rightAligned", valueGetter: p => p.data.qty_confirmed - p.data.qty_invoiced },
          { headerName: "QTY", flex: 0.7, type: "rightAligned", cellRenderer: p => p.data.selected ? <input type="number" className="w-16 border rounded px-1 text-right text-sm" value={p.data.qty_use} onChange={e => updateQty(p.data.so_key, p.data.so_line, e.target.value)} /> : "" },
        ]} defaultColDef={{ sortable: true, filter: true, resizable: true, suppressHeaderMenuButton: true }} suppressCellFocus getRowStyle={p => p.node.rowPinned ? { background: "#eff6ff" } : null} />
      </div>
    </div>
  )
}
