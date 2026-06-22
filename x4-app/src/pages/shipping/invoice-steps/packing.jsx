import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Lock, Wand2, Trash2, Plus, Package, ListOrdered } from "lucide-react"
import { toast } from "@/lib/toast"

export default function InvoicePacking({ invoiceKey, items, packing, setPacking, packingItems, setPackingItems, lockedSeqs, setLockedSeqs, containerType, setContainerType, containers, unitVolMap = {}, t, revision = 0 }) {
  const [containerCount, setContainerCount] = useState(1)

  const reSeqAll = () => {
    const seqMap = {}
    packing.forEach((p, i) => { seqMap[p.seq_no] = i + 1 })
    const updated = packing.map((p, i) => ({ ...p, seq_no: i + 1 }))
    setPackingItems(prev => prev.map(pi => ({ ...pi, seq_no: seqMap[pi.seq_no] ?? pi.seq_no })))
    setLockedItems(prev => {
      const s = new Set()
      prev.forEach(key => { const [seq, ...rest] = key.split("|"); const newSeq = seqMap[Number(seq)]; if (newSeq) s.add(`${newSeq}|${rest.join("|")}`) })
      return s
    })
    setPacking(updated)
  }
  const [lockedItems, setLockedItems] = useState(new Set())

  const toggleLockItem = (seqNo, soKey, soLine) => {
    const key = `${seqNo}|${soKey}|${soLine}`
    setLockedItems(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s })
  }

  const autoGen = () => {
    if (packing.length === 0) { toast.error(t("DOCFLOW.PACK_ADD_FIRST")); return }
    // Keep locked items (item-level)
    const lockedPIs = packingItems.filter(pi => lockedItems.has(`${pi.seq_no}|${pi.so_key}|${pi.so_line}`))
    // Calculate what's locked packed
    const lockedPacked = {}
    lockedPIs.forEach(pi => { lockedPacked[`${pi.so_key}|${pi.so_line}`] = (lockedPacked[`${pi.so_key}|${pi.so_line}`] || 0) + (pi.qty || 0) })
    // Items to pack (exclude locked qty)
    const toPack = items.map(it => ({ ...it, remaining: it.qty - (lockedPacked[`${it.so_key}|${it.so_line}`] || 0) })).filter(it => it.remaining > 0)
    if (toPack.length === 0) { toast.info(t("DOCFLOW.PACK_ALL_PACKED")); return }
    // Fill containers with unlocked space
    const newPackItems = [...lockedPIs]
    const containerUsed = {}
    lockedPIs.forEach(pi => { containerUsed[pi.seq_no] = (containerUsed[pi.seq_no] || 0) + (pi.volume || 0) })

    for (const it of toPack) {
      let remaining = it.remaining
      for (const cont of packing) {
        if (remaining <= 0) break
        const cType = containers.find(c => (c.key_ || c.key) === cont.container_type)
        const maxV = cType?.volume_max || 67
        const used = containerUsed[cont.seq_no] || 0
        const space = maxV - used
        const unitVol = unitVolMap[it.product_key] || 0.001
        const canFit = unitVol > 0 ? Math.floor(space / unitVol) : remaining
        if (canFit <= 0) continue
        const toPlace = Math.min(canFit, remaining)
        newPackItems.push({ seq_no: cont.seq_no, so_key: it.so_key, so_line: it.so_line, product_key: it.product_key, kit_key: it.kit_key, description: it.product_key, qty: toPlace, volume: Math.round(toPlace * unitVol * 10000) / 10000 })
        containerUsed[cont.seq_no] = (containerUsed[cont.seq_no] || 0) + toPlace * unitVol
        remaining -= toPlace
      }
    }
    setPackingItems(newPackItems)
    toast.success(t("DOCFLOW.PACK_DONE"))
  }

  // Packed qty per item
  const packedQty = {}
  packingItems.forEach(pi => { packedQty[`${pi.so_key}|${pi.so_line}`] = (packedQty[`${pi.so_key}|${pi.so_line}`] || 0) + (pi.qty || 0) })

  const unpackedItems = items.map(it => {
    const packed = packedQty[`${it.so_key}|${it.so_line}`] || 0
    return { ...it, remaining: it.qty - packed }
  }).filter(it => it.remaining > 0)

  const addContainers = () => {
    const startSeq = packing.length > 0 ? Math.max(...packing.map(p => p.seq_no)) + 1 : 1
    setPacking(prev => [...prev, ...Array.from({ length: containerCount }, (_, i) => ({
      seq_no: startSeq + i, container_type: containerType || ""
    }))])
  }

  const deleteContainer = (seqNo) => {
    setPacking(prev => prev.filter(p => p.seq_no !== seqNo))
    setPackingItems(prev => prev.filter(p => p.seq_no !== seqNo))
  }

  const addToContainer = (seqNo, it) => {
    const unitVol = unitVolMap[it.product_key] || 0
    setPackingItems(prev => [...prev, {
      seq_no: seqNo, so_key: it.so_key, so_line: it.so_line,
      product_key: it.product_key, kit_key: it.kit_key,
      description: it.product_key, qty: it.remaining, volume: Math.round(it.remaining * unitVol * 10000) / 10000,
    }])
  }

  const removeFromContainer = (seqNo, soKey, soLine) => {
    setPackingItems(prev => prev.filter(p => !(p.seq_no === seqNo && p.so_key === soKey && p.so_line === soLine)))
  }

  const updateItemQty = (seqNo, soKey, soLine, qty) => {
    setPackingItems(prev => prev.map(p => {
      if (p.seq_no === seqNo && p.so_key === soKey && p.so_line === soLine) {
        const unitVol = unitVolMap[p.product_key] || 0
        return { ...p, qty: Number(qty), volume: Math.round(Number(qty) * unitVol * 10000) / 10000 }
      }
      return p
    }))
  }

  const grouped = packing.map(p => {
    const pitems = packingItems.filter(pi => pi.seq_no === p.seq_no)
    const totalVol = pitems.reduce((s, pi) => s + (pi.volume || 0), 0)
    const totalQty = pitems.reduce((s, pi) => s + (pi.qty || 0), 0)
    const cType = containers.find(c => (c.key_ || c.key) === p.container_type)
    const maxV = cType?.volume_max || 67
    const pct = maxV > 0 ? Math.round((totalVol / maxV) * 100) : 0
    return { ...p, items: pitems, total_vol: totalVol, total_qty: totalQty, max_vol: maxV, pct }
  })

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-auto">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap border-b pb-3">
        <select className="h-8 border rounded px-2 text-sm bg-background" value={containerType} onChange={e => setContainerType(e.target.value)}>
          <option value="">{t("DOCFLOW.PACK_CONTAINER_TYPE")}</option>
          {containers.map(c => <option key={c.key_ || c.key} value={c.key_ || c.key}>{c.key_ || c.key} — {c.description}</option>)}
        </select>
        <input className="h-8 w-14 border rounded px-2 text-sm text-center" type="number" min={1} value={containerCount} onChange={e => setContainerCount(Math.max(1, Number(e.target.value)))} />
        <Button size="sm" variant="outline" className="text-sm gap-1" onClick={addContainers} disabled={!containerType}><Plus size={14} /> {t("DOCFLOW.PACK_ADD")}</Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button size="sm" className="text-sm gap-1" onClick={autoGen} disabled={!containerType}><Wand2 size={14} /> {t("DOCFLOW.PACK_AUTO")}</Button>
        {revision === 0 && packing.length > 0 && <Button size="sm" variant="outline" className="text-sm gap-1" onClick={reSeqAll}><ListOrdered size={14} /> {t("DOCFLOW.PACK_RESEQ")}</Button>}
        {packing.length > 0 && <Button size="sm" variant="ghost" className="text-sm text-red-500" onClick={() => { setPackingItems(prev => prev.filter(pi => lockedItems.has(`${pi.seq_no}|${pi.so_key}|${pi.so_line}`))) }}>{t("DOCFLOW.PACK_CLEAR")}</Button>}
      </div>

      {/* Unpacked summary */}
      {unpackedItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded p-2">
          <p className="text-sm font-semibold text-amber-700 mb-1">{t("DOCFLOW.PACK_UNPACKED")} ({unpackedItems.length})</p>
          <div className="flex flex-wrap gap-1">
            {unpackedItems.map(it => (
              <span key={`${it.so_key}|${it.so_line}`} className="text-sm bg-white border rounded px-1.5 py-0.5">{it.product_key}/{it.kit_key} <span className="text-muted-foreground">×{it.remaining}</span></span>
            ))}
          </div>
        </div>
      )}

      {/* Containers */}
      {grouped.map((cont, idx) => {
        return (
        <div key={cont.seq_no} className="border rounded">
          <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">#{cont.seq_no}</span>
              <span className="text-sm px-1.5 py-0.5 bg-background border rounded">{cont.container_type || "—"}</span>
              <span className="text-sm text-muted-foreground">{cont.total_qty} pcs</span>
              <span className="text-sm text-muted-foreground">|</span>
              <span className="text-sm">{cont.total_vol.toFixed(2)} / {cont.max_vol} m³</span>
              <div className="w-16 h-2 bg-gray-200 rounded overflow-hidden">
                <div className={`h-full ${cont.pct > 95 ? "bg-red-500" : cont.pct > 80 ? "bg-amber-400" : "bg-green-500"}`} style={{ width: `${Math.min(cont.pct, 100)}%` }} />
              </div>
              <span className="text-sm font-medium">{cont.pct}%</span>
            </div>
            <div className="flex items-center gap-1">
              {unpackedItems.length > 0 && (
                <select className="h-6 border rounded px-1 text-sm bg-background" value="" onChange={e => { if (e.target.value) { const it = unpackedItems.find(x => `${x.so_key}|${x.so_line}` === e.target.value); if (it) addToContainer(cont.seq_no, it); e.target.value = "" } }}>
                  <option value="">+ {t("DOCFLOW.PACK_ADD")}</option>
                  {unpackedItems.map(it => <option key={`${it.so_key}|${it.so_line}`} value={`${it.so_key}|${it.so_line}`}>{it.product_key}/{it.kit_key} ×{it.remaining}</option>)}
                </select>
              )}
              {!cont.items.some(pi => lockedItems.has(`${cont.seq_no}|${pi.so_key}|${pi.so_line}`)) && (
                <button className="text-red-400 hover:text-red-600 p-1" onClick={() => deleteContainer(cont.seq_no)}><Trash2 size={13} /></button>
              )}
            </div>
          </div>
          {cont.items.length > 0 ? (
            <table className="w-full text-sm table-fixed">
              <thead><tr className="text-left text-muted-foreground border-b">
                <th className="py-0.5 px-2 w-[30px]"></th><th className="py-0.5 w-[120px]">PRODUCT</th><th className="py-0.5 w-[50px]">SET</th><th className="py-0.5 w-[110px]">SO</th><th className="py-0.5 w-[40px]">LINE</th><th className="py-0.5 text-right w-[70px]">QTY</th><th className="py-0.5 text-right pr-3 w-[80px]">VOL</th><th className="py-0.5 w-[24px]"></th>
              </tr></thead>
              <tbody>
                {cont.items.map((pi, i) => {
                  const itemKey = `${cont.seq_no}|${pi.so_key}|${pi.so_line}`
                  const isLocked = lockedItems.has(itemKey)
                  return (
                  <tr key={i} className={`border-b border-border/20 hover:bg-muted/20 ${isLocked ? "bg-green-50" : ""}`}>
                    <td className="py-0.5 px-2"><button onClick={() => toggleLockItem(cont.seq_no, pi.so_key, pi.so_line)} className={isLocked ? "text-green-600" : "text-muted-foreground/40 hover:text-muted-foreground"}><Lock size={12} /></button></td>
                    <td className="py-0.5 font-medium">{pi.product_key}</td>
                    <td className="py-0.5">{pi.kit_key}</td>
                    <td className="py-0.5 text-muted-foreground">{pi.so_key}</td>
                    <td className="py-0.5 text-muted-foreground">{pi.so_line}</td>
                    <td className="py-0.5 text-right">{isLocked ? <span className="text-sm pr-1">{pi.qty}</span> : <input type="number" className="w-16 border rounded px-1 text-right text-sm h-5" value={pi.qty} onChange={e => updateItemQty(cont.seq_no, pi.so_key, pi.so_line, e.target.value)} />}</td>
                    <td className="py-0.5 text-right pr-3 text-muted-foreground">{pi.volume ? pi.volume.toFixed(4) : "—"}</td>
                    <td className="py-0.5">{isLocked ? <span className="text-muted-foreground">—</span> : <button className="text-red-400 hover:text-red-600" onClick={() => removeFromContainer(cont.seq_no, pi.so_key, pi.so_line)}>✕</button>}</td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground p-3 italic">{t("DOCFLOW.PACK_EMPTY_CONTAINER")}</p>
          )}
        </div>
      )})}

      {grouped.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Package size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t("DOCFLOW.PACK_EMPTY_HINT")}</p>
          </div>
        </div>
      )}
    </div>
  )
}
