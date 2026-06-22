import { Toaster } from "sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function AppProviders({ children }) {
  return (
    <TooltipProvider>
      <Toaster position="top-right" />
      {children}
    </TooltipProvider>
  )
}
