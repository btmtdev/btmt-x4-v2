import { useState, useEffect } from "react"
import * as signalR from "@microsoft/signalr"

const HUB_URL = (import.meta.env.VITE_HUB_URL ?? "http://localhost:4100") + "/hub/presence"

let connection = null
let listeners = new Set()
let currentCount = 0
let connectedUsername = null

function getConnection() {
  const deviceId = localStorage.getItem("device_id") || ""
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const username = user.ad_username || user.key || ""
  const displayName = user.display_name_en || user.display_name_th || username

  if (connection && connectedUsername === username) return connection
  if (connection) { connection.stop(); connection = null }
  connectedUsername = username
  const ua = navigator.userAgent
  let browser = "Unknown"
  if (ua.includes("Edg")) browser = "Edge"
  else if (ua.includes("Chrome")) browser = "Chrome"
  else if (ua.includes("Firefox")) browser = "Firefox"
  else if (ua.includes("Safari")) browser = "Safari"
  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${HUB_URL}?deviceId=${deviceId}&username=${username}&displayName=${encodeURIComponent(displayName)}&browser=${browser}`)
    .withAutomaticReconnect()
    .build()
  connection.on("OnlineCount", count => {
    currentCount = count
    listeners.forEach(fn => fn(count))
  })
  connection.start().catch(() => {})
  return connection
}

export function useOnlineCount() {
  const [count, setCount] = useState(currentCount)
  useEffect(() => {
    getConnection()
    listeners.add(setCount)
    return () => { listeners.delete(setCount) }
  }, [])
  return count
}
