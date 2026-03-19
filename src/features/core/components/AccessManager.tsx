'use client'

import React, { useState, useTransition } from 'react';
import { grantAdminRole, revokeAdminRole, UserWithRoles } from '@/features/core/actions/admin-access';
import { AppRole } from '@/features/core/api/get-current-user';
import { useToast } from '@/features/core/components/ToastContext';

const ROLE_LABELS: Record<string, string> = {
  SYSADMIN:     'SysAdmin',
  CHURCH_ADMIN: 'Administrador',
  FINANCE_ADMIN:'Financeiro',
  LEADER:       'Líder',
};

const ROLE_COLORS: Record<string, string> = {
  SYSADMIN:     'bg-purple-100 text-purple-700',
  CHURCH_ADMIN: 'bg-blue-100 text-blue-700',
  FINANCE_ADMIN:'bg-emerald-100 text-emerald-700',
  LEADER:       'bg-amber-100 text-amber-700',
};

const ONBOARDING_LABELS: Record<string, { label: string; color: string }> = {
  admin_notification: { label: 'Aguardando notificação', color: 'bg-amber-100 text-amber-700'   },
  fill_admin_profile: { label: 'Preenchendo perfil',     color: 'bg-blue-100 text-blue-700'     },
  accept_admin_terms: { label: 'Aceitando termos',       color: 'bg-indigo-100 text-indigo-700' },
  create_pin:         { label: 'Criando PIN',            color: 'bg-violet-100 text-violet-700' },
  done:               { label: 'Ativo',                  color: 'bg-green-100 text-green-700'   },
};

const GRANTABLE_ROLES: AppRole[] = ['CHURCH_ADMIN', 'FINANCE_ADMIN', 'LEADER'];

interface AccessManagerProps {
  users: UserWithRoles[];
}

export function AccessManager({ users }: AccessManagerProps) {
  const { toast, dismiss } = useToast();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState<'all' | 'admins' | 'members'>('all');
  const [grantingFor, setGrantingFor] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>('CHURCH_ADMIN');

  const filtered = users.filter(u => {
    const term = search.toLowerCase();
    const matchesSearch = !term ||
      u.full_name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term);

    const isAdmin = u.roles.some(r =>
      ['CHURCH_ADMIN', 'FINANCE_ADMIN', 'LEADER', 'SYSADMIN'].includes(r)
    );
    const matchesFilter =
      filter === 'all'    ? true :
      filter === 'admins' ? isAdmin :
      !isAdmin;

    return matchesSearch && matchesFilter;
  });

  const handleGrant = (userId: string) => {
    startTransition(async () => {
      const id = toast('loading', 'Concedendo cargo...');
      const result = await grantAdminRole(userId, selectedRole);
      dismiss(id);
      if (result.error) {
        toast('error', result.error);
      } else {
        toast('success', 'Cargo concedido. O usuário será notificado ao acessar o sistema.');
        setGrantingFor(null);
      }
    });
  };

  const handleRevoke = (userId: string, role: AppRole, name: string) => {
    if (!confirm(`Revogar o cargo "${ROLE_LABELS[role] ?? role}" de ${name}?`)) return;
    startTransition(async () => {
      const id = toast('loading', 'Revogando cargo...');
      const result = await revokeAdminRole(userId, role);
      dismiss(id);
      if (result.error) toast('error', result.error);
      else toast('success', 'Cargo revogado com sucesso.');
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'admins', 'members'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                filter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'admins' ? 'Administradores' : 'Membros'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-100">
          <p className="text-xs text-slate-400 font-medium">{filtered.length} usuários</p>
        </div>

        <div className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400 text-sm">
              Nenhum usuário encontrado.
            </div>
          ) : (
            filtered.map(u => {
              const isAdmin = u.roles.some(r =>
                ['CHURCH_ADMIN', 'FINANCE_ADMIN', 'LEADER', 'SYSADMIN'].includes(r)
              );
              const isSysAdmin = u.roles.includes('SYSADMIN');
              const onboarding = u.onboarding_step
                ? ONBOARDING_LABELS[u.onboarding_step]
                : null;
              const pendingOnboarding =
                u.onboarding_step &&
                u.onboarding_step !== 'done';

              return (
                <div key={u.id} className="px-6 py-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900 text-sm">{u.full_name}</p>
                      {pendingOnboarding && onboarding && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${onboarding.color}`}>
                          {onboarding.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{u.email}</p>
                    {u.church_role && (
                      <p className="text-xs text-slate-500 mt-0.5">{u.church_role}</p>
                    )}

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {u.roles.length > 0 ? u.roles.map(role => (
                        <span
                          key={role}
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${ROLE_COLORS[role] ?? 'bg-slate-100 text-slate-600'}`}
                        >
                          {ROLE_LABELS[role] ?? role}
                          {role !== 'SYSADMIN' && (
                            <button
                              onClick={() => handleRevoke(u.id, role as AppRole, u.full_name)}
                              disabled={isPending}
                              className="ml-0.5 hover:text-red-600 transition-colors disabled:opacity-50"
                              title="Revogar cargo"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </span>
                      )) : (
                        <span className="text-xs text-slate-400 italic">Sem cargo administrativo</span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {!isSysAdmin && (
                      grantingFor === u.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedRole}
                            onChange={e => setSelectedRole(e.target.value as AppRole)}
                            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {GRANTABLE_ROLES.map(r => (
                              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleGrant(u.id)}
                            disabled={isPending}
                            className="text-xs font-semibold bg-blue-600 text-white px-3 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setGrantingFor(null)}
                            className="text-xs text-slate-500 hover:text-slate-700 px-2 py-2 rounded-xl transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setGrantingFor(u.id); setSelectedRole('CHURCH_ADMIN'); }}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 px-3 py-2 rounded-xl transition-colors"
                        >
                          Conceder cargo
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}