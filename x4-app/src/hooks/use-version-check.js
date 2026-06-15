import { useState, useEffect } from "react"
import { version } from "../../package.json"

const API_URL = import.meta.env.VITE_API_URL ?? ""

export function useVersionCheck(intervalMs = 60000) {
  const [outdated, setOutdated] = useState(false)
  const [latestVersion, setLatestVersion] = useState(null)

  useEffect(() => {
    const check = () => {
      fetch(`${API_URL}/api/releases/latest`)
        .then(r => r.json())
        .then(res => {
          if (res.status && res.data?.version && res.data.version !== version) {
            setOutdated(true)
            setLatestVersion(res.data.version)
          }
        })
        .catch(() => {})
    }
    check()
    const id = setInterval(check, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return { outdated, currentVersion: version, latestVersion }
}
