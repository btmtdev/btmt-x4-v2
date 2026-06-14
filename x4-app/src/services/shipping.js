const BASE_URL = import.meta.env.VITE_SHIPPING_API_URL ?? "http://localhost:4001"

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
    throw err
  }
  return data.data
}

function masterCrud(resource) {
  return {
    getAll: (active) => request(`/api/masters/${resource}${active != null ? `?active=${active}` : ""}`),
    getById: (id) => request(`/api/masters/${resource}/${id}`),
    create: (dto) => request(`/api/masters/${resource}`, { method: "POST", body: JSON.stringify(dto) }),
    update: (id, dto) => request(`/api/masters/${resource}/${id}`, { method: "PUT", body: JSON.stringify(dto) }),
    remove: (id) => request(`/api/masters/${resource}/${id}`, { method: "DELETE" }),
  }
}

export const shippingService = {
  countryOfOrigins: masterCrud("countries-of-origin"),
  signatories: masterCrud("signatories"),
  carriers: masterCrud("carriers"),
  companies: masterCrud("companies"),
  containers: masterCrud("containers"),
  countries: masterCrud("countries"),
  customers: masterCrud("customers"),
  destinations: masterCrud("destinations"),
  ports: masterCrud("ports"),
  products: masterCrud("products"),
  productPrices: masterCrud("product-prices"),
  kittingBoms: masterCrud("kitting-boms"),

  // Lookup endpoints for dropdowns (reuse masters GET)
  lookup: {
    countries: () => request("/api/masters/countries"),
    countryOfOrigins: () => request("/api/masters/countries-of-origin"),
    carriers: () => request("/api/masters/carriers"),
    containers: () => request("/api/masters/containers"),
    ports: () => request("/api/masters/ports"),
    products: () => request("/api/masters/products"),
    companies: () => request("/api/masters/companies"),
    customers: () => request("/api/masters/customers"),
  },

  // Customer addresses under a customer
  getCustomerAddresses: (customerId) => request(`/api/customers/${customerId}/addresses`),

  // Sales Orders
  salesOrders: {
    getAll: (params) => request(`/api/sales-orders${params ? "?" + new URLSearchParams(params) : ""}`),
    get: (soKey, soLine) => request(`/api/sales-orders/${encodeURIComponent(soKey)}/${encodeURIComponent(soLine)}`),
    update: (soKey, soLine, dto) => request(`/api/sales-orders/${encodeURIComponent(soKey)}/${encodeURIComponent(soLine)}`, { method: "PUT", body: JSON.stringify(dto) }),
    import: (dto) => request("/api/sales-orders/import", { method: "POST", body: JSON.stringify(dto) }),
    getBalance: (params) => request(`/api/sales-orders/balance${params ? "?" + new URLSearchParams(params) : ""}`),
  },

  // Shipments
  shipments: {
    getEvents: (invoiceKey) => request(`/api/shipments/${encodeURIComponent(invoiceKey)}/events`),
    release: (dto) => request("/api/shipments/release", { method: "POST", body: JSON.stringify(dto) }),
    pullback: (dto) => request("/api/shipments/pullback", { method: "POST", body: JSON.stringify(dto) }),
    confirm: (dto) => request("/api/shipments/confirm", { method: "POST", body: JSON.stringify(dto) }),
  },

  // Invoices
  invoices: {
    getAll: (limit) => request(`/api/invoices${limit ? `?limit=${limit}` : ""}`),
    get: (key) => request(`/api/invoices/${encodeURIComponent(key)}`),
    nextNumber: (etd) => request(`/api/invoices/next-number${etd ? `?etd=${etd}` : ""}`),
    create: (dto) => request("/api/invoices", { method: "POST", body: JSON.stringify(dto) }),
    update: (key, dto) => request(`/api/invoices/${encodeURIComponent(key)}`, { method: "PUT", body: JSON.stringify(dto) }),
    autoGenPacking: (key, dto) => request(`/api/invoices/${encodeURIComponent(key)}/packing/auto-gen`, { method: "POST", body: JSON.stringify(dto) }),
    savePacking: (key, dto) => request(`/api/invoices/${encodeURIComponent(key)}/packing`, { method: "PUT", body: JSON.stringify(dto) }),
  },
}

// Invoice Number Encoding: 6T3B03
// Pos1: Year (2020=0..2025=5, 2026=6, ..., 2029=9, 2030=X)
// Pos2: 'T' fixed
// Pos3: Month (1-9, X=10, Y=11, Z=12)
// Pos4: Decade letter (B=2020s, C=2030s, D=2040s, ...)
// Pos5-6: Running number base-36 (01..ZZ)
const YEAR_CHARS = "0123456789X"
const MONTH_CHARS = "123456789XY0"

export function encodeInvoiceNumber(year, month, running) {
  const yearInDecade = year % 10
  const yearChar = YEAR_CHARS[yearInDecade] ?? "0"
  const monthChar = MONTH_CHARS[month - 1] ?? "1"
  const decadeOffset = Math.floor((year - 2020) / 10)
  const decadeChar = String.fromCharCode(66 + decadeOffset) // B=2020s, C=2030s
  const runStr = running.toString(36).toUpperCase().padStart(2, "0")
  return `${yearChar}T${monthChar}${decadeChar}${runStr}`
}

export function decodeInvoiceNumber(code) {
  if (!code || code.length < 6) return null
  const yearInDecade = YEAR_CHARS.indexOf(code[0])
  if (yearInDecade < 0) return null
  const month = MONTH_CHARS.indexOf(code[2]) + 1
  if (month < 1) return null
  const decadeOffset = code[3].charCodeAt(0) - 65 // A=0(2010s), B=1(2020s), C=2(2030s)
  const year = 2010 + decadeOffset * 10 + yearInDecade
  const running = parseInt(code.slice(4), 36)
  return { year, month, running }
}

export function formatInvoiceNumber(code) {
  const d = decodeInvoiceNumber(code)
  if (!d) return code
  const yy = String(d.year).slice(-2)
  const mm = String(d.month).padStart(2, "0")
  const run = String(d.running).padStart(3, "0")
  return `IV-${yy}${mm}${run}`
}
