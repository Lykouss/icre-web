// src/features/portal/components/AdminSystemButton.tsx

'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export function AdminSystemButton() {
  const [isAdmin, setIsAdmin]   = useState(false);
  const [visible, setVisible]   = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let userId: string | null = null;

    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;

      // Verifica cargo E onboarding completo
      const [{ data: roleData }, { data: profileData }] = await Promise.all([
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['LEADER', 'FINANCE_ADMIN', 'CHURCH_ADMIN', 'SYSADMIN'])
          .limit(1)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('onboarding_step')
          .eq('id', user.id)
          .single(),
      ]);

      // Só mostra se tem cargo E onboarding completo
      if (roleData && profileData?.onboarding_step === 'done') {
        setIsAdmin(true);
        setTimeout(() => setVisible(true), 500);
      }
    };

    check();
  }, []);

  if (!isAdmin) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <Link
        href="/dashboard"
        className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 hover:border-slate-600 transition-all hover:-translate-y-0.5 active:translate-y-0"
      >
        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h4M16 17l5-5m0 0l-5-5m5 5H9" />
        </svg>
        Ir para o sistema
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      </Link>
    </div>
  );
}