import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="text-sm font-medium text-[var(--foreground)]">{label}</label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-[var(--radius)] border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm ring-offset-background placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-[var(--destructive)] focus:ring-[var(--destructive)]",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs text-[var(--destructive)]">{error}</p>}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }