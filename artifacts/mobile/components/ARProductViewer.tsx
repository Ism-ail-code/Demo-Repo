import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ColorSwatch } from "@/components/ColorSwatch";
import { ShimmerCard } from "@/components/ShimmerCard";
import { ColorVariant, Product } from "@/constants/products";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_W } = Dimensions.get("window");
const PRODUCT_SIZE = Math.min(SCREEN_W * 0.55, 260);

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
  const [permission, requestPermission] = useCameraPermissions();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ColorVariant>(
    product.colorVariants[0]
  );

  const rotY = useRef(new Animated.Value(-15)).current;
  const rotX = useRef(new Animated.Value(10)).current;
  const loadAnim = useRef(new Animated.Value(0)).current;
  const colorAnim = useRef(new Animated.Value(1)).current;

  const lastOffset = useRef({ x: -15, y: 10 });

  useEffect(() => {
    setIsLoading(true);
    loadAnim.setValue(0);
    setSelectedVariant(product.colorVariants[0]);
    const timer = setTimeout(() => {
      setIsLoading(false);
      Animated.spring(loadAnim, {
        toValue: 1,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }, 1400);
    return () => clearTimeout(timer);
  }, [product.id]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      lastOffset.current = {
        x: (rotY as unknown as { _value: number })._value,
        y: (rotX as unknown as { _value: number })._value,
      };
    },
    onPanResponderMove: (_, g) => {
      const newRotY = lastOffset.current.x + g.dx * 0.4;
      const newRotX = Math.max(
        -35,
        Math.min(35, lastOffset.current.y - g.dy * 0.3)
      );
      rotY.setValue(newRotY);
      rotX.setValue(newRotX);
    },
    onPanResponderRelease: (_, g) => {
      lastOffset.current = {
        x: lastOffset.current.x + g.dx * 0.4,
        y: Math.max(-35, Math.min(35, lastOffset.current.y - g.dy * 0.3)),
      };
    },
  });

  const handleSelectVariant = (variant: ColorVariant) => {
    setSelectedVariant(variant);
    onColorChange?.(variant.id);
    Animated.sequence([
      Animated.timing(colorAnim, {
        toValue: 0.3,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(colorAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleBuyNow = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onBuyNow?.();
    await WebBrowser.openBrowserAsync(product.checkoutUrl);
  };

  const rotYDeg = rotY.interpolate({
    inputRange: [-180, 180],
    outputRange: ["-180deg", "180deg"],
  });
  const rotXDeg = rotX.interpolate({
    inputRange: [-90, 90],
    outputRange: ["-90deg", "90deg"],
  });

  if (!permission) {
    return <View style={[styles.fill, { backgroundColor: "#000" }]} />;
  }

  if (!permission.granted) {
    return (
      <View
        style={[
          styles.fill,
          styles.permissionContainer,
          { backgroundColor: "#0A0A0A" },
        ]}
      >
        <View style={styles.permissionCard}>
          <View
            style={[
              styles.permissionIcon,
              { backgroundColor: colors.accent + "22" },
            ]}
          >
            <Feather name="camera" size={32} color={colors.accent} />
          </View>
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionBody}>
            AR Commerce needs camera access to anchor 3D products in your real
            space using spatial tracking.
          </Text>
          <Pressable
            style={[styles.permissionBtn, { backgroundColor: colors.accent }]}
            onPress={requestPermission}
          >
            <Text style={styles.permissionBtnText}>Enable Camera</Text>
          </Pressable>
          <Pressable onPress={onClose} style={styles.permissionClose}>
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: 14,
                fontFamily: "Inter_400Regular",
              }}
            >
              Not now
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      {Platform.OS !== "web" ? (
        <CameraView style={StyleSheet.absoluteFill} facing="back" />
      ) : (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: "#1A1A2E" }]}
        />
      )}

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

      {/* 3D orbit viewer */}
      {isLoading ? (
        <View style={styles.center}>
          <View style={styles.loadingContainer}>
            <ShimmerCard
              width={PRODUCT_SIZE}
              height={PRODUCT_SIZE}
              borderRadius={PRODUCT_SIZE / 2}
              style={{ opacity: 0.5 }}
            />
            <Text style={styles.loadingText}>Streaming 3D asset...</Text>
            <Text style={styles.loadingSubText}>
              {Platform.OS === "ios" ? ".usdz" : ".glb"} · {product.merchant}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.center} {...panResponder.panHandlers}>
          <Animated.View
            style={{
              opacity: Animated.multiply(loadAnim, colorAnim),
              transform: [
                { scale: loadAnim },
                { perspective: 800 },
                { rotateY: rotYDeg },
                { rotateX: rotXDeg },
              ],
            }}
          >
            <View
              style={[
                styles.productBody,
                {
                  width: PRODUCT_SIZE,
                  height: PRODUCT_SIZE,
                  borderRadius: PRODUCT_SIZE * 0.12,
                  backgroundColor: selectedVariant.color,
                },
              ]}
            >
              <View style={styles.productFaceTop} />
              <View style={styles.productFaceLeft} />
              <View style={styles.productShine} />
              <Feather name="box" size={48} color="rgba(255,255,255,0.25)" />
              <Text style={styles.productCategoryLabel}>
                {product.category}
              </Text>
            </View>
          </Animated.View>

          <View style={styles.groundShadow} />

          <View style={styles.orbitHint}>
            <Feather
              name="rotate-cw"
              size={12}
              color="rgba(255,255,255,0.6)"
            />
            <Text style={styles.orbitHintText}>Drag to orbit</Text>
          </View>
        </View>
      )}

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
  permissionContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  permissionCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    gap: 12,
    maxWidth: 340,
    width: "100%",
  },
  permissionIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  permissionTitle: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  permissionBody: {
    color: "#A0A0A0",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
  },
  permissionBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    width: "100%",
    alignItems: "center",
  },
  permissionBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  permissionClose: { paddingVertical: 8 },
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
    marginBottom: 200,
  },
  loadingContainer: { alignItems: "center", gap: 16 },
  loadingText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.5,
  },
  loadingSubText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.5,
  },
  productBody: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
    gap: 8,
    overflow: "hidden",
  },
  productFaceTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "40%",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  productFaceLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "25%",
    backgroundColor: "rgba(0,0,0,0.15)",
    borderTopLeftRadius: 28,
    borderBottomLeftRadius: 28,
  },
  productShine: {
    position: "absolute",
    top: 16,
    left: 20,
    width: 60,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.18)",
    transform: [{ rotate: "-30deg" }],
  },
  productCategoryLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  groundShadow: {
    width: PRODUCT_SIZE * 0.7,
    height: 12,
    borderRadius: 50,
    backgroundColor: "rgba(0,0,0,0.35)",
    marginTop: -4,
  },
  orbitHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 16,
    opacity: 0.7,
  },
  orbitHintText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
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
