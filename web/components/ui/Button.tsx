import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "t-btn group/button inline-flex shrink-0 items-center justify-center rounded-full border bg-clip-padding text-sm font-medium tracking-[0.005em] whitespace-nowrap outline-none select-none focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-[var(--border-strong)] aria-invalid:ring-2 aria-invalid:ring-[var(--border-strong)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--accent)] text-[var(--accent-ink)] hover:opacity-95",
        outline:
          "border-[var(--border-strong)] bg-transparent text-[var(--text)] hover:border-[var(--accent-line)] aria-expanded:border-[var(--border-strong)]",
        secondary:
          "border-[var(--border)] bg-[var(--bg-elev-2)] text-[var(--text)] hover:border-[var(--border-strong)] aria-expanded:bg-[var(--bg-elev-2)]",
        ghost:
          "border-[var(--border-strong)] bg-transparent text-[var(--text)] hover:border-[var(--accent-line)] aria-expanded:border-[var(--border-strong)]",
        destructive:
          "border-[var(--border-strong)] bg-transparent text-[var(--text)] hover:bg-[var(--bg-elev-2)] focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent)]",
        link: "border-transparent bg-transparent text-[var(--text)] underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-[38px] gap-2 px-4 text-[13px] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1 px-3 text-[12px] in-data-[slot=button-group]:rounded-full has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-[30px] gap-1.5 px-3 text-[12px] in-data-[slot=button-group]:rounded-full has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-[46px] gap-2 px-[22px] text-[14px] has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        icon: "size-9",
        "icon-xs":
          "size-7 rounded-full in-data-[slot=button-group]:rounded-full [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 rounded-full in-data-[slot=button-group]:rounded-full",
        "icon-lg": "size-11",
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
