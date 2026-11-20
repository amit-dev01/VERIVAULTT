import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#592B9B]/20 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#F16221] text-white shadow-md shadow-[#F16221]/20 hover:bg-[#d95216] hover:scale-[1.02] active:scale-[0.98]",
        destructive:
          "bg-[#EF4444] text-white shadow-md shadow-[#EF4444]/20 hover:bg-[#dc2626] hover:scale-[1.02] active:scale-[0.98]",
        outline:
          "border border-[#ECE8F2] bg-white text-[#1A1523] hover:bg-[#F7F5FB] hover:border-[#592B9B]/30 hover:scale-[1.01] active:scale-[0.98] shadow-sm",
        secondary:
          "bg-[#F7F5FB] text-[#1A1523] border border-[#ECE8F2] hover:bg-white hover:border-[#592B9B]/30 hover:scale-[1.01] active:scale-[0.98] shadow-sm",
        ghost:
          "text-[#55505F] hover:text-[#1A1523] hover:bg-[#F7F5FB] active:scale-[0.98]",
        link:
          "text-[#F16221] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-full px-4 text-xs",
        lg: "h-12 rounded-full px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
