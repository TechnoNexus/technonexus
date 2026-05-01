import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Linking, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import SpatialBackground from '../components/SpatialBackground';
import GlassPanel from '../components/GlassPanel';
import { Colors } from '../theme/Colors';
import Constants from 'expo-constants';

export default function SettingsScreen({ navigation }) {
  // Use expo-constants for version if available, fallback to 1.0.0
  const appVersion = Constants.expoConfig?.version || '1.0.0';

  const handleLink = async (url) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Cannot open the link at this time.');
    }
  };

  const OptionRow = ({ title, onPress, value, isDanger }) => (
    <Pressable 
      onPress={async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if(onPress) onPress();
      }}
      style={({pressed}) => [
        styles.optionRow,
        pressed && styles.optionRowPressed
      ]}
    >
      <Text style={[styles.optionTitle, isDanger && { color: '#F87171' }]}>{title}</Text>
      {value ? (
        <Text style={styles.optionValue}>{value}</Text>
      ) : (
        <Text style={styles.optionArrow}>›</Text>
      )}
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <SpatialBackground />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.goBack();
            }}
            style={styles.backButton}
          >
            <Text style={styles.headerIcon}>{'<'}</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>SYSTEM CONFIG</Text>
            <Text style={styles.headerTitle}>SETTINGS</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <GlassPanel style={styles.panel} intensity={40}>
            <OptionRow 
              title="Nexus Profile & Vault" 
              onPress={() => navigation.navigate('Profile')} 
            />
            <View style={styles.divider} />
            <OptionRow 
              title="Upgrade to Nexus Pro" 
              onPress={() => navigation.navigate('NexusProPaywall')} 
            />
          </GlassPanel>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LEGAL & ABOUT</Text>
          <GlassPanel style={styles.panel} intensity={40}>
            <OptionRow 
              title="Privacy Policy" 
              onPress={() => handleLink('https://technonexus.ca/privacy')} 
            />
            <View style={styles.divider} />
            <OptionRow 
              title="Terms of Service" 
              onPress={() => handleLink('https://technonexus.ca/terms')} 
            />
            <View style={styles.divider} />
            <OptionRow 
              title="App Version" 
              value={`v${appVersion}`}
              onPress={() => {}}
            />
          </GlassPanel>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>TechnoNexus © {new Date().getFullYear()}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBg
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 80
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40
  },
  headerCopy: {
    flex: 1,
    alignItems: 'flex-end'
  },
  backButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center'
  },
  headerIcon: {
    color: Colors.neonCyan,
    fontSize: 24,
    fontWeight: '900'
  },
  headerEyebrow: {
    color: Colors.slateGray,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -1
  },
  section: {
    marginBottom: 32
  },
  sectionTitle: {
    color: Colors.neonCyan,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
    paddingLeft: 4
  },
  panel: {
    borderRadius: 20,
    overflow: 'hidden'
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.02)'
  },
  optionRowPressed: {
    backgroundColor: 'rgba(255,255,255,0.06)'
  },
  optionTitle: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700'
  },
  optionValue: {
    color: Colors.slateGray,
    fontSize: 14,
    fontWeight: '600'
  },
  optionArrow: {
    color: Colors.slateGray,
    fontSize: 22,
    fontWeight: '400',
    lineHeight: 22
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 20
  },
  footer: {
    marginTop: 40,
    alignItems: 'center'
  },
  footerText: {
    color: Colors.slateGray,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1
  }
});
