import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AppNotification } from '@/types';
import { runResilientRequest } from '@/lib/resilientRequest';
import { useAuth } from '@/contexts/AuthContext';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return [];
    }

    setLoading(true);

    try {
      const { data, error } = await runResilientRequest(
        (signal) => supabase
          .from('notifications')
          .select('*')
          .eq('target_user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20)
          .abortSignal(signal),
        {
          label: 'notifications fetch',
          timeoutMessage: 'Timeout durante il caricamento delle notifiche',
        }
      );

      if (error) {
        throw error;
      }

      const nextNotifications = (data ?? []) as AppNotification[];
      setNotifications(nextNotifications);
      return nextNotifications;
    } catch (error) {
      console.error('Notifications fetch failed', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    const readAt = new Date().toISOString();

    const { error } = await runResilientRequest(
      (signal) => supabase
        .from('notifications')
        .update({ read_at: readAt })
        .eq('id', notificationId)
        .eq('target_user_id', user?.id ?? '')
        .abortSignal(signal),
      {
        label: 'notification mark read',
        timeoutMessage: 'Timeout durante l\'aggiornamento della notifica',
      }
    );

    if (!error) {
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId ? { ...notification, read_at: readAt } : notification
        )
      );
    }

    return { error };
  };

  const unreadCount = notifications.filter((notification) => !notification.read_at).length;

  return {
    notifications,
    loading,
    unreadCount,
    fetchNotifications,
    markAsRead,
  };
}
