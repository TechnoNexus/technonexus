import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import SpatialBackground from '../components/SpatialBackground';
import GameCard from '../components/GameCard';
import { Colors } from '../theme/Colors';
import * as Haptics from 'expo-haptics';

export default function ArcadeHome({ navigation }) {
  return (
    <View style={styles.container}>
      <SpatialBackground />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
            style={styles.backButton}
          >
            <Text style={styles.backText}>← DASHBOARD</Text>
          </Pressable>
          <Text style={styles.subtitle}>NEXUS ARCADE</Text>
          <Text style={styles.title}>MULTIPLAYER HUB</Text>
        </View>

        <GameCard
          title="AI FORGE"
          description="Generate custom party games in real-time via Gemini 2.5 Flash."
          color={Colors.neonCyan}
          onPress={() => navigation.navigate('ForgeLobby')}
        />
        
        <GameCard
          title="NEXUS BLITZ"
          description="High-speed trivia generated on the fly. 15 seconds per question."
          color={Colors.electricViolet}
          onPress={() => navigation.navigate('NexusBlitz')}
        />

        <GameCard
          title="DUMB CHARADES"
          description="The classic acting game, now synchronized across the room."
          color={Colors.white}
          onPress={() => navigation.navigate('DumbCharades')}
        />

        <GameCard
          title="NEXUS NPATM"
          description="Name, Place, Animal, Thing, Movie. Be the first to shout STOP!"
          color={Colors.neonCyan}
          onPress={() => navigation.navigate('Npatm')}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 40,
  },
  backButton: {
    marginBottom: 24,
  },
  backText: {
    color: Colors.neonCyan,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  subtitle: {
    color: Colors.neonCyan,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 8,
  },
  title: {
    color: Colors.white,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
});
