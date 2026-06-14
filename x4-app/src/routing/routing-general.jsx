import { lazy } from "react"

const DashboardPage = lazy(() => import("@/pages/welcome"))
const PreferencesPage = lazy(() => import("@/pages/preferences"))
const TicketsPage = lazy(() => import("@/pages/ticket/ticket"))

export const generalRoutes = [
  { path: "/", element: <DashboardPage /> },
  { path: "/preferences", element: <PreferencesPage /> },
  { path: "/ticket", element: <TicketsPage /> },
]
