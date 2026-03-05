'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AppRole } from '@/features/core/api/get-current-user';

interface SidebarProps {
  user: {
    id: string;
    fullName: string;
    roles: AppRole[];
    isAdmin: boolean;
    isSysAdmin: boolean;
  };
  flags?: Record<string, boolean>;
}

export function AdminSidebar({ user, flags = {} }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();

  // MÁGICA DO TEMPO REAL: Escuta mudanças no banco de dados
  useEffect(() => {
    const supabase = createClient();
    
    // Liga o "rádio" na frequência da tabela feature_flags
    const channel = supabase
      .channel('realtime_flags')
      .on(
        'postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'feature_flags' }, 
        () => {
          // Quando o banco avisar que mudou, o Next.js recarrega os dados silenciosamente
          router.refresh(); 
        }
      )
      .subscribe();

    // Desliga o rádio se o componente for destruído
    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return (
    <aside 
      className={`bg-slate-900 text-slate-300 flex flex-col shadow-xl z-20 transition-all duration-300 ease-in-out relative shrink-0 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Botão de Retrair/Expandir */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-5 bg-blue-600 text-white rounded-full p-1 shadow-md hover:bg-blue-500 transition-colors z-30"
      >
        <svg 
          className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Cabeçalho do Sidebar (Logo) */}
      <div className={`h-16 flex items-center bg-slate-950 border-b border-slate-800 ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}>
        <Link href="/dashboard" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="relative w-8 h-8 flex-shrink-0">
            <Image 
              src="/logo.svg" 
              alt="Logo ICRE" 
              fill
              className="object-contain brightness-0 invert"
            />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg text-white tracking-wide truncate transition-opacity duration-300">
              SIGE-Web
            </span>
          )}
        </Link>
      </div>

      {/* Links de Navegação */}
      <nav className="flex-1 py-6 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {!isCollapsed && (
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-6">
            Gestão
          </div>
        )}
        
        {/* 1. Dashboard */}
        {flags['module_dashboard'] && (
          <div className="px-3">
            <Link 
              href="/dashboard" 
              className={`flex items-center rounded-lg font-medium transition-colors hover:bg-slate-800 hover:text-white ${
                isCollapsed ? 'justify-center py-3' : 'gap-3 px-3 py-2'
              } text-slate-300`}
              title={isCollapsed ? "Dashboard" : ""}
            >
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
              </svg>
              {!isCollapsed && <span className="truncate">Dashboard</span>}
            </Link>
          </div>
        )}

        {/* 2. Site Público */}
        {flags['module_portal'] && (
          <div className="px-3">
            <Link 
              href="/portal" 
              className={`flex items-center rounded-lg font-medium transition-colors hover:bg-slate-800 hover:text-white ${
                isCollapsed ? 'justify-center py-3' : 'gap-3 px-3 py-2'
              } text-slate-300`}
              title={isCollapsed ? "Site Público" : ""}
            >
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
              </svg>
              {!isCollapsed && <span className="truncate">Site Público</span>}
            </Link>
          </div>
        )}

        {/* 3. Financeiro */}
        {flags['module_finance'] && (
          <div className="px-3">
            <Link 
              href="/financeiro" 
              className={`flex items-center rounded-lg font-medium transition-colors hover:bg-slate-800 hover:text-white ${
                isCollapsed ? 'justify-center py-3' : 'gap-3 px-3 py-2'
              } text-slate-300`}
              title={isCollapsed ? "Financeiro" : ""}
            >
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {!isCollapsed && <span className="truncate">Financeiro</span>}
            </Link>
          </div>
        )}

        {/* 4. Membros */}
        {flags['module_members'] && (
          <div className="px-3">
            <Link 
              href="/membros" 
              className={`flex items-center rounded-lg font-medium transition-colors hover:bg-slate-800 hover:text-white ${
                isCollapsed ? 'justify-center py-3' : 'gap-3 px-3 py-2'
              } text-slate-300`}
              title={isCollapsed ? "Membros" : ""}
            >
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              {!isCollapsed && <span className="truncate">Membros</span>}
            </Link>
          </div>
        )}

        {/* 5. Eventos */}
        {flags['module_events'] && (
          <div className="px-3">
            <Link 
              href="/eventos" 
              className={`flex items-center rounded-lg font-medium transition-colors hover:bg-slate-800 hover:text-white ${
                isCollapsed ? 'justify-center py-3' : 'gap-3 px-3 py-2'
              } text-slate-300`}
              title={isCollapsed ? "Eventos" : ""}
            >
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              {!isCollapsed && <span className="truncate">Eventos</span>}
            </Link>
          </div>
        )}

        {/* 6. Escalas */}
        {flags['module_volunteers'] && (
          <div className="px-3">
            <Link 
              href="/escalas" 
              className={`flex items-center rounded-lg font-medium transition-colors hover:bg-slate-800 hover:text-white ${
                isCollapsed ? 'justify-center py-3' : 'gap-3 px-3 py-2'
              } text-slate-300`}
              title={isCollapsed ? "Escalas" : ""}
            >
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
              </svg>
              {!isCollapsed && <span className="truncate">Escalas</span>}
            </Link>
          </div>
        )}

        {/* 7. Kids */}
        {flags['module_kids'] && (
          <div className="px-3">
            <Link 
              href="/kids" 
              className={`flex items-center rounded-lg font-medium transition-colors hover:bg-slate-800 hover:text-white ${
                isCollapsed ? 'justify-center py-3' : 'gap-3 px-3 py-2'
              } text-slate-300`}
              title={isCollapsed ? "Kids" : ""}
            >
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {!isCollapsed && <span className="truncate">Kids</span>}
            </Link>
          </div>
        )}

        {/* 8. Patrimônio */}
        {flags['module_assets'] && (
          <div className="px-3">
            <Link 
              href="/patrimonio" 
              className={`flex items-center rounded-lg font-medium transition-colors hover:bg-slate-800 hover:text-white ${
                isCollapsed ? 'justify-center py-3' : 'gap-3 px-3 py-2'
              } text-slate-300`}
              title={isCollapsed ? "Patrimônio" : ""}
            >
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
              </svg>
              {!isCollapsed && <span className="truncate">Patrimônio</span>}
            </Link>
          </div>
        )}

        {/* 9. Permissões (NOVA PÁGINA) */}
        {flags['module_permissions'] && (
          <div className="px-3">
            <Link 
              href="/permissoes" 
              className={`flex items-center rounded-lg font-medium transition-colors hover:bg-slate-800 hover:text-white ${
                isCollapsed ? 'justify-center py-3' : 'gap-3 px-3 py-2'
              } text-slate-300`}
              title={isCollapsed ? "Permissões" : ""}
            >
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
              {!isCollapsed && <span className="truncate">Permissões</span>}
            </Link>
          </div>
        )}

        {/* Categoria: Sistema (Só para SysAdmin) */}
        {user.isSysAdmin && (
          <>
            {!isCollapsed ? (
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-8 mb-4 px-6">
                Sistema
              </div>
            ) : (
              <div className="w-full h-px bg-slate-800 my-4"></div>
            )}
            
            <div className="px-3">
              <Link 
                href="/sysadmin" 
                className={`flex items-center rounded-lg font-medium transition-colors hover:bg-slate-800 hover:text-white ${
                  isCollapsed ? 'justify-center py-3' : 'gap-3 px-3 py-2'
                } text-slate-300`}
                title={isCollapsed ? "Configurações" : ""}
              >
                <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                {!isCollapsed && <span className="truncate">Configurações</span>}
              </Link>
            </div>
          </>
        )}
      </nav>

      {/* Rodapé do Sidebar */}
      <div className={`bg-slate-950 border-t border-slate-800 ${isCollapsed ? 'p-3 flex justify-center' : 'p-4'}`}>
        <Link 
          href="/" 
          className={`flex items-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${
            isCollapsed ? 'p-2' : 'gap-3 px-3 py-2'
          }`}
          title={isCollapsed ? "Voltar para o Site" : ""}
        >
          <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          {!isCollapsed && <span className="truncate">Voltar para o Site</span>}
        </Link>
      </div>
    </aside>
  );
}