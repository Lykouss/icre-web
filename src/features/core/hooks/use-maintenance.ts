'use client'

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export interface SiteMaintenance {
  is_portal_maintenance: boolean;
  is_sige_maintenance: boolean;
  block_signups: boolean;
  block_logins: boolean;
  scheduled_at: string | null;
  scheduled_portal: boolean;
  scheduled_sige: boolean;
  auto_activate_scheduled: boolean;
  auto_deactivate_expected: boolean;
  expected_end_at: string | null;
  message: string;
}

export function useMaintenance() {
  const [maintenance, setMaintenance] = useState<SiteMaintenance | null>(null);
  const [isSysAdmin, setIsSysAdmin] = useState(false);
  const [timeOffset, setTimeOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function fetchMaintenance() {
      try {
        // Obter hora oficial do servidor
        fetch(window.location.origin, { method: 'HEAD' }).then(res => {
          const dateHeader = res.headers.get('Date');
          if (dateHeader) {
            setTimeOffset(new Date(dateHeader).getTime() - Date.now());
          }
        }).catch(() => {});

        const { data, error } = await supabase
          .from('site_maintenance')
          .select('*')
          .eq('id', 1)
          .single();

        if (!error && data) {
          setMaintenance(data);
        }

        // Check if user is sysadmin
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);
          
          if (roles?.some(r => r.role === 'SYSADMIN' || r.role === 'CHURCH_ADMIN')) {
            setIsSysAdmin(true);
          }
        }
      } catch (err) {
        console.error('Failed to fetch maintenance status:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMaintenance();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('public:site_maintenance')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'site_maintenance',
          filter: 'id=eq.1'
        },
        (payload) => {
          setMaintenance(payload.new as SiteMaintenance);
          router.refresh(); // Opcional: forçar revalidação
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [router]);

  return { maintenance, isSysAdmin, loading, timeOffset };
}
