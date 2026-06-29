import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";

import {
  Viro3DObject,
  ViroAmbientLight,
  ViroARScene,
  ViroARSceneNavigator,
  ViroNode,
  ViroSpotLight,
} from "@reactvision/react-viro";

export interface NativeARSessionProps {
  glbUrl: string;
  usdzUrl?: string;
  color: string;
  onAnchorFound?: () => void;
  onError?: (message: string) => void;
}

interface ARSceneProps {
  sceneNavigator: {
    viroAppProps: {
      glbUrl: string;
      usdzUrl?: string;
      position: [number, number, number];
      color: string;
      onAnchorFound?: () => void;
      onError?: (message: string) => void;
      onModelLoaded?: () => void;
    };
  };
}

function ARScene({ sceneNavigator }: ARSceneProps) {
  const { glbUrl, usdzUrl, position, onAnchorFound, onError, onModelLoaded } =
    sceneNavigator.viroAppProps;

  const onPlaneDetected = useCallback(() => {
    onAnchorFound?.();
  }, [onAnchorFound]);

  const modelSource =
    Platform.OS === "ios" && usdzUrl ? { uri: usdzUrl } : { uri: glbUrl };
  const modelType = Platform.OS === "ios" && usdzUrl ? "VRX" : "GLB";

  return (
    <ViroARScene onTrackingUpdated={onPlaneDetected}>
      <ViroAmbientLight color="#ffffff" intensity={300} />
      <ViroSpotLight
        position={[0, 5, -1]}
        color="#ffffff"
        direction={[0, -1, 0]}
        attenuationStartDistance={5}
        attenuationEndDistance={10}
        castsShadow
      />
      <ViroNode position={position} dragType="FixedToWorld" onDrag={() => {}}>
        <Viro3DObject
          source={modelSource}
          type={modelType}
          scale={[0.3, 0.3, 0.3]}
          onLoadEnd={() => {
            onModelLoaded?.();
          }}
          onLoadStart={() => {}}
          onError={() => {
            onError?.("Failed to load 3D model");
          }}
        />
      </ViroNode>
    </ViroARScene>
  );
}

export function NativeARSession({
  glbUrl,
  usdzUrl,
  color,
  onAnchorFound,
  onError,
}: NativeARSessionProps) {
  const [isReady, setIsReady] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);

  useEffect(() => {
    if (glbUrl) {
      setIsReady(true);
    }
  }, [glbUrl]);

  const handleModelLoaded = useCallback(() => {
    setModelLoaded(true);
  }, []);

  if (!isReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Initializing AR...</Text>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <ViroARSceneNavigator
        autofocus
        initialScene={{
          scene: ARScene,
        }}
        viroAppProps={{
          glbUrl,
          usdzUrl,
          position: [0, 0, -1] as [number, number, number],
          color,
          onAnchorFound,
          onError,
          onModelLoaded: handleModelLoaded,
        }}
        style={StyleSheet.absoluteFill}
      />

      {!modelLoaded && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingTitle}>Loading 3D Model</Text>
            <Text style={styles.loadingSub}>
              {Platform.OS === "ios" ? ".usdz" : ".glb"} · Downloading assets...
            </Text>
            <Text style={styles.loadingHint}>
              Point camera at a flat surface to anchor
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    marginTop: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    pointerEvents: "none",
  },
  loadingCard: {
    backgroundColor: "rgba(20,20,20,0.9)",
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    gap: 12,
    minWidth: 260,
  },
  loadingTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  loadingSub: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
  },
  loadingHint: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
    marginTop: 4,
  },
});
