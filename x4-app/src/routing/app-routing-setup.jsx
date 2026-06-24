import { Suspense } from "react"
import { Routes, Route, Navigate } from "react-router-dom"

import RequireAuth from "@/auth/require-auth"
import AuthLayout from "@/layouts/auth"
import DesktopLayout from "@/layouts/desktop/layout"
import StationLayout from "@/layouts/station"
import PublicLayout from "@/layouts/public"
import Error404 from "@/errors/error-404"

import { authRoutes } from "./routing-auth"
import { adminRoutes } from "./routing-admin"
import { masterRoutes } from "./routing-master"
import { shippingRoutes } from "./routing-shipping"
import { warehouseRoutes } from "./routing-warehouse"
import { qualityRoutes } from "./routing-quality"
import { generalRoutes } from "./routing-general"
import { stationRoutes } from "./routing-station"
import { publicRoutes } from "./routing-public"

const desktopRoutes = [...generalRoutes, ...adminRoutes, ...masterRoutes, ...shippingRoutes, ...warehouseRoutes, ...qualityRoutes]

export default function AppRoutingSetup() {
  return (
    <Suspense>
      <Routes>
        <Route element={<AuthLayout />}>
          {authRoutes.map(r => <Route key={r.path} {...r} />)}
        </Route>
        <Route element={<RequireAuth />}>
          <Route element={<DesktopLayout />}>
            {desktopRoutes.map(r => <Route key={r.path} {...r} />)}
          </Route>
          <Route element={<StationLayout />}>
            {stationRoutes.map(r => <Route key={r.path} {...r} />)}
          </Route>
        </Route>
        <Route element={<PublicLayout />}>
          {publicRoutes.map(r => <Route key={r.path} {...r} />)}
        </Route>
        <Route path="/error/404" element={<Error404 />} />
        <Route path="*" element={<Navigate to="/error/404" replace />} />
      </Routes>
    </Suspense>
  )
}
