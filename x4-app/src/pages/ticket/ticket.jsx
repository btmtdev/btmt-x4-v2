import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Badge, BadgeDot } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { adminService } from "@/services/admin"
import { toast } from "@/lib/toast"
import { useToolbar } from "@/layouts/desktop/layout"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { timeAgo } from "@/components/time-ago"
import { TicketCreate } from "./ticket-create"

import { getApiUrl } from "@/lib/env"

const BASE_URL = getApiUrl()
const req = (p, o = {}) => fetch(`${BASE_URL}${p}`, { headers: { "Content-Type": "application/json" }, ...o }).then(r => r.json()).then(d => d.data)

const STATUSES = ["open", "in-progress", "resolved", "closed"]
const STATUS_KEY = { open: "SUPPORT.STATUS_OPEN", "in-progress": "SUPPORT.STATUS_IN_PROGRESS", resolved: "SUPPORT.STATUS_RESOLVED", closed: "SUPPORT.STATUS_CLOSED" }
const STATUS_DOT = { open: "bg-blue-500", "in-progress": "bg-amber-500", resolved: "bg-emerald-500", closed: "bg-zinc-400" }
const STATUS_BADGE = { open: "primary", "in-progress": "warning", resolved: "success", closed: "secondary" }
const CATEGORIES = ["bug", "change-request", "question", "access"]
const CAT_KEY = { bug: "SUPPORT.CAT_BUG", "change-request": "SUPPORT.CAT_CHANGE_REQUEST", question: "SUPPORT.CAT_QUESTION", access: "SUPPORT.CAT_ACCESS" }
const CAT_VARIANT = { bug: "destructive", "change-request": "info", question: "warning", access: "success" }
const PRIORITIES = ["low", "medium", "high", "critical"]
const PRI_KEY = { low: "SUPPORT.PRI_LOW", medium: "SUPPORT.PRI_MEDIUM", high: "SUPPORT.PRI_HIGH", critical: "SUPPORT.PRI_CRITICAL" }
const PRI_VARIANT = { low: "secondary", medium: "primary", high: "warning", critical: "destructive" }

