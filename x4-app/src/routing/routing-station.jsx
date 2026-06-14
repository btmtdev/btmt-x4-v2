import { lazy } from "react"

const InboundPage = lazy(() => import("@/pages/station/inbound"))

export const stationRoutes = [
  { path: "/station/inbound", element: <InboundPage /> },
]
