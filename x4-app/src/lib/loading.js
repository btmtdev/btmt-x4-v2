let count = 0
let bar = null

function getBar() {
  if (!bar) {
    bar = document.createElement("div")
    bar.id = "global-loading-bar"
    bar.className = "fixed top-0 left-0 h-[2px] bg-primary z-[9999] transition-all duration-300 ease-out"
    bar.style.width = "0%"
    bar.style.opacity = "0"
    document.body.appendChild(bar)
  }
  return bar
}

export function startLoading() {
  count++
  const el = getBar()
  el.style.opacity = "1"
  el.style.width = "70%"
}

export function stopLoading() {
  count = Math.max(0, count - 1)
  if (count === 0) {
    const el = getBar()
    el.style.width = "100%"
    setTimeout(() => { el.style.opacity = "0"; el.style.width = "0%" }, 300)
  }
}

// Patch global fetch to show loading bar on all API calls
const originalFetch = window.fetch
window.fetch = function (...args) {
  startLoading()
  return originalFetch.apply(this, args).finally(() => stopLoading())
}
