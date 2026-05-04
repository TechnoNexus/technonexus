import { supabase } from '../../../lib/supabase';

export const runtime = 'edge';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}

export async function POST(req) {
  try {
    const { hostName, roomId, gameType } = await req.json();

    if (!hostName || !roomId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS }
      });
    }

    // 1. Fetch all user profiles with a push token
    // In a real app, you'd filter by 'friends' or 'recent players'
    const { data: profiles, error: fetchError } = await supabase
      .from('user_profiles')
      .select('push_token')
      .not('push_token', 'is', null);

    if (fetchError) throw fetchError;

    const tokens = profiles.map(p => p.push_token).filter(t => t.startsWith('ExponentPushToken'));

    if (tokens.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No tokens found' }), {
        headers: { 'Content-Type': 'application/json', ...CORS }
      });
    }

    // 2. Prepare the Expo Push messages
    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: '🎮 New Nexus Mission!',
      body: `${hostName} invited you to join a game of ${gameType || 'Nexus Arcade'}!`,
      data: { 
        type: 'invite',
        roomId: roomId,
        gameType: gameType,
        url: `https://technonexus.ca/games/${gameType || 'ai-forge'}?join=${roomId}`
      },
    }));

    // 3. Send to Expo Push API
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { 'Content-Type': 'application/json', ...CORS }
    });

  } catch (error) {
    console.error('Push invite error:', error);
    return new Response(JSON.stringify({ error: 'Failed to send invites', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS }
    });
  }
}
