'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function useAdminOnboarding() {
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_step')
        .eq('id', user.id)
        .single();

      const step = profile?.onboarding_step;

      if (step === 'accept_admin_terms') router.push('/termos-admin');
      else if (step === 'create_pin') router.push('/criar-pin');
    };

    check();
  }, [router]);
}