import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Dimensions, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/Colors';

const { width, height } = Dimensions.get('window');

export default function SpatialBackground() {
  const orb1X = useRef(new Animated.Value(-100)).current;
  const orb1Y = useRef(new Animated.Value(-200)).current;
  
  const orb2X = useRef(new Animated.Value(150)).current;
  const orb2Y = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    const animateOrb = (valX, valY, toX, toY, durationX, durationY) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(valX, { toValue: toX, duration: durationX, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(valX, { toValue: -toX, duration: durationX, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(valY, { toValue: toY, duration: durationY, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(valY, { toValue: -toY, duration: durationY, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
        ])
      ).start();
    };

    animateOrb(orb1X, orb1Y, 100, 50, 15000, 10000);
    animateOrb(orb2X, orb2Y, -150, 200, 12000, 14000);
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.darkBg, Colors.darkBg]}
        style={StyleSheet.absoluteFillObject}
      />
      
      <Animated.View style={[styles.orb, styles.cyanOrb, { transform: [{ translateX: orb1X }, { translateY: orb1Y }] }]} />
      <Animated.View style={[styles.orb, styles.violetOrb, { transform: [{ translateX: orb2X }, { translateY: orb2Y }] }]} />

      <LinearGradient
        colors={['rgba(139,92,246,0.15)', 'transparent']}
        style={styles.topGradient}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.darkBg,
    overflow: 'hidden',
  },
  topGradient: {
    ...StyleSheet.absoluteFillObject,
    height: height * 0.4,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.4,
  },
  cyanOrb: {
    width: 300,
    height: 300,
    backgroundColor: Colors.neonCyan,
    top: height * 0.2,
    left: width * 0.5 - 150,
  },
  violetOrb: {
    width: 400,
    height: 400,
    backgroundColor: Colors.electricViolet,
    top: height * 0.5,
    left: width * 0.2 - 200,
  }
});