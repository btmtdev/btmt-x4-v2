import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Rocket } from "lucide-react"
import { version } from "../../package.json"

const API_URL = import.meta.env.VITE_API_URL ?? ""

export default function WelcomePage() {
  const { t, i18n } = useTranslation()
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const name = (i18n.language === "th" ? user.display_name_th : user.display_name_en) || user.display_name_en || user.key || ""
  const locale = i18n.language === "th" ? "th-TH" : "en-US"
  const today = new Date().toLocaleDateString(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" })

  const [releases, setReleases] = useState([])

  useEffect(() => {
    fetch(`${API_URL}/api/releases`)
      .then(r => r.json())
      .then(res => { if (res.status) setReleases(res.data) })
      .catch(() => {})
  }, [])

  return (
    <div className="p-6 max-w-3xl space-y-8">
      <div className="bg-gradient-to-r from-primary/10 to-transparent rounded-xl p-6">
        <h1 className="text-2xl font-bold">{t("DASHBOARD.WELCOME", { name })}</h1>
        <p className="text-muted-foreground mt-1">{today}</p>
        <span className="inline-block mt-2 text-xs bg-primary/10 text-primary font-mono px-2 py-0.5 rounded">v{version}</span>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Rocket size={18} className="text-primary" />
          <h2 className="text-base font-semibold">{t("DASHBOARD.RELEASE_HISTORY")}</h2>
        </div>
        {releases.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("DASHBOARD.NO_RELEASES")}</p>
        ) : (
          <div className="space-y-0">
            {releases.map((r, i) => (
              <div key={r.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="size-2.5 rounded-full bg-primary ring-4 ring-primary/10 mt-2" />
                  {i < releases.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                </div>
                <div className="pb-5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-primary">{r.version}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.released_at).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="text-sm font-medium mt-0.5">{r.title}</p>
                  {r.description && <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
