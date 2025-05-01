
"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check, Minus } from "lucide-react" // Import Minus for indeterminate

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, checked, ...props }, ref) => ( // Destructure checked prop
  <CheckboxPrimitive.Root
    ref={ref}
    checked={checked} // Pass checked prop directly
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground", // Add indeterminate styles
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      {/* Conditionally render Check or Minus based on state */}
      {checked === 'indeterminate' ? <Minus className="h-4 w-4" /> : <Check className="h-4 w-4" />}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }

    