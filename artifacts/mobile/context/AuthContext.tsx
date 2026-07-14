import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { clearProfileCache, DbProfile, fetchProfile, supabase } from "@/services/supabase";

export type AppRole = "merchant_owner" | "consumer";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  merchantId: string | null;
  avatarUrl: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  profileRole: AppRole;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profileRole: "consumer",
  isAuthLoading: true,
  login: async () => false,
  logout: async () => undefined,
  refreshProfile: async () => undefined,
});

const USER_CACHE_KEY = "ar_commerce_user_cache";

function profileToUser(
  authUser: { id: string; email?: string },
  profile: DbProfile
): AppUser {
  return {
    id: authUser.id,
    email: profile.email ?? authUser.email ?? "",
    name: profile.full_name ?? authUser.email?.split("@")[0] ?? "User",
    role: profile.role ?? "consumer",
    merchantId: profile.merchant_id ?? null,
    avatarUrl: profile.avatar_url ?? null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profileRole, setProfileRole] = useState<AppRole>("consumer");
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const resolvingRef = useRef(false);

  const resolveProfile = useCallback(
    async (authUser: { id: string; email?: string }) => {
      if (resolvingRef.current) return;
      resolvingRef.current = true;
      try {
        const profile = await fetchProfile(authUser.id);
        if (profile) {
          const fullUser = profileToUser(authUser, profile);
          setUser(fullUser);
          setProfileRole(profile.role ?? "consumer");
          await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(fullUser));
        } else {
          const fallback: AppUser = {
            id: authUser.id,
            email: authUser.email ?? "",
            name: authUser.email?.split("@")[0] ?? "User",
            role: "consumer",
            merchantId: null,
            avatarUrl: null,
          };
          setUser(fallback);
          setProfileRole("consumer");
          await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(fallback));
        }
      } finally {
        resolvingRef.current = false;
      }
    },
    []
  );

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          await resolveProfile(session.user);
        } else {
          const cached = await AsyncStorage.getItem(USER_CACHE_KEY);
          if (cached) {
            try {
              const parsed = JSON.parse(cached) as AppUser;
              setUser(parsed);
              setProfileRole(parsed.role);
            } catch {}
          }
        }
      } catch (err) {
        console.warn("[Auth] session restore error:", err);
        try {
          const cached = await AsyncStorage.getItem(USER_CACHE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached) as AppUser;
            setUser(parsed);
            setProfileRole(parsed.role);
          }
        } catch {}
      } finally {
        setIsAuthLoading(false);
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await resolveProfile(session.user);
      } else {
        setUser(null);
        setProfileRole("consumer");
        await AsyncStorage.removeItem(USER_CACHE_KEY);
        await clearProfileCache();
      }
    });

    return () => subscription.unsubscribe();
  }, [resolveProfile]);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        console.warn("[Auth] login error:", error?.message);
        return false;
      }

      await resolveProfile(data.user);
      return true;
    },
    [resolveProfile]
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfileRole("consumer");
    await AsyncStorage.removeItem(USER_CACHE_KEY);
    await clearProfileCache();
  }, []);

  const refreshProfile = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      await resolveProfile(session.user);
    }
  }, [resolveProfile]);

  return (
    <AuthContext.Provider
      value={{ user, profileRole, isAuthLoading, login, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
