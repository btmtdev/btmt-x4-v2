export function FileAttachment({ files, setFiles, uploading, t }) {
  if (!files.length && !uploading) return null
  return (
    <div className="px-5 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("SUPPORT.ATTACHMENTS")}</span>
        {uploading && <span className="text-sm text-primary animate-pulse">{t("SUPPORT.UPLOADING")}</span>}
      </div>
      {files.length > 0 && (
        <div className="max-h-20 overflow-y-auto space-y-0.5">
          {files.map((url, i) => (
            <div key={i} className="flex items-center gap-2 text-sm py-1 group">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
              <a href={url} target="_blank" rel="noopener" className="text-foreground hover:text-primary truncate flex-1">{url.split("/").pop()}</a>
              <button onClick={() => setFiles(f => f.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
