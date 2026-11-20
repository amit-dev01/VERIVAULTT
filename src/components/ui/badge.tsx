import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-[#592B9B]/20",
  {
    variants: {
      variant: {
        default:
          "border-[rgba(89,43,155,0.2)] bg-[#F7F5FB] text-[#592B9B] font-['Sometype_Mono',monospace]",
        secondary:
          "border-[#ECE8F2] bg-[#F7F5FB] text-[#55505F] font-['Inter',sans-serif]",
        success:
          "border-emerald-500/25 bg-emerald-50 text-emerald-700 font-medium",
        destructive:
          "border-red-500/25 bg-red-50 text-red-600 font-medium",
        outline:
          "border-[#ECE8F2] text-[#55505F] bg-white font-['Sometype_Mono',monospace]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
