const BASE_URL = import.meta.env.VITE_API_URL ?? ""

async function request(path, options = {}) {
  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    })
  } catch {
    const err = new Error("NETWORK_ERROR")
    err.code = "NETWORK_ERROR"
    throw err
  }
  const data = await res.json().catch(() => ({}))
  if (!data.status) {
    const code = data.error?.error_code ?? "UNKNOWN_ERROR"
    const err = new Error(code)
    err.code = code
    err.description = data.error?.error_description ?? ""
    throw err
  }
  return data.data
}

function getDeviceInfo() {
  const ua = navigator.userAgent
  let browser = "Unknown"
  if (ua.includes("Firefox")) browser = "Firefox"
  else if (ua.includes("Edg")) browser = "Edge"
  else if (ua.includes("Chrome")) browser = "Chrome"
  else if (ua.includes("Safari")) browser = "Safari"

  let os = "Unknown"
  if (ua.includes("Windows")) os = "Windows"
  else if (ua.includes("Mac")) os = "macOS"
  else if (ua.includes("Linux")) os = "Linux"
  else if (ua.includes("Android")) os = "Android"
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS"

  return { name: `${browser} on ${os}`, os, browser }
}

export const authService = {
  login(username, password) {
    const deviceId = localStorage.getItem("device_id") || ""
    return request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Device-Id": deviceId },
      body: JSON.stringify({ username, password, device: getDeviceInfo() }),
    })
  },

  validate(token) {
    return request("/api/auth/validate", {
      method: "POST",
      body: JSON.stringify({ token }),
    })
  },

  heartbeat(deviceId) {
    const token = localStorage.getItem("token")
    return request("/api/auth/heartbeat", {
      method: "POST",
      body: JSON.stringify({ visitor_id: deviceId, device: navigator.userAgent.slice(0, 100), token }),
    })
  },

  verifyUsername(username) {
    return request("/api/auth/forgot-password/verify-username", {
      method: "POST",
      body: JSON.stringify({ username }),
    })
  },

  verifyMobile(username, mobileNo) {
    return request("/api/auth/forgot-password/verify-mobile", {
      method: "POST",
      body: JSON.stringify({ username, mobile_no: mobileNo }),
    })
  },

  resetPassword(username, mobileNo, newPassword) {
    return request("/api/auth/forgot-password/reset", {
      method: "POST",
      body: JSON.stringify({ username, mobile_no: mobileNo, new_password: newPassword }),
    })
  },

  logout() {
    const token = localStorage.getItem("token")
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    return request("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({ token }),
    })
  },
}
