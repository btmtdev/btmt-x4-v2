import { lazy } from "react"

const StockOverviewPage = lazy(() => import("@/pages/warehouse/stock-overview"))

export const warehouseRoutes = [
  { path: "/warehouse/stock", element: <StockOverviewPage /> },
]
