import { useEffect, useState } from "react";
import { useBrand } from "@/hooks/useBrand";
import logoFull from "@/assets/firmus-logo.png.asset.json";
import logoMark from "@/assets/firmus-mark.png.asset.json";

type Props = {
  /** full = mark + FIRMUS FORMATION wordmark; mark = emblem only (small sizes, favicon-like spots) */
  variant?: "full" | "mark";
  className?: string;
};

/**
 * The one shared Firmus Formation logo. Shows the logo set in admin settings
 * (company_settings.logo_url) when present, with the built-in uploaded logo as fallback.
 */
export function BrandLogo({ variant = "full", className }: Props) {
  const brand = useBrand();
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [brand.logoUrl]);
  const fallback = variant === "full" ? logoFull.url : logoMark.url;
  const src = !broken && brand.logoUrl ? brand.logoUrl : fallback;

  return (
    <img
      src={src}
      alt="Firmus Formation"
      onError={() => setBroken(true)}
      className={`${variant === "full" ? "h-9 w-auto object-contain" : "h-9 w-9 object-contain"} ${className ?? ""}`}
    />
  );
}
