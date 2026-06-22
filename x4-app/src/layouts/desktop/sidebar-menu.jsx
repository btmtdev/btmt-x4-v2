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
    <div className="lg:fixed lg:z-[5] lg:top-(--header-height) lg:bottom-0 lg:start-(--sidebar-width) flex flex-col border-e border-border/60 bg-white w-[220px] lg:w-(--sidebar-menu-width)">
      <div className="flex items-center px-4 h-10 shrink-0">
        <span className="text-sm font-semibold text-foreground">{activeItem?.[nameKey]}</span>
      </div>
      <ScrollArea className="grow">
        <nav className="flex flex-col py-1 px-2 text-sm">
          {children.map(l2 => (
            <div key={l2.id}>
              {l2.have_divider && <Separator className="my-1.5 mx-2" />}
              {l2.children?.length > 0 ? (
                <>
                  <button
                    onClick={() => { toggleExpand(l2.id); if (l2.path) navTo(l2.path) }}
                    className={cn(
                      "w-full flex items-center justify-between h-8 px-3 rounded-md text-sm transition-colors",
                      "hover:bg-accent",
                      l2.children?.some(l3 => l3.path === pathname) ? "text-primary font-medium" : "text-muted-foreground"
                    )}
                  >
                    <span>{l2[nameKey]}</span>
                    {expanded[l2.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  {expanded[l2.id] && (
                    <div className="ml-3 border-l border-border/50 flex flex-col mt-0.5 mb-1">
                      {l2.children.map(l3 => (
                        <div key={l3.id}>
                          {l3.have_divider && <Separator className="my-1 mx-2" />}
                          <a
                            onClick={() => navTo(l3.path)}
                            className={cn(
                              "block h-8 pl-3 pr-3 cursor-pointer text-sm leading-8 rounded-md mx-1 transition-colors",
                              pathname === l3.path
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
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
                    "block h-8 px-3 cursor-pointer text-sm leading-8 rounded-md transition-colors",
                    pathname === l2.path
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
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
