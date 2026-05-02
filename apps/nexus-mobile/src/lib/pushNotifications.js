import { supabase } from './supabase';

// Helper to push the token. 
export async function savePushToken(userId, token) {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .upsert({ id: userId, push_token: token }, { onConflict: 'id' });
      
    if (error) {
      console.error('Error saving push token to Supabase:', error);
    } else {
      console.log('Push token saved successfully for user:', userId);
    }
  } catch (err) {
    console.error('Failed to update push token:', err);
  }
}
