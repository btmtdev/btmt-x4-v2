import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import * as icons from "lucide-react"
import { adminService } from "@/services/admin"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const PRESET_COLORS = [
  "#18181b","#b91c1c","#c2410c","#b45309","#15803d","#0f766e","#0369a1","#1d4ed8","#6d28d9","#be185d",
  "#3f3f46","#dc2626","#ea580c","#d97706","#16a34a","#0d9488","#0284c7","#2563eb","#7c3aed","#db2777",
  "#71717a","#ef4444","#f97316","#eab308","#22c55e","#14b8a6","#0ea5e9","#3b82f6","#8b5cf6","#ec4899",
  "#a1a1aa","#f87171","#fb923c","#facc15","#4ade80","#2dd4bf","#38bdf8","#60a5fa","#a78bfa","#f472b6",
  "#d4d4d8","#fca5a5","#fdba74","#fde047","#86efac","#5eead4","#7dd3fc","#93c5fd","#c4b5fd","#f9a8d4",
]
const PRESET_SET = new Set(PRESET_COLORS.map(c => c.toLowerCase()))

export function PreferencesPanel({ userId, onClose }) {
  const [color, setColor] = useState("")
  const [fontSize, setFontSize] = useState(() => String(parseInt(getComputedStyle(document.documentElement).fontSize) || 16))
  const [lang, setLang] = useState("")
  const [customColors, setCustomColors] = useState([])
  const [showPicker, setShowPicker] = useState(false)
  const [saved, setSaved] = useState({})
  const pickerRef = useRef(null)
  const { t, i18n } = useTranslation()

  useEffect(() => {
    adminService.getUserSettings(userId).then(prefs => {
      if (prefs.primary_color) setColor(prefs.primary_color)
      if (prefs.font_size) setFontSize(prefs.font_size)
      if (prefs.lang) setLang(prefs.lang)
      else setLang(i18n.language)
      const colors = []
      for (let i = 1; i <= 10; i++) { if (prefs[`saved_color_${i}`]) colors.push(prefs[`saved_color_${i}`]) }
      setCustomColors(colors)
      setSaved(prefs)
    }).catch(() => {})
  }, [])

  function applyColor(c) {
    setColor(c)
    document.documentElement.style.setProperty("--primary", c)
  }

  function addCustomColor() {
    const c = pickerRef.current?.value || "#0070C0"
    if (!PRESET_SET.has(c.toLowerCase())) {
      setCustomColors(prev => [c, ...prev.filter(x => x !== c)].slice(0, 10))
    }
    applyColor(c)
    setShowPicker(false)
  }

  function applyFontSize(s) {
    const v = Math.max(12, Math.min(20, Number(s)))
    setFontSize(String(v))
    document.documentElement.style.fontSize = v + "px"
  }

  async function save() {
    const settings = {}
    settings.primary_color = color || ""
    settings.font_size = String(fontSize || "")
    if (lang) { settings.lang = lang; i18n.changeLanguage(lang) }
    for (let i = 1; i <= 10; i++) settings[`saved_color_${i}`] = customColors[i - 1] || ""
    await adminService.setUserSettings(userId, settings)
    onClose()
  }

  async function clearAll() {
    const settings = { primary_color: "", font_size: "", lang: "" }
    for (let i = 1; i <= 10; i++) settings[`saved_color_${i}`] = ""
    await adminService.setUserSettings(userId, settings)
    document.documentElement.style.removeProperty("--primary")
    document.documentElement.style.fontSize = ""
    onClose()
  }

  function isDirty() {
    if (color !== (saved.primary_color || "") || String(fontSize) !== (saved.font_size || "16") || lang !== (saved.lang || i18n.language)) return true
    for (let i = 1; i <= 10; i++) { if ((customColors[i - 1] || "") !== (saved[`saved_color_${i}`] || "")) return true }
    return false
  }

  function handleClose() {
    if (isDirty()) {
      if (confirm(t("PREFS.UNSAVED_PROMPT"))) {
        save()
        return
      }
    }
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-[50]" onClick={handleClose} />
      <div className="fixed top-(--header-height) bottom-0 right-0 z-[55] w-80 bg-background border-l border-border shadow-lg flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-sm">{t("PREFS.TITLE")}</h3>
          <Button variant="ghost" mode="icon" className="size-7" onClick={handleClose}>&times;</Button>
        </div>
        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
          <div className="space-y-2">
            <div>
              <label className="text-xs font-bold uppercase">{t("PREFS.PRIMARY_COLOR")}</label>
              <Separator className="mt-1 mb-2" />
            </div>
            <div className="grid grid-cols-10 gap-0.5">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => { applyColor(c) }}
                  className="size-5 rounded-sm border transition-all flex items-center justify-center"
                  style={{ background: c, borderColor: color.toLowerCase() === c ? "var(--foreground)" : "transparent" }}
                >
                  {color.toLowerCase() === c && <icons.Check className="size-3 text-white drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]" />}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-10 gap-1 items-center pt-2">
              {customColors.map(c => (
                <div key={c} className="relative group">
                  <button
                    onClick={() => applyColor(c)}
                    className="size-5 rounded-sm border transition-all flex items-center justify-center"
                    style={{ background: c, borderColor: color.toLowerCase() === c.toLowerCase() ? "var(--foreground)" : "transparent" }}
                  >
                    {color.toLowerCase() === c.toLowerCase() && <icons.Check className="size-3 text-white drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]" />}
                  </button>
                  <button
                    onClick={() => setCustomColors(customColors.filter(x => x !== c))}
                    className="absolute -top-1.5 -left-1.5 size-3.5 rounded-full bg-destructive text-white text-[9px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100"
                  >×</button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-xs font-medium" style={{ color: color || undefined }}>#</span>
              <input
                type="text"
                value={(color || "").replace("#", "").toUpperCase()}
                onChange={e => { const v = "#" + e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6).toUpperCase(); if (v.length === 7) applyColor(v) }}
                placeholder="HEX"
                className="w-16 text-xs px-1.5 py-1 border rounded uppercase font-mono"
                style={{ color: color || undefined, borderColor: color || undefined }}
              />
              <label className="size-5 rounded-sm cursor-pointer overflow-hidden border" style={{ background: color || "#ccc" }}>
                <input ref={pickerRef} type="color" value={color || "#0070C0"} onChange={e => applyColor(e.target.value)} className="opacity-0 size-0" />
              </label>
              <button
                onClick={() => { if (color && !PRESET_SET.has(color.toLowerCase())) setCustomColors(prev => [color, ...prev.filter(x => x !== color)].slice(0, 10)) }}
                className="size-5 rounded-sm border border-dashed border-muted-foreground flex items-center justify-center text-muted-foreground text-xs hover:border-primary hover:text-primary"
              >+</button>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-xs font-bold uppercase">{t("PREFS.FONT_SIZE")}</label>
              <Separator className="mt-1 mb-2" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="size-8 p-0" onClick={() => applyFontSize(Number(fontSize) - 1)}>−</Button>
              <span className="text-sm font-medium w-12 text-center">{fontSize}px</span>
              <Button variant="outline" size="sm" className="size-8 p-0" onClick={() => applyFontSize(Number(fontSize) + 1)}>+</Button>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-xs font-bold uppercase">{t("PREFS.DEFAULT_LANGUAGE")}</label>
              <Separator className="mt-1 mb-2" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setLang("th")} className={cn("px-3 py-1.5 rounded border text-sm", lang === "th" ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground")}>ไทย</button>
              <button onClick={() => setLang("en")} className={cn("px-3 py-1.5 rounded border text-sm", lang === "en" ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground")}>English</button>
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-border flex gap-2">
          <Button variant="outline" className="flex-1" onClick={clearAll}>{t("RESET")}</Button>
          <Button className="flex-1" onClick={save}>{t("SAVE")}</Button>
        </div>
      </div>
    </>
  )
}
