import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Brand = {
  logoUrl: string | null;
  brandPrimary: string | null;
};

let cache: Promise<Brand> | null = null;

function loadBrand(): Promise<Brand> {
  if (!cache) {
    const request = Promise.resolve(supabase
      .from("public_brand_settings")
      .select("logo_url, brand_primary")
      .maybeSingle())
      .then(({ data }) => ({
        logoUrl: (data?.logo_url as string | null) ?? null,
        brandPrimary: (data?.brand_primary as string | null) ?? null,
      }))
      .catch(() => ({ logoUrl: null, brandPrimary: null }) as Brand);
    cache = request;
    return request;
  }
  return cache;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const v = parseInt(m[1], 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function contrastVsWhite(rgb: [number, number, number]): number {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const l = 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
  return (1.05) / (l + 0.05);
}

function readableDark(hex: string): string | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const factors = [1, 0.85, 0.7, 0.55, 0.42, 0.32];
  for (const k of factors) {
    const scaled = rgb.map((c) => Math.round(c * k)) as [number, number, number];
    if (contrastVsWhite(scaled) >= 4.5) {
      return "#" + scaled.map((c) => c.toString(16).padStart(2, "0")).join("");
    }
  }
  return "#10123A";
}

const BRAND_SETTINGS_UPDATED = "firmus-brand-settings-updated";

/** Applies brand_primary as a runtime CSS variable override; falls back to defaults when unset. */
function applyPrimaryOverride(hex: string | null) {
  const root = document.documentElement;
  if (!hex) {
    root.style.removeProperty("--primary");
    root.style.removeProperty("--primary-glow");
    root.style.removeProperty("--ring");
    root.style.removeProperty("--gold");
    root.style.removeProperty("--accent");
    return;
  }
  const rgb = hexToRgb(hex);
  if (!rgb) return; // invalid value: keep defaults, never break the theme
  const dark = readableDark(hex);
  if (!dark) return;
  const normalized = hex.trim().startsWith("#") ? hex.trim() : `#${hex.trim()}`;
  root.style.setProperty("--primary", dark);
  root.style.setProperty("--primary-glow", dark);
  root.style.setProperty("--gold", dark);
  root.style.setProperty("--accent", normalized);
  root.style.setProperty("--ring", normalized);
}

/** Reloads the public brand settings after an admin saves them and updates all mounted logos. */
export async function refreshBrandSettings(): Promise<Brand> {
  cache = null;
  const brand = await loadBrand();
  applyPrimaryOverride(brand.brandPrimary);
  if (typeof window !== "undefined") window.dispatchEvent(new Event(BRAND_SETTINGS_UPDATED));
  return brand;
}

/**
 * Loads brand identity (logo URL, primary color) from company settings.
 * Client-side only; SSR renders the built-in logo defaults.
 */
export function useBrand(): Brand {
  const [brand, setBrand] = useState<Brand>({ logoUrl: null, brandPrimary: null });

  useEffect(() => {
    let alive = true;
    const handleBrandUpdate = () => {
      void loadBrand().then((b) => {
        if (!alive) return;
        setBrand(b);
        applyPrimaryOverride(b.brandPrimary);
      });
    };
    window.addEventListener(BRAND_SETTINGS_UPDATED, handleBrandUpdate);
    loadBrand().then((b) => {
      if (!alive) return;
      setBrand(b);
      applyPrimaryOverride(b.brandPrimary);
    });
    return () => {
      alive = false;
      window.removeEventListener(BRAND_SETTINGS_UPDATED, handleBrandUpdate);
    };
  }, []);

  return brand;
}
