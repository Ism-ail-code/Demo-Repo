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
  ViroQuad,
  ViroTrackingStateConstants,
} from "@reactvision/react-viro";
import type { ViroTrackingState, ViroTrackingReason } from "@reactvision/react-viro";

const INITIAL_POSITION: [number, number, number] = [0, 0, -1];
const INITIAL_SCALE = 0.3;

ViroMaterials.createMaterials({
  productPBR: {
    lightingModel: "PBR",
    roughness: 0.4,
    metalness: 0.12,
    diffuseIntensity: 1.0,
    writesToDepthBuffer: true,
    readsFromDepthBuffer: true,
  },
  dialRing: {
    lightingModel: "PBR",
    diffuseColor: "rgba(167, 139, 250, 0.25)",
    roughness: 0.1,
    metalness: 0.9,
    readsFromDepthBuffer: false,
    writesToDepthBuffer: false,
  },
  dialRingGlow: {
    lightingModel: "Constant",
    diffuseColor: "rgba(167, 139, 250, 0.12)",
    readsFromDepthBuffer: false,
    writesToDepthBuffer: false,
  },
});

export interface NativeARSessionProps {
  glbUrl: string;
  usdzUrl?: string;
  color: string;
  modelPosition?: [number, number, number];
  modelScale?: number;
  modelRotation?: [number, number, number];
  isLatched?: boolean;
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
      isLatched: boolean;
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
    isLatched,
    onAnchorFound,
    onError,
    onModelLoaded,
  } = sceneNavigator.viroAppProps;

  const onTrackingUpdated = useCallback(
    (_state: ViroTrackingState, _reason: ViroTrackingReason) => {
      if (_state === ViroTrackingStateConstants.TRACKING_NORMAL) {
        onAnchorFound?.();
      }
    },
    [onAnchorFound]
  );

  const modelSource =
    Platform.OS === "ios" && usdzUrl ? { uri: usdzUrl } : { uri: glbUrl };
  const modelType = Platform.OS === "ios" && usdzUrl ? "VRX" : "GLB";

  const dialY = -0.02;
  const dialRadius = 0.18;

  return (
    <ViroARScene onTrackingUpdated={onTrackingUpdated}>
      <ViroLightingEnvironment
        source={{
          uri: "https://modelviewer.dev/shared-assets/environments/neutral.hdr",
        }}
        onLoadEnd={() => {}}
      />

      <ViroAmbientLight color="#ffffff" intensity={220} />

      <ViroDirectionalLight
        color="#ffffff"
        intensity={600}
        direction={[0, -1, -1]}
        castsShadow
        shadowOpacity={0.6}
        shadowMapSize={1024}
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
      />

      <ViroSpotLight
        position={[-2, 4, -1]}
        color="#e0d4ff"
        intensity={250}
        direction={[0, -1, 0.5]}
        attenuationStartDistance={4}
        attenuationEndDistance={12}
        innerAngle={25}
        outerAngle={55}
      />

      <ViroOmniLight
        position={[-3, 3, -3]}
        color="#e8e0ff"
        intensity={200}
        attenuationStartDistance={3}
        attenuationEndDistance={10}
      />

      <ViroOmniLight
        position={[3, 2, 2]}
        color="#ffe8d4"
        intensity={150}
        attenuationStartDistance={3}
        attenuationEndDistance={8}
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
          shadowCastingBitMask={1}
          onLoadEnd={() => {
            onModelLoaded?.();
          }}
          onLoadStart={() => {}}
          onError={(error: any) => {
            onError?.(`Failed to load 3D model: ${error}`);
          }}
        />

        <ViroNode position={[0, dialY, 0]} rotation={[0, 0, 0]}>
          <ViroQuad
            position={[0, 0, 0]}
            rotation={[-90, 0, 0]}
            width={dialRadius * 2.2}
            height={dialRadius * 2.2}
            materials={["dialRing"]}
          />
          <ViroQuad
            position={[0, 0.002, 0]}
            rotation={[-90, 0, 0]}
            width={dialRadius * 2.5}
            height={dialRadius * 2.5}
            materials={["dialRingGlow"]}
          />
          <ViroQuad
            position={[0, 0, 0]}
            rotation={[-90, 0, 0]}
            width={dialRadius * 1.2}
            height={dialRadius * 1.2}
            materials={["dialRingGlow"]}
          />
        </ViroNode>
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
  isLatched = false,
  onAnchorFound,
  onError,
}: NativeARSessionProps) {
  const [isReady, setIsReady] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);

  const resolvedPosition = externalPosition ?? INITIAL_POSITION;
  const resolvedScale = externalScale ?? INITIAL_SCALE;
  const resolvedRotation = externalRotation ?? [0, 0, 0];

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
        initialScene={{ scene: ARScene as any }}
        viroAppProps={{
          glbUrl,
          usdzUrl,
          modelPosition: resolvedPosition,
          modelScale: resolvedScale,
          modelRotation: resolvedRotation as [number, number, number],
          isLatched,
          onAnchorFound,
          onError,
          onModelLoaded: handleModelLoaded,
        }}
        hdrEnabled={true}
        pbrEnabled={true}
        bloomEnabled={false}
        shadowsEnabled={true}
        multisamplingEnabled={true}
        style={StyleSheet.absoluteFill}
      />

      {!modelLoaded && (
        <View style={styles.loadingOverlay}>
          <View style={styles.glassCard}>
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

      {modelLoaded && (
        <View style={styles.gestureHintContainer}>
          <View style={styles.gestureHintRow}>
            <View style={styles.gesturePill}>
              <Text style={styles.gestureIcon}>{"\u2194"}</Text>
              <Text style={styles.gestureLabel}>Drag</Text>
            </View>
            <View style={styles.gesturePill}>
              <Text style={styles.gestureIcon}>{"\u2195"}</Text>
              <Text style={styles.gestureLabel}>Pinch</Text>
            </View>
            <View style={styles.gesturePill}>
              <Text style={styles.gestureIcon}>{"\u21BB"}</Text>
              <Text style={styles.gestureLabel}>Twist</Text>
            </View>
            <View style={styles.gesturePill}>
              <Text style={styles.gestureIcon}>{"\u25CE"}</Text>
              <Text style={styles.gestureLabel}>Dial</Text>
            </View>
          </View>
        </View>
      )}

      {isLatched && modelLoaded && (
        <View style={styles.latchBadge}>
          <View style={styles.latchDot} />
          <Text style={styles.latchText}>CAMERA LOCKED</Text>
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
  loadingHint: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
    marginTop: 4,
  },
  gestureHintContainer: {
    position: "absolute",
    bottom: 180,
    left: 0,
    right: 0,
    alignItems: "center",
    pointerEvents: "none",
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
  latchBadge: {
    position: "absolute",
    top: 100,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(167, 139, 250, 0.3)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.5)",
    pointerEvents: "none",
  },
  latchDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#a78bfa",
  },
  latchText: {
    color: "#a78bfa",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
  },
});
