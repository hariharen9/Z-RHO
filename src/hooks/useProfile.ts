// ============================================================
// ZRHO — Profile Hooks (TanStack Query)
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Profile } from '@/types/database.types';

const PROFILE_KEY = 'profile';

/**
 * Fetch the current user's profile.
 */
export function useProfile() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: [PROFILE_KEY, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user,
  });
}

/**
 * Update the current user's profile.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (updates: {
      full_name?: string;
      avatar_url?: string;
      default_currency?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([PROFILE_KEY, data.id], data);
    },
  });
}

/**
 * Delete user account and all data.
 */
export function useDeleteAccount() {
  const signOut = useAuthStore((s) => s.signOut);

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('delete_account');
      if (error) throw error;
      await signOut();
    },
  });
}
