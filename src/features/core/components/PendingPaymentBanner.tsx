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
    let channel: ReturnType<typeof createClient>['channel'] | null = null;
    
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

      let activePending = data as PendingReg | null;

      if (!activePending) {
        // Tenta fallback por email
        const { data: fallbackData } = await supabase
          .from('event_registrations')
          .select('id, event_id, events(title)')
          .eq('email', user.email)
          .eq('status', 'pendente_pagamento')
          .limit(1)
          .maybeSingle();
        
        if (fallbackData) {
          activePending = fallbackData as PendingReg;
        }
      }
      
      setPending(activePending);

      if (activePending) {
        // Subscribe to real-time updates for this registration
        channel = supabase.channel(`payment_status_${activePending.id}`)
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'event_registrations', filter: `id=eq.${activePending.id}` },
            (payload) => {
              if (payload.new.status !== 'pendente_pagamento') {
                setPending(null);
              }
            }
          )
          .subscribe();
      }
    }
    
    checkPending();
    
    return () => {
      if (channel) {
        const supabase = createClient();
        supabase.removeChannel(channel);
      }
    };
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
    <div className="fixed bottom-0 left-0 right-0 bg-amber-500 text-amber-950 px-4 py-3 text-sm font-medium border-t border-amber-600/20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-[100] animate-in slide-in-from-bottom-full duration-300">
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
