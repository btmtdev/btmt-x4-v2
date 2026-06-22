import { Outlet } from "react-router-dom"
import { useTranslation } from "react-i18next"
import LangSwitcher from "@/components/lang-switcher"

export default function StationLayout() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="h-14 shrink-0 border-b bg-background flex items-center px-6 gap-4">
        <span className="font-semibold">{t("STATION")}</span>
        <nav className="flex gap-4 text-sm text-muted-foreground">
          <a href="/station/inbound" className="hover:text-foreground">{t("INBOUND")}</a>
        </nav>
        <div className="ml-auto"><LangSwitcher /></div>
      </header>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
