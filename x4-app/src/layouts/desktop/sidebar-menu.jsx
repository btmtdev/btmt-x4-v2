import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useActiveL1 } from "./layout"

export function SidebarMenuPanel({ menu, nameKey, onNav }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [activeL1] = useActiveL1()
  const [expanded, setExpanded] = useState({})

  const activeItem = menu.find(m => m.id === activeL1)
  const children = activeItem?.children || []

  // Auto-expand L2 that contains active L3
  useEffect(() => {
    const active = children.find(l2 => l2.children?.some(l3 => l3.path === pathname))
    if (active && !expanded[active.id]) setExpanded(e => ({ ...e, [active.id]: true }))
  }, [pathname, children])

  function toggleExpand(code) {
    setExpanded(e => ({ ...e, [code]: !e[code] }))
  }

  function navTo(path) {
    navigate(path)
    onNav?.()
  }

  if (!children.length) return null

  return (
    <div className="lg:fixed lg:z-[5] lg:top-(--header-height) lg:bottom-0 lg:start-(--sidebar-width) flex flex-col items-stretch border-e border-border bg-white w-[250px] lg:w-(--sidebar-menu-width)">
      <div className="flex items-center gap-2.5 pl-[19px] pr-4 h-12 border-b border-border shrink-0">
        <span className="text-sm font-semibold text-foreground">{activeItem?.[nameKey]}</span>
      </div>
      <ScrollArea className="grow h-[calc(100vh-6rem)] lg:h-[calc(100vh-4rem)] pt-2">
        <nav className="flex flex-col gap-0.5 text-sm">
          {children.map(l2 => (
            <div key={l2.id}>
              {l2.have_divider && <Separator className="my-2" />}
              {l2.children?.length > 0 ? (
                <>
                  <button
                    onClick={() => { toggleExpand(l2.id); if (l2.path) navTo(l2.path) }}
                    className={cn(
                      "w-full flex items-center justify-between h-9 px-4 font-normal transition-colors border-l-3 border-l-transparent",
                      "hover:bg-muted",
                      l2.children?.some(l3 => l3.path === pathname) ? "text-primary font-medium" : "text-muted-foreground"
                    )}
                  >
                    <span>{l2[nameKey]}</span>
                    {expanded[l2.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  {expanded[l2.id] && (
                    <div className="ml-6 border-l border-border flex flex-col gap-0.5 mt-0.5">
                      {l2.children.map(l3 => (
                        <div key={l3.id}>
                          {l3.have_divider && <Separator className="my-1" />}
                          <a
                            onClick={() => navTo(l3.path)}
                            className={cn(
                              "block h-8 pl-4 pr-4 cursor-pointer text-sm leading-8 transition-colors border-l-3",
                              pathname === l3.path
                                ? "bg-primary/10 text-primary font-medium border-l-primary"
                                : "border-l-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                          >
                            {l3[nameKey]}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <a
                  onClick={() => navTo(l2.path)}
                  className={cn(
                    "block h-9 px-4 cursor-pointer text-sm leading-9 transition-colors border-l-3",
                    pathname === l2.path
                      ? "bg-primary/10 text-primary font-medium border-l-primary"
                      : "border-l-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {l2[nameKey]}
                </a>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>
    </div>
  )
}
