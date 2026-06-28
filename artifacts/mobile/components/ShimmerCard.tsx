import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface ShimmerCardProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function ShimmerCard({
  width = "100%",
  height = 120,
  borderRadius,
  style,
}: ShimmerCardProps) {
  const colors = useColors();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.9],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: borderRadius ?? colors.radius,
          backgroundColor: colors.muted,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function ProductCardSkeleton() {
  const colors = useColors();
  return (
    <View
      style={[
        styles.skeleton,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      <ShimmerCard height={120} borderRadius={0} />
      <View style={styles.skeletonInfo}>
        <ShimmerCard height={14} width="70%" />
        <ShimmerCard height={11} width="50%" style={{ marginTop: 4 }} />
        <View style={styles.skeletonFooter}>
          <ShimmerCard height={18} width={60} />
          <ShimmerCard height={11} width={50} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    borderWidth: 1,
    overflow: "hidden",
  },
  skeletonInfo: {
    padding: 12,
    gap: 4,
  },
  skeletonFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
});
