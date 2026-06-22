export function ResizeHandle({ direction = "horizontal", onResize }) {
  const isHorizontal = direction === "horizontal"

  function handleMouseDown(e) {
    e.preventDefault()
    const start = isHorizontal ? e.clientY : e.clientX
    const containerSize = isHorizontal ? e.currentTarget.parentElement.clientHeight : e.currentTarget.parentElement.clientWidth
    const onMove = ev => {
      const current = isHorizontal ? ev.clientY : ev.clientX
      onResize((start - current) / containerSize * 100)
    }
    const onUp = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp) }
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)
  }

  if (isHorizontal) {
    return (
      <div className="h-1.5 cursor-row-resize hover:bg-primary/20 active:bg-primary/30 flex items-center justify-center shrink-0" onMouseDown={handleMouseDown}>
        <div className="w-8 h-0.5 rounded-full bg-border" />
      </div>
    )
  }

  return (
    <div className="w-1.5 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 flex items-center justify-center shrink-0" onMouseDown={handleMouseDown}>
      <div className="h-8 w-0.5 rounded-full bg-border" />
    </div>
  )
}
