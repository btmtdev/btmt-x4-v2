import { Fragment } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useActiveL1, LucideIcon } from "./layout"

export function SidebarIcons({ menu, nameKey }) {
  const navigate = useNavigate()
  const [activeL1, setActiveL1] = useActiveL1()

  return (
    <div className="lg:fixed z-[6] top-(--header-height) start-0 bottom-0 flex flex-col items-center shrink-0 py-2 gap-0.5 w-(--sidebar-width) border-e border-border/60 bg-white">
      <ScrollArea className="grow w-full">
        <div className="flex flex-col items-center gap-0.5 px-1">
          {menu.map(item => (
            <Fragment key={item.id}>
              {item.have_divider && <Separator className="my-1 w-6" />}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    {...(activeL1 === item.id ? { "data-active": "" } : {})}
                    className={cn(
                      "size-9 rounded-md flex items-center justify-center transition-colors",
                      "text-muted-foreground hover:text-foreground hover:bg-accent",
                      "data-[active]:bg-primary/10 data-[active]:text-primary"
                    )}
                    onClick={() => { setActiveL1(item.id); if (item.path) navigate(item.path) }}
                  >
                    <LucideIcon name={item.icon} size={18} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">{item[nameKey]}</TooltipContent>
              </Tooltip>
            </Fragment>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
