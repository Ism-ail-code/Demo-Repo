import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import { ColorVariant, Product, SAMPLE_PRODUCTS } from "@/constants/products";
import { DbMerchant, DbProduct, DbVariant, supabase } from "./supabase";

export type RapidifyEventName =
  | "product_view"
  | "page_view"
  | "ar_widget_visible"
  | "ar_launch"
  | "ar_session_end"
  | "add_to_cart"
  | "purchase_completed"
  | "buy_click"
  | "qr_open"
  | "embed_open"
  | "variant_switch"
  | "session_start";

const DEFAULT_BRAND_COLOR = "#7c3aed";

export function isSafeHttpsUrl(
  url: string | null | undefined
): url is string {
  if (!url) return false;
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

function hexToRGBA(
  hex: string | null | undefined
): [number, number, number, number] {
  if (!hex) return [0.5, 0.5, 0.5, 1];
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [0.5, 0.5, 0.5, 1];
  const n = parseInt(m[1], 16);
  return [
    ((n >> 16) & 255) / 255,
    ((n >> 8) & 255) / 255,
    (n & 255) / 255,
    1,
  ];
}

function dbProductToLocal(
  row: DbProduct,
  merchant: Pick<DbMerchant, "name" | "slug" | "brand_color"> | null,
  variants: DbVariant[]
): Product {
  const variantList = Array.isArray(variants) ? variants : [];
  const colorVariants: ColorVariant[] = variantList.map((v) => ({
    id: v.id,
    name: v.name || "Default",
    color: v.color_hex || "#888888",
    baseColorFactor: hexToRGBA(v.color_hex),
  }));

  const fallbackVariant: ColorVariant = {
    id: "default",
    name: "Default",
    color: merchant?.brand_color ?? DEFAULT_BRAND_COLOR,
    baseColorFactor: hexToRGBA(merchant?.brand_color),
  };

  const glbUrl = isSafeHttpsUrl(row.model_glb_url) ? row.model_glb_url : "";
  const usdzUrl = isSafeHttpsUrl(row.model_usdz_url)
    ? row.model_usdz_url
    : glbUrl;

  return {
    id: row.id,
    name: row.title || "Unnamed Product",
    merchant: merchant?.name ?? "Unknown Merchant",
    merchantSlug: merchant?.slug ?? row.merchant_id,
    checkoutUrl: isSafeHttpsUrl(row.buy_url) ? row.buy_url : "",
    description: row.description ?? "",
    category: "Other",
    scanCount: 0,
    colorVariants:
      colorVariants.length > 0 ? colorVariants : [fallbackVariant],
    glbUrl,
    usdzUrl,
    thumbnailColor:
      merchant?.brand_color ?? colorVariants[0]?.color ?? DEFAULT_BRAND_COLOR,
    merchantId: row.merchant_id,
    businessId: row.business_id ?? undefined,
    priceCents: row.price_cents,
    currency: row.currency,
    imageUrl: isSafeHttpsUrl(row.thumbnail_url)
      ? row.thumbnail_url
      : isSafeHttpsUrl(row.image_url)
        ? row.image_url
        : "",
  };
}

const PRODUCT_QUERY =
  "id, slug, title, description, price_cents, currency, thumbnail_url, image_url, model_glb_url, model_usdz_url, buy_url, status, merchant_id, business_id, external_sku, external_product_id";
const MERCHANT_QUERY = "id, slug, name, logo_url, brand_color, store_domain";
const VARIANT_QUERY =
  "id, product_id, name, color_hex, model_glb_url, model_usdz_url, thumbnail_url, sort_order";

async function fetchProductRow(slug?: string, productId?: string): Promise<Product | null> {
  try {
    let query = supabase.from("products").select(PRODUCT_QUERY);
    if (slug) query = query.eq("slug", slug);
    if (productId) query = query.eq("id", productId);
    const { data: row, error } = await query
      .eq("status", "active")
      .maybeSingle();

    if (error || !row) {
      console.warn("[Supabase] fetchProduct error:", error?.code, error?.message ?? "not found");
      return null;
    }

    const product = row as DbProduct;
    const [merchantRes, variantsRes] = await Promise.all([
      supabase
        .from("merchants")
        .select(MERCHANT_QUERY)
        .eq("id", product.merchant_id)
        .maybeSingle(),
      supabase
        .from("product_variants")
        .select(VARIANT_QUERY)
        .eq("product_id", product.id)
        .order("sort_order", { ascending: true }),
    ]);

    const merchant = merchantRes.error ? null : (merchantRes.data as DbMerchant | null);
    const variants =
      (variantsRes.data as DbVariant[] | null) ?? [];

    return dbProductToLocal(product, merchant, variants);
  } catch (err) {
    console.warn("[Supabase] fetchProduct exception:", err);
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  return fetchProductRow(slug);
}

export async function fetchProductById(productId: string): Promise<Product | null> {
  return fetchProductRow(undefined, productId);
}

export async function fetchTrendingProducts(limit = 10): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_QUERY)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) {
      console.warn("[Supabase] fetchTrending error:", error?.code, error?.message ?? "empty");
      return SAMPLE_PRODUCTS.filter((p) => p.category !== "Demo");
    }

    const rows = data as DbProduct[];
    const merchantIds = [...new Set(rows.map((r) => r.merchant_id))];
    const [merchantRes, variantsRes] = await Promise.all([
      merchantIds.length > 0
        ? supabase.from("merchants").select(MERCHANT_QUERY).in("id", merchantIds)
        : Promise.resolve({ data: null, error: null } as const),
      supabase
        .from("product_variants")
        .select(VARIANT_QUERY)
        .in("product_id", rows.map((r) => r.id)),
    ]);

    const merchants = new Map<string, DbMerchant>();
    for (const m of (merchantRes?.data as DbMerchant[] | null) ?? []) {
      merchants.set(m.id, m);
    }

    const variantsByProduct = new Map<string, DbVariant[]>();
    for (const v of (variantsRes.data as DbVariant[] | null) ?? []) {
      const list = variantsByProduct.get(v.product_id) ?? [];
      list.push(v);
      variantsByProduct.set(v.product_id, list);
    }

    return rows.map((r) =>
      dbProductToLocal(r, merchants.get(r.merchant_id) ?? null, variantsByProduct.get(r.id) ?? [])
    );
  } catch (err) {
    console.warn("[Supabase] fetchTrending exception:", err);
    return SAMPLE_PRODUCTS.filter((p) => p.category !== "Demo");
  }
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface TrackEventPayload {
  event_type: RapidifyEventName;
  product_id?: string | null;
  merchant_id?: string | null;
  business_id?: string | null;
  variant_id?: string | null;
  duration_ms?: number | null;
  source?: string | null;
  metadata?: Record<string, unknown>;
}

