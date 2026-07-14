import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

const AUTH_STORAGE_KEY = "ar_commerce_supabase_session";
const PROFILE_CACHE_KEY = "ar_commerce_profile_cache";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: {
      getItem: async (key: string) => {
        try {
          const raw = await AsyncStorage.getItem(`${AUTH_STORAGE_KEY}_${key}`);
          return raw;
        } catch {
          return null;
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          await AsyncStorage.setItem(`${AUTH_STORAGE_KEY}_${key}`, value);
        } catch {}
      },
      removeItem: async (key: string) => {
        try {
          await AsyncStorage.removeItem(`${AUTH_STORAGE_KEY}_${key}`);
        } catch {}
      },
    },
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

export interface DbProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "merchant_owner" | "consumer";
  merchant_id: string | null;
  avatar_url: string | null;
  created_at: string | null;
}

export async function fetchProfile(
  userId: string
): Promise<DbProfile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, merchant_id, avatar_url, created_at")
      .eq("id", userId)
      .single();

    if (error || !data) {
      console.warn("[Supabase] profile fetch error:", error?.code, error?.message);
      return null;
    }

    const profile = data as DbProfile;
    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
    return profile;
  } catch (err) {
    console.warn("[Supabase] profile fetch exception:", err);
    try {
      const cached = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
      if (cached) return JSON.parse(cached) as DbProfile;
    } catch {}
    return null;
  }
}

export async function getCachedProfile(): Promise<DbProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
    if (raw) return JSON.parse(raw) as DbProfile;
  } catch {}
  return null;
}

export async function clearProfileCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {}
}
