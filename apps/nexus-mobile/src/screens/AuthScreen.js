import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import SpatialBackground from '../components/SpatialBackground';
import GlassPanel from '../components/GlassPanel';
import { Colors } from '../theme/Colors';
import * as Haptics from 'expo-haptics';

export default function AuthScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async () => {
    if (!email || !password) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    let error;
    if (isLogin) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      error = signInError;
    } else {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      error = signUpError;
    }

    setLoading(false);
    
    if (error) {
      alert(error.message);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Supabase onAuthStateChange listener in App.js will handle the redirect
    }
  };

  const handleOAuth = async (provider) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Note: True OAuth in Expo requires configuring app schemes and redirect URIs in Supabase.
    // This initiates the standard Supabase flow.
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: 'exp://localhost:8081' // Replace with your scheme
      }
    });
    
    if (error) alert(error.message);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SpatialBackground />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.subtitle}>NEXUS ID</Text>
          <Text style={styles.title}>AUTHENTICATION</Text>
        </View>

        <GlassPanel style={styles.panel} intensity={60}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL PROTOCOL</Text>
            <TextInput
              style={styles.input}
              placeholder="ENTER EMAIL"
              placeholderTextColor={Colors.slateGray}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>SECURITY KEY</Text>
            <TextInput
              style={styles.input}
              placeholder="ENTER PASSWORD"
              placeholderTextColor={Colors.slateGray}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <Pressable 
            onPress={handleAuth}
            disabled={loading}
            style={[styles.primaryButton, loading && styles.disabled]}
          >
            {loading ? (
              <ActivityIndicator color={Colors.black} />
            ) : (
              <Text style={styles.primaryButtonText}>{isLogin ? 'INITIALIZE SYNC' : 'REGISTER NEW ID'}</Text>
            )}
          </Pressable>

          <Pressable onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsLogin(!isLogin);
          }}>
            <Text style={styles.switchText}>
              {isLogin ? 'CREATE NEW NEXUS ID' : 'RETURN TO EXISTING ID'}
            </Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>OR SECURE WITH</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.socialRow}>
            <Pressable onPress={() => handleOAuth('google')} style={[styles.socialButton, { borderColor: '#DB4437' }]}>
              <Text style={[styles.socialText, { color: '#DB4437' }]}>GOOGLE</Text>
            </Pressable>
            <Pressable onPress={() => handleOAuth('apple')} style={[styles.socialButton, { borderColor: '#FFFFFF' }]}>
              <Text style={[styles.socialText, { color: '#FFFFFF' }]}>APPLE</Text>
            </Pressable>
            <Pressable onPress={() => handleOAuth('facebook')} style={[styles.socialButton, { borderColor: '#4267B2' }]}>
              <Text style={[styles.socialText, { color: '#4267B2' }]}>META</Text>
            </Pressable>
          </View>
        </GlassPanel>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
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
  panel: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: Colors.slateGray,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  primaryButton: {
    backgroundColor: Colors.neonCyan,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  primaryButtonText: {
    color: Colors.black,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  disabled: {
    opacity: 0.7,
  },
  switchText: {
    color: Colors.electricViolet,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    color: Colors.slateGray,
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
    paddingHorizontal: 12,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  socialButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  socialText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  }
});
