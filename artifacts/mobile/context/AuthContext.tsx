import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface MerchantUser {
  email: string;
  name: string;
  merchantSlug: string;
  role: "admin" | "viewer";
}

interface AuthContextType {
  user: MerchantUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => false,
  logout: () => undefined,
});

const AUTH_STORAGE_KEY = "ar_commerce_merchant_auth";

const DEMO_CREDENTIALS = [
  {
    email: "admin@studio-furniture.com",
    password: "demo1234",
    user: {
      email: "admin@studio-furniture.com",
      name: "Alex Chen",
      merchantSlug: "studio-furniture",
      role: "admin" as const,
    },
  },
  {
    email: "demo@merchant.com",
    password: "demo1234",
    user: {
      email: "demo@merchant.com",
      name: "Jordan Rivera",
      merchantSlug: "cloud-living",
      role: "admin" as const,
    },
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MerchantUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(AUTH_STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setUser(JSON.parse(raw));
        } catch {}
      }
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      await new Promise((r) => setTimeout(r, 900));
      const match = DEMO_CREDENTIALS.find(
        (c) =>
          c.email.toLowerCase() === email.toLowerCase() &&
          c.password === password
      );
      if (match) {
        setUser(match.user);
        AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(match.user));
        return true;
      }
      return false;
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
