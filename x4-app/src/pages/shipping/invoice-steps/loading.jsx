export default function InvoiceLoading({ packing, setPacking, t }) {
  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10) })()

  return (
    <div className="p-4 space-y-3">
      <h4 className="text-sm font-semibold">{t("DOCFLOW.STEP_LOADING")} ({packing.length})</h4>
      <table className="w-full text-sm border rounded">
        <thead>
          <tr className="border-b bg-muted/30 text-muted-foreground">
            <th className="p-2 text-left">#</th>
            <th className="p-2 text-left">{t("DOCFLOW.LOAD_JOB_NO")}</th>
            <th className="p-2 text-left">{t("DOCFLOW.LOAD_CONTAINER_NO")}</th>
            <th className="p-2 text-left">{t("DOCFLOW.LOAD_DATE")}</th>
            <th className="p-2 text-left">{t("DOCFLOW.LOAD_PERIOD")}</th>
          </tr>
        </thead>
        <tbody>
          {packing.map(cont => (
            <tr key={cont.seq_no} className="border-b">
              <td className="p-2 font-bold">{cont.seq_no}</td>
              <td className="p-2"><span className="text-sm text-muted-foreground">—</span></td>
              <td className="p-2"><input className="h-7 border rounded px-2 text-sm w-full" value={cont.container_no || ""} onChange={e => setPacking(prev => prev.map(p => p.seq_no === cont.seq_no ? { ...p, container_no: e.target.value } : p))} /></td>
              <td className="p-2"><input className="h-7 border rounded px-2 text-sm" type="date" value={cont.loading_date || tomorrow} onChange={e => setPacking(prev => prev.map(p => p.seq_no === cont.seq_no ? { ...p, loading_date: e.target.value } : p))} /></td>
              <td className="p-2">
                <select className="h-7 border rounded px-2 text-sm" value={cont.loading_time_period || ""} onChange={e => setPacking(prev => prev.map(p => p.seq_no === cont.seq_no ? { ...p, loading_time_period: e.target.value } : p))}>
                  <option value="">-</option>
                  {["P1","P2","P3","P4","P5","P6"].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {packing.length === 0 && <p className="text-sm text-muted-foreground">{t("DOCFLOW.LOAD_NO_CONTAINERS")}</p>}
    </div>
  )
}
