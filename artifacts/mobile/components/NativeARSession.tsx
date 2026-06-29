import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Viro3DObject,
  ViroAmbientLight,
  ViroARScene,
  ViroARSceneNavigator,
  ViroDirectionalLight,
  ViroLightingEnvironment,
  ViroMaterials,
  ViroNode,
  ViroOmniLight,
  ViroSpotLight,
} from "@reactvision/react-viro";

// Instant placement — 2.0 m in front of camera at lower-eye level.
// No floor-plane detection required; model appears the moment the asset loads.
const INITIAL_POSITION: [number, number, number] = [0, -0.5, -2.0];
const INITIAL_SCALE = 0.5;

// Seed the base material; will be updated per color change below.
ViroMaterials.createMaterials({
  productPBR: {
    lightingModel: "PBR",
    diffuseColor: "#ffffff",
    roughness: 0.4,
    metalness: 0.3,
    writesToDepthBuffer: true,
    readsFromDepthBuffer: true,
  },
});

export interface NativeARSessionProps {
  glbUrl: string;
  usdzUrl?: string;
  color: string;
  modelPosition?: [number, number, number];
  modelScale?: number;
  modelRotation?: [number, number, number];
  onAnchorFound?: () => void;
  onError?: (message: string) => void;
}

interface ARSceneProps {
  sceneNavigator: {
    viroAppProps: {
      glbUrl: string;
      usdzUrl?: string;
      modelPosition: [number, number, number];
      modelScale: number;
      modelRotation: [number, number, number];
      onAnchorFound?: () => void;
      onError?: (message: string) => void;
      onModelLoaded?: () => void;
    };
  };
}

function ARScene({ sceneNavigator }: ARSceneProps) {
  const {
    glbUrl,
    usdzUrl,
    modelPosition,
    modelScale,
    modelRotation,
    onAnchorFound,
    onError,
    onModelLoaded,
  } = sceneNavigator.viroAppProps;

  const onPlaneDetected = useCallback(() => {
    onAnchorFound?.();
  }, [onAnchorFound]);

  const modelSource =
    Platform.OS === "ios" && usdzUrl ? { uri: usdzUrl } : { uri: glbUrl };
  const modelType = Platform.OS === "ios" && usdzUrl ? "VRX" : "GLB";

  return (
    <ViroARScene onTrackingUpdated={onPlaneDetected}>
      <ViroLightingEnvironment
        source={{
          uri: "https://modelviewer.dev/shared-assets/environments/neutral.hdr",
        }}
        onLoadEnd={() => {}}
      />

      <ViroAmbientLight color="#ffffff" intensity={250} />

      {/* Key directional — HD shadow map with 4096 resolution */}
      <ViroDirectionalLight
        color="#ffffff"
        intensity={650}
        direction={[0, -1, -1]}
        castsShadow
        shadowOpacity={0.65}
        shadowMapSize={4096}
        shadowOrthographicSize={5}
        shadowOrthographicPosition={[0, 5, 0]}
        shadowNearZ={1}
        shadowFarZ={15}
        shadowBias={0.5}
      />

      <ViroSpotLight
        position={[2, 5, 2]}
        color="#ffffff"
        intensity={400}
        direction={[0, -1, 0]}
        attenuationStartDistance={5}
        attenuationEndDistance={15}
        innerAngle={30}
        outerAngle={60}
        castsShadow
        shadowOpacity={0.5}
        shadowMapSize={2048}
      />

      <ViroOmniLight
        position={[-3, 3, -3]}
        color="#e8e0ff"
        intensity={200}
        attenuationStartDistance={3}
        attenuationEndDistance={10}
      />

      <ViroNode
        position={modelPosition}
        rotation={modelRotation}
        scale={[modelScale, modelScale, modelScale]}
      >
        <Viro3DObject
          source={modelSource}
          type={modelType}
          materials={["productPBR"]}
          lightReceivingBitMask={3}
          shadowCastingBitMask={2}
          onLoadEnd={() => {
            onModelLoaded?.();
          }}
          onLoadStart={() => {}}
          onError={(error: any) => {
            onError?.(`Failed to load 3D model: ${error}`);
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
  modelPosition: externalPosition,
  modelScale: externalScale,
  modelRotation: externalRotation,
  onAnchorFound,
  onError,
}: NativeARSessionProps) {
  const [isReady, setIsReady] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);

  const resolvedPosition = externalPosition ?? INITIAL_POSITION;
  const resolvedScale = externalScale ?? INITIAL_SCALE;
  const resolvedRotation = externalRotation ?? [0, 0, 0];

  // Instant placement: mark ready the moment a URL is present — no surface scan needed.
  useEffect(() => {
    if (glbUrl) {
      setIsReady(true);
    }
  }, [glbUrl]);

  // Apply color variant to the PBR material directly on the GPU — no re-download.
  // Recreate the material with the new baseColorFactor whenever the color prop changes.
  useEffect(() => {
    if (!color) return;
    ViroMaterials.createMaterials({
      productPBR: {
        lightingModel: "PBR",
        diffuseColor: color,
        roughness: 0.4,
        metalness: 0.3,
        writesToDepthBuffer: true,
        readsFromDepthBuffer: true,
      },
    });
  }, [color]);

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
    // box-none: this view does NOT consume touches — gestures pass through to the
    // PanResponder layer in ARProductViewer sitting above this in the z-stack.
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <ViroARSceneNavigator
        autofocus
        initialScene={{ scene: ARScene as any }}
        viroAppProps={{
          glbUrl,
          usdzUrl,
          modelPosition: resolvedPosition,
          modelScale: resolvedScale,
          modelRotation: resolvedRotation as [number, number, number],
          onAnchorFound,
          onError,
          onModelLoaded: handleModelLoaded,
        }}
        hdrEnabled={true}
        pbrEnabled={true}
        bloomEnabled={true}
        shadowsEnabled={true}
        // multisamplingEnabled enables hardware MSAA anti-aliasing — eliminates jagged edges
        multisamplingEnabled={true}
        style={StyleSheet.absoluteFill}
      />

      {!modelLoaded && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <View style={styles.glassCard}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingTitle}>Loading 3D Model</Text>
            <Text style={styles.loadingSub}>
              {Platform.OS === "ios" ? ".usdz" : ".glb"} · Streaming asset...
            </Text>
          </View>
        </View>
      )}

      {modelLoaded && (
        <View style={styles.gestureHintContainer} pointerEvents="none">
          <View style={styles.gestureHintRow}>
            <View style={styles.gesturePill}>
              <Text style={styles.gestureIcon}>{"↔"}</Text>
              <Text style={styles.gestureLabel}>Drag</Text>
            </View>
            <View style={styles.gesturePill}>
              <Text style={styles.gestureIcon}>{"↕"}</Text>
              <Text style={styles.gestureLabel}>Pinch</Text>
            </View>
            <View style={styles.gesturePill}>
              <Text style={styles.gestureIcon}>{"↻"}</Text>
              <Text style={styles.gestureLabel}>Twist</Text>
            </View>
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
  },
  glassCard: {
    backgroundColor: "rgba(20,20,20,0.85)",
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    gap: 12,
    minWidth: 260,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
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
  gestureHintContainer: {
    position: "absolute",
    bottom: 180,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  gestureHintRow: {
    flexDirection: "row",
    gap: 8,
  },
  gesturePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  gestureIcon: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  gestureLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontWeight: "500",
  },
});
