import { supabase } from './supabase';

// Helper to push the token. In a real scenario, you'd run an ALTER TABLE to add this column to user_profiles
// But since we can't alter the schema here easily, we'll assume it exists or fail gracefully.
export async function savePushToken(userId, token) {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ push_token: token })
      .eq('id', userId);
      
    if (error) {
      console.error('Error saving push token to Supabase:', error);
    } else {
      console.log('Push token saved successfully for user:', userId);
    }
  } catch (err) {
    console.error('Failed to update push token:', err);
  }
}
