// RunAt:
// DEV  => localhost (dev machine)
// UAT  => 10.30.93.66 (dev server)
// PRD  => 10.30.92.66 (prod server)
//
// Internet => https://api.btmt.co.th/x4/core/* or /x4/shipping/* (YARP gateway)
// Intranet => direct to server IP

const ENVS = {
  production: {
    API_URL: "http://10.30.92.66:4000",
    SHIPPING_API_URL: "http://10.30.92.66:4001",
  },
  uat: {
    API_URL: "http://10.30.93.66:4000",
    SHIPPING_API_URL: "http://10.30.93.66:4001",
  },
  development: {
    API_URL: "http://localhost:4000",
    SHIPPING_API_URL: "http://localhost:4001",
  },
}

// Gateway routes (for internet access via YARP)
const GATEWAY = "https://api.btmt.co.th"
const GATEWAY_PATHS = {
  production: { API: "/x4/core", SHIPPING: "/x4/shipping" },
  uat: { API: "/x4-uat/core", SHIPPING: "/x4-uat/shipping" },
}

// Detect if user is on internet (not intranet)
function isInternet() {
  // Intranet: local IPs, localhost, or internal domain
  const h = location.hostname
  return !(h === "localhost" || h.startsWith("10.") || h.startsWith("192.168.") || h.startsWith("172."))
}

export const ENV_LIST = ["production", "uat", "development"]

export function getEnvName() {
  return localStorage.getItem("x4_env") || "production"
}

export function setEnvName(env) {
  localStorage.setItem("x4_env", env)
  window.location.reload()
}

export function getApiUrl() {
  const env = getEnvName()
  if (env === "development") return ENVS.development.API_URL
  if (isInternet()) return GATEWAY + GATEWAY_PATHS[env].API
  return ENVS[env].API_URL
}

export function getShippingApiUrl() {
  const env = getEnvName()
  if (env === "development") return ENVS.development.SHIPPING_API_URL
  if (isInternet()) return GATEWAY + GATEWAY_PATHS[env].SHIPPING
  return ENVS[env].SHIPPING_API_URL
}
