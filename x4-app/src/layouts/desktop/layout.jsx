import { useState, useEffect, createContext, useContext, useMemo, Fragment } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Menu, RefreshCw } from "lucide-react"
import * as icons from "lucide-react"
import { adminService } from "@/services/admin"
import { useIsMobile } from "@/hooks/use-mobile"
import { useVersionCheck } from "@/hooks/use-version-check"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Header } from "./header"
import { SidebarIcons } from "./sidebar-icons"
import { SidebarMenuPanel } from "./sidebar-menu"

// --- Context ---
const LayoutContext = createContext(undefined)
const ToolbarContext = createContext(undefined)
const ActiveL1Context = createContext(undefined)

export function useToolbar() { return useContext(ToolbarContext) }

export function useLayout() {
  const ctx = useContext(LayoutContext)
  if (!ctx) throw new Error("useLayout must be used within LayoutProvider")
  return ctx
}

export function useActiveL1() {
  const ctx = useContext(ActiveL1Context)
  if (!ctx) throw new Error("useActiveL1 must be used within ActiveL1Provider")
  return ctx
}

// --- Helpers ---
export function LucideIcon({ name, size = 18, className = "" }) {
  const pascal = name?.split("-").map(s => s[0]?.toUpperCase() + s.slice(1)).join("") || ""
  const Icon = icons[pascal]
  return Icon ? <Icon size={size} className={className} /> : <span className={`text-xs ${className}`}>{name?.slice(0, 2)}</span>
}

// --- Providers ---
function LayoutProvider({ children }) {
  const isMobile = useIsMobile()
  const [isPanelOpen, setIsPanelOpen] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const panelToggle = () => setIsPanelOpen(o => !o)
  const mobileToggle = () => setIsMobileOpen(o => !o)

  useEffect(() => { if (!isMobile) setIsMobileOpen(false) }, [isMobile])

  const style = useMemo(() => ({
    "--header-height": "60px",
    "--sidebar-width": "60px",
    "--sidebar-menu-width": "240px",
  }), [])

  useEffect(() => {
    const html = document.documentElement
    Object.entries(style).forEach(([k, v]) => html.style.setProperty(k, v))
    return () => Object.keys(style).forEach(k => html.style.removeProperty(k))
  }, [style])

  return (
    <LayoutContext.Provider value={{ isMobile, isPanelOpen, panelToggle, isMobileOpen, mobileToggle, style }}>
      <TooltipProvider delayDuration={0}>
        <div data-slot="layout-wrapper" className="flex grow bg-white" style={style}>{children}</div>
      </TooltipProvider>
    </LayoutContext.Provider>
  )
}

function ActiveL1Provider({ children }) {
  const [activeL1, setActiveL1] = useState(null)
  return (
    <ActiveL1Context.Provider value={[activeL1, setActiveL1]}>
      {children}
    </ActiveL1Context.Provider>
  )
}

// --- Breadcrumb ---
function Breadcrumb({ menu, nameKey, toolbar }) {
  const { pathname } = useLocation()
  const { panelToggle } = useLayout()
  const [activeL1] = useActiveL1()
  const activeItem = menu.find(m => m.id === activeL1)
  const hasPanel = (activeItem?.children?.length || 0) > 0
  const crumbs = []
  for (const l1 of menu) {
    if (l1.path === pathname) { crumbs.push(l1); break }
    for (const l2 of l1.children || []) {
      if (l2.path === pathname) { crumbs.push(l1, l2); break }
      for (const l3 of l2.children || []) {
        if (l3.path === pathname) { crumbs.push(l1, l2, l3); break }
      }
      if (crumbs.length) break
    }
    if (crumbs.length) break
  }
  if (!crumbs.length) return null
  return (
    <div className="px-6 h-12 flex items-center gap-1.5 text-sm text-muted-foreground bg-white border-b border-border">
      {hasPanel && <button onClick={panelToggle} className="hidden lg:flex items-center justify-center size-6 rounded hover:bg-muted me-1">
        <Menu size={16} />
      </button>}
      {crumbs.map((c, i) => (
        <Fragment key={c.id}>
          {i > 0 && <span>/</span>}
          <span className={i === crumbs.length - 1 ? "text-foreground font-medium" : ""}>{c[nameKey]}</span>
        </Fragment>
      ))}
      {toolbar && <div className="ml-auto flex items-center gap-2 text-sm">{toolbar}</div>}
    </div>
  )
}