export default function TicketsPage() {
  const { t, i18n } = useTranslation()
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState([])
  const [permissions, setPermissions] = useState([])
  const [isAdmin, setCanManage] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState({ subject: "", description: "", permission_id: "", category: "bug", priority: "medium" })
  const [filter, setFilter] = useState("active")
  const [search, setSearch] = useState("")
  const [comment, setComment] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [files, setFiles] = useState([])
  const [commentFiles, setCommentFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [createWidth, setCreateWidth] = useState(32)
  const historyEndRef = useRef(null)
  const fileListRef = useRef(null)

  useEffect(() => {
    Promise.all([
      req("/api/tickets").then(setTickets),
      adminService.getEffectivePermissions(user.key).then(setPermissions).catch(() => {}),
      adminService.getUserRoles(user.key).then(data => setCanManage((data.roles || []).includes("admin"))).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  function load() { req("/api/tickets").then(setTickets) }

  async function uploadFiles(fileList) {
    const urls = []
    for (const file of fileList) {
      const fd = new FormData(); fd.append("file", file); fd.append("prefix", "x4-tickets")
      const res = await fetch(`${BASE_URL}/api/upload`, { method: "POST", body: fd })
      const data = await res.json(); const url = data.url || data.data?.url; if (url) urls.push(url)
    }
    return urls
  }

  async function create(e) {
    e.preventDefault()
    let desc = form.description || ""
    if (files.length) desc += (desc ? "\n\n" : "") + files.map(u => `[file](${u})`).join("\n")
    await req("/api/tickets", { method: "POST", body: JSON.stringify({ topic: form.subject, description: desc, path: form.permission_id || null, category: form.category, priority: form.priority, created_by: user.key }) })
    setShowCreate(false); setForm({ subject: "", description: "", permission_id: "", category: "bug", priority: "medium" }); setFiles([]); load()
    toast.success(t("SUPPORT.CASE_CREATED"))
  }

  async function changeStatus(ticketId, status) {
    await req(`/api/tickets/${ticketId}/status`, { method: "PUT", body: JSON.stringify({ user_key: user.key, status, comment: status }) })
    load(); if (selected?.key === ticketId) openDetail(selected)
    toast.success(t("SUPPORT.STATUS_UPDATED"))
  }

  async function openDetail(t2) {
    setSelected(t2)
    setDetail(await req(`/api/tickets/${t2.key}`))
    setTimeout(() => historyEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
  }

  async function addComment() {
    if (!comment.trim() && !commentFiles.length) return
    let text = comment
    if (commentFiles.length) text += (text ? "\n" : "") + commentFiles.map(u => `[file](${u})`).join("\n")
    await req(`/api/tickets/${selected.key}/comment`, { method: "POST", body: JSON.stringify({ user_key: user.key, comment: text }) })
    setComment(""); setCommentFiles([]); openDetail(selected)
    toast.success(t("SUPPORT.COMMENT_ADDED"))
  }

  async function deleteHistory(ticketId, historyId) { await req(`/api/tickets/${ticketId}/history/${historyId}`, { method: "DELETE" }); openDetail(selected) }
  async function deleteTicket(ticketId) { setConfirmDelete(ticketId) }
  async function confirmDeleteTicket() { await req(`/api/tickets/${confirmDelete}`, { method: "DELETE" }); setConfirmDelete(null); setSelected(null); setDetail(null); load(); toast.success(t("SUPPORT.CASE_DELETED")) }

  function renderComment(text) {
    if (!text) return null
    const parts = text.split(/(\[file\]\([^)]+\))/)
    return parts.map((part, i) => {
      const m = part.match(/\[file\]\(([^)]+)\)/)
      if (m) { const url = m[1]; if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)) return <img key={i} src={url} alt="" className="max-w-[180px] rounded mt-1 cursor-pointer" onClick={() => window.open(url, "_blank")} />; return <a key={i} href={url} target="_blank" rel="noopener" className="text-primary hover:underline text-sm">{url.split("/").pop()}</a> }
      return part ? <span key={i}>{part}</span> : null
    })
  }

  function getPermPath(id) { if (!id) return null; const p = permissions.find(x => x.key === id); return p?.path ? { name: i18n.language === "th" ? (p.name_th || p.name_en) : (p.name_en || p.name_th), path: p.path } : null }

  const filtered = tickets.filter(t2 => {
    if (filter === "active" && t2.status === "closed") return false
    if (filter !== "all" && filter !== "active" && t2.status !== filter) return false
    if (search && !t2.topic.toLowerCase().includes(search.toLowerCase()) && !t2.key.includes(search)) return false
    return true
  })

  const setToolbar = useToolbar()
  useEffect(() => {
    setToolbar(<Button size="sm" onClick={() => setShowCreate(true)}>+ {t("SUPPORT.NEW_CASE")}</Button>)
    return () => setToolbar(null)
  }, [i18n.language])

  if (loading) return <div className="flex items-center justify-center h-full"><Spinner /></div>

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left: List Panel */}
      <div className="w-[380px] shrink-0 border-r border-border flex flex-col bg-background">
        {/* Filters */}
        <div className="p-3 space-y-2 border-b border-border">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("MASTER.SEARCH")} className="h-8 text-sm" />
          <select value={filter} onChange={e => setFilter(e.target.value)} className="w-full h-8 text-sm border border-input rounded-md px-2 bg-background">
            <option value="active">{t("SUPPORT.ACTIVE")} ({tickets.filter(t2 => t2.status !== "closed").length})</option>
            <option value="all">{t("ALL")} ({tickets.length})</option>
            {STATUSES.map(s => <option key={s} value={s}>{t(STATUS_KEY[s])} ({tickets.filter(t2 => t2.status === s).length})</option>)}
          </select>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.map(t2 => (
            <div
              key={t2.key}
              onClick={() => openDetail(t2)}
              className={`px-3 py-2.5 border-b border-border/50 cursor-pointer transition-colors ${selected?.key === t2.key ? "bg-accent" : "hover:bg-muted/50"}`}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`size-2 rounded-full shrink-0 ${STATUS_DOT[t2.status]}`} />
                <span className="text-sm font-mono text-muted-foreground">{t2.key}</span>
                {t2.priority && t2.priority !== "medium" && <Badge variant={PRI_VARIANT[t2.priority]} appearance="light" size="xs">{t(PRI_KEY[t2.priority])}</Badge>}
                <Badge variant={CAT_VARIANT[t2.category]} appearance="light" size="xs" className="ml-auto">{t(CAT_KEY[t2.category])}</Badge>
              </div>
              <p className="text-sm leading-snug line-clamp-1 pl-4">{t2.topic}</p>
              <p className="text-sm text-muted-foreground pl-4 mt-0.5">{t2.created_by} · {timeAgo(t2.updated_at || t2.created_at, i18n.language, t)}</p>
            </div>
          ))}
          {!filtered.length && <p className="text-sm text-muted-foreground text-center py-10">{t("SUPPORT.NO_ITEMS")}</p>}
        </div>
      </div>

      {/* Right: Detail Panel */}
      <div className="flex-1 flex flex-col min-w-0 bg-muted/20">
        {selected && detail ? (
          <>
            {/* Detail Header */}
            <div className="px-6 py-4 bg-background border-b border-border space-y-3">
              <div className="flex items-start justify-between gap-4">
                {isAdmin ? (
                  <input className="text-base font-semibold flex-1 bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none" value={detail.ticket?.topic || ""} onChange={e => { detail.ticket.topic = e.target.value; setDetail({ ...detail }) }} onBlur={() => req(`/api/tickets/${detail.ticket.key}`, { method: "PUT", body: JSON.stringify({ topic: detail.ticket.topic }) }).then(load)} />
                ) : (
                  <h2 className="text-base font-semibold flex-1">{detail.ticket?.topic}</h2>
                )}
                {isAdmin && <Button variant="ghost" size="sm" className="text-destructive shrink-0" onClick={() => deleteTicket(detail.ticket.key)}>{t("DELETE")}</Button>}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={STATUS_BADGE[detail.ticket?.status]} appearance="outline" size="sm"><BadgeDot />{t(STATUS_KEY[detail.ticket?.status])}</Badge>
                <Badge variant={CAT_VARIANT[detail.ticket?.category]} appearance="light" size="sm">{t(CAT_KEY[detail.ticket?.category])}</Badge>
                {detail.ticket?.priority && detail.ticket.priority !== "medium" && <Badge variant={PRI_VARIANT[detail.ticket.priority]} appearance="light" size="sm">{t(PRI_KEY[detail.ticket.priority])}</Badge>}
                <Separator orientation="vertical" className="h-4 mx-1" />
                <span className="text-sm text-muted-foreground">{detail.ticket?.created_by}</span>
                <span className="text-sm text-muted-foreground">· {new Date(detail.ticket?.created_at).toLocaleDateString(i18n.language === "th" ? "th-TH" : "en-US", { day: "numeric", month: "short", year: "numeric" })}</span>
                {getPermPath(detail.ticket?.path) && <a href={getPermPath(detail.ticket?.path).path} target="_blank" rel="noopener" className="text-sm text-primary hover:underline ml-1">{getPermPath(detail.ticket?.path).name}</a>}
              </div>

              {isAdmin && (
                <div className="flex gap-2">
                  <select value={detail.ticket?.status || "open"} onChange={e => changeStatus(detail.ticket.key, e.target.value)} className="text-sm border border-input rounded-md px-2 py-1 bg-background">
                    {STATUSES.map(s => <option key={s} value={s}>{t(STATUS_KEY[s])}</option>)}
                  </select>
                  <select value={detail.ticket?.category || ""} onChange={e => { detail.ticket.category = e.target.value; setDetail({ ...detail }); req(`/api/tickets/${detail.ticket.key}`, { method: "PUT", body: JSON.stringify({ category: e.target.value }) }).then(load) }} className="text-sm border border-input rounded-md px-2 py-1 bg-background">
                    {CATEGORIES.map(c => <option key={c} value={c}>{t(CAT_KEY[c])}</option>)}
                  </select>
                  <select value={detail.ticket?.priority || "medium"} onChange={e => { detail.ticket.priority = e.target.value; setDetail({ ...detail }); req(`/api/tickets/${detail.ticket.key}`, { method: "PUT", body: JSON.stringify({ priority: e.target.value }) }).then(load) }} className="text-sm border border-input rounded-md px-2 py-1 bg-background">
                    {PRIORITIES.map(p => <option key={p} value={p}>{t(PRI_KEY[p])}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Description */}
            {detail.ticket?.description && (
              <div className="px-6 py-4 bg-background border-b border-border">
                <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/80">
                  {renderComment(detail.ticket.description.replace(/\[file\]\([^)]+\)/g, "").trim())}
                </div>
                {(() => {
                  const f = [...(detail.ticket.description.matchAll(/\[file\]\(([^)]+)\)/g))].map(m => m[1])
                  return f.length ? <div className="flex flex-wrap gap-2 mt-2">{f.map((url, i) => <a key={i} href={url} target="_blank" rel="noopener" className="text-sm text-primary hover:underline">{url.split("/").pop()}</a>)}</div> : null
                })()}
              </div>
            )}

            {/* Activity */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {detail.history?.map(h => {
                const isComment = h.action === "comment"
                return (
                  <div key={h.id} className="group">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{h.updated_by}</span>
                      <span className="text-muted-foreground">{timeAgo(h.updated_at, i18n.language, t)}</span>
                      {!isComment && <span className="text-muted-foreground italic">{h.action}{h.comment && h.action !== "created" ? ` → ${h.comment.replace(/^(Assigned to |Update status to )/i, "")}` : ""}</span>}
                      {isAdmin && <button onClick={() => deleteHistory(detail.ticket.key, h.id)} className="ml-auto opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">&times;</button>}
                    </div>
                    {isComment && h.comment && (
                      <div className="mt-1 text-sm bg-background rounded-md px-3 py-2 border border-border leading-relaxed">{renderComment(h.comment)}</div>
                    )}
                  </div>
                )
              })}
              <div ref={historyEndRef} />
            </div>

            {/* Comment box */}
            <div className="px-6 py-3 bg-background border-t border-border space-y-1.5 shrink-0">
              {commentFiles.length > 0 && <div className="flex flex-wrap gap-1">{commentFiles.map((url, i) => <span key={i} className="text-sm bg-muted px-2 py-0.5 rounded">{url.split("/").pop()} <button onClick={() => setCommentFiles(f => f.filter((_, j) => j !== i))} className="hover:text-destructive">&times;</button></span>)}</div>}
              {uploading && <p className="text-sm text-primary animate-pulse">{t("SUPPORT.UPLOADING")}</p>}
              <div className="flex gap-2">
                <Input placeholder={t("SUPPORT.ADD_COMMENT")} value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === "Enter" && addComment()} className="flex-1 h-8 text-sm" />
                <label className="inline-flex items-center h-8 px-2 border border-input rounded-md cursor-pointer hover:bg-accent text-sm text-muted-foreground shrink-0">
                  {t("SUPPORT.ATTACH_FILE")}
                  <input type="file" className="hidden" onChange={async e => { const file = e.target.files?.[0]; if (!file) return; setUploading(true); const urls = await uploadFiles([file]); if (urls.length) setCommentFiles(f => [...f, ...urls]); setUploading(false); e.target.value = "" }} />
                </label>
                <Button size="sm" onClick={addComment}>{t("SEND")}</Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            {t("SUPPORT.NO_ITEMS")}
          </div>
        )}
      </div>

      <TicketCreate showCreate={showCreate} setShowCreate={setShowCreate} form={form} setForm={setForm} files={files} setFiles={setFiles} uploading={uploading} setUploading={setUploading} uploadFiles={uploadFiles} fileListRef={fileListRef} create={create} createWidth={createWidth} setCreateWidth={setCreateWidth} permissions={permissions} t={t} i18n={i18n} CATEGORIES={CATEGORIES} CAT_KEY={CAT_KEY} PRIORITIES={PRIORITIES} PRI_KEY={PRI_KEY} />
      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={confirmDeleteTicket} title={t("SUPPORT.DELETE_CASE")} message={t("SUPPORT.DELETE_CASE_CONFIRM")} confirmLabel={t("DELETE")} cancelLabel={t("CANCEL")} />
    </div>
  )
}


