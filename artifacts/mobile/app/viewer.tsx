import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { ARProductViewer } from "@/components/ARProductViewer";
import { useRecentlyViewed } from "@/context/RecentlyViewedContext";
import { useProductById, useProductBySlug } from "@/hooks/useProducts";
import { trackEvent } from "@/services/productService";
import { useColors } from "@/hooks/useColors";

export default function ViewerScreen() {
  const params = useLocalSearchParams<{
    product_id?: string;
    merchant_slug?: string;
    slug?: string;
    is_playground?: string;
  }>();
  const colors = useColors();
  const { addRecentProduct } = useRecentlyViewed();

  const bySlug = useProductBySlug(params.slug);
  const byId = useProductById(
    params.slug ? undefined : params.product_id
  );
  const { data: product, isLoading, isError } = params.slug ? bySlug : byId;

  useEffect(() => {
    if (product && params.is_playground !== "true") {
      addRecentProduct(product.id);
      trackEvent({
        event_type: "product_view",
        product_id: product.id,
        merchant_id: product.merchantId ?? null,
        business_id: product.businessId ?? null,
        source: "viewer",
      });
    }
  }, [product?.id]);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: "#0A0A0A" }]}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.loadingText}>Fetching product data...</Text>
      </View>
    );
  }

  if (isError || !product) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={32} color={colors.mutedForeground} />
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
          Product not found
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <ARProductViewer
        product={product}
        onClose={() => router.back()}
        onColorChange={(variantId) => {
          if (params.is_playground !== "true") {
            trackEvent({
              event_type: "variant_switch",
              product_id: product.id,
              merchant_id: product.merchantId ?? null,
              business_id: product.businessId ?? null,
              variant_id: variantId,
            });
          }
        }}
        onBuyNow={() => {
          if (params.is_playground !== "true") {
            trackEvent({
              event_type: "buy_click",
              product_id: product.id,
              merchant_id: product.merchantId ?? null,
              business_id: product.businessId ?? null,
            });
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
});