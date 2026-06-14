import { useTranslation } from "react-i18next"

export default function LangSwitcher() {
  const { i18n } = useTranslation()
  const toggle = () => i18n.changeLanguage(i18n.language === "th" ? "en" : "th")

  return (
    <button onClick={toggle} className="text-xs px-2 py-1 rounded border hover:bg-muted">
      {i18n.language === "th" ? "TH" : "EN"}
    </button>
  )
}
