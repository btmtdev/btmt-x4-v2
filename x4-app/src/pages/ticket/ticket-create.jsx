import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { SlidePanel } from "@/components/slide-panel"

export function TicketCreate({ showCreate, setShowCreate, form, setForm, files, setFiles, uploading, setUploading, uploadFiles, fileListRef, create, createWidth, setCreateWidth, permissions, t, i18n, CATEGORIES, CAT_KEY, PRIORITIES, PRI_KEY }) {
  const [errors, setErrors] = useState({})
  if (!showCreate) return null

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.subject.trim()) { setErrors({ subject: true }); return }
    create(e)
  }

  return (
    <SlidePanel width={createWidth} onClose={() => setShowCreate(false)} onResize={setCreateWidth}
      header={
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-base font-semibold">{t("SUPPORT.NEW_CASE")}</h3>
          <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">&times;</button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <div className="space-y-2">
            <Label>{t("SUPPORT.SUBJECT")} <span className="text-destructive">*</span></Label>
            <Input value={form.subject} onChange={e => { setForm(f => ({ ...f, subject: e.target.value })); setErrors({}) }} className={errors.subject ? "border-destructive" : ""} placeholder={t("SUPPORT.SUBJECT_PLACEHOLDER")} />
            {errors.subject && <p className="text-sm text-destructive">{t("SUPPORT.REQUIRED")}</p>}
          </div>

          <div className="space-y-2">
            <Label>{t("SUPPORT.TYPE")}</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORIES.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, category: c }))} className={`rounded-md border px-3 py-2 text-sm transition-colors ${form.category === c ? "border-primary bg-primary/5 text-primary font-medium" : "border-border text-muted-foreground hover:bg-accent"}`}>{t(CAT_KEY[c])}</button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("SUPPORT.PRIORITY")}</Label>
            <div className="flex gap-1.5">
              {PRIORITIES.map(p => (
                <button key={p} type="button" onClick={() => setForm(f => ({ ...f, priority: p }))} className={`flex-1 rounded-md border px-2 py-1.5 text-sm transition-colors ${form.priority === p ? "border-primary bg-primary/5 text-primary font-medium" : "border-border text-muted-foreground hover:bg-accent"}`}>{t(PRI_KEY[p])}</button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("SUPPORT.DESCRIPTION")}</Label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[100px] resize-y" placeholder={t("SUPPORT.DESCRIPTION_PLACEHOLDER")} />
          </div>

          <div className="space-y-2">
            <Label>{t("SUPPORT.RELATED_MENU")}</Label>
            <select value={form.permission_id} onChange={e => setForm(f => ({ ...f, permission_id: e.target.value || "" }))} className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">—</option>
              {[...permissions].sort((a, b) => a.level - b.level).map(p => <option key={p.key} value={p.key}>{"  ".repeat(p.level || 0)}{i18n.language === "th" ? (p.name_th || p.name_en) : (p.name_en || p.name_th)}</option>)}
            </select>
          </div>
        </div>

        <Separator />
        <div className="px-5 py-3 space-y-1.5 shrink-0">
          {files.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {files.map((url, i) => (
                <span key={i} className="text-sm bg-muted px-2 py-0.5 rounded">{url.split("/").pop()} <button type="button" onClick={() => setFiles(f => f.filter((_, j) => j !== i))} className="hover:text-destructive">&times;</button></span>
              ))}
            </div>
          )}
          {uploading && <p className="text-sm text-primary animate-pulse">{t("SUPPORT.UPLOADING")}</p>}
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center h-8 px-2 border border-input rounded-md cursor-pointer hover:bg-accent text-sm text-muted-foreground shrink-0">
              {t("SUPPORT.ATTACH_FILE")}
              <input type="file" className="hidden" onChange={async e => { const file = e.target.files?.[0]; if (!file) return; setUploading(true); const urls = await uploadFiles([file]); if (urls.length) setFiles(f => [...f, ...urls]); setUploading(false); e.target.value = "" }} />
            </label>
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowCreate(false)}>{t("CANCEL")}</Button>
              <Button type="submit" size="sm">{t("SUPPORT.OPEN_CASE")}</Button>
            </div>
          </div>
        </div>
      </form>
    </SlidePanel>
  )
}
