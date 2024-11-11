import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { theme } from "@/lib/theme"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-md text-sm font-medium antialiased subpixel-antialiased ring-offset-background transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-lift m-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg neon-focus contrast-[1.1] px-6 py-3",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 neon-focus contrast-[1.1] px-6 py-3",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground neon-focus px-6 py-3",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 neon-focus px-6 py-3",
        ghost: "hover:bg-accent hover:text-accent-foreground neon-focus px-6 py-3",
        link: "text-primary underline-offset-4 hover:underline px-4 py-2",
        neon: `relative bg-transparent border border-neonBlue text-neonBlue contrast-[1.1] px-6 py-3 ${theme.effects.neonGlow(theme.colors.neonBlue)}`,
        neonPurple: `relative bg-transparent border border-neonPurple text-neonPurple contrast-[1.1] px-6 py-3 ${theme.effects.neonGlow(theme.colors.neonPurple)}`,
        neonPink: `relative bg-transparent border border-neonPink text-neonPink contrast-[1.1] px-6 py-3 ${theme.effects.neonGlow(theme.colors.neonPink)}`,
        holographic: `relative text-white contrast-[1.1] px-6 py-3 ${theme.effects.holographicGradient}`,
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

export { Button, type ButtonProps, buttonVariants }
