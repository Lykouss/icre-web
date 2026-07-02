'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FullscreenAnnouncement, AnnouncementPayload } from './FullscreenAnnouncement';
import { useToast } from './ToastContext';
import { requestFirebaseNotificationPermission, onMessageListener } from '@/lib/firebase';
import { markNotificationAsRead } from '@/features/core/actions/communications';

export function GlobalNotificationListener() {
  const [announcements, setAnnouncements] = useState<AnnouncementPayload[]>([]);
  const { toast } = useToast();
  const supabase = createClient();

  const handleIncomingNotification = (id: string, comm: any) => {
    const isFuture = comm.scheduled_for && new Date(comm.scheduled_for).getTime() > Date.now();
    
    const display = () => {
      if (comm.type !== 'DIRECT_MESSAGE') {
        setAnnouncements(prev => [...prev, {
          id: id,
          type: comm.type as any,
          title: comm.title,
          message: comm.message,
          lockDurationSeconds: comm.lock_duration_seconds || 0,
        }]);
        
        if (Notification.permission === 'granted') {
          new Notification(comm.title, { body: 'Um aviso obrigatório bloqueou a sua tela.' });
        }
      } else {
        toast('info', `Mensagem Direta: ${comm.title}`);
        if (Notification.permission === 'granted') {
          new Notification(comm.title, { body: comm.message });
        }
        window.dispatchEvent(new Event('sige_new_inbox_message'));
      }
    };

    if (isFuture) {
      const delay = new Date(comm.scheduled_for).getTime() - Date.now();
      setTimeout(display, delay);
    } else {
      display();
    }
  };

  useEffect(() => {
    // 1. Ask for Firebase permission
    requestFirebaseNotificationPermission().then((token) => {
      if (token) {
        console.log('Firebase Push Token generated');
      }
    });

    // 2. Listen to foreground FCM messages
    onMessageListener().then((payload: any) => {
      const title = payload?.notification?.title || 'Novo Aviso SIGE';
      const body = payload?.notification?.body || '';
      toast('info', `${title}: ${body}`);
      
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/icon.png' });
      }
    }).catch(err => console.log('failed: ', err));
  }, [toast]);

  useEffect(() => {
    const fetchPendingAnnouncements = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_notifications')
        .select(`
          id,
          communications (
            id, type, title, message, lock_duration_seconds, scheduled_for
          )
        `)
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (data && !error) {
        for (const item of data) {
          const comm = Array.isArray(item.communications) ? item.communications[0] : item.communications;
          if (comm) {
             handleIncomingNotification(item.id, comm);
          }
        }
      }
    };

    fetchPendingAnnouncements();

    const channel = supabase.channel('user-notifications-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_notifications' },
        async (payload) => {
          const newNotifId = payload.new.id;
          const commId = payload.new.communication_id;

          const { data, error } = await supabase
            .from('communications')
            .select('*')
            .eq('id', commId)
            .single();

          if (data && !error) {
            // Only process if it's targeted at the currently logged in user
            // We check this by querying auth.getUser, but we can also just let RLS handle it (the insert event might fire for all, wait)
            // Postgres changes don't fire for rows we can't see? Actually they do unless we filter by RLS or if RLS is enforced on Realtime.
            // But we already set RLS on user_notifications and we only subscribe to the ones we own. Wait, RLS on Realtime is true by default?
            // To be safe, we check if payload.new.user_id === currentUser.id
            const { data: { user } } = await supabase.auth.getUser();
            if (user && payload.new.user_id === user.id) {
              handleIncomingNotification(newNotifId, data);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, toast]);

  const handleClose = async (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    await markNotificationAsRead(id);
  };

  if (announcements.length === 0) return null;

  return <FullscreenAnnouncement announcement={announcements[0]} onClose={handleClose} />;
}
