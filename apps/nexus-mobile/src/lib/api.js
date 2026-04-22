export const getApiUrl = (path) => {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://technonexus.ca';
  return `${baseUrl}${path}`;
};
