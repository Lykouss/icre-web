'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FullscreenAnnouncement, AnnouncementPayload } from './FullscreenAnnouncement';
import { useToast } from './ToastContext';
import { requestFirebaseNotificationPermission, onMessageListener } from '@/lib/firebase';
import { markNotificationAsRead } from '@/features/core/actions/communications';

export function GlobalNotificationListener() {
  const [announcements, setAnnouncements] = useState<AnnouncementPayload[]>([]);
  const { toast } = useToast();
  const supabaseRef = useRef(createClient());
  const didRunFirebase = useRef(false);
  const didRunNotifications = useRef(false);

  const handleIncomingNotification = useCallback((id: string, comm: any) => {
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
  }, [toast]);

  useEffect(() => {
    if (didRunFirebase.current) return;
    didRunFirebase.current = true;

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
    const supabase = createClient();
    let channel: any = null;

    const setupListener = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fetchPendingAnnouncements = async () => {
        const { data, error } = await supabase
          .from('user_notifications')
          .select(`
            id,
            communications (id, type, title, message, lock_duration_seconds, scheduled_for)
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

      channel = supabase.channel('user-notifications-channel')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'user_notifications', filter: `user_id=eq.${user.id}` },
          async (payload) => {
            const newNotifId = payload.new.id;
            const commId = payload.new.communication_id;

            const { data, error } = await supabase
              .from('communications')
              .select('id, type, title, message, lock_duration_seconds, scheduled_for')
              .eq('id', commId)
              .single();

            if (!error && data) {
              handleIncomingNotification(newNotifId, data);
            }
          }
        )
        .subscribe();
    };

    setupListener();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [handleIncomingNotification]);

  const handleClose = async (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    await markNotificationAsRead(id);
  };

  if (announcements.length === 0) return null;

  return <FullscreenAnnouncement announcement={announcements[0]} onClose={handleClose} />;
}

