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

const MIN_SCALE = 0.2;
const MAX_SCALE = 2.0;
const TRANSLATE_SENSITIVITY = 0.004;
const ROTATE_SENSITIVITY = 0.3;
const INITIAL_SCALE = 0.3;
const INITIAL_POSITION: [number, number, number] = [0, 0, -1];

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

interface ActiveTouch {
  id: number;
  pageX: number;
  pageY: number;
}

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

function angleBetweenPoints(
  a: { pageX: number; pageY: number },
  b: { pageX: number; pageY: number }
): number {
  return (
    Math.atan2(b.pageY - a.pageY, b.pageX - a.pageX) * (180 / Math.PI)
  );
}

function distanceBetweenPoints(
  a: { pageX: number; pageY: number },
  b: { pageX: number; pageY: number }
): number {
  const dx = b.pageX - a.pageX;
  const dy = b.pageY - a.pageY;
  return Math.sqrt(dx * dx + dy * dy);
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

  const modelPositionRef = useRef<[number, number, number]>([
    ...INITIAL_POSITION,
  ]);
  const modelRotationRef = useRef<[number, number, number]>([0, 0, 0]);
  const modelScaleRef = useRef(INITIAL_SCALE);

  const activeTouchesRef = useRef<ActiveTouch[]>([]);
  const pinchBaseDistRef = useRef(0);
  const pinchBaseScaleRef = useRef(INITIAL_SCALE);
  const rotateBaseAngleRef = useRef(0);
  const rotateBaseYRef = useRef(0);
  const panBasePosRef = useRef<[number, number, number]>([...INITIAL_POSITION]);
  const panStartTouchRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [modelPosition, setModelPosition] =
    useState<[number, number, number]>(INITIAL_POSITION);
  const [modelRotation, setModelRotation] = useState<[number, number, number]>([
    0, 0, 0,
  ]);
  const [modelScale, setModelScale] = useState(INITIAL_SCALE);

  useEffect(() => {
    if (glbUrl) {
      setIsReady(true);
    }
  }, [glbUrl]);

  const handleModelLoaded = useCallback(() => {
    setModelLoaded(true);
  }, []);

  const syncPosition = useCallback((pos: [number, number, number]) => {
    modelPositionRef.current = pos;
    setModelPosition(pos);
  }, []);

  const syncScale = useCallback((s: number) => {
    modelScaleRef.current = s;
    setModelScale(s);
  }, []);

  const syncRotation = useCallback((r: [number, number, number]) => {
    modelRotationRef.current = r;
    setModelRotation(r);
  }, []);

  const handleTouchStart = useCallback(
    (e: any) => {
      const nativeTouches: any[] = e.nativeEvent.touches || [];
      if (nativeTouches.length === 0) return;

      activeTouchesRef.current = nativeTouches.map((t: any) => ({
        id: t.identifier ?? t.pageX,
        pageX: t.pageX,
        pageY: t.pageY,
      }));

      const count = activeTouchesRef.current.length;

      if (count === 1) {
        panBasePosRef.current = [...modelPositionRef.current];
        panStartTouchRef.current = {
          x: nativeTouches[0].pageX,
          y: nativeTouches[0].pageY,
        };
      } else if (count >= 2) {
        const t1 = activeTouchesRef.current[0];
        const t2 = activeTouchesRef.current[1];
        pinchBaseDistRef.current = distanceBetweenPoints(t1, t2);
        pinchBaseScaleRef.current = modelScaleRef.current;
        rotateBaseAngleRef.current = angleBetweenPoints(t1, t2);
        rotateBaseYRef.current = modelRotationRef.current[1];
      }
    },
    []
  );

  const handleTouchMove = useCallback(
    (e: any) => {
      const nativeTouches: any[] = e.nativeEvent.touches || [];
      if (nativeTouches.length === 0) return;

      activeTouchesRef.current = nativeTouches.map((t: any) => ({
        id: t.identifier ?? t.pageX,
        pageX: t.pageX,
        pageY: t.pageY,
      }));

      const count = activeTouchesRef.current.length;

      if (count === 1) {
        const t = nativeTouches[0];
        const base = panBasePosRef.current;
        const startX = panStartTouchRef.current.x;
        const startY = panStartTouchRef.current.y;
        const dx = t.pageX - startX;
        const dy = t.pageY - startY;
        const newPos: [number, number, number] = [
          base[0] + dx * TRANSLATE_SENSITIVITY,
          base[1],
          base[2] + dy * TRANSLATE_SENSITIVITY,
        ];
        syncPosition(newPos);
      } else if (count >= 2) {
        const t1 = nativeTouches[0];
        const t2 = nativeTouches[1];
        const currentDist = distanceBetweenPoints(t1, t2);
        const currentAngle = angleBetweenPoints(t1, t2);

        if (pinchBaseDistRef.current > 0) {
          const ratio = currentDist / pinchBaseDistRef.current;
          const newScale = Math.max(
            MIN_SCALE,
            Math.min(MAX_SCALE, pinchBaseScaleRef.current * ratio)
          );
          syncScale(newScale);
        }

        if (pinchBaseDistRef.current > 0) {
          let angleDelta = currentAngle - rotateBaseAngleRef.current;
          if (angleDelta > 180) angleDelta -= 360;
          if (angleDelta < -180) angleDelta += 360;
          const newY = rotateBaseYRef.current + angleDelta;
          syncRotation([0, newY, 0]);
        }
      }
    },
    [syncPosition, syncScale, syncRotation]
  );

  const handleTouchEnd = useCallback(() => {
    activeTouchesRef.current = [];
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
          modelPosition,
          modelScale,
          modelRotation,
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

      <View
        style={StyleSheet.absoluteFill}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
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
              <Text style={styles.gestureIcon}>{`\u2194`}</Text>
              <Text style={styles.gestureLabel}>Drag</Text>
            </View>
            <View style={styles.gesturePill}>
              <Text style={styles.gestureIcon}>{`\u2195`}</Text>
              <Text style={styles.gestureLabel}>Pinch</Text>
            </View>
            <View style={styles.gesturePill}>
              <Text style={styles.gestureIcon}>{`\u21BB`}</Text>
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
});
