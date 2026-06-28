import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ColorSwatch } from "@/components/ColorSwatch";
import { NativeARSession } from "@/components/NativeARSession";
import { ColorVariant, Product } from "@/constants/products";
import { useColors } from "@/hooks/useColors";

interface ARProductViewerProps {
  product: Product;
  onClose: () => void;
  onColorChange?: (variantId: string) => void;
  onBuyNow?: () => void;
}

export function ARProductViewer({
  product,
  onClose,
  onColorChange,
  onBuyNow,
}: ARProductViewerProps) {
  const colors = useColors();
  const [selectedVariant, setSelectedVariant] = useState<ColorVariant>(
    product.colorVariants[0]
  );

  const handleSelectVariant = (variant: ColorVariant) => {
    setSelectedVariant(variant);
    onColorChange?.(variant.id);
  };

  const handleBuyNow = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onBuyNow?.();
    await WebBrowser.openBrowserAsync(product.checkoutUrl);
  };

  const onARAnchorFound = useCallback(() => {}, []);

  const onARError = useCallback((message: string) => {
    console.warn("AR Error:", message);
  }, []);

  return (
    <View style={styles.fill}>
      <NativeARSession
        glbUrl={product.glbUrl}
        usdzUrl={product.usdzUrl}
        color={selectedVariant.color}
        onAnchorFound={onARAnchorFound}
        onError={onARError}
      />

      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(0,0,0,0.18)" },
        ]}
      />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable
          style={[styles.iconBtn, { backgroundColor: "rgba(0,0,0,0.5)" }]}
          onPress={onClose}
        >
          <Feather name="x" size={20} color="#fff" />
        </Pressable>
        <View style={styles.productLabel}>
          <Text style={styles.productLabelMerchant}>{product.merchant}</Text>
          <Text style={styles.productLabelName} numberOfLines={1}>
            {product.name}
          </Text>
        </View>
        <View style={styles.iconBtn} />
      </View>

      {/* Bottom panel */}
      <View style={styles.bottomPanel}>
        <View
          style={[
            styles.bottomCard,
            {
              backgroundColor: "rgba(10,10,10,0.88)",
              borderColor: "rgba(255,255,255,0.1)",
            },
          ]}
        >
          <View style={styles.swatchHeader}>
            <Text style={styles.swatchLabel}>Color variants</Text>
            <Text style={styles.selectedVariantName}>
              {selectedVariant.name}
            </Text>
          </View>
          <View style={styles.swatchRow}>
            {product.colorVariants.map((v) => (
              <ColorSwatch
                key={v.id}
                variant={v}
                selected={selectedVariant.id === v.id}
                onSelect={handleSelectVariant}
                showLabel
                size={30}
              />
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.buyBtn,
              { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={handleBuyNow}
          >
            <Feather name="shopping-bag" size={16} color="#fff" />
            <Text style={styles.buyBtnText}>Buy Now</Text>
            <Feather
              name="external-link"
              size={14}
              color="rgba(255,255,255,0.7)"
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  topBar: {
    position: "absolute",
    top: 56,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
    zIndex: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  productLabel: { flex: 1, alignItems: "center" },
  productLabelMerchant: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  productLabelName: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  bottomPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 34,
  },
  bottomCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    gap: 14,
  },
  swatchHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  swatchLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  selectedVariantName: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  swatchRow: { flexDirection: "row", gap: 12 },
  buyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  buyBtnText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
});
