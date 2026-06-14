import { useTranslation } from "react-i18next"

export default function WelcomePage() {
  const { t, i18n } = useTranslation()
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const name = (i18n.language === "th" ? user.display_name_th : user.display_name_en) || user.display_name_en || user.key || ""
  const today = new Date().toLocaleDateString(i18n.language === "th" ? "th-TH" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">{t("DASHBOARD.WELCOME", { name })}</h1>
      <p className="text-muted-foreground mt-1">{today}</p>
    </div>
  )
}
