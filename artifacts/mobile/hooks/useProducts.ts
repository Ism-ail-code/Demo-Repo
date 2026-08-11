import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchProductById,
  fetchProductBySlug,
  fetchTrendingProducts,
} from "@/services/productService";

export function useProductById(productId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["product", "v4", productId],
    queryFn: () => fetchProductById(productId!),
    enabled: !!productId,
    staleTime: 0,
    gcTime: 0,
    retry: 2,
  });

  const refetchProduct = async () => {
    await queryClient.invalidateQueries({ queryKey: ["product", "v4", productId] });
    return query.refetch();
  };

  return { ...query, refetchProduct };
}

export function useProductBySlug(slug: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["product", "v4", slug],
    queryFn: () => fetchProductBySlug(slug!),
    enabled: !!slug,
    staleTime: 0,
    gcTime: 0,
    retry: 2,
  });

  const refetchProduct = async () => {
    await queryClient.invalidateQueries({ queryKey: ["product", "v4", slug] });
    return query.refetch();
  };

  return { ...query, refetchProduct };
}

export function useTrendingProducts(limit = 10) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["trending", "v4", limit],
    queryFn: () => fetchTrendingProducts(limit),
    staleTime: 0,
    gcTime: 0,
    retry: 2,
  });

  const refetchProducts = async () => {
    await queryClient.invalidateQueries({ queryKey: ["trending", "v4", limit] });
    return query.refetch();
  };

  return { ...query, refetchProducts };
}