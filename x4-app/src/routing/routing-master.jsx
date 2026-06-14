import { lazy } from "react"

const CarrierPage = lazy(() => import("@/pages/master/shipping/carrier"))
const ContainerPage = lazy(() => import("@/pages/master/shipping/container"))
const CountryPage = lazy(() => import("@/pages/master/shipping/country"))
const CountryOfOriginPage = lazy(() => import("@/pages/master/shipping/country-of-origin"))
const PortPage = lazy(() => import("@/pages/master/shipping/port"))
const ProductPage = lazy(() => import("@/pages/master/shipping/product"))
const ProductPricePage = lazy(() => import("@/pages/master/shipping/product-price"))
const SignatoryPage = lazy(() => import("@/pages/master/shipping/signatory"))
const CustomerPage = lazy(() => import("@/pages/master/shipping/customer"))
const DestinationPage = lazy(() => import("@/pages/master/shipping/destination"))
const KittingBomPage = lazy(() => import("@/pages/master/shipping/kitting-bom"))

export const masterRoutes = [
  { path: "/shipping/master/carrier", element: <CarrierPage /> },
  { path: "/shipping/master/container", element: <ContainerPage /> },
  { path: "/shipping/master/country", element: <CountryPage /> },
  { path: "/shipping/master/country-of-origin", element: <CountryOfOriginPage /> },
  { path: "/shipping/master/port", element: <PortPage /> },
  { path: "/shipping/master/product", element: <ProductPage /> },
  { path: "/shipping/master/product-price", element: <ProductPricePage /> },
  { path: "/shipping/master/signatory", element: <SignatoryPage /> },
  { path: "/shipping/master/customer", element: <CustomerPage /> },
  { path: "/shipping/master/destination", element: <DestinationPage /> },
  { path: "/shipping/master/kitting-bom", element: <KittingBomPage /> },
]
