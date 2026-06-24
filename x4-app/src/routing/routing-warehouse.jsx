import { lazy } from "react"

const StockOverviewPage = lazy(() => import("@/pages/warehouse/stock-overview"))
const PickingPage = lazy(() => import("@/pages/warehouse/picking"))
const PhotoPage = lazy(() => import("@/pages/warehouse/photo"))

export const warehouseRoutes = [
  { path: "/warehouse/stock", element: <StockOverviewPage /> },
  { path: "/warehouse/picking", element: <PickingPage /> },
  { path: "/warehouse/photo", element: <PhotoPage /> },
]
