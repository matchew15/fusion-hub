import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { theme } from "@/lib/theme"
import { cn } from "@/lib/utils"

const buttonStyles = cva(
  "inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-md text-sm font-medium antialiased subpixel-antialiased ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 cyber-panel neon-focus hover-lift",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 cyber-panel neon-focus hover-lift",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground cyber-panel neon-focus hover-lift",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 cyber-panel neon-focus hover-lift",
        ghost: "hover:bg-accent hover:text-accent-foreground neon-focus hover-lift",
        link: "text-primary underline-offset-4 hover:underline hover-lift",
        neon: `relative bg-transparent border border-neonBlue text-neonBlue cyber-panel neon-focus hover-lift ${theme.effects.neonGlow(theme.colors.neonBlue)}`,
        neonPurple: `relative bg-transparent border border-neonPurple text-neonPurple cyber-panel neon-focus hover-lift ${theme.effects.neonGlow(theme.colors.neonPurple)}`,
        neonPink: `relative bg-transparent border border-neonPink text-neonPink cyber-panel neon-focus hover-lift ${theme.effects.neonGlow(theme.colors.neonPink)}`,
        holographic: `relative text-white cyber-panel neon-focus hover-lift ${theme.effects.holographicGradient}`,
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-md px-4 py-2",
        lg: "h-14 rounded-md px-8 py-4",
        icon: "h-12 w-12 p-3",
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
    VariantProps<typeof buttonStyles> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonStyles({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, type ButtonProps }
export const buttonVariants = buttonStyles
