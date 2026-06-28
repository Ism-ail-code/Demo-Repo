import { useQuery } from "@tanstack/react-query";

import { fetchProductById, fetchTrendingProducts } from "@/services/productService";

export function useProductById(productId: string | undefined) {
  return useQuery({
    queryKey: ["product", "v2", productId],
    queryFn: () => fetchProductById(productId!),
    enabled: !!productId,
    staleTime: 0,
    gcTime: 0,
    retry: 2,
  });
}

export function useTrendingProducts(limit = 10) {
  return useQuery({
    queryKey: ["trending", "v2", limit],
    queryFn: () => fetchTrendingProducts(limit),
    staleTime: 0,
    gcTime: 0,
    retry: 2,
  });
}
