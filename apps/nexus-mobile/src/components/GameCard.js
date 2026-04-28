import React, { useRef } from 'react';
import { StyleSheet, Text, Pressable, View, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import GlassPanel from './GlassPanel';
import { Colors } from '../theme/Colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function GameCard({ title, description, color, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={[styles.wrapper, { transform: [{ scale }] }]}
    >
      <GlassPanel style={[styles.card, { borderColor: color + '40' }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={[styles.arrow, { color }]}>→</Text>
        </View>
        <Text style={styles.description}>{description}</Text>
      </GlassPanel>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 24,
  },
  card: {
    padding: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  arrow: {
    fontSize: 24,
    fontWeight: '900',
  },
  description: {
    color: Colors.slateGray,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  }
});