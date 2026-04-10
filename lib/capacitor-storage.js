import { Preferences } from '@capacitor/preferences';

const VAULT_KEY = 'nexus_vault_cache';

export const saveVaultOffline = async (vaultData) => {
  try {
    await Preferences.set({
      key: VAULT_KEY,
      value: JSON.stringify(vaultData),
    });
    return true;
  } catch (e) {
    console.error('Error saving vault offline:', e);
    return false;
  }
};

export const getVaultOffline = async () => {
  try {
    const { value } = await Preferences.get({ key: VAULT_KEY });
    return value ? JSON.parse(value) : [];
  } catch (e) {
    console.error('Error reading vault offline:', e);
    return [];
  }
};

export const clearVaultOffline = async () => {
  try {
    await Preferences.remove({ key: VAULT_KEY });
  } catch (e) {
    console.error('Error clearing vault offline:', e);
  }
};
