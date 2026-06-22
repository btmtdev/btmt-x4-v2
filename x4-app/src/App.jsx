import "./style.css"
import { BrowserRouter } from "react-router-dom"
import AppProviders from "./providers/AppProviders"
import AppRouting from "./routing/app-routing"

export default function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <AppRouting />
      </AppProviders>
    </BrowserRouter>
  )
}
