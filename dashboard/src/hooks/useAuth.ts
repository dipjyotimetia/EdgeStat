import { useState, useCallback } from 'react';

const MASTER_KEY_STORAGE = 'edgestat_master_key';
const SITE_ID_STORAGE = 'edgestat_site_id';

export function useAuth() {
  const [masterKey, setMasterKeyState] = useState<string | null>(
    () => localStorage.getItem(MASTER_KEY_STORAGE),
  );
  const [siteId, setSiteIdState] = useState<string | null>(
    () => localStorage.getItem(SITE_ID_STORAGE),
  );

  const setMasterKey = useCallback((key: string) => {
    localStorage.setItem(MASTER_KEY_STORAGE, key);
    setMasterKeyState(key);
  }, []);

  const setSiteId = useCallback((id: string) => {
    localStorage.setItem(SITE_ID_STORAGE, id);
    setSiteIdState(id);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(MASTER_KEY_STORAGE);
    localStorage.removeItem(SITE_ID_STORAGE);
    setMasterKeyState(null);
    setSiteIdState(null);
  }, []);

  return {
    masterKey,
    siteId,
    isAuthenticated: !!masterKey && !!siteId,
    setMasterKey,
    setSiteId,
    logout,
  };
}
