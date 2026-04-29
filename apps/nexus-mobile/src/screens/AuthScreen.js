import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { probeSupabaseConnection, supabase, supabaseConfig } from '../lib/supabase';
import SpatialBackground from '../components/SpatialBackground';
import GlassPanel from '../components/GlassPanel';
import { Colors } from '../theme/Colors';
import * as Haptics from 'expo-haptics';

export default function AuthScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const hasSupabaseConfig = supabaseConfig.hasConfiguredUrl && supabaseConfig.hasConfiguredKey;

  const showAuthError = async (error) => {
    const message = error?.message || 'Authentication failed.';

    if (!message.includes('Network request failed')) {
      Alert.alert('Authentication Failed', message);
      return;
    }

    const probe = await probeSupabaseConnection();
    const details = [
      `Supabase config: ${hasSupabaseConfig ? 'READY' : 'MISSING'}`,
      `Supabase host: ${supabaseConfig.host}`,
      probe.ok ? `Reachability: HTTP ${probe.status}` : `Reachability: ${probe.message}`,
      'If you recently changed EAS variables, install a freshly rebuilt tester app.'
    ].join('\n');

    Alert.alert('Network Request Failed', details);
  };

  const handleAuth = async () => {
    if (!email || !password) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    let error;
    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        error = signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        error = signUpError;
      }
    } catch (unexpectedError) {
      error = unexpectedError;
    }

    setLoading(false);
    
    if (error) {
      await showAuthError(error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Supabase onAuthStateChange listener in App.js will handle the redirect
    }
  };

  const handleOAuth = async (provider) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      const redirectUrl = makeRedirectUri({
        path: '/auth/callback',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl, {
          showInRecents: true,
        });

        if (result.type === 'success' && result.url) {
          const queryOrFragment = result.url.split('#')[1] || result.url.split('?')[1];
          if (queryOrFragment) {
            const params = {};
            queryOrFragment.split('&').forEach(pair => {
              const [k, v] = pair.split('=');
              params[k] = decodeURIComponent(v);
            });
            
            if (params.access_token && params.refresh_token) {
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: params.access_token,
                refresh_token: params.refresh_token,
              });
              if (sessionError) throw sessionError;
            }
          }
        }
      }
    } catch (unexpectedError) {
      await showAuthError(unexpectedError);
    } finally {
      setLoading(false);
    }
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
          <Text style={[styles.statusText, { color: hasSupabaseConfig ? Colors.neonCyan : Colors.electricViolet }]}>
            {hasSupabaseConfig ? 'SECURE CONNECTION ESTABLISHED' : 'AUTH LINK MISCONFIGURED • REBUILD REQUIRED'}
          </Text>
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
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 12,
    textAlign: 'center'
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
