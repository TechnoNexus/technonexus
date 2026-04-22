import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '../theme/Colors';

export default function GlassPanel({ children, style, intensity = 40, tint = 'dark' }) {
  return (
    <View style={[styles.container, style]}>
      <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFillObject} />
      <View style={styles.overlay} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 32,
    overflow: 'hidden',
    borderColor: Colors.glassBorder,
    borderWidth: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)', // Dark tint for frosted effect
  }
});
