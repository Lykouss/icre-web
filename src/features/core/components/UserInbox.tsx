'use client';

import React, { useEffect, useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useRouter } from 'next/navigation';
import { getUserInbox, markNotificationAsRead } from '../actions/communications';
import { renderMessageWithLinks } from '@/lib/render-message';
import { AnnouncementPayload } from './FullscreenAnnouncement';

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

export function UserInbox() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const fetchInbox = async () => {
    const { data } = await getUserInbox();
    if (data) {
      setItems(data as any);
      setUnreadCount(data.filter(d => !d.is_read).length);
    }
  };

  useEffect(() => {
    fetchInbox();
    
    const handleNewMessage = () => fetchInbox();
    window.addEventListener('sige_new_inbox_message', handleNewMessage);
    
    return () => window.removeEventListener('sige_new_inbox_message', handleNewMessage);
  }, []);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      fetchInbox(); // Refresh on open
    }
  };

  const handleRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    // Optimistic update
    setItems(prev => prev.map(item => item.id === id ? { ...item, is_read: true } : item));
    setUnreadCount(prev => Math.max(0, prev - 1));
    await markNotificationAsRead(id);
  };

  return (
    <DropdownMenu.Root open={open} onOpenChange={handleOpenChange} modal={false}>
      <DropdownMenu.Trigger asChild>
        <button className="relative flex items-center justify-center w-10 h-10 rounded-full transition-all focus:outline-none hover:bg-white/5 data-[state=open]:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full shadow-lg border-2 border-[#0f172a]"></span>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={16}
          className="z-50 w-80 max-h-[28rem] rounded-2xl shadow-2xl overflow-y-auto overflow-x-hidden portal-scroll border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
        >
          <div className="sticky top-0 px-4 py-3 border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md z-10 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Caixa de Entrada</h3>
            {unreadCount > 0 && <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">{unreadCount} não lidas</span>}
          </div>

          <div className="flex flex-col">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-500 text-sm">
                Nenhuma notificação encontrada.
              </div>
            ) : (
              items.slice(0, 5).map((item) => (
                <DropdownMenu.Item
                  key={item.id}
                  onSelect={(e) => {
                    e.preventDefault();
                    handleRead(item.id, item.is_read);
                    setOpen(false);
                    router.push(`/minhas-notificacoes?id=${item.id}`);
                  }}
                  className={`relative p-4 outline-none cursor-pointer transition-colors border-b border-black/5 dark:border-white/5 last:border-b-0 hover:bg-slate-50 dark:hover:bg-white/5 ${!item.is_read ? 'bg-blue-500/5' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {!item.is_read && <div className="w-2 h-2 mt-1.5 shrink-0 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">{typeTranslations[item.communications.type] || item.communications.type}</span>
                        <span className="text-[10px] text-slate-500">{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className={`text-sm ${!item.is_read ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-600 dark:text-slate-300'}`}>{item.communications.title}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-3 leading-relaxed">{renderMessageWithLinks(item.communications.message)}</p>
                    </div>
                  </div>
                </DropdownMenu.Item>
              ))
            )}
            
            {items.length > 0 && (
              <div className="p-2 border-t border-black/5 dark:border-white/5">
                <button
                  onClick={() => {
                    setOpen(false);
                    router.push('/minhas-notificacoes');
                  }}
                  className="w-full text-center text-xs font-bold text-blue-400 hover:text-blue-300 py-2 rounded-xl hover:bg-blue-500/10 transition-colors"
                >
                  Ver todas as notificações
                </button>
              </div>
            )}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
