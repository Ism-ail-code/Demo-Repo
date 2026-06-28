import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

export interface DbMerchant {
  id: string;
  name: string | null;
  slug: string | null;
  checkout_url: string | null;
  website_url: string | null;
}

export interface DbProduct {
  id: string;
  name: string | null;
  title: string | null;
  description: string | null;
  merchant_id: string | null;
  merchant: string | null;
  merchant_name: string | null;
  merchant_slug: string | null;
  checkout_url: string | null;
  thumbnail_color: string | null;
  primary_color: string | null;
  category: string | null;
  scan_count: number | null;
  views: number | null;
  view_count: number | null;
  merchants?: DbMerchant | null;
}

export interface DbAsset {
  id: string;
  product_id: string;
  platform: "ios" | "android" | "all" | null;
  file_url: string | null;
  glb_url: string | null;
  usdz_url: string | null;
  url: string | null;
  file_type: "glb" | "usdz" | null;
}

export interface DbVariant {
  id: string;
  product_id: string;
  name: string | null;
  label: string | null;
  color_hex: string | null;
  hex: string | null;
  color: string | null;
  base_color_r: number | null;
  base_color_g: number | null;
  base_color_b: number | null;
  base_color_a: number | null;
}

export interface DbProductWithRelations extends DbProduct {
  assets: DbAsset[];
  product_variants: DbVariant[];
}
