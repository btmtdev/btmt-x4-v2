import { useState, useEffect } from "react"

const WAREHOUSE_URL = import.meta.env.VITE_WAREHOUSE_API_URL ?? "/warehouse"

export default function StockOverviewPage() {
  const [stock, setStock] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${WAREHOUSE_URL}/api/stock`)
      .then(r => r.json())
      .then(res => { if (res.status) setStock(res.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="p-6 text-muted-foreground">Loading...</p>

  const columns = stock.length > 0 ? Object.keys(stock[0]) : []

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Stock Overview</h1>
      <div className="border rounded-lg overflow-auto max-h-[70vh]">
        <table className="w-full text-sm">
          <thead className="bg-muted sticky top-0">
            <tr>
              {columns.map(col => (
                <th key={col} className="text-left px-3 py-2 font-medium whitespace-nowrap">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stock.map((row, i) => (
              <tr key={i} className="border-t hover:bg-muted/50">
                {columns.map(col => (
                  <td key={col} className="px-3 py-1.5 whitespace-nowrap">{row[col] ?? ""}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">{stock.length} records</p>
    </div>
  )
}
