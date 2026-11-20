import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-2xl border p-4 sm:p-5 text-sm shadow-sm [&>svg~*]:pl-8 [&>svg+div]:translate-y-[-2px] [&>svg]:absolute [&>svg]:left-4 sm:[&>svg]:left-5 [&>svg]:top-4 sm:[&>svg]:top-5",
  {
    variants: {
      variant: {
        default:
          "bg-white border-[#ECE8F2] text-[#1A1523] [&>svg]:text-[#592B9B]",
        destructive:
          "border-red-200 bg-red-50/90 text-red-900 [&>svg]:text-red-600",
        warning:
          "border-amber-200 bg-amber-50/90 text-amber-900 [&>svg]:text-amber-600",
        info:
          "border-[rgba(89,43,155,0.2)] bg-[#F7F5FB] text-[#1A1523] [&>svg]:text-[#592B9B]",
        success:
          "border-emerald-200 bg-emerald-50/90 text-emerald-900 [&>svg]:text-emerald-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-bold leading-none tracking-tight font-['Plus_Jakarta_Sans',sans-serif]", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-xs sm:text-sm font-['Inter',sans-serif] leading-relaxed opacity-95", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
