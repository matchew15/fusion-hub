import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { theme } from "@/lib/theme"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium antialiased subpixel-antialiased ring-offset-background transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-lift",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg neon-focus",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 neon-focus",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground neon-focus",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 neon-focus",
        ghost: "hover:bg-accent hover:text-accent-foreground neon-focus",
        link: "text-primary underline-offset-4 hover:underline",
        neon: `relative bg-transparent border border-neonBlue text-neonBlue contrast-125 ${theme.effects.neonGlow(theme.colors.neonBlue)}`,
        neonPurple: `relative bg-transparent border border-neonPurple text-neonPurple contrast-125 ${theme.effects.neonGlow(theme.colors.neonPurple)}`,
        neonPink: `relative bg-transparent border border-neonPink text-neonPink contrast-125 ${theme.effects.neonGlow(theme.colors.neonPink)}`,
        holographic: `relative text-white contrast-125 ${theme.effects.holographicGradient}`,
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, type ButtonProps }
// Export buttonVariants as a named constant to fix Fast Refresh
export const variants = buttonVariants
