import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useRecentlyViewed } from "@/context/RecentlyViewedContext";
import { useColors } from "@/hooks/useColors";

function SettingRow({
  icon,
  label,
  value,
  onPress,
  accent,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  accent?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingRow,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.settingIcon,
          {
            backgroundColor: accent
              ? colors.accent + "18"
              : colors.secondary,
          },
        ]}
      >
        <Feather
          name={icon as any}
          size={16}
          color={accent ? colors.accent : colors.foreground}
        />
      </View>
      <Text
        style={[
          styles.settingLabel,
          { color: accent ? colors.accent : colors.foreground },
        ]}
      >
        {label}
      </Text>
      {value ? (
        <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>
          {value}
        </Text>
      ) : null}
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { recentProducts, clearRecent } = useRecentlyViewed();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleMerchantPortal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (user) {
      router.push("/merchant/dashboard");
    } else {
      router.push("/merchant/login");
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Sign out of the merchant portal?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          logout();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleClearRecent = () => {
    Alert.alert("Clear History", "Remove all recently viewed products?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          clearRecent();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topPad + 8,
          paddingBottom: Platform.OS === "web" ? 100 : 90,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.headline, { color: colors.foreground }]}>
          Profile
        </Text>
      </View>

      {user ? (
        <View
          style={[
            styles.userCard,
            { backgroundColor: colors.foreground, borderRadius: colors.radius + 4 },
          ]}
        >
          <View
            style={[
              styles.avatar,
              { backgroundColor: colors.accent },
            ]}
          >
            <Text style={styles.avatarText}>
              {user.name.split(" ").map((n) => n[0]).join("")}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.primaryForeground }]}>
              {user.name}
            </Text>
            <Text style={[styles.userEmail, { color: "rgba(255,255,255,0.55)" }]}>
              {user.email}
            </Text>
            <View style={styles.userBadge}>
              <View style={[styles.roleDot, { backgroundColor: colors.accent }]} />
              <Text style={styles.roleText}>{user.merchantSlug}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.consumerCard,
            { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
          ]}
        >
          <View
            style={[
              styles.avatar,
              { backgroundColor: colors.secondary },
            ]}
          >
            <Feather name="user" size={22} color={colors.mutedForeground} />
          </View>
          <View>
            <Text style={[styles.consumerTitle, { color: colors.foreground }]}>
              AR Shopper
            </Text>
            <Text style={[styles.consumerSub, { color: colors.mutedForeground }]}>
              {recentProducts.length} product{recentProducts.length !== 1 ? "s" : ""} viewed
            </Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Merchant
        </Text>
        <View style={[styles.group, { borderRadius: colors.radius }]}>
          <SettingRow
            icon="briefcase"
            label={user ? "Merchant Dashboard" : "Merchant Portal"}
            onPress={handleMerchantPortal}
            accent
          />
          {user && (
            <SettingRow
              icon="log-out"
              label="Sign Out"
              onPress={handleLogout}
            />
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          History
        </Text>
        <View style={[styles.group, { borderRadius: colors.radius }]}>
          <SettingRow
            icon="clock"
            label="Recently Viewed"
            value={`${recentProducts.length} items`}
            onPress={() => {}}
          />
          {recentProducts.length > 0 && (
            <SettingRow
              icon="trash-2"
              label="Clear History"
              onPress={handleClearRecent}
            />
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          About
        </Text>
        <View style={[styles.group, { borderRadius: colors.radius }]}>
          <SettingRow icon="info" label="Version" value="1.0.0" />
          <SettingRow
            icon="globe"
            label="Deep Link Format"
            value="mobile://viewer"
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 20 },
  header: { marginBottom: 4 },
  headline: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  userCard: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  consumerCard: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  userInfo: { flex: 1, gap: 2 },
  userName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  userEmail: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  userBadge: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  roleDot: { width: 6, height: 6, borderRadius: 3 },
  roleText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  consumerTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  consumerSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  section: { gap: 8 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: 4,
  },
  group: {
    overflow: "hidden",
    borderWidth: 0,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    marginBottom: 2,
    borderRadius: 12,
    gap: 12,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  settingValue: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
