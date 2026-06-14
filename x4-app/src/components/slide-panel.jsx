import { useRef } from "react"
import { Maximize2, Minimize2 } from "lucide-react"

export function SlidePanel({ width, onClose, onResize, title, header, children, minWidth = 20, maxWidth = 70, position, fixedWidth }) {
  const prevWidth = useRef(null)
  if (position === "fixed" && fixedWidth) {
    return (
      <>
        <div className="fixed inset-0 z-[50] bg-black/20" onClick={onClose} />
        <div className={`fixed inset-y-0 right-0 z-[55] ${fixedWidth} bg-background border-l border-border shadow-lg flex flex-col`}>
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-sm">{title}</h3>
            <button onClick={onClose} className="text-muted-foreground text-xs hover:text-foreground">✕</button>
          </div>
          {children}
        </div>
      </>
    )
  }

  return (
    <>
      <div className="fixed inset-0 z-[50] bg-black/20" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-[55] bg-background border-l border-border shadow-xl flex flex-col" style={{ width: `${width}%` }}>
        {onResize && (
          <div
            className="absolute inset-y-0 left-0 w-2 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 z-10 flex items-center justify-center"
            onMouseDown={e => {
              e.preventDefault()
              const startX = e.clientX
              const startW = width
              const onMove = ev => onResize(Math.max(minWidth, Math.min(maxWidth, startW + ((startX - ev.clientX) / window.innerWidth) * 100)))
              const onUp = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp) }
              document.addEventListener("mousemove", onMove)
              document.addEventListener("mouseup", onUp)
            }}
          >
            <div className="w-0.5 h-8 rounded-full bg-border" />
          </div>
        )}
        {header || (
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3 className="font-semibold">{title}</h3>
            <div className="flex items-center gap-2">
              {onResize && <button onClick={() => { if (width >= 100) { onResize(prevWidth.current || maxWidth) } else { prevWidth.current = width; onResize(100) } }} className="text-muted-foreground hover:text-foreground border rounded p-1" title="Expand">{width >= 100 ? <Minimize2 size={14} /> : <Maximize2 size={14} />}</button>}
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg">&times;</button>
            </div>
          </div>
        )}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">{children}</div>
      </div>
    </>
  )
}
