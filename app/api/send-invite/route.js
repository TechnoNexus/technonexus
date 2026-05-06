import { supabase } from '../../../lib/supabase';

export const runtime = 'edge';

const CORS = {
  'Access-Control-Allow-Origin': 'https://technonexus.ca',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}

export async function POST(req) {
  try {
    const { hostName, roomId, gameType, targetUserIds } = await req.json();

    if (!hostName || !roomId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS }
      });
    }

    if (!targetUserIds || !Array.isArray(targetUserIds) || targetUserIds.length === 0) {
      return new Response(JSON.stringify({ error: 'targetUserIds is required and must be a non-empty array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS }
      });
    }

    // 1. Fetch push tokens for specific target users
    const { data: profiles, error: fetchError } = await supabase
      .from('user_profiles')
      .select('push_token')
      .in('id', targetUserIds)
      .not('push_token', 'is', null);

    if (fetchError) throw fetchError;

    const tokens = profiles.map(p => p.push_token).filter(t => t.startsWith('ExponentPushToken'));

    if (tokens.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No tokens found' }), {
        headers: { 'Content-Type': 'application/json', ...CORS }
      });
    }

    const gameSlug = (gameType || 'ai-forge').toLowerCase().replace(/\s+/g, '-');

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
        url: `https://technonexus.ca/games/${gameSlug}?join=${roomId}`
      },
    }));

    // 3. Send to Expo Push API in chunks of 100
    const chunkSize = 100;
    const chunks = [];
    for (let i = 0; i < messages.length; i += chunkSize) {
      chunks.push(messages.slice(i, i + chunkSize));
    }

    const results = [];
    for (const chunk of chunks) {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
        },
        body: JSON.stringify(chunk),
      });
      const result = await response.json();
      results.push(result);
    }

    return new Response(JSON.stringify({ success: true, results }), {
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
