import { AppState, Platform } from 'react-native';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://your-project-id.supabase.co';
const DEFAULT_SUPABASE_KEY = 'your-anon-key';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;

const supabaseFetch = (...args) => fetch(...args);

export const supabaseConfig = {
  host: supabaseUrl.replace(/^https?:\/\//, ''),
  hasConfiguredUrl: supabaseUrl !== DEFAULT_SUPABASE_URL,
  hasConfiguredKey: supabaseAnonKey !== DEFAULT_SUPABASE_KEY,
  keyPreview: `${supabaseAnonKey || ''}`.slice(0, 12),
  url: supabaseUrl
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock
  },
  global: {
    fetch: supabaseFetch
  }
});

export async function probeSupabaseConnection() {
  try {
    const response = await supabaseFetch(supabaseUrl, {
      method: 'GET',
      headers: {
        apikey: supabaseAnonKey
      }
    });

    return {
      ok: true,
      status: response.status
    };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'Unknown network error'
    };
  }
}

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
