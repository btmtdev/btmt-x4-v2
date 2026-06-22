import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "@/lib/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { adminService } from "@/services/admin"

const COLORS = [
  { label: "Blue", value: "oklch(0.546 0.245 262.881)" },
  { label: "Green", value: "oklch(0.627 0.194 149.214)" },
  { label: "Red", value: "oklch(0.577 0.245 27.325)" },
  { label: "Orange", value: "oklch(0.705 0.213 47.604)" },
  { label: "Purple", value: "oklch(0.553 0.261 293.541)" },
  { label: "Teal", value: "oklch(0.627 0.14 184.364)" },
]

export default function PreferencesPage() {
  const { t } = useTranslation()
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const [color, setColor] = useState("")
  const [fontSize, setFontSize] = useState("16")

  useEffect(() => {
    adminService.getUserSettings(user.id).then(prefs => {
      if (prefs.primary_color) setColor(prefs.primary_color)
      if (prefs.font_size) setFontSize(prefs.font_size)
    }).catch(() => {})
  }, [])

  function applyColor(c) {
    setColor(c)
    document.documentElement.style.setProperty("--primary", c)
  }

  function applyFontSize(s) {
    setFontSize(s)
    document.documentElement.style.fontSize = s + "px"
  }

  async function save() {
    const settings = {}
    if (color) settings.primary_color = color
    if (fontSize) settings.font_size = fontSize
    await adminService.setUserSettings(user.id, settings)
    toast.success(t("PREFS.SAVED"))
  }

  return (
    <div className="p-6 max-w-lg space-y-6">
      <h1 className="text-lg font-semibold">{t("PREFS.TITLE")}</h1>

      <div className="space-y-2">
        <label className="text-sm font-medium">{t("PREFS.PRIMARY_COLOR")}</label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => applyColor(c.value)}
              className="size-8 rounded-full border-2 transition-all"
              style={{ background: c.value, borderColor: color === c.value ? "currentColor" : "transparent" }}
              title={c.label}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">{t("PREFS.FONT_SIZE")} ({fontSize}px)</label>
        <Input
          type="range"
          min="12"
          max="20"
          value={fontSize}
          onChange={e => applyFontSize(e.target.value)}
          className="w-full"
        />
      </div>

      <Button onClick={save}>{t("SAVE")}</Button>
    </div>
  )
}
