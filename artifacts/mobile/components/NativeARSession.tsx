import React, { useCallback, useEffect, useRef, useState } from "react";
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

const MIN_SCALE = 0.1;
const MAX_SCALE = 2.0;

ViroMaterials.createMaterials({
  productPBR: {
    lightingModel: "PBR",
    roughness: 0.4,
    metalness: 0.1,
    diffuseIntensity: 1.0,
    writesToDepthBuffer: true,
    readsFromDepthBuffer: true,
  },
});

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

  const [modelLoaded, setModelLoaded] = useState(false);
  const [scale, setScale] = useState(0.3);
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [modelPosition, setModelPosition] = useState<
    [number, number, number]
  >(position);

  const scaleRef = useRef(0.3);
  const rotRef = useRef(0);

  const onPlaneDetected = useCallback(() => {
    onAnchorFound?.();
  }, [onAnchorFound]);

  const modelSource =
    Platform.OS === "ios" && usdzUrl ? { uri: usdzUrl } : { uri: glbUrl };
  const modelType = Platform.OS === "ios" && usdzUrl ? "VRX" : "GLB";

  const handleDrag = useCallback(
    (dragToPos: [number, number, number]) => {
      setModelPosition(dragToPos);
    },
    []
  );

  const handlePinch = useCallback(
    (
      pinchState: number,
      scaleFactor: number
    ) => {
      if (pinchState === 1 || pinchState === 2) {
        const newScale = Math.max(
          MIN_SCALE,
          Math.min(MAX_SCALE, scaleRef.current * scaleFactor)
        );
        scaleRef.current = newScale;
        setScale(newScale);
      }
      if (pinchState === 3) {
        scaleRef.current = scale;
      }
    },
    [scale]
  );

  const handleRotate = useCallback(
    (
      rotateState: number,
      rotationFactor: number
    ) => {
      if (rotateState === 1 || rotateState === 2) {
        const newY = rotRef.current + rotationFactor;
        rotRef.current = newY;
        setRotation([0, newY, 0]);
      }
      if (rotateState === 3) {
        rotRef.current = rotation[1];
      }
    },
    [rotation]
  );

  return (
    <ViroARScene onTrackingUpdated={onPlaneDetected}>
      <ViroLightingEnvironment
        source={{ uri: "https://modelviewer.dev/shared-assets/environments/neutral.hdr" }}
        onLoadEnd={() => {}}
      />

      <ViroAmbientLight color="#ffffff" intensity={200} />

      <ViroDirectionalLight
        color="#ffffff"
        intensity={600}
        direction={[0, -1, -1]}
        castsShadow
        shadowOpacity={0.65}
        shadowMapSize={2048}
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
        shadowMapSize={1024}
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
        rotation={rotation}
        scale={[scale, scale, scale]}
        dragType="FixedToWorld"
        onDrag={handleDrag}
        onPinch={handlePinch}
        onRotate={handleRotate}
      >
        <Viro3DObject
          source={modelSource}
          type={modelType}
          materials={["productPBR"]}
          lightReceivingBitMask={3}
          shadowCastingBitMask={2}
          onLoadEnd={() => {
            setModelLoaded(true);
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
        initialScene={{ scene: ARScene }}
        viroAppProps={{
          glbUrl,
          usdzUrl,
          position: [0, 0, -1] as [number, number, number],
          color,
          onAnchorFound,
          onError,
          onModelLoaded: handleModelLoaded,
        }}
        hdrEnabled={true}
        pbrEnabled={true}
        bloomEnabled={true}
        shadowsEnabled={true}
        multisamplingEnabled={true}
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
              Pinch to scale · Twist to rotate · Drag to reposition
            </Text>
          </View>
        </View>
      )}

      {modelLoaded && (
        <View style={styles.gestureHints}>
          <View style={styles.gestureHintRow}>
            <View style={styles.gesturePill}>
              <Text style={styles.gestureIcon}>☝</Text>
              <Text style={styles.gestureLabel}>Drag to move</Text>
            </View>
            <View style={styles.gesturePill}>
              <Text style={styles.gestureIcon}>✊</Text>
              <Text style={styles.gestureLabel}>Pinch to scale</Text>
            </View>
            <View style={styles.gesturePill}>
              <Text style={styles.gestureIcon}>🔄</Text>
              <Text style={styles.gestureLabel}>Twist to rotate</Text>
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
  gestureHints: {
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
  },
  gestureLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontWeight: "500",
  },
});
