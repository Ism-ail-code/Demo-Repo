import React, { useCallback, useEffect, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";

import {
  Viro3DObject,
  ViroAmbientLight,
  ViroARScene,
  ViroARSceneNavigator,
  ViroNode,
  ViroSpotLight,
} from "@reactvision/react-viro";

export interface NativeARSessionProps {
  /** GLB model URL (Android + web fallback) */
  glbUrl: string;
  /** USDZ model URL (iOS preferred) */
  usdzUrl?: string;
  /** Active color variant hex for material tint */
  color: string;
  /** Fires when ARCore/ARKit initialises tracking and a surface is found */
  onAnchorFound?: () => void;
  /** Fires when an AR tracking error occurs */
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
    };
  };
}

function ARScene({ sceneNavigator }: ARSceneProps) {
  const { glbUrl, usdzUrl, position, color, onAnchorFound } =
    sceneNavigator.viroAppProps;

  const [anchorFound, setAnchorFound] = useState(false);

  const onPlaneDetected = useCallback(() => {
    if (!anchorFound) {
      setAnchorFound(true);
      onAnchorFound?.();
    }
  }, [anchorFound, onAnchorFound]);

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
          onLoadEnd={() => {}}
          onLoadStart={() => {}}
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

  useEffect(() => {
    if (glbUrl) {
      setIsReady(true);
    }
  }, [glbUrl]);

  if (!isReady) {
    return <View style={styles.loading} />;
  }

  return (
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
      }}
      style={StyleSheet.absoluteFill}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: "#000",
  },
});
