import { Button } from "@/components/ui/button"
import { createPortal } from "react-dom"

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Delete", cancelLabel = "Cancel", deleting, deleteLogs, deleteSuccess, deleteCountdown }) {
  if (!open) return null
  return createPortal(
    <>
      <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={deleting ? undefined : onClose} />
      <div className="fixed z-[61] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background rounded-lg border border-border shadow-2xl w-96 overflow-hidden">
        {!deleting ? (
          <>
            <div className="p-6 flex gap-4">
              <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="size-6 text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </div>
              <div>
                <h4 className="text-base font-semibold">{title}</h4>
                {message && <p className="text-sm text-muted-foreground mt-1">{message}</p>}
              </div>
            </div>
            <div className="flex gap-2 px-6 py-4 border-t border-border bg-muted/30 justify-end">
              <Button variant="outline" onClick={onClose}>{cancelLabel}</Button>
              <Button variant="destructive" onClick={onConfirm}>{confirmLabel}</Button>
            </div>
          </>
        ) : (
          <div className="p-6 space-y-3">
            <h4 className="text-base font-semibold text-center">{title}: {deleting}</h4>
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1 font-mono text-sm max-h-48 overflow-auto">
              {deleteLogs?.map((log, i) => (
                <p key={i} className="text-muted-foreground">{log}</p>
              ))}
            </div>
            {deleteSuccess && (
              <div className="flex flex-col items-center gap-2 pt-2">
                <svg className="size-14 text-green-500 animate-[scale-in_0.3s_ease-out]" viewBox="0 0 52 52">
                  <circle className="stroke-current fill-none" strokeWidth="3" cx="26" cy="26" r="24" opacity="0.2" />
                  <circle className="stroke-current fill-none animate-[circle-draw_0.4s_ease-out]" strokeWidth="3" strokeDasharray="150" strokeDashoffset="0" cx="26" cy="26" r="24" strokeLinecap="round" />
                  <path className="stroke-current fill-none animate-[check-draw_0.3s_0.2s_ease-out_both]" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M14 27l8 8 16-16" strokeDasharray="40" strokeDashoffset="0" />
                </svg>
                {deleteCountdown && <p className="text-sm text-muted-foreground">{deleteCountdown}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </>,
    document.body
  )
}
