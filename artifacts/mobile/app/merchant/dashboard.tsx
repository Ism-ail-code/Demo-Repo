import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

interface MetricCard {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: string;
}

const METRICS: MetricCard[] = [
  { label: "Total Scans", value: "12,847", change: "+18.4%", positive: true, icon: "eye" },
  { label: "Active Products", value: "34", change: "+3", positive: true, icon: "box" },
  { label: "Conversion Rate", value: "6.2%", change: "+0.9%", positive: true, icon: "trending-up" },
  { label: "Avg. Session", value: "2m 14s", change: "-8s", positive: false, icon: "clock" },
];

const RECENT_SCANS = [
  { product: "Nordic Lounge Chair", time: "2 min ago", country: "US" },
  { product: "Haven Sectional Sofa", time: "11 min ago", country: "CA" },
  { product: "Nordic Lounge Chair", time: "23 min ago", country: "UK" },
  { product: "Nordic Lounge Chair", time: "41 min ago", country: "AU" },
  { product: "Haven Sectional Sofa", time: "1 hr ago", country: "US" },
];

const AI_JOBS = [
  { name: "Velvet Armchair", status: "processing", progress: 72 },
  { name: "Coffee Table Set", status: "queued", progress: 0 },
  { name: "Bookshelf Unit", status: "complete", progress: 100 },
];

function BarChart({ data }: { data: number[] }) {
  const colors = useColors();
  const max = Math.max(...data);
  return (
    <View style={styles.chartRow}>
      {data.map((val, i) => (
        <View key={i} style={styles.barWrapper}>
          <View
            style={[
              styles.bar,
              {
                height: Math.max(4, (val / max) * 80),
                backgroundColor: i === data.length - 1 ? colors.accent : colors.muted,
                borderRadius: 4,
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [scanData] = useState([420, 380, 510, 620, 490, 710, 843]);

  useEffect(() => {
    if (!user) router.replace("/merchant/login");
  }, [user]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.replace("/(tabs)/profile");
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 32 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.welcomeBanner,
          { backgroundColor: colors.foreground, borderRadius: colors.radius + 4 },
        ]}
      >
        <View>
          <Text style={[styles.welcomeLabel, { color: "rgba(255,255,255,0.5)" }]}>
            Welcome back
          </Text>
          <Text style={styles.welcomeName}>{user.name}</Text>
          <View style={styles.merchantRow}>
            <View style={[styles.merchantDot, { backgroundColor: colors.accent }]} />
            <Text style={styles.merchantSlug}>{user.merchantSlug}</Text>
          </View>
        </View>
        <Pressable onPress={handleLogout} style={styles.logoutBtn}>
          <Feather name="log-out" size={16} color="rgba(255,255,255,0.5)" />
        </Pressable>
      </View>

      <View style={styles.metricsGrid}>
        {METRICS.map((m) => (
          <View
            key={m.label}
            style={[
              styles.metricCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <View style={styles.metricTop}>
              <View
                style={[styles.metricIcon, { backgroundColor: colors.secondary }]}
              >
                <Feather name={m.icon as any} size={14} color={colors.foreground} />
              </View>
              <Text
                style={[
                  styles.metricChange,
                  {
                    color: m.positive ? "#22C55E" : colors.destructive,
                    backgroundColor: m.positive
                      ? "#22C55E18"
                      : colors.destructive + "15",
                  },
                ]}
              >
                {m.change}
              </Text>
            </View>
            <Text style={[styles.metricValue, { color: colors.foreground }]}>
              {m.value}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
              {m.label}
            </Text>
          </View>
        ))}
      </View>

      <View
        style={[
          styles.chartCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        <View style={styles.chartHeader}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Scan Traffic
          </Text>
          <Text style={[styles.chartPeriod, { color: colors.mutedForeground }]}>
            Last 7 days
          </Text>
        </View>
        <BarChart data={scanData} />
        <View style={styles.chartLegend}>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"].map((d) => (
            <Text key={d} style={[styles.chartDay, { color: colors.mutedForeground }]}>
              {d}
            </Text>
          ))}
        </View>
      </View>

      <View
        style={[
          styles.section,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>
          Recent Scans
        </Text>
        {RECENT_SCANS.map((scan, i) => (
          <View
            key={i}
            style={[
              styles.scanRow,
              {
                borderTopColor: colors.border,
                borderTopWidth: i > 0 ? 1 : 0,
              },
            ]}
          >
            <View
              style={[styles.scanDot, { backgroundColor: colors.accent + "30" }]}
            >
              <View style={[styles.scanDotInner, { backgroundColor: colors.accent }]} />
            </View>
            <View style={styles.scanInfo}>
              <Text style={[styles.scanProduct, { color: colors.foreground }]}>
                {scan.product}
              </Text>
              <Text style={[styles.scanTime, { color: colors.mutedForeground }]}>
                {scan.time} · {scan.country}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View
        style={[
          styles.section,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            AI 3D Generation Queue
          </Text>
        </View>
        {AI_JOBS.map((job, i) => (
          <View
            key={i}
            style={[
              styles.jobRow,
              {
                borderTopColor: colors.border,
                borderTopWidth: i > 0 ? 1 : 0,
              },
            ]}
          >
            <View style={styles.jobInfo}>
              <Text style={[styles.jobName, { color: colors.foreground }]}>
                {job.name}
              </Text>
              <View
                style={[
                  styles.progressBar,
                  { backgroundColor: colors.muted },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${job.progress}%` as any,
                      backgroundColor:
                        job.status === "complete"
                          ? "#22C55E"
                          : job.status === "processing"
                          ? colors.accent
                          : colors.border,
                    },
                  ]}
                />
              </View>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    job.status === "complete"
                      ? "#22C55E18"
                      : job.status === "processing"
                      ? colors.accent + "18"
                      : colors.muted,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      job.status === "complete"
                        ? "#22C55E"
                        : job.status === "processing"
                        ? colors.accent
                        : colors.mutedForeground,
                  },
                ]}
              >
                {job.status}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  welcomeBanner: {
    padding: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  welcomeLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  welcomeName: {
    color: "#fff",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  merchantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  merchantDot: { width: 6, height: 6, borderRadius: 3 },
  merchantSlug: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  logoutBtn: { padding: 4 },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  metricCard: {
    width: "48%",
    padding: 14,
    borderWidth: 1,
    gap: 6,
  },
  metricTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metricIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  metricChange: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  metricValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  chartCard: {
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  chartPeriod: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 80,
    gap: 6,
  },
  barWrapper: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: {
    width: "100%",
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chartDay: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    flex: 1,
    textAlign: "center",
  },
  section: {
    borderWidth: 1,
    padding: 16,
    gap: 0,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  scanRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  scanDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  scanDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scanInfo: { flex: 1 },
  scanProduct: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  scanTime: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  jobRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  jobInfo: { flex: 1, gap: 8 },
  jobName: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
});
