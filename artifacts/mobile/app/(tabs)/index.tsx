import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef } from "react";
import {
  Animated,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProductCard } from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/ShimmerCard";
import { useTrendingProducts } from "@/hooks/useProducts";
import { useRecentlyViewed } from "@/context/RecentlyViewedContext";
import { useColors } from "@/hooks/useColors";

function PlaygroundCard() {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/viewer",
      params: {
        product_id: "astronaut",
        merchant_slug: "ar-playground",
        is_playground: "true",
      },
    });
  };

  const handlePressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 120,
      friction: 10,
    }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 120,
      friction: 10,
    }).start();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.playgroundCard}
      >
        <LinearGradient
          colors={["#0A0A0A", "#1A1A2E", "#16213E"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.playgroundGradient,
            { borderRadius: colors.radius + 4 },
          ]}
        >
          <View style={styles.playgroundContent}>
            <View style={styles.playgroundLeft}>
              <View
                style={[styles.arBadge, { backgroundColor: colors.accent }]}
              >
                <Text style={styles.arBadgeText}>AR</Text>
              </View>
              <Text style={styles.playgroundTitle}>
                Enter AR{"\n"}Playground
              </Text>
              <Text style={styles.playgroundSub}>
                Drop 3D objects into your space
              </Text>
            </View>
            <View style={styles.playgroundVisual}>
              <View style={styles.cube}>
                <View
                  style={[
                    styles.cubeFace,
                    styles.cubeTop,
                    { borderColor: "rgba(255,107,53,0.5)" },
                  ]}
                />
                <View
                  style={[
                    styles.cubeFace,
                    styles.cubeSide,
                    { borderColor: "rgba(255,107,53,0.3)" },
                  ]}
                />
                <View
                  style={[
                    styles.cubeFace,
                    { borderColor: "rgba(255,107,53,0.2)" },
                  ]}
                />
              </View>
            </View>
          </View>
          <View style={styles.playgroundFooter}>
            <Text style={styles.playgroundCta}>Tap to launch</Text>
            <Feather
              name="arrow-right"
              size={14}
              color="rgba(255,255,255,0.6)"
            />
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

export default function DiscoveryHub() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { recentProducts } = useRecentlyViewed();
  const { data: trending, isLoading: trendingLoading } = useTrendingProducts(8);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleQRScan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(tabs)/scanner");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 8 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text
              style={[styles.greeting, { color: colors.mutedForeground }]}
            >
              AR Commerce
            </Text>
            <Text style={[styles.headline, { color: colors.foreground }]}>
              Discover
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/merchant/login")}
            style={[
              styles.headerBtn,
              { backgroundColor: colors.secondary },
            ]}
          >
            <Feather name="briefcase" size={18} color={colors.foreground} />
          </Pressable>
        </View>

        <PlaygroundCard />

        {/* Recently Viewed */}
        {recentProducts.length > 0 && (
          <>
            <SectionHeader
              title="Recently Viewed"
              subtitle={`${recentProducts.length} items`}
            />
            <FlatList
              data={recentProducts}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.recentList}
              renderItem={({ item }) => (
                <ProductCard product={item} style={{ width: 160 }} />
              )}
            />
          </>
        )}

        {/* Trending */}
        <SectionHeader
          title="Trending Now"
          subtitle={
            trending && !trendingLoading
              ? `${trending.length} products with 3D models`
              : undefined
          }
        />

        {trendingLoading ? (
          <View style={styles.grid}>
            {[0, 1, 2, 3].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </View>
        ) : (
          <View style={styles.grid}>
            {(trending ?? []).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                style={{ width: "48%" }}
              />
            ))}
          </View>
        )}

        <View style={{ height: Platform.OS === "web" ? 100 : 90 }} />
      </ScrollView>

      {/* Floating QR button */}
      <Pressable
        style={[styles.fab, { backgroundColor: colors.foreground }]}
        onPress={handleQRScan}
      >
        <Feather
          name="maximize"
          size={22}
          color={colors.primaryForeground}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, gap: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  greeting: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  headline: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  playgroundCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  playgroundGradient: { padding: 20, paddingBottom: 16, gap: 16 },
  playgroundContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  playgroundLeft: { flex: 1, gap: 8 },
  arBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  arBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
  },
  playgroundTitle: {
    color: "#fff",
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    lineHeight: 30,
  },
  playgroundSub: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  playgroundVisual: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  cube: {
    width: 48,
    height: 48,
    position: "relative",
    transform: [{ rotateX: "30deg" }, { rotateY: "-45deg" }],
  },
  cubeFace: {
    position: "absolute",
    width: 48,
    height: 48,
    borderWidth: 1.5,
    borderRadius: 4,
  },
  cubeTop: { transform: [{ translateY: -12 }] },
  cubeSide: { transform: [{ translateX: 8 }, { translateY: 4 }] },
  playgroundFooter: { flexDirection: "row", alignItems: "center", gap: 6 },
  playgroundCta: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  sectionHeader: { gap: 2, marginBottom: -4 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  sectionSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular" },
  recentList: { gap: 12, paddingVertical: 4 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  fab: {
    position: "absolute",
    bottom: 90,
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
