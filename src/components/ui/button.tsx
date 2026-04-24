import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border-2 border-transparent bg-clip-padding text-sm font-black whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-[2px] active:shadow-none disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 uppercase tracking-wider",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground border-primary shadow-[0_4px_0_0_#4a6728] hover:bg-primary/90",
        outline:
          "border-2 border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 shadow-[0_4px_0_0_#18181b]",
        secondary:
          "bg-zinc-800 text-zinc-100 border-zinc-700 hover:bg-zinc-700 shadow-[0_4px_0_0_#09090b]",
        ghost:
          "hover:bg-zinc-900 hover:text-zinc-100 border-transparent",
        destructive:
          "bg-red-600 text-white border-red-700 hover:bg-red-500 shadow-[0_4px_0_0_#7f1d1d]",
        link: "text-primary underline-offset-4 hover:underline shadow-none border-none bg-transparent",
      },
      size: {
        default:
          "h-11 gap-2 px-6",
        xs: "h-8 gap-1 rounded-lg px-3 text-xs shadow-[0_2px_0_0_rgba(0,0,0,0.3)]",
        sm: "h-9 gap-1.5 rounded-lg px-4 text-[0.8rem] shadow-[0_3px_0_0_rgba(0,0,0,0.3)]",
        lg: "h-14 gap-2.5 px-8 text-base shadow-[0_6px_0_0_rgba(0,0,0,0.3)]",
        icon: "size-11",
        "icon-xs": "size-8 rounded-lg shadow-[0_2px_0_0_rgba(0,0,0,0.3)]",
        "icon-sm": "size-9 rounded-lg shadow-[0_3px_0_0_rgba(0,0,0,0.3)]",
        "icon-lg": "size-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
