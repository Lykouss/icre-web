'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { MemberRow } from '@/app/(admin)/membros/page';

const STATUS_OPTIONS = ['Todos', 'Membro', 'Visitante', 'Inativo', 'Afastado', 'Admin'];

const STATUS_STYLES: Record<string, string> = {
  Membro:    'bg-green-100 text-green-700',
  Visitante: 'bg-amber-100 text-amber-700',
  Inativo:   'bg-slate-100 text-slate-500',
  Afastado:  'bg-orange-100 text-orange-700',
  Admin:     'bg-purple-100 text-purple-700',
};

interface MembersTableProps {
  initialMembers: MemberRow[];
}

export function MembersTable({ initialMembers }: MembersTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('realtime_members')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => router.refresh())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [router]);

  const filtered = initialMembers.filter(m => {
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      m.full_name.toLowerCase().includes(term) ||
      m.phone?.toLowerCase().includes(term) ||
      m.address?.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === 'Todos' || m.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="bg-white dark:bg-slate-800 p-4 rounded-t-2xl border border-slate-200 border-b-0 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar por nome, contato ou endereço..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-colors text-sm"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === s
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 rounded-b-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400 font-medium">
            {filtered.length === initialMembers.length
              ? `${initialMembers.length} pessoas`
              : `${filtered.length} de ${initialMembers.length} pessoas`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Contato</th>
                <th className="px-6 py-4">Célula</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                        <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <p className="font-semibold text-slate-600">Nenhuma pessoa encontrada</p>
                      <p className="text-xs">Tente ajustar os filtros ou cadastre uma nova pessoa.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(member => (
                  <tr key={member.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0">
                          {member.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{member.full_name}</p>
                          {member.is_admin_only && (
                            <p className="text-xs text-purple-600 font-medium">{member.system_role}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{member.phone ?? '—'}</td>
                    <td className="px-6 py-4">
                      {member.cell_name ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-100 dark:border-blue-900/30">
                          {member.cell_name}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[member.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {member.is_admin_only ? (
                        <span className="text-xs text-slate-400 italic">Somente leitura</span>
                      ) : (
                        <Link
                          href={`/membros/${member.id}`}
                          className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 font-semibold text-sm transition-colors"
                        >
                          Ver Perfil
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}