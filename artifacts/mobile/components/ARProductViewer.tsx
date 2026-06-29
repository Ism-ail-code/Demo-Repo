import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

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

const MIN_SCALE = 0.2;
const MAX_SCALE = 2.0;
const TRANSLATE_SENSITIVITY = 0.004;
const INITIAL_POSITION: [number, number, number] = [0, 0, -1];
const INITIAL_SCALE = 0.3;
const INITIAL_ROTATION: [number, number, number] = [0, 0, 0];

function distance(
  a: { pageX: number; pageY: number },
  b: { pageX: number; pageY: number }
) {
  const dx = b.pageX - a.pageX;
  const dy = b.pageY - a.pageY;
  return Math.sqrt(dx * dx + dy * dy);
}

function angle(
  a: { pageX: number; pageY: number },
  b: { pageX: number; pageY: number }
) {
  return Math.atan2(b.pageY - a.pageY, b.pageX - a.pageX) * (180 / Math.PI);
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

  const [modelPosition, setModelPosition] =
    useState<[number, number, number]>(INITIAL_POSITION);
  const [modelScale, setModelScale] = useState(INITIAL_SCALE);
  const [modelRotation, setModelRotation] =
    useState<[number, number, number]>(INITIAL_ROTATION);

  const gestureStateRef = useRef({
    position: INITIAL_POSITION,
    scale: INITIAL_SCALE,
    rotation: INITIAL_ROTATION,
  });

  useEffect(() => {
    gestureStateRef.current.position = modelPosition;
    gestureStateRef.current.scale = modelScale;
    gestureStateRef.current.rotation = modelRotation;
  }, [modelPosition, modelScale, modelRotation]);

  const panBaseRef = useRef<[number, number, number]>(INITIAL_POSITION);
  const panStartRef = useRef({ x: 0, y: 0 });
  const pinchBaseDistRef = useRef(0);
  const pinchBaseScaleRef = useRef(INITIAL_SCALE);
  const rotateBaseAngleRef = useRef(0);
  const rotateBaseYRef = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (!touches || touches.length === 0) return;

        const currentPos = gestureStateRef.current.position;
        const currentScale = gestureStateRef.current.scale;
        const currentRot = gestureStateRef.current.rotation;

        if (touches.length === 1) {
          panBaseRef.current = [...currentPos];
          panStartRef.current = {
            x: touches[0].pageX,
            y: touches[0].pageY,
          };
        } else if (touches.length >= 2) {
          const t1 = touches[0];
          const t2 = touches[1];
          pinchBaseDistRef.current = distance(t1, t2);
          pinchBaseScaleRef.current = currentScale;
          rotateBaseAngleRef.current = angle(t1, t2);
          rotateBaseYRef.current = currentRot[1];
        }
      },

      onPanResponderMove: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (!touches || touches.length === 0) return;

        if (touches.length === 1) {
          const t = touches[0];
          const base = panBaseRef.current;
          const dx = t.pageX - panStartRef.current.x;
          const dy = t.pageY - panStartRef.current.y;
          const newPos: [number, number, number] = [
            base[0] + dx * TRANSLATE_SENSITIVITY,
            base[1],
            base[2] + dy * TRANSLATE_SENSITIVITY,
          ];
          setModelPosition(newPos);
        } else if (touches.length >= 2) {
          const t1 = touches[0];
          const t2 = touches[1];
          const currentDist = distance(t1, t2);
          const currentAngle = angle(t1, t2);

          if (pinchBaseDistRef.current > 0) {
            const ratio = currentDist / pinchBaseDistRef.current;
            const newScale = Math.max(
              MIN_SCALE,
              Math.min(MAX_SCALE, pinchBaseScaleRef.current * ratio)
            );
            setModelScale(newScale);
          }

          let angleDelta = currentAngle - rotateBaseAngleRef.current;
          if (angleDelta > 180) angleDelta -= 360;
          if (angleDelta < -180) angleDelta += 360;
          const newY = rotateBaseYRef.current + angleDelta;
          setModelRotation([0, newY, 0]);
        }
      },

      onPanResponderRelease: () => {},
      onPanResponderTerminate: () => {},
    })
  ).current;

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
    <GestureHandlerRootView style={styles.fill}>
      <View style={styles.fill}>
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <NativeARSession
            glbUrl={product.glbUrl}
            usdzUrl={product.usdzUrl}
            color={selectedVariant.color}
            modelPosition={modelPosition}
            modelScale={modelScale}
            modelRotation={modelRotation}
            onAnchorFound={onARAnchorFound}
            onError={onARError}
          />
        </View>

        <View
          style={StyleSheet.absoluteFill}
          {...panResponder.panHandlers}
        />

        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0,0,0,0.10)", pointerEvents: "none" },
          ]}
        />

        <View style={[styles.topBar, { pointerEvents: "box-none" }]}>
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
          <Pressable
            style={[styles.iconBtn, { backgroundColor: "rgba(0,0,0,0.5)" }]}
          >
            <Feather name="info" size={18} color="#fff" />
          </Pressable>
        </View>

        <View style={[styles.bottomPanel, { pointerEvents: "box-none" }]}>
          <View
            style={[
              styles.bottomCard,
              {
                backgroundColor: "rgba(10,10,10,0.92)",
                borderColor: "rgba(255,255,255,0.08)",
              },
            ]}
          >
            <View style={styles.productInfoRow}>
              <View style={styles.productInfoLeft}>
                <Text style={styles.productCategory}>{product.category}</Text>
                <Text style={styles.productDesc} numberOfLines={1}>
                  {product.description}
                </Text>
              </View>
              <View style={styles.scanBadge}>
                <Feather name="eye" size={12} color="rgba(255,255,255,0.5)" />
                <Text style={styles.scanCount}>
                  {product.scanCount.toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

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
                {
                  backgroundColor: colors.accent,
                  opacity: pressed ? 0.85 : 1,
                },
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
    </GestureHandlerRootView>
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
    zIndex: 10,
  },
  bottomCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    gap: 14,
  },
  productInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  productInfoLeft: { flex: 1, gap: 2 },
  productCategory: {
    color: "#a78bfa",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  productDesc: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  scanBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  scanCount: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
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