// --- LayoutInner ---
function LayoutInner({ menu, nameKey, toolbar }) {
  const { isMobile, isPanelOpen, isMobileOpen, mobileToggle } = useLayout()
  const location = useLocation()
  const [activeL1, setActiveL1] = useActiveL1()
  const { t } = useTranslation()
  const { outdated, latestVersion } = useVersionCheck()

  useEffect(() => {
    if (!menu.length) return
    const current = menu.find(l1 =>
      l1.path === location.pathname ||
      l1.children?.some(l2 => l2.path === location.pathname || l2.children?.some(l3 => l3.path === location.pathname))
    )
    if (current && activeL1 !== current.id) setActiveL1(current.id)
  }, [menu, location.pathname])

  const activeItem = menu.find(m => m.id === activeL1)
  const hasMenuPanel = (activeItem?.children?.length || 0) > 0

  return (
    <>
      <Header menu={menu} nameKey={nameKey} />

      {outdated && (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-yellow-300 border-t border-yellow-400 px-4 py-2 flex items-center justify-center gap-2 text-sm text-yellow-900">
          <RefreshCw size={14} />
          <span>{t("VERSION_OUTDATED", { version: latestVersion })}</span>
          <button onClick={() => window.location.reload()} className="underline font-medium hover:text-yellow-950">{t("RELOAD")}</button>
        </div>
      )}

      <div className="flex grow pt-(--header-height)">
        {!isMobile && (
          <div className="w-(--sidebar-width)">
            <SidebarIcons menu={menu} nameKey={nameKey} />
          </div>
        )}

        {isMobile && isMobileOpen && (
          <>
            <div className="fixed inset-0 z-[19] bg-black/30" onClick={mobileToggle} />
            <div className="fixed inset-y-0 start-0 z-[20] pt-(--header-height) flex">
              <SidebarIcons menu={menu} nameKey={nameKey} />
              {hasMenuPanel && <SidebarMenuPanel menu={menu} nameKey={nameKey} onNav={mobileToggle} />}
            </div>
          </>
        )}

        <div className="flex flex-col grow">
          <div className="flex flex-grow">
            {!isMobile && isPanelOpen && hasMenuPanel && <SidebarMenuPanel menu={menu} nameKey={nameKey} />}

            <main
              className={cn("grow min-w-0 h-[calc(100vh-var(--header-height))] overflow-hidden flex flex-col")}
              style={!isMobile && isPanelOpen && hasMenuPanel ? { paddingInlineStart: 'var(--sidebar-menu-width)' } : undefined}
              role="content"
            >
              <Breadcrumb menu={menu} nameKey={nameKey} toolbar={toolbar} />
              <div className="flex-1 overflow-y-auto overflow-x-hidden"><Outlet /></div>
            </main>
          </div>
        </div>
      </div>
    </>
  )
}

// --- Main Layout ---
export default function DesktopLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { i18n } = useTranslation()
  const [menu, setMenu] = useState([])

  const nameKey = i18n.language === "th" ? "name_th" : "name_en"

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    const mapNode = (n) => ({ ...n, id: n.key, have_divider: n.is_divider, is_default: !n.is_authorized, children: (n.children || []).map(mapNode) })
    adminService.getPermissions().then(tree => {
      const mapped = tree.map(mapNode)
      adminService.getEffectivePermissions(user.key).then(perms => {
        const ids = new Set(perms.map(p => p.key))
        const filtered = mapped.map(l1 => ({
          ...l1,
          children: (l1.children || []).map(l2 => ({
            ...l2,
            children: (l2.children || []).filter(l3 => ids.has(l3.id))
          })).filter(l2 => ids.has(l2.id) || l2.children?.length > 0)
        })).filter(l1 => l1.is_default || ids.has(l1.id) || l1.children?.length > 0)
        setMenu(filtered)
      })
    })
    adminService.getUserSettings(user.key).then(prefs => {
      if (prefs.primary_color) document.documentElement.style.setProperty("--primary", prefs.primary_color)
      if (prefs.font_size) document.documentElement.style.fontSize = prefs.font_size + "px"
      if (prefs.lang) i18n.changeLanguage(prefs.lang)
    }).catch(() => {})
  }, [])

  const [toolbar, setToolbar] = useState(null)

  return (
    <ActiveL1Provider>
      <ToolbarContext.Provider value={setToolbar}>
        <LayoutProvider>
          <LayoutInner menu={menu} nameKey={nameKey} toolbar={toolbar} />
        </LayoutProvider>
      </ToolbarContext.Provider>
    </ActiveL1Provider>
  )
}
