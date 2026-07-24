import { Link } from "@tanstack/react-router";
import { Layers, MapPin, Ruler } from "lucide-react";
import { SlabVisual } from "./SlabVisual";
import { StockLevelBadge } from "./StatusBadge";
import { aggregateProduct, areaFmt, currency, type ProductWithStock } from "@/lib/inventory-queries";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: ProductWithStock }) {
  const agg = aggregateProduct(product);
  return (
    <Link
      to="/inventory/products/$productId"
      params={{ productId: product.id }}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        "transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
      )}
    >
      <div className="relative">
        <SlabVisual gradient={product.hero_gradient} imageUrl={product.image_url} alt={product.name} ratio="landscape" />
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <StockLevelBadge level={agg.level} />
          {product.is_new_arrival && (
            <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              New
            </span>
          )}
        </div>
        <div className="absolute right-3 top-3 rounded-md bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-foreground/80 backdrop-blur">
          {product.sku}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {product.collection?.material} · {product.collection?.name}
          </div>
          <div className="mt-1 line-clamp-1 text-[14px] font-semibold tracking-tight text-foreground group-hover:text-primary">
            {product.name.split(" — ")[0]}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Ruler className="h-3 w-3" /> {product.thickness_mm}mm</span>
            <span>·</span>
            <span>{product.finish}</span>
            <span>·</span>
            <span>{product.color_family}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-md bg-muted/40 px-2 py-2 text-center">
          <Stat label="Avail." value={agg.available} tone={agg.available > 0 ? "ok" : "muted"} />
          <Stat label="Reserved" value={agg.reserved} tone={agg.reserved > 0 ? "accent" : "muted"} />
          <Stat label="Incoming" value={agg.incoming} tone={agg.incoming > 0 ? "info" : "muted"} />
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">List / m²</div>
            <div className="text-[15px] font-semibold text-foreground">
              {currency(Number(product.list_price_per_m2))}
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Layers className="h-3 w-3" /> {areaFmt(agg.totalAreaM2)}</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {agg.warehousesPresent.length > 0 ? agg.warehousesPresent.join(" · ") : "—"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "ok" | "accent" | "info" | "muted" }) {
  const toneCls =
    tone === "ok"     ? "text-success" :
    tone === "accent" ? "text-accent-foreground" :
    tone === "info"   ? "text-info" :
                        "text-muted-foreground";
  return (
    <div>
      <div className={cn("text-[14px] font-semibold tabular-nums", toneCls)}>{value}</div>
      <div className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
