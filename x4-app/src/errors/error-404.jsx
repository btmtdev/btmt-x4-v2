import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

export default function Error404() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 px-6 text-center">
      <div className="text-7xl font-bold text-muted-foreground/30">404</div>
      <h1 className="text-xl font-semibold text-foreground">{t("ERROR.PAGE_NOT_FOUND", "Page Not Found")}</h1>
      <p className="text-sm text-muted-foreground max-w-sm">{t("ERROR.PAGE_NOT_FOUND_DESC", "The page you're looking for doesn't exist or has been moved.")}</p>
      <button onClick={() => navigate(-1)} className="mt-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
        {t("ERROR.GO_BACK", "Go Back")}
      </button>
    </div>
  )
}
