import { Platform } from "react-native";

import { ColorVariant, Product, SAMPLE_PRODUCTS } from "@/constants/products";
import {
  DbAsset,
  DbProduct,
  DbProductWithRelations,
  DbVariant,
  supabase,
} from "./supabase";

function resolveAssetUrl(asset: DbAsset): string {
  return asset.file_url ?? asset.glb_url ?? asset.usdz_url ?? asset.url ?? "";
}

function resolveGlb(assets: DbAsset[]): string | null {
  const a =
    assets.find((x) => x.file_type === "glb") ??
    assets.find((x) => x.platform === "android" || x.platform === "all") ??
    assets.find((x) => x.glb_url != null) ??
    assets.find((x) => x.platform !== "ios") ??
    assets[0];
  return a ? resolveAssetUrl(a) : null;
}

function resolveUsdz(assets: DbAsset[], fallbackGlb: string | null): string | null {
  const a =
    assets.find((x) => x.file_type === "usdz") ??
    assets.find((x) => x.platform === "ios") ??
    assets.find((x) => x.usdz_url != null);
  if (a) return a.usdz_url ?? a.file_url ?? fallbackGlb;
  return fallbackGlb;
}

function dbProductToLocal(row: DbProductWithRelations): Product {
  const fallbackSeed = SAMPLE_PRODUCTS[0];
  const assets: DbAsset[] = Array.isArray(row.assets) ? row.assets : [];
  const variants: DbVariant[] = Array.isArray(row.product_variants)
    ? row.product_variants
    : [];

  const glbUrl = resolveGlb(assets) ?? fallbackSeed.glbUrl;
  const usdzUrl = resolveUsdz(assets, glbUrl) ?? glbUrl;

  const colorVariants: ColorVariant[] = variants.map((v) => ({
    id: v.id,
    name: v.name ?? v.label ?? "Default",
    color: v.color_hex ?? v.hex ?? v.color ?? "#888888",
    baseColorFactor: [
      v.base_color_r ?? 0.5,
      v.base_color_g ?? 0.5,
      v.base_color_b ?? 0.5,
      v.base_color_a ?? 1.0,
    ],
  }));

  const merchantName =
    row.merchant ?? row.merchant_name ?? "Unknown Merchant";
  const merchantSlug = row.merchant_id ?? row.merchant_slug ?? row.id;
  const checkoutUrl = row.checkout_url ?? "https://example.com";
  const thumbnailColor =
    row.thumbnail_color ??
    row.primary_color ??
    colorVariants[0]?.color ??
    fallbackSeed.thumbnailColor;

  return {
    id: row.id,
    name: row.name ?? row.title ?? "Unnamed Product",
    merchant: merchantName,
    merchantSlug,
    checkoutUrl,
    description: row.description ?? "",
    category: row.category ?? "Other",
    scanCount: row.scan_count ?? row.views ?? row.view_count ?? 0,
    colorVariants:
      colorVariants.length > 0 ? colorVariants : fallbackSeed.colorVariants,
    glbUrl,
    usdzUrl,
    thumbnailColor,
  };
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchMerchantsByIds(
  ids: string[]
): Promise<Map<string, { name: string; slug: string; checkout_url: string | null }>> {
  if (ids.length === 0) return new Map();
  try {
    const { data, error } = await supabase
      .from("merchants")
      .select("id, name, slug")
      .in("id", ids);
    if (error) {
      console.warn("[Supabase] merchants fetch error:", error.code, error.message);
      return new Map();
    }
    const map = new Map<string, { name: string; slug: string; checkout_url: string | null }>();
    for (const m of data ?? []) {
      map.set((m as any).id, { ...(m as any), checkout_url: null });
    }
    return map;
  } catch {
    return new Map();
  }
}

async function fetchAssetsByProductIds(
  ids: string[]
): Promise<Map<string, DbAsset[]>> {
  if (ids.length === 0) return new Map();
  try {
    const { data, error } = await supabase
      .from("assets")
      .select("*")
      .in("product_id", ids);
    if (error) {
      console.warn("[Supabase] assets fetch error:", error.code, error.message);
      return new Map();
    }
    const map = new Map<string, DbAsset[]>();
    for (const a of data ?? []) {
      const pid = (a as DbAsset).product_id;
      if (!map.has(pid)) map.set(pid, []);
      map.get(pid)!.push(a as DbAsset);
    }
    return map;
  } catch {
    return new Map();
  }
}

async function fetchVariantsByProductIds(
  ids: string[]
): Promise<Map<string, DbVariant[]>> {
  if (ids.length === 0) return new Map();
  try {
    const { data, error } = await supabase
      .from("product_variants")
      .select("*")
      .in("product_id", ids);
    if (error) {
      console.warn("[Supabase] variants fetch error:", error.code, error.message);
      return new Map();
    }
    const map = new Map<string, DbVariant[]>();
    for (const v of data ?? []) {
      const pid = (v as DbVariant).product_id;
      if (!map.has(pid)) map.set(pid, []);
      map.get(pid)!.push(v as DbVariant);
    }
    return map;
  } catch {
    return new Map();
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchProductById(productId: string): Promise<Product> {
  const localSeed = SAMPLE_PRODUCTS.find((p) => p.id === productId);

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .maybeSingle();

    if (error) {
      console.warn("[Supabase] fetchProductById error:", error.code, error.message);
      return localSeed ?? SAMPLE_PRODUCTS[0];
    }
    if (!data) {
      return localSeed ?? SAMPLE_PRODUCTS[0];
    }

    const productRow = data as DbProduct;
    const merchantId = productRow.merchant_id ?? "";
    const [assetMap, variantMap, merchantMap] = await Promise.all([
      fetchAssetsByProductIds([productId]),
      fetchVariantsByProductIds([productId]),
      fetchMerchantsByIds(merchantId ? [merchantId] : []),
    ]);

    const m = merchantId ? merchantMap.get(merchantId) : undefined;
    const row: DbProductWithRelations = {
      ...productRow,
      merchant: m?.name ?? productRow.merchant,
      merchant_name: m?.name ?? productRow.merchant_name,
      merchant_slug: m?.slug ?? undefined,
      checkout_url: productRow.checkout_url ?? m?.checkout_url ?? null,
      assets: assetMap.get(productId) ?? [],
      product_variants: variantMap.get(productId) ?? [],
    };
    console.info("[Supabase] fetched product:", row.name ?? row.title);
    return dbProductToLocal(row);
  } catch (err) {
    console.warn("[Supabase] fetchProductById exception:", err);
    return localSeed ?? SAMPLE_PRODUCTS[0];
  }
}

export async function fetchTrendingProducts(limit = 10): Promise<Product[]> {
  try {
    const { data: rows, error } = await supabase
      .from("products")
      .select("*")
      .limit(limit);

    if (error) {
      console.warn("[Supabase] fetchTrending error:", error.code, error.message);
      return SAMPLE_PRODUCTS.filter((p) => p.category !== "Demo");
    }
    if (!rows || rows.length === 0) {
      console.info("[Supabase] products table empty, using seed data");
      return SAMPLE_PRODUCTS.filter((p) => p.category !== "Demo");
    }

    const productRows = rows as DbProduct[];
    const ids = productRows.map((r) => r.id);
    const merchantIds = [...new Set(productRows.map((r) => r.merchant_id).filter(Boolean) as string[])];

    const [assetMap, variantMap, merchantMap] = await Promise.all([
      fetchAssetsByProductIds(ids),
      fetchVariantsByProductIds(ids),
      fetchMerchantsByIds(merchantIds),
    ]);

    console.info("[Supabase] fetched", rows.length, "live products");

    return productRows.map((row) => {
      const m = row.merchant_id ? merchantMap.get(row.merchant_id) : undefined;
      return dbProductToLocal({
        ...row,
        merchant: m?.name ?? row.merchant,
        merchant_name: m?.name ?? row.merchant_name,
        merchant_slug: m?.slug ?? undefined,
        checkout_url: row.checkout_url ?? m?.checkout_url ?? null,
        assets: assetMap.get(row.id) ?? [],
        product_variants: variantMap.get(row.id) ?? [],
      });
    });
  } catch (err) {
    console.warn("[Supabase] fetchTrending exception:", err);
    return SAMPLE_PRODUCTS.filter((p) => p.category !== "Demo");
  }
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface TrackEventPayload {
  event_type: "product_view" | "color_change" | "buy_now" | "qr_scan";
  product_id: string;
  merchant_slug: string;
  variant_id?: string;
  platform?: string;
}

export async function trackEvent(payload: TrackEventPayload): Promise<void> {
  const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

  try {
    await fetch(`${baseUrl}/functions/v1/track-event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      },
      body: JSON.stringify({
        ...payload,
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    /* fire-and-forget */
  }

  try {
    await supabase.from("analytics_events").insert([
      {
        event_type: payload.event_type,
        product_id: payload.product_id,
        merchant_slug: payload.merchant_slug,
        variant_id: payload.variant_id ?? null,
        platform: Platform.OS,
        occurred_at: new Date().toISOString(),
      },
    ]);
  } catch {
    /* fire-and-forget */
  }
}
