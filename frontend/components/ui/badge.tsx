import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-indigo-500/15 text-indigo-300 border border-indigo-500/30",
        secondary:
          "border-transparent bg-white/10 text-slate-300 border border-white/10",
        destructive:
          "border-transparent bg-red-500/15 text-red-400 border border-red-500/30",
        outline: "text-slate-300 border border-white/10",
        success:
          "border-transparent bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
        violet:
          "border-transparent bg-violet-500/15 text-violet-300 border border-violet-500/30",
        warning:
          "border-transparent bg-amber-500/15 text-amber-300 border border-amber-500/30",
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
