import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AppRole, UserProfile } from '@/types';

const PROFILES_CACHE_TTL_MS = 5 * 60_000;

type AdminUserPayload = {
  full_name: string;
  email: string;
  role: AppRole;
  is_active: boolean;
  password?: string;
};

let profilesCache: UserProfile[] | null = null;
let profilesCacheAt = 0;

async function loadProfilesFromApi() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const nextData = (data ?? []) as UserProfile[];
  profilesCache = nextData;
  profilesCacheAt = Date.now();
  return nextData;
}

export function invalidateProfilesCache() {
  profilesCache = null;
  profilesCacheAt = 0;
}

async function invokeAdminUsers<T>(body: Record<string, unknown>) {
  const { data, error, response } = await supabase.functions.invoke<T>('admin-users', { body });

  if (!error) return { data, error: null };

  const res: Response | undefined =
    (response instanceof Response ? response : undefined) ??
    ((error as Record<string, unknown>).context instanceof Response
      ? ((error as Record<string, unknown>).context as Response)
      : undefined);

  if (res) {
    try {
      const text = await res.text();
      console.error('[admin-users] HTTP', res.status, text);
      try {
        const payload = JSON.parse(text) as Record<string, unknown>;
        if (payload?.error) {
          return { data, error: new Error(String(payload.error)) };
        }
      } catch {
        // not JSON
      }
      return { data, error: new Error(`HTTP ${res.status}: ${text}`) };
    } catch {
      // body already consumed
    }
  }

  return { data, error };
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(!profilesCache);

  const fetchProfiles = useCallback(async (force = false) => {
    const hasFreshCache = profilesCache && Date.now() - profilesCacheAt < PROFILES_CACHE_TTL_MS;

    if (!force && profilesCache) {
      setProfiles(profilesCache);
      setLoading(false);
      if (hasFreshCache) return profilesCache;
    } else {
      setLoading(true);
    }

    const freshProfiles = await loadProfilesFromApi();
    setProfiles(freshProfiles);
    setLoading(false);
    return freshProfiles;
  }, []);

  useEffect(() => {
    fetchProfiles().catch((error) => {
      console.error('Profiles fetch error', error);
      setLoading(false);
    });
  }, [fetchProfiles]);

  const createUser = async (payload: AdminUserPayload & { password: string }) => {
    const { data, error } = await invokeAdminUsers<{ profile: UserProfile }>({
      action: 'create_user',
      ...payload,
    });
    if (!error) {
      invalidateProfilesCache();
      await fetchProfiles(true);
    }
    return { data, error };
  };

  const updateUser = async (id: string, payload: AdminUserPayload) => {
    const { data, error } = await invokeAdminUsers<{ profile: UserProfile }>({
      action: 'update_user',
      user_id: id,
      ...payload,
    });
    if (!error) {
      invalidateProfilesCache();
      await fetchProfiles(true);
    }
    return { data, error };
  };

  return {
    profiles,
    loading,
    fetchProfiles,
    createUser,
    updateUser,
  };
}
