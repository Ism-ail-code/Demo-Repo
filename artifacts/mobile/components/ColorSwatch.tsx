import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ColorVariant } from "@/constants/products";
import { useColors } from "@/hooks/useColors";

interface ColorSwatchProps {
  variant: ColorVariant;
  selected: boolean;
  onSelect: (variant: ColorVariant) => void;
  showLabel?: boolean;
  size?: number;
}

export function ColorSwatch({
  variant,
  selected,
  onSelect,
  showLabel = false,
  size = 32,
}: ColorSwatchProps) {
  const colors = useColors();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(variant);
  };

  return (
    <Pressable onPress={handlePress} style={styles.wrapper}>
      <View
        style={[
          styles.ring,
          {
            width: size + 8,
            height: size + 8,
            borderRadius: (size + 8) / 2,
            borderColor: selected ? colors.foreground : "transparent",
          },
        ]}
      >
        <View
          style={[
            styles.swatch,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: variant.color,
              borderColor:
                variant.color === "#F0F0F0" || variant.color === "#FFFFFF"
                  ? colors.border
                  : "transparent",
            },
          ]}
        />
      </View>
      {showLabel && (
        <Text
          style={[
            styles.label,
            { color: selected ? colors.foreground : colors.mutedForeground },
          ]}
        >
          {variant.name}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    gap: 4,
  },
  ring: {
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  swatch: {
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
});
