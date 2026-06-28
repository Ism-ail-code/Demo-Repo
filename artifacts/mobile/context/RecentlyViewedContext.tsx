import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { Product, getProductById } from "@/constants/products";

interface RecentlyViewedContextType {
  recentProducts: Product[];
  addRecentProduct: (productId: string) => void;
  clearRecent: () => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType>({
  recentProducts: [],
  addRecentProduct: () => undefined,
  clearRecent: () => undefined,
});

const STORAGE_KEY = "ar_commerce_recently_viewed";
const MAX_RECENT = 10;

export function RecentlyViewedProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setRecentIds(JSON.parse(raw));
        } catch {}
      }
    });
  }, []);

  const addRecentProduct = useCallback((productId: string) => {
    setRecentIds((prev) => {
      const filtered = prev.filter((id) => id !== productId);
      const next = [productId, ...filtered].slice(0, MAX_RECENT);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecentIds([]);
    AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const recentProducts = recentIds
    .map((id) => getProductById(id))
    .filter((p): p is Product => p !== undefined);

  return (
    <RecentlyViewedContext.Provider
      value={{ recentProducts, addRecentProduct, clearRecent }}
    >
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() {
  return useContext(RecentlyViewedContext);
}
