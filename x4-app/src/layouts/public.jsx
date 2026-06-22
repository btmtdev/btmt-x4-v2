import { Outlet } from "react-router-dom"
import { useTranslation } from "react-i18next"
import LangSwitcher from "@/components/lang-switcher"

export default function PublicLayout() {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen flex flex-col bg-muted">
      <header className="h-14 bg-background border-b flex items-center px-6">
        <span className="font-semibold">{t("SYSTEM_STATUS")}</span>
        <div className="ml-auto"><LangSwitcher /></div>
      </header>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
      <footer className="h-10 border-t flex items-center justify-center text-sm text-muted-foreground">
        X4 App
      </footer>
    </div>
  )
}
