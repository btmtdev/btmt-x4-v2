import { Loader2 } from "lucide-react"

export function Spinner({ className = "" }) {
  return <div className={`flex items-center justify-center p-8 ${className}`}><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
}
