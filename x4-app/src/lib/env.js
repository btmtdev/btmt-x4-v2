// RunAt:
// DEV  => localhost (dev machine)
// UAT  => 10.30.93.66 (dev server)
// PRD  => 10.30.92.66 (prod server)
//
// Internet => https://api.btmt.co.th/x4/core/* or /x4/shipping/* (YARP gateway)
// Intranet => direct to server IP

const ENVS = {
  production: {
    API_URL: import.meta.env.VITE_API_URL || "http://localhost:4000",
    SHIPPING_API_URL: import.meta.env.VITE_SHIPPING_API_URL || "http://localhost:4001",
    WAREHOUSE_API_URL: import.meta.env.VITE_WAREHOUSE_API_URL || "http://localhost:4002",
    QUALITY_API_URL: import.meta.env.VITE_QUALITY_API_URL || "http://localhost:4003",
    TSG_SHIPMENT_API_URL: import.meta.env.VITE_TSG_SHIPMENT_API_URL || "http://localhost:4004",
  },
  uat: {
    API_URL: import.meta.env.VITE_API_URL || "http://localhost:4000",
    SHIPPING_API_URL: import.meta.env.VITE_SHIPPING_API_URL || "http://localhost:4001",
    WAREHOUSE_API_URL: import.meta.env.VITE_WAREHOUSE_API_URL || "http://localhost:4002",
    QUALITY_API_URL: import.meta.env.VITE_QUALITY_API_URL || "http://localhost:4003",
    TSG_SHIPMENT_API_URL: import.meta.env.VITE_TSG_SHIPMENT_API_URL || "http://localhost:4004",
  },
  development: {
    API_URL: "/api/core",
    SHIPPING_API_URL: "/api/shipping",
    WAREHOUSE_API_URL: "/api/warehouse",
    QUALITY_API_URL: "/api/quality",
    TSG_SHIPMENT_API_URL: "/api/tsg-shipment",
  },
}

export const ENV_LIST = ["production", "uat", "development"]

export function getEnvName() {
  const stored = localStorage.getItem("x4_env")
  if (stored) return stored
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") return "development"
  return "production"
}

export function setEnvName(env) {
  localStorage.setItem("x4_env", env)
  window.location.reload()
}

export function getApiUrl() {
  return ENVS[getEnvName()].API_URL
}

export function getShippingApiUrl() {
  return ENVS[getEnvName()].SHIPPING_API_URL
}

export function getQualityApiUrl() {
  return ENVS[getEnvName()].QUALITY_API_URL
}

export function getWarehouseApiUrl() {
  return ENVS[getEnvName()].WAREHOUSE_API_URL
}

export function getTsgShipmentApiUrl() {
  return ENVS[getEnvName()].TSG_SHIPMENT_API_URL
}