const SESSION_STORAGE_KEY = "ar_commerce_session_id";
let cachedSessionId: string | null = null;

async function getSessionId(): Promise<string> {
  if (cachedSessionId) return cachedSessionId;
  try {
    cachedSessionId = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
  } catch {}
  if (!cachedSessionId) {
    cachedSessionId =
      "ms_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
    try {
      await AsyncStorage.setItem(SESSION_STORAGE_KEY, cachedSessionId);
    } catch {}
  }
  return cachedSessionId;
}

export async function trackEvent(payload: TrackEventPayload): Promise<void> {
  try {
    const sessionId = await getSessionId();
    const { error } = await supabase.from("analytics_events").insert({
      event_type: payload.event_type,
      session_id: sessionId,
      product_id: payload.product_id ?? null,
      merchant_id: payload.merchant_id ?? null,
      business_id: payload.business_id ?? null,
      variant_id: payload.variant_id ?? null,
      metadata:
        payload.duration_ms != null || payload.source != null
          ? {
              duration_ms: payload.duration_ms ?? null,
              source: payload.source ?? null,
              ...(payload.metadata ?? {}),
            }
          : payload.metadata ?? null,
      user_agent: `RapidifyMobile/${Platform.OS}/${Platform.Version ?? "unknown"}`,
    });
    if (error) {
      console.warn("[Supabase] analytics insert error:", error.code, error.message);
    }
  } catch (err) {
    console.warn("[Supabase] analytics insert exception:", err);
  }
}