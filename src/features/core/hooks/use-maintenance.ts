'use client'

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

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
  const [loading, setLoading] = useState(true);
  const didRun = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (didRun.current) return;
    didRun.current = true;

    const supabase = createClient();

    async function fetchMaintenance() {
      try {
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

    fetchMaintenance();

    // Polling em vez de Realtime para não estourar limite do Supabase Free Tier
    const interval = setInterval(fetchMaintenance, 60000);

    return () => clearInterval(interval);
  }, []);

  return { maintenance, isSysAdmin, loading };
}
