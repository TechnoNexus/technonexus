import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
import Purchases from 'react-native-purchases';
import SpatialBackground from '../components/SpatialBackground';
import GlassPanel from '../components/GlassPanel';
import { Colors } from '../theme/Colors';
import * as Haptics from 'expo-haptics';

export default function NexusProPaywall({ navigation }) {
  const [packages, setPackages] = useState([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This is a placeholder API key. In a real app, this should be in .env
    // Purchases.configure({ apiKey: "appl_XXXXXX" }); // iOS
    // Purchases.configure({ apiKey: "goog_XXXXXX" }); // Android

    const fetchOfferings = async () => {
      try {
        // Mocking the offerings for now, as we don't have real API keys
        /*
        const offerings = await Purchases.getOfferings();
        if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
          setPackages(offerings.current.availablePackages);
        }
        */
        
        // Mock data
        setTimeout(() => {
          setPackages([
            {
              identifier: '$9.99',
              product: {
                identifier: 'nexus_pro_monthly',
                description: 'Unlock advanced AI Judges and unlimited Vault storage.',
                title: 'Nexus Pro - Monthly',
                priceString: '$9.99'
              }
            },
            {
              identifier: '$89.99',
              product: {
                identifier: 'nexus_pro_yearly',
                description: 'Save 25% with an annual subscription.',
                title: 'Nexus Pro - Yearly',
                priceString: '$89.99'
              }
            }
          ]);
          setIsLoading(false);
        }, 1000);
      } catch (e) {
        console.error('Error fetching offerings', e);
        Alert.alert('Error', 'Could not fetch subscription options.');
        setIsLoading(false);
      }
    };

    fetchOfferings();
  }, []);

  const handlePurchase = async (pkg) => {
    setIsPurchasing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      /*
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (typeof customerInfo.entitlements.active['pro'] !== 'undefined') {
        Alert.alert('Success', 'Welcome to Nexus Pro!');
        navigation.goBack();
      }
      */
      
      // Mock purchase success
      setTimeout(() => {
        Alert.alert('Success', `Mock purchase successful for ${pkg.product.title}. Welcome to Nexus Pro!`);
        setIsPurchasing(false);
        navigation.goBack();
      }, 1500);

    } catch (e) {
      setIsPurchasing(false);
      if (!e.userCancelled) {
        Alert.alert('Error', 'There was an error making the purchase.');
      }
    }
  };

  const handleRestore = async () => {
    setIsPurchasing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      /*
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active['pro']) {
        Alert.alert('Success', 'Purchases restored. Welcome back to Nexus Pro!');
        navigation.goBack();
      } else {
        Alert.alert('Notice', 'No active subscription found to restore.');
      }
      */
     setTimeout(() => {
        Alert.alert('Notice', 'Mock restore complete. No active subscription found.');
        setIsPurchasing(false);
     }, 1000);
    } catch (e) {
      setIsPurchasing(false);
      Alert.alert('Error', 'Failed to restore purchases.');
    }
  };

  return (
    <View style={styles.container}>
      <SpatialBackground />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.headerIcon}>{'<'}</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>UPGRADE</Text>
            <Text style={styles.headerTitle}>NEXUS <Text style={{ color: Colors.electricViolet }}>PRO</Text></Text>
          </View>
        </View>

        <GlassPanel style={styles.heroPanel} intensity={60}>
          <Text style={styles.heroTitle}>UNLEASH THE FORGE</Text>
          <View style={styles.featureList}>
            <FeatureRow icon="⚡" text="Unlimited AI Mission Generations" />
            <FeatureRow icon="🧠" text="Advanced 'Savage' AI Judge Personalities" />
            <FeatureRow icon="💾" text="Unlimited Vault Slots for Saved Games" />
            <FeatureRow icon="👑" text="Exclusive Nexus Pro Animated Nameplate" />
          </View>
        </GlassPanel>

        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.neonCyan} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.packagesContainer}>
            {packages.map((pkg, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  styles.packageCard,
                  pressed && { opacity: 0.8 },
                  pkg.product.identifier.includes('yearly') && styles.packageCardFeatured
                ]}
                onPress={() => handlePurchase(pkg)}
                disabled={isPurchasing}
              >
                {pkg.product.identifier.includes('yearly') && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>BEST VALUE</Text>
                  </View>
                )}
                <View style={styles.packageContent}>
                  <View>
                    <Text style={styles.packageTitle}>{pkg.product.title}</Text>
                    <Text style={styles.packageDesc}>{pkg.product.description}</Text>
                  </View>
                  <Text style={styles.packagePrice}>{pkg.product.priceString}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.footerActions}>
          <Pressable onPress={handleRestore} disabled={isPurchasing} style={styles.footerButton}>
            <Text style={styles.footerButtonText}>RESTORE PURCHASES</Text>
          </Pressable>
          <Pressable onPress={() => navigation.goBack()} disabled={isPurchasing} style={styles.footerButton}>
             <Text style={styles.footerButtonText}>MAYBE LATER</Text>
          </Pressable>
        </View>
        
        {isPurchasing && (
           <View style={styles.overlay}>
              <ActivityIndicator size="large" color={Colors.electricViolet} />
           </View>
        )}
      </ScrollView>
    </View>
  );
}

const FeatureRow = ({ icon, text }) => (
  <View style={styles.featureRow}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

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
    marginBottom: 32
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
  heroPanel: {
    padding: 24,
    marginBottom: 24,
    borderColor: 'rgba(139, 92, 246, 0.4)', // electric violet tint
    borderWidth: 1
  },
  heroTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 20,
    textAlign: 'center'
  },
  featureList: {
    gap: 16
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  featureIcon: {
    fontSize: 18
  },
  featureText: {
    color: Colors.slateGray,
    fontSize: 14,
    fontWeight: '700',
    flex: 1
  },
  packagesContainer: {
    gap: 16,
    marginBottom: 32
  },
  packageCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 20,
    position: 'relative'
  },
  packageCardFeatured: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)', // Light violet fill
    borderColor: Colors.electricViolet,
  },
  badge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: Colors.electricViolet,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1
  },
  packageContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  packageTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4
  },
  packageDesc: {
    color: Colors.slateGray,
    fontSize: 11,
    maxWidth: 200
  },
  packagePrice: {
    color: Colors.neonCyan,
    fontSize: 20,
    fontWeight: '900'
  },
  footerActions: {
    gap: 16,
    alignItems: 'center'
  },
  footerButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  footerButtonText: {
    color: Colors.slateGray,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100
  }
});
