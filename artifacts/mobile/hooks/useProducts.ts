import { useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchProductById, fetchTrendingProducts } from "@/services/productService";

export function useProductById(productId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["product", "v3", productId],
    queryFn: () => fetchProductById(productId!),
    enabled: !!productId,
    staleTime: 0,
    gcTime: 0,
    retry: 2,
  });

  const refetchProduct = async () => {
    await queryClient.invalidateQueries({ queryKey: ["product", "v3", productId] });
    return query.refetch();
  };

  return { ...query, refetchProduct };
}

export function useTrendingProducts(limit = 10) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["trending", "v3", limit],
    queryFn: () => fetchTrendingProducts(limit),
    staleTime: 0,
    gcTime: 0,
    retry: 2,
  });

  const refetchProducts = async () => {
    await queryClient.invalidateQueries({ queryKey: ["trending", "v3", limit] });
    return query.refetch();
  };

  return { ...query, refetchProducts };
}
