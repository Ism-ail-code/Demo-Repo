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

export type DbRole =
  | "admin"
  | "merchant_owner"
  | "merchant_admin"
  | "merchant_member"
  | "consumer";

export interface DbMerchant {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  brand_color: string | null;
  store_domain: string | null;
}

export interface DbProduct {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price_cents: number;
  currency: string;
  thumbnail_url: string | null;
  image_url: string | null;
  model_glb_url: string | null;
  model_usdz_url: string | null;
  buy_url: string | null;
  status: string;
  merchant_id: string;
  business_id: string | null;
  external_sku: string | null;
  external_product_id: string | null;
}

export interface DbVariant {
  id: string;
  product_id: string;
  name: string;
  color_hex: string | null;
  model_glb_url: string | null;
  model_usdz_url: string | null;
  thumbnail_url: string | null;
  sort_order: number;
}

export interface DbProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  corporate_title: string | null;
  role: DbRole;
  merchant_id: string | null;
  avatar_url: string | null;
  created_at: string | null;
}

export async function fetchProfile(
  userId: string,
  email?: string
): Promise<DbProfile | null> {
  try {
    const [{ data: profile }, { data: userRoles }, { data: memberships }, { data: merchantId }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, corporate_title, created_at")
          .eq("id", userId)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase
          .from("merchant_members")
          .select("merchant_id, role")
          .eq("user_id", userId),
        supabase.rpc("get_user_merchant_id", { _user_id: userId }),
      ]);

    const isAdmin =
      Array.isArray(userRoles) &&
      userRoles.some((r) => (r as { role: string }).role === "admin");

    const membership =
      Array.isArray(memberships) && memberships.length > 0
        ? (memberships[0] as { merchant_id: string; role: string })
        : null;

    let role: DbRole = "consumer";
    let resolvedMerchantId: string | null = null;

    if (isAdmin) {
      role = "admin";
    } else if (membership) {
      resolvedMerchantId = membership.merchant_id;
      role =
        membership.role === "owner"
          ? "merchant_owner"
          : membership.role === "admin"
            ? "merchant_admin"
            : "merchant_member";
    }
    resolvedMerchantId =
      resolvedMerchantId ?? (typeof merchantId === "string" ? merchantId : null);

    const row =
      profile && !Array.isArray(profile)
        ? (profile as { id: string; full_name: string | null; corporate_title: string | null; created_at: string | null })
        : null;

    const dbProfile: DbProfile = {
      id: userId,
      email: email ?? null,
      full_name: row?.full_name ?? null,
      corporate_title: row?.corporate_title ?? null,
      role,
      merchant_id: resolvedMerchantId,
      avatar_url: null,
      created_at: row?.created_at ?? null,
    };

    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(dbProfile));
    return dbProfile;
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