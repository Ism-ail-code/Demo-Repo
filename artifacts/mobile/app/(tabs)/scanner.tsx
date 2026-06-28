import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

const { width: W, height: H } = Dimensions.get("window");
const FRAME_SIZE = Math.min(W * 0.65, 280);

function PermissionView({ onRequest }: { onRequest: () => void }) {
  const colors = useColors();
  return (
    <View
      style={[styles.center, { backgroundColor: colors.background }]}
    >
      <View
        style={[
          styles.permBox,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View
          style={[
            styles.permIcon,
            { backgroundColor: colors.secondary },
          ]}
        >
          <Feather name="maximize" size={32} color={colors.foreground} />
        </View>
        <Text style={[styles.permTitle, { color: colors.foreground }]}>
          Scan QR Code
        </Text>
        <Text style={[styles.permBody, { color: colors.mutedForeground }]}>
          Point your camera at any AR-enabled QR code from a merchant website
          to instantly preview their products in 3D.
        </Text>
        <Pressable
          style={[styles.permBtn, { backgroundColor: colors.primary }]}
          onPress={onRequest}
        >
          <Text style={[styles.permBtnText, { color: colors.primaryForeground }]}>
            Enable Camera
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function ScannerScreen() {
  const colors = useColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const flashAnim = useRef(new Animated.Value(0)).current;
  const cornerAnim = useRef(new Animated.Value(1)).current;

  const flashEffect = useCallback(() => {
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [flashAnim]);

  const startCornerAnim = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(cornerAnim, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(cornerAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [cornerAnim]);

  React.useEffect(() => {
    startCornerAnim();
  }, [startCornerAnim]);

  const handleBarcode = useCallback(
    ({ data }: { data: string }) => {
      if (scanned) return;
      setScanned(true);
      flashEffect();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => {
        try {
          const url = new URL(data);
          const productId = url.searchParams.get("product_id");
          const merchantSlug = url.searchParams.get("merchant_slug");
          if (productId) {
            router.push({
              pathname: "/viewer",
              params: { product_id: productId, merchant_slug: merchantSlug ?? "" },
            });
          } else {
            setScanned(false);
          }
        } catch {
          setScanned(false);
        }
      }, 400);
    },
    [scanned, flashEffect]
  );

  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  if (!permission.granted) {
    return <PermissionView onRequest={requestPermission} />;
  }

  return (
    <View style={styles.container}>
      {Platform.OS !== "web" ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarcode}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#0A0A0A" }]} />
      )}

      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(255,107,53,0.9)", opacity: flashAnim },
        ]}
      />

      <View style={[StyleSheet.absoluteFill, styles.overlay]}>
        <View style={styles.overlayTop} />
        <View style={styles.middleRow}>
          <View style={styles.overlaySide} />
          <Animated.View
            style={[
              styles.frame,
              { opacity: cornerAnim },
            ]}
          >
            <View style={[styles.corner, styles.cornerTL, { borderColor: colors.accent }]} />
            <View style={[styles.corner, styles.cornerTR, { borderColor: colors.accent }]} />
            <View style={[styles.corner, styles.cornerBL, { borderColor: colors.accent }]} />
            <View style={[styles.corner, styles.cornerBR, { borderColor: colors.accent }]} />
          </Animated.View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>

      <View style={styles.topBar}>
        <Pressable
          style={[styles.closeBtn, { backgroundColor: "rgba(0,0,0,0.5)" }]}
          onPress={() => router.back()}
        >
          <Feather name="x" size={20} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.bottomInfo}>
        <View style={[styles.infoCard, { backgroundColor: "rgba(0,0,0,0.75)" }]}>
          {scanned ? (
            <>
              <Feather name="check-circle" size={18} color="#4CAF50" />
              <Text style={styles.infoText}>Launching AR viewer...</Text>
            </>
          ) : (
            <>
              <Feather name="maximize" size={18} color="rgba(255,255,255,0.7)" />
              <Text style={styles.infoText}>
                Aim at a QR code from any AR-enabled merchant site
              </Text>
            </>
          )}
        </View>
        {scanned && (
          <Pressable
            style={[styles.resetBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.resetText}>Scan again</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  permBox: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 12,
    maxWidth: 340,
    width: "100%",
  },
  permIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  permTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  permBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
  },
  permBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    width: "100%",
    alignItems: "center",
  },
  permBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  overlay: { flexDirection: "column" },
  overlayTop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)" },
  middleRow: { flexDirection: "row", height: FRAME_SIZE },
  overlaySide: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)" },
  overlayBottom: { flex: 1.2, backgroundColor: "rgba(0,0,0,0.55)" },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderWidth: 2.5,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  topBar: {
    position: "absolute",
    top: 56,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomInfo: {
    position: "absolute",
    bottom: 40,
    left: 16,
    right: 16,
    gap: 10,
    alignItems: "center",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    width: "100%",
  },
  infoText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 18,
  },
  resetBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
