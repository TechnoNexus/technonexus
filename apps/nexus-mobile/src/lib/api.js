export const getApiUrl = (path) => {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://technonexus.ca';
  return `${baseUrl}${path}`;
};

export const sendRoomInvite = async (hostName, roomId, gameType, targetUserIds = []) => {
  try {
    const response = await fetch(getApiUrl('/api/send-invite'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostName, roomId, gameType, targetUserIds })
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to send invite:', error);
    return { error: true, details: error.message };
  }
};
