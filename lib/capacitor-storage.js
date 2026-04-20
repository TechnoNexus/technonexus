/**
 * Web-compatible storage utility using localStorage.
 * Replaces @capacitor/preferences.
 */
const VAULT_KEY = 'nexus_vault_cache';

export const saveVaultOffline = async (vaultData) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(VAULT_KEY, JSON.stringify(vaultData));
      return true;
    }
  } catch (e) {
    console.error('Error saving vault offline:', e);
  }
  return false;
};

export const getVaultOffline = async () => {
  try {
    if (typeof window !== 'undefined') {
      const value = localStorage.getItem(VAULT_KEY);
      return value ? JSON.parse(value) : [];
    }
  } catch (e) {
    console.error('Error reading vault offline:', e);
  }
  return [];
};

export const clearVaultOffline = async () => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(VAULT_KEY);
    }
  } catch (e) {
    console.error('Error clearing vault offline:', e);
  }
};
