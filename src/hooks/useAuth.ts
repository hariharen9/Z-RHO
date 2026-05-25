// ============================================================
// ZRHO — useAuth hook
// ============================================================

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * Convenience hook that initializes auth on mount and returns auth state.
 */
export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    if (!store.initialized) {
      store.initialize();
    }
  }, [store.initialized]);

  return store;
}
