import { useState, useEffect } from "react"
import { Outlet } from "react-router-dom"
import { useTranslation } from "react-i18next"
import LangSwitcher from "@/components/lang-switcher"
import { useOnlineCount } from "@/hooks/use-online-count"
import loginBg from "@/assets/login-bg.png"
import { version } from "../../package.json"

function Clock() {
  const { i18n } = useTranslation()
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const locale = i18n.language === "th" ? "th-TH" : "en-US"

  return (
    <div className="text-white">
      <p className="text-5xl font-bold">{now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}</p>
      <p className="text-white/70 mt-2">{now.toLocaleDateString(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
    </div>
  )
}

function OnlineCount() {
  const count = useOnlineCount()
  return (
    <span className="text-xs text-muted-foreground/70 flex items-center gap-1.5">
      <span className="relative flex size-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500" />
      </span>
      {count}
    </span>
  )
}

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel with background image */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden">
        <img src={loginBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <h1 className="text-4xl font-bold text-white tracking-tight">X4 <span className="text-white/60">|</span> BTMT</h1>
          <div className="flex-1" />
          <div className="mb-8">
            <Clock />
          </div>
          <p className="text-white/50 text-xs">&copy; {new Date().getFullYear()} BTMT. All rights reserved. <span className="border-l border-white/30 ml-2 pl-2">{version}</span></p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background relative">
        <div className="absolute top-4 right-4 flex items-center gap-3">
          <OnlineCount />
          <LangSwitcher />
        </div>
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-primary">X4 <span className="text-muted-foreground">|</span> <span className="text-foreground">BTMT</span></h1>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
