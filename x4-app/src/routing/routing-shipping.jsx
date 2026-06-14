import { lazy } from "react"
import { Navigate } from "react-router-dom"

const SalesOrderPage = lazy(() => import("@/pages/shipping/sales-orders"))
const InvoicesPage = lazy(() => import("@/pages/shipping/invoices"))
const InvoiceEditPage = lazy(() => import("@/pages/shipping/invoice-edit"))

export const shippingRoutes = [
  { path: "/shipping/sales-orders", element: <SalesOrderPage /> },
  { path: "/shipping/so", element: <Navigate to="/shipping/sales-orders" replace /> },
  { path: "/shipping/invoices", element: <InvoicesPage /> },
  { path: "/shipping/invoices/new", element: <InvoiceEditPage /> },
  { path: "/shipping/invoices/:invoiceKey/edit", element: <InvoiceEditPage /> },
]
