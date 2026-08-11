import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
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
import { isSafeHttpsUrl } from "@/services/productService";

interface ARProductViewerProps {
  product: Product;
  onClose: () => void;
  onColorChange?: (variantId: string) => void;
  onBuyNow?: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const MIN_SCALE = 0.2;
const MAX_SCALE = 2.0;
const TRANSLATE_SENSITIVITY = 0.004;
const DIAL_SENSITIVITY = 0.35;
const LATCH_HOLD_MS = 200;
const MOVE_DEADZONE = 8;
const DIAL_ZONE_RATIO = 0.35;
const SMOOTHING = 0.12;

const INITIAL_POSITION: [number, number, number] = [0, 0, -1];
const INITIAL_SCALE = 0.3;
const INITIAL_ROTATION: [number, number, number] = [0, 0, 0];

function touchDistance(
  a: { pageX: number; pageY: number },
  b: { pageX: number; pageY: number }
) {
  const dx = b.pageX - a.pageX;
  const dy = b.pageY - a.pageY;
  return Math.sqrt(dx * dx + dy * dy);
}

function touchAngle(
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
  const [isLatched, setIsLatched] = useState(false);

  const dialOpacity = useRef(new Animated.Value(0.3)).current;
  const latchIndicatorOpacity = useRef(new Animated.Value(0)).current;
  const dialAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const gestureStateRef = useRef({
    position: [...INITIAL_POSITION] as [number, number, number],
    scale: INITIAL_SCALE,
    rotation: [...INITIAL_ROTATION] as [number, number, number],
  });

  useEffect(() => {
    gestureStateRef.current.position = [...modelPosition];
    gestureStateRef.current.scale = modelScale;
    gestureStateRef.current.rotation = [...modelRotation];
  }, [modelPosition, modelScale, modelRotation]);

  const panBaseRef = useRef<[number, number, number]>([...INITIAL_POSITION]);
  const pinchBaseDistRef = useRef(0);
  const pinchBaseScaleRef = useRef(INITIAL_SCALE);
  const rotateBaseAngleRef = useRef(0);
  const rotateBaseYRef = useRef(0);

  const gestureModeRef = useRef<
    "idle" | "pan" | "dial" | "latch" | "pinch"
  >("idle");
  const latchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (latchTimerRef.current) clearTimeout(latchTimerRef.current);
      if (dialAnimRef.current) dialAnimRef.current.stop();
    };
  }, []);

  useEffect(() => {
    Animated.timing(latchIndicatorOpacity, {
      toValue: isLatched ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isLatched, latchIndicatorOpacity]);

  const startDialPulse = useCallback(() => {
    if (dialAnimRef.current) dialAnimRef.current.stop();
    dialAnimRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(dialOpacity, {
          toValue: 0.6,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(dialOpacity, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    dialAnimRef.current.start();
  }, [dialOpacity]);

  const stopDialPulse = useCallback(() => {
    if (dialAnimRef.current) {
      dialAnimRef.current.stop();
      dialAnimRef.current = null;
    }
    dialOpacity.setValue(0.3);
  }, [dialOpacity]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: (evt) => {
        const touchCount = evt.nativeEvent.touches.length;
        if (touchCount === 0) return;

        if (touchCount === 1) {
          const touch = evt.nativeEvent.touches[0];
          const touchY = touch.pageY;
          const dialThreshold = SCREEN_HEIGHT * (1 - DIAL_ZONE_RATIO);

          panBaseRef.current = [...gestureStateRef.current.position];

          if (gestureModeRef.current === "pinch") {
            gestureModeRef.current = "idle";
          }

          if (touchY >= dialThreshold) {
            gestureModeRef.current = "dial";
            startDialPulse();
          } else {
            gestureModeRef.current = "idle";

            if (latchTimerRef.current) clearTimeout(latchTimerRef.current);
            latchTimerRef.current = setTimeout(() => {
              if (gestureModeRef.current === "idle") {
                gestureModeRef.current = "latch";
                setIsLatched(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
            }, LATCH_HOLD_MS);
          }
        } else if (touchCount >= 2) {
          if (latchTimerRef.current) clearTimeout(latchTimerRef.current);
          gestureModeRef.current = "pinch";
          setIsLatched(false);

          const t1 = evt.nativeEvent.touches[0];
          const t2 = evt.nativeEvent.touches[1];
          pinchBaseDistRef.current = touchDistance(t1, t2);
          pinchBaseScaleRef.current = gestureStateRef.current.scale;
          rotateBaseAngleRef.current = touchAngle(t1, t2);
          rotateBaseYRef.current = gestureStateRef.current.rotation[1];
        }
      },

      onPanResponderMove: (evt, gestureState) => {
        const activeTouches = gestureState.numberActiveTouches;

        if (activeTouches === 2) {
          if (gestureModeRef.current !== "pinch") {
            gestureModeRef.current = "pinch";
            if (latchTimerRef.current) clearTimeout(latchTimerRef.current);
            const t1 = evt.nativeEvent.touches[0];
            const t2 = evt.nativeEvent.touches[1];
            if (t1 && t2) {
              pinchBaseDistRef.current = touchDistance(t1, t2);
              pinchBaseScaleRef.current = gestureStateRef.current.scale;
              rotateBaseAngleRef.current = touchAngle(t1, t2);
              rotateBaseYRef.current = gestureStateRef.current.rotation[1];
            }
          }

          const t1 = evt.nativeEvent.touches[0];
          const t2 = evt.nativeEvent.touches[1];
          if (!t1 || !t2) return;

          const currentDist = touchDistance(t1, t2);
          if (pinchBaseDistRef.current > 0) {
            const ratio = currentDist / pinchBaseDistRef.current;
            const newScale = Math.max(
              MIN_SCALE,
              Math.min(MAX_SCALE, pinchBaseScaleRef.current * ratio)
            );
            gestureStateRef.current.scale = newScale;
            setModelScale(newScale);
          }

          const currentAngle = touchAngle(t1, t2);
          let angleDelta = currentAngle - rotateBaseAngleRef.current;
          if (angleDelta > 180) angleDelta -= 360;
          if (angleDelta < -180) angleDelta += 360;
          const newY = rotateBaseYRef.current + angleDelta;
          gestureStateRef.current.rotation = [0, newY, 0];
          setModelRotation([0, newY, 0]);
          return;
        }

        if (activeTouches !== 1) return;

        if (gestureModeRef.current === "pinch") {
          gestureModeRef.current = "idle";
          panBaseRef.current = [...gestureStateRef.current.position];
          if (latchTimerRef.current) clearTimeout(latchTimerRef.current);
          latchTimerRef.current = setTimeout(() => {
            if (gestureModeRef.current === "idle") {
              gestureModeRef.current = "latch";
              setIsLatched(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
          }, LATCH_HOLD_MS);
          return;
        }

        if (gestureModeRef.current === "dial") {
          const rotationDelta = gestureState.dx * DIAL_SENSITIVITY;
          const currentRotY = gestureStateRef.current.rotation[1];
          const newY = currentRotY + rotationDelta;
          gestureStateRef.current.rotation = [0, newY, 0];
          setModelRotation([0, newY, 0]);
          return;
        }

        if (gestureModeRef.current === "latch") {
          return;
        }

        if (gestureModeRef.current === "idle") {
          const moveDist = Math.sqrt(
            gestureState.dx * gestureState.dx +
              gestureState.dy * gestureState.dy
          );
          if (moveDist > MOVE_DEADZONE) {
            if (latchTimerRef.current) clearTimeout(latchTimerRef.current);

            const touch = evt.nativeEvent.touches[0];
            if (touch) {
              const dialThreshold =
                SCREEN_HEIGHT * (1 - DIAL_ZONE_RATIO);
              if (touch.pageY >= dialThreshold) {
                gestureModeRef.current = "dial";
                startDialPulse();
                return;
              }
            }

            gestureModeRef.current = "pan";
            panBaseRef.current = [...gestureStateRef.current.position];
          }
          return;
        }

        if (gestureModeRef.current === "pan") {
          const base = panBaseRef.current;
          const targetX = base[0] + gestureState.dx * TRANSLATE_SENSITIVITY;
          const targetZ = base[2] + gestureState.dy * TRANSLATE_SENSITIVITY;

          const curX = gestureStateRef.current.position[0];
          const curZ = gestureStateRef.current.position[2];
          const newX = curX + (targetX - curX) * SMOOTHING;
          const newZ = curZ + (targetZ - curZ) * SMOOTHING;

          const newPos: [number, number, number] = [newX, base[1], newZ];
          gestureStateRef.current.position = newPos;
          setModelPosition(newPos);
        }
      },

      onPanResponderRelease: () => {
        if (latchTimerRef.current) clearTimeout(latchTimerRef.current);
        stopDialPulse();

        if (gestureModeRef.current !== "latch") {
          gestureModeRef.current = "idle";
        }
      },

      onPanResponderTerminate: () => {
        if (latchTimerRef.current) clearTimeout(latchTimerRef.current);
        stopDialPulse();
        gestureModeRef.current = "idle";
      },
    })
  ).current;

  const handleTapToUnlatch = useCallback(() => {
    if (isLatched) {
      setIsLatched(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [isLatched]);

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

  const modelUrl = isSafeHttpsUrl(product.glbUrl) ? product.glbUrl : "";
  const hasModel = modelUrl.length > 0;

  return (
    <GestureHandlerRootView style={styles.fill}>
      <View style={styles.fill} removeClippedSubviews={true}>
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {hasModel ? (
            <NativeARSession
              glbUrl={modelUrl}
              usdzUrl={product.usdzUrl}
              color={selectedVariant.color}
              modelPosition={modelPosition}
              modelScale={modelScale}
              modelRotation={modelRotation}
              isLatched={isLatched}
              onAnchorFound={onARAnchorFound}
              onError={onARError}
            />
          ) : (
            <View style={styles.noModelContainer}>
              <View style={styles.noModelCard}>
                <Feather name="box" size={28} color="rgba(255,255,255,0.7)" />
                <Text style={styles.noModelTitle}>No AR model yet</Text>
                <Text style={styles.noModelBody}>
                  This product does not have a 3D preview available yet. You
                  can still view details or buy it below.
                </Text>
              </View>
            </View>
          )}
        </View>

        <View
          style={StyleSheet.absoluteFill}
          pointerEvents="auto"
          {...panResponder.panHandlers}
        />

        <Pressable
          style={StyleSheet.absoluteFill}
          pointerEvents={isLatched ? "auto" : "none"}
          onPress={handleTapToUnlatch}
        />

        <Animated.View
          style={[
            styles.dialIndicator,
            {
              opacity: dialOpacity,
              pointerEvents: "none",
            },
          ]}
        >
          <View style={styles.dialRingOuter}>
            <View style={styles.dialRingMiddle} />
            <View style={styles.dialRingInner} />
          </View>
          <Text style={styles.dialLabel}>SWIPE TO ROTATE</Text>
        </Animated.View>

        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.latchOverlay,
            { opacity: latchIndicatorOpacity, pointerEvents: "none" },
          ]}
        />

        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0,0,0,0.08)", pointerEvents: "none" },
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
  dialIndicator: {
    position: "absolute",
    bottom: 260,
    alignSelf: "center",
    alignItems: "center",
    gap: 8,
  },
  dialRingOuter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "rgba(167, 139, 250, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  dialRingMiddle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  dialRingInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(167, 139, 250, 0.5)",
  },
  dialLabel: {
    color: "rgba(167, 139, 250, 0.7)",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  latchOverlay: {
    backgroundColor: "rgba(167, 139, 250, 0.06)",
  },
  noModelContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A0A0A",
  },
  noModelCard: {
    alignItems: "center",
    gap: 10,
    maxWidth: 280,
    padding: 24,
  },
  noModelTitle: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
  },
  noModelBody: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 19,
  },
});