import { cn } from "@/lib/utils";

interface Props {
  gradient: string;
  imageUrl?: string | null;
  alt: string;
  className?: string;
  ratio?: "landscape" | "square" | "portrait" | "hero";
}

const RATIO: Record<NonNullable<Props["ratio"]>, string> = {
  landscape: "aspect-[16/10]",
  square:    "aspect-square",
  portrait:  "aspect-[3/4]",
  hero:      "aspect-[21/10]",
};

/**
 * Slab visual — renders an uploaded image when present, otherwise a
 * color-family CSS gradient. Includes a subtle veining overlay so the
 * gradient reads as stone rather than a flat swatch.
 */
export function SlabVisual({ gradient, imageUrl, alt, className, ratio = "landscape" }: Props) {
  return (
    <div className={cn("relative w-full overflow-hidden rounded-md", RATIO[ratio], className)}>
      {imageUrl ? (
        <img src={imageUrl} alt={alt} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0" style={{ background: gradient }} aria-label={alt} role="img">
          <div
            className="absolute inset-0 opacity-40 mix-blend-overlay"
            style={{
              backgroundImage:
                "radial-gradient(120% 60% at 20% 30%, rgba(255,255,255,0.35), transparent 60%), radial-gradient(80% 40% at 80% 70%, rgba(0,0,0,0.25), transparent 60%), repeating-linear-gradient(115deg, rgba(255,255,255,0.06) 0 2px, transparent 2px 12px)",
            }}
          />
          <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.25)]" />
        </div>
      )}
    </div>
  );
}
