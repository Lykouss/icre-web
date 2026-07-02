'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getUserInbox, markNotificationAsRead } from '@/features/core/actions/communications';
import { motion, AnimatePresence } from 'framer-motion';

type InboxItem = {
  id: string;
  is_read: boolean;
  created_at: string;
  communications: {
    id: string;
    type: string;
    title: string;
    message: string;
  };
};

const typeTranslations: Record<string, string> = {
  INFO: 'Informação',
  WARNING: 'Aviso',
  MAINTENANCE: 'Manutenção',
  ALERT: 'Alerta Crítico',
  DIRECT_MESSAGE: 'Mensagem Direta'
};

function InboxView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedId = searchParams.get('id');
  
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingId, setFetchingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchInbox = async () => {
      if (items.length === 0) setLoading(true);
      const { data } = await getUserInbox();
      if (data) {
        setItems(data as any);
        
        // If there's an ID in URL, mark it as read automatically
        const selected = data.find((d: any) => d.id === selectedId);
        if (selected && !selected.is_read) {
          await markNotificationAsRead(selected.id);
          setItems(prev => prev.map(item => item.id === selected.id ? { ...item, is_read: true } : item));
          window.dispatchEvent(new Event('sige_new_inbox_message'));
        }
      }
      setLoading(false);
      setFetchingId(null);
    };
    
    fetchInbox();

    const handleNewMessage = () => {
      fetchInbox();
    };
    
    window.addEventListener('sige_new_inbox_message', handleNewMessage);
    return () => window.removeEventListener('sige_new_inbox_message', handleNewMessage);
  }, [selectedId]);

  const selectedItem = items.find(item => item.id === selectedId);

  const handleSelect = async (id: string, isRead: boolean) => {
    setFetchingId(id);
    router.push(`/minhas-notificacoes?id=${id}`);
    if (!isRead) {
      setItems(prev => prev.map(item => item.id === id ? { ...item, is_read: true } : item));
      await markNotificationAsRead(id);
      window.dispatchEvent(new Event('sige_new_inbox_message'));
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <svg className="w-10 h-10 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[85vh] max-h-[850px] max-w-6xl mx-auto">
      <div className="mb-4">
        <button onClick={() => router.push('/')} className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Voltar para a página inicial
        </button>
      </div>
      
      <div className="flex flex-col md:flex-row flex-1 rounded-3xl overflow-hidden border border-white/10 bg-slate-900/60 backdrop-blur-2xl shadow-2xl shadow-black/50">
        {/* Lista da Esquerda */}
        <div className={`w-full md:w-1/3 md:border-r border-white/10 flex flex-col bg-slate-900/80 ${selectedItem ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-6 border-b border-white/10 shrink-0">
            <h2 className="text-2xl font-black text-white">Notificações</h2>
            <p className="text-slate-400 text-sm mt-1">Seu histórico de avisos e mensagens.</p>
          </div>
          
          <div className="overflow-y-auto flex-1 p-3 space-y-2 custom-scrollbar">
            {items.length === 0 ? (
              <div className="text-center p-8 text-slate-500">Nenhuma notificação recebida.</div>
            ) : (
              items.map(item => {
                const isSelected = item.id === selectedId;
                const isFetchingThis = fetchingId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id, item.is_read)}
                    className={`relative w-full text-left p-4 rounded-2xl transition-all border ${
                      isSelected 
                        ? 'bg-blue-600/10 border-blue-500/30' 
                        : 'bg-white/5 border-transparent hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {!item.is_read && <div className="w-2 h-2 mt-1.5 shrink-0 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />}
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{typeTranslations[item.communications.type] || item.communications.type}</span>
                          <span className="text-[10px] text-slate-500">{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className={`text-sm truncate ${!item.is_read ? 'font-bold text-white' : 'font-medium text-slate-300'}`}>{item.communications.title}</p>
                      </div>
                      
                      {isFetchingThis && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <svg className="w-4 h-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

      {/* Detalhes da Direita */}
      <div className={`w-full md:w-2/3 flex flex-col bg-slate-950/40 relative ${!selectedItem ? 'hidden md:flex' : 'flex'}`}>
        {selectedItem ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedItem.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col h-full"
            >
              <div className="p-6 md:p-8 border-b border-white/5 shrink-0 flex items-center gap-4">
                <button onClick={() => router.push('/minhas-notificacoes')} className="md:hidden p-2 bg-white/5 rounded-xl hover:bg-white/10 text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <div>
                  <div className="flex gap-3 items-center mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md">{typeTranslations[selectedItem.communications.type] || selectedItem.communications.type}</span>
                    <span className="text-xs text-slate-500">{new Date(selectedItem.created_at).toLocaleString()}</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-white">{selectedItem.communications.title}</h2>
                </div>
              </div>
              
              <div className="p-6 md:p-10 flex-1 overflow-y-auto">
                <div className="prose prose-invert max-w-none text-slate-300 whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                  {selectedItem.communications.message}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
            <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
            <p className="text-lg">Selecione uma notificação na lista para ver os detalhes.</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

export default function MinhasNotificacoesPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 pt-24 pb-20">
      <Suspense fallback={
        <div className="h-screen flex items-center justify-center">
          <svg className="w-10 h-10 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>
      }>
        <InboxView />
      </Suspense>
    </div>
  );
}
