import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Product } from "@/constants/products";
import { useColors } from "@/hooks/useColors";

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  style?: object;
}

function formatScanCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k scans`;
  return `${count} scans`;
}

export function ProductCard({ product, onPress, style }: ProductCardProps) {
  const colors = useColors();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: "/viewer",
        params: { product_id: product.id, merchant_slug: product.merchantSlug },
      });
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
          opacity: pressed ? 0.92 : 1,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.imageArea,
          {
            backgroundColor: product.thumbnailColor + "22",
            borderTopLeftRadius: colors.radius,
            borderTopRightRadius: colors.radius,
          },
        ]}
      >
        <View
          style={[
            styles.colorDot,
            { backgroundColor: product.thumbnailColor },
          ]}
        />
        <View style={styles.swatchRow}>
          {product.colorVariants.slice(0, 3).map((v) => (
            <View
              key={v.id}
              style={[styles.miniSwatch, { backgroundColor: v.color }]}
            />
          ))}
          {product.colorVariants.length > 3 && (
            <Text style={[styles.moreText, { color: colors.mutedForeground }]}>
              +{product.colorVariants.length - 3}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.info}>
        <Text
          style={[styles.name, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {product.name}
        </Text>
        <Text
          style={[styles.merchant, { color: colors.mutedForeground }]}
          numberOfLines={1}
        >
          {product.merchant}
        </Text>
        <View style={styles.footer}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: colors.secondary },
            ]}
          >
            <Text
              style={[styles.categoryText, { color: colors.secondaryForeground }]}
            >
              {product.category}
            </Text>
          </View>
          <View style={styles.scanRow}>
            <Feather name="eye" size={10} color={colors.mutedForeground} />
            <Text style={[styles.scanCount, { color: colors.mutedForeground }]}>
              {" "}
              {formatScanCount(product.scanCount)}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: "hidden",
  },
  imageArea: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  colorDot: {
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  swatchRow: {
    flexDirection: "row",
    position: "absolute",
    bottom: 10,
    right: 10,
    gap: 4,
    alignItems: "center",
  },
  miniSwatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  moreText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  info: {
    padding: 12,
    gap: 3,
  },
  name: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  merchant: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  scanRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  scanCount: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
});
