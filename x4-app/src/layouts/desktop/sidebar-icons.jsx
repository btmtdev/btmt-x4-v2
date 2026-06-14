import { Fragment } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Power } from "lucide-react"
import { authService } from "@/services/auth"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useActiveL1, LucideIcon } from "./layout"

export function SidebarIcons({ menu, nameKey }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [activeL1, setActiveL1] = useActiveL1()

  async function handleLogout() {
    await authService.logout()
    navigate("/auth/login")
  }

  return (
    <div className="lg:fixed z-[6] top-(--header-height) start-0 bottom-0 flex flex-col items-center shrink-0 py-2.5 gap-1 w-16 lg:w-(--sidebar-width) border-e border-input bg-white">
      <ScrollArea className="grow w-full h-[calc(100vh-5.5rem)]">
        <div className="grow gap-1 shrink-0 flex items-center flex-col">
          {menu.map(item => (
            <Fragment key={item.id}>
              {item.have_divider && <Separator className="my-0.5 w-6.5" />}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    mode="icon"
                    {...(activeL1 === item.id ? { "data-state": "open" } : {})}
                    className={cn(
                      "shrink-0 size-9 rounded-lg transition-colors flex items-center justify-center",
                      "text-muted-foreground hover:text-primary hover:bg-muted",
                      "data-[state=open]:text-white data-[state=open]:bg-primary"
                    )}
                    onClick={() => { setActiveL1(item.id); if (item.path) navigate(item.path) }}
                  >
                    <LucideIcon name={item.icon} size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{item[nameKey]}</TooltipContent>
              </Tooltip>
            </Fragment>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <Separator className="my-1 w-6.5" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" mode="icon" className="text-muted-foreground hover:text-foreground" onClick={handleLogout}>
              <Power className="size-4.5!" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{t("LOGOUT")}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
