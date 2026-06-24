'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { MemberRow } from '@/app/(admin)/membros/page';
import { AdminEmptyState } from '@/features/core/components/AdminEmptyState';
import { AdminBadge } from '@/features/core/components/AdminUI';

const STATUS_OPTIONS = ['Todos', 'Membro', 'Visitante', 'Congregante', 'Inativo', 'Afastado', 'Admin'];

const STATUS_CONFIG: Record<string, { color: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'slate'; dot?: boolean }> = {
  Membro:      { color: 'green',  dot: true },
  Visitante:   { color: 'amber',  dot: true },
  Congregante: { color: 'blue',   dot: true },
  Inativo:     { color: 'slate',  dot: true },
  Afastado:    { color: 'red',    dot: true },
  Admin:       { color: 'purple', dot: true },
};

interface MembersTableProps { initialMembers: MemberRow[] }

function Avatar({ name }: { name: string }) {
  const initials = name.trim().split(/\s+/).slice(0,2).map(w => w[0]).join('').toUpperCase();
  const hue = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold text-white shrink-0"
      style={{
        background: `linear-gradient(135deg, hsl(${hue},60%,35%) 0%, hsl(${hue+30},60%,25%) 100%)`,
        boxShadow: `0 0 0 1.5px hsl(${hue},40%,30%)`,
      }}
    >
      {initials}
    </div>
  );
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
    const matchesSearch = !term || m.full_name.toLowerCase().includes(term) || m.phone?.toLowerCase().includes(term) || m.address?.toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'Todos' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--admin-border)', background: 'var(--admin-surface)' }}>

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4" style={{ borderBottom: '1px solid var(--admin-border)' }}>
        {/* Search */}
        <div className="relative flex-1 w-full min-w-0">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, telefone ou endereço…"
            className="w-full h-9 pl-9 pr-4 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
            style={{ background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)' }}
            onFocus={e => { e.target.style.borderColor = 'rgba(37,99,235,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--admin-border)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto shrink-0 pb-0.5">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="px-3 h-8 rounded-xl text-[12px] font-semibold whitespace-nowrap transition-all duration-150"
              style={statusFilter === s
                ? { background: 'var(--admin-accent)', color: '#fff' }
                : { background: 'var(--admin-surface-alt)', color: 'var(--admin-text-secondary)', border: '1px solid var(--admin-border)' }
              }
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Count bar ── */}
      <div className="px-5 py-2.5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-surface-alt)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--admin-text-secondary)' }}>
          {filtered.length !== initialMembers.length
            ? `${filtered.length} de ${initialMembers.length} pessoas`
            : `${initialMembers.length} pessoas`}
        </p>
        {search && (
          <button onClick={() => setSearch('')} className="text-[11px] text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Limpar busca
          </button>
        )}
      </div>

      {/* ── Table ── */}
      {filtered.length === 0 ? (
        <AdminEmptyState
          icon={search ? 'search' : 'members'}
          title={search ? 'Nenhum resultado encontrado' : 'Nenhuma pessoa cadastrada'}
          description={search ? `Nenhum membro corresponde a "${search}". Tente outros termos.` : 'Clique em "Novo Registro" para adicionar a primeira pessoa.'}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--admin-border)' }}>
                {['Nome', 'Contato', 'Célula', 'Status', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--admin-text-muted)', background: 'var(--admin-surface-alt)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((member, idx) => (
                <tr
                  key={member.id}
                  className="group transition-colors duration-100"
                  style={{
                    borderBottom: idx < filtered.length - 1 ? '1px solid var(--admin-border)' : 'none',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--admin-surface-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={member.full_name} />
                      <div>
                        <p className="font-semibold text-slate-200 leading-tight">{member.full_name}</p>
                        {member.is_admin_only && (
                          <p className="text-[10px] font-semibold text-purple-400 mt-0.5">{member.system_role}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5" style={{ color: 'var(--admin-text-secondary)' }}>
                    {member.phone
                      ? <span className="font-mono text-xs">{member.phone}</span>
                      : <span style={{ color: 'var(--admin-text-muted)' }}>—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {member.cell_name ? (
                      <AdminBadge color="blue">{member.cell_name}</AdminBadge>
                    ) : (
                      <span style={{ color: 'var(--admin-text-muted)' }}>—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <AdminBadge
                      color={STATUS_CONFIG[member.status]?.color ?? 'slate'}
                      dot={STATUS_CONFIG[member.status]?.dot}
                    >
                      {member.status}
                    </AdminBadge>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {member.is_admin_only ? (
                      <span className="text-[11px] italic" style={{ color: 'var(--admin-text-muted)' }}>Somente leitura</span>
                    ) : (
                      <Link
                        href={`/membros/${member.id}`}
                        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Ver perfil
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}