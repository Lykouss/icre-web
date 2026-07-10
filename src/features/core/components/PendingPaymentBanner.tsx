'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { usePathname } from 'next/navigation';

interface PendingReg {
  id: string;
  event_id: string;
  events: { title: string } | { title: string }[] | null;
}

export function PendingPaymentBanner() {
  const [pending, setPending] = useState<PendingReg | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    async function checkPending() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const memberId = member?.id;
      if (!memberId) return;

      const { data } = await supabase
        .from('event_registrations')
        .select('id, event_id, events(title)')
        .eq('member_id', memberId)
        .eq('status', 'pendente_pagamento')
        .limit(1)
        .maybeSingle();

      if (data) {
        setPending(data as PendingReg);
      } else {
        // Tenta fallback por email
        const { data: fallbackData } = await supabase
          .from('event_registrations')
          .select('id, event_id, events(title)')
          .eq('email', user.email)
          .eq('status', 'pendente_pagamento')
          .limit(1)
          .maybeSingle();
        
        if (fallbackData) {
          setPending(fallbackData as PendingReg);
        }
      }
    }
    checkPending();
  }, [pathname]); // re-check if user navigates (so if they pay, it vanishes)

  if (!pending) return null;
  
  // Se já estivermos na página de pagamento específica, não precisa exibir o banner global
  if (pathname.includes(`/agenda/${pending.event_id}/pagamento/${pending.id}`)) {
    return null;
  }

  const eventTitle = Array.isArray(pending.events) 
    ? pending.events[0]?.title 
    : pending.events?.title || 'Evento';

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-3 text-sm font-medium border-b border-amber-600/20 shadow-md relative z-50">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Você tem um pagamento pendente para o evento <strong>{eventTitle}</strong>.
          </span>
        </div>
        <Link 
          href={`/agenda/${pending.event_id}/pagamento/${pending.id}`}
          className="bg-amber-950 text-amber-400 hover:bg-amber-900 hover:text-amber-300 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap"
        >
          Prosseguir com o pagamento
        </Link>
      </div>
    </div>
  );
}
