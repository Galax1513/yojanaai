import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium tracking-[-0.005em] transition-[background-color,color,box-shadow,opacity,transform] duration-200 ease-[var(--ease-soft)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Espresso pill in light, sand-cream pill in dark.
        primary:
          "bg-primary text-on-primary shadow-[0_10px_24px_-14px_rgb(0_0_0/0.55)] hover:opacity-90",
        // Sand fill — reads well on photographs in either theme.
        accent:
          "bg-accent text-[#1c190f] shadow-[0_10px_24px_-14px_rgb(0_0_0/0.5)] hover:bg-[#d6c9a2]",
        outline:
          "border border-line-strong bg-field text-fg backdrop-blur-md hover:bg-fg/[0.06]",
        ghost: "text-fg hover:bg-fg/[0.06]",
        photo: "glass-photo hover:bg-white/20",
        link: "rounded-none px-0 text-fg underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4 text-[13px]",
        lg: "h-[3.25rem] px-7 text-[15px]",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
