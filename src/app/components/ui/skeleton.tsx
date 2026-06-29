import { cn } from "./utils";

const shimmerStyle = `
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.shimmer-anim {
  animation: shimmer 1.2s linear infinite;
}
`;

type SkeletonProps = React.ComponentProps<"div"> & {
  variant?: "rect" | "text" | "title" | "circle" | "card";
};

function Skeleton({ className, variant = "rect", ...props }: SkeletonProps) {
  const baseClass = cn(
    "relative overflow-hidden",
    variant === "text" ? "h-4 rounded-sm" : variant === "title" ? "h-6 rounded-md" : variant === "circle" ? "rounded-full" : "rounded-lg",
    "bg-slate-100 shadow-sm",
    className,
  );

  return (
    <>
      <style>{shimmerStyle}</style>
      <div data-slot="skeleton" className={baseClass} {...props}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent shimmer-anim" />
      </div>
    </>
  );
}

export { Skeleton };