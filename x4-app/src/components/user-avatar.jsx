import { cn } from "@/lib/utils"

function getInitials(name) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return (parts[0]?.[0] || "?").toUpperCase()
}

export function UserAvatar({ avatarUrl, name, className, size = "md" }) {
  const sizes = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-12 text-base" }

  if (avatarUrl) {
    return (
      <div className={cn("rounded-full overflow-hidden shrink-0", sizes[size], className)}>
        <img src={avatarUrl} className="size-full object-cover" alt={name} />
      </div>
    )
  }

  return (
    <div className={cn("rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0", sizes[size], className)}>
      {getInitials(name)}
    </div>
  )
}
