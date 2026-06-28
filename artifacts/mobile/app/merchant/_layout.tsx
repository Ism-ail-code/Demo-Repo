import { Stack } from "expo-router";
import React from "react";

import { useColors } from "@/hooks/useColors";

export default function MerchantLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        headerTitleStyle: {
          fontFamily: "Inter_600SemiBold",
          fontSize: 16,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="login"
        options={{ title: "Merchant Portal", headerBackTitle: "Back" }}
      />
      <Stack.Screen
        name="dashboard"
        options={{ title: "Dashboard", headerBackTitle: "Portal" }}
      />
    </Stack>
  );
}
