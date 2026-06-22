export function timeAgo(date, lang, t) {
  const d = String(date).endsWith("Z") ? date : date + "Z"
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return t("SUPPORT.TIME_JUST_NOW")
  const m = Math.floor(s / 60)
  if (m < 60) return t("SUPPORT.TIME_MINUTES_AGO", { m })
  const h = Math.floor(m / 60)
  if (h < 24) return t("SUPPORT.TIME_HOURS_AGO", { h })
  const days = Math.floor(h / 24)
  if (days < 30) return t("SUPPORT.TIME_DAYS_AGO", { d: days })
  return new Date(d).toLocaleDateString()
}
