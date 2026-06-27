'use client'

import React, { useState, useTransition } from 'react';
import {
  grantAdminRole, revokeAdminRole,
  suspendAdmin, unsuspendAdmin,
  resetAdminPin, resetAdminPassword,
  updateAdminProfile, getAdminAuditLogs,
  UserWithRoles, AuditLogEntry,
} from '@/features/core/actions/admin-access';
import { AppRole } from '@/features/core/api/get-current-user';
import { useToast } from '@/features/core/components/ToastContext';
import { RoleBadge, ROLE_BADGE_CONFIG } from '@/features/core/components/RoleBadge';

const ONBOARDING_LABELS: Record<string, { label: string; color: string }> = {
  admin_notification: { label: 'Aguardando notificação', color: 'bg-amber-100 text-amber-700'   },
  fill_admin_profile: { label: 'Preenchendo perfil',     color: 'bg-blue-100 text-blue-700'     },
  upload_photo:       { label: 'Enviando foto',          color: 'bg-sky-100 text-sky-700'       },
  accept_admin_terms: { label: 'Aceitando termos',       color: 'bg-indigo-100 text-indigo-700' },
  create_pin:         { label: 'Criando PIN',            color: 'bg-violet-100 text-violet-700' },
  done:               { label: 'Ativo',                  color: 'bg-green-100 text-green-700'   },
};

const ACTION_LABELS: Record<string, string> = {
  GRANT_ROLE:           'Cargo concedido',
  REVOKE_ROLE:          'Cargo revogado',
  SUSPEND_ACCESS:       'Acesso suspenso',
  UNSUSPEND_ACCESS:     'Acesso reativado',
  RESET_PIN:            'PIN redefinido',
  RESET_PASSWORD:       'Senha redefinida',
  UPDATE_ADMIN_PROFILE: 'Perfil atualizado',
  CREATE:               'Cadastro criado',
  UPDATE:               'Dados atualizados',
  UPDATE_NOTES:         'Anotação atualizada',
  UPDATE_SPIRITUAL:     'Trilha espiritual atualizada',
  UPDATE_MINISTRIES:    'Ministérios atualizados',
};

const GRANTABLE_ROLES: AppRole[] = [
  'CHURCH_ADMIN',
  'FINANCE_ADMIN',
  'LEADER',
  'SUPPORT_ADMIN',
  'EVENT_ADMIN',
  'MEDIA_ADMIN',
  'MEMBER_ADMIN',
  'REPORT_VIEWER',
];

type SuspendDuration = '1d' | '7d' | '30d' | 'indefinido';

function Avatar({ photoUrl, name, size = 'md' }: { photoUrl: string | null; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  const cls = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-16 h-16 text-xl' : 'w-10 h-10 text-sm';
  return (
    <div className={`${cls} rounded-full overflow-hidden bg-blue-600 flex items-center justify-center text-white font-bold shrink-0`}>
      {photoUrl
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
        : initials}
    </div>
  );
}

interface AccessManagerProps {
  users: UserWithRoles[];
}

type PanelTab = 'info' | 'edit' | 'logs';

export function AccessManager({ users: initialUsers }: AccessManagerProps) {
  const { toast, dismiss }           = useToast();
  const [isPending, startTransition] = useTransition();
  const [users, setUsers]            = useState<UserWithRoles[]>(initialUsers);
  const [search, setSearch]          = useState('');
  const [filter, setFilter]          = useState<'all' | 'admins' | 'members'>('all');
  const [grantingFor, setGrantingFor]   = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>('CHURCH_ADMIN');
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [panelTab, setPanelTab]         = useState<PanelTab>('info');
  const [logs, setLogs]                 = useState<AuditLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs]   = useState(false);

  // Estados do modal de suspensão
  const [suspendModalFor, setSuspendModalFor]   = useState<UserWithRoles | null>(null);
  const [suspendDuration, setSuspendDuration]   = useState<SuspendDuration>('indefinido');
  const [suspendReason, setSuspendReason]       = useState('');

  // Campos de edição
  const [editFullName,   setEditFullName]   = useState('');
  const [editChurchRole, setEditChurchRole] = useState('');
  const [editPhone,      setEditPhone]      = useState('');
  const [editAddress,    setEditAddress]    = useState('');
  const [editRoles,      setEditRoles]      = useState<AppRole[]>([]);

  const filtered = users.filter(u => {
    const term = search.toLowerCase();
    const matchesSearch = !term ||
      u.full_name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term);
    const isAdmin = u.roles.some(r => ['CHURCH_ADMIN', 'FINANCE_ADMIN', 'LEADER', 'SYSADMIN'].includes(r));
    return matchesSearch && (
      filter === 'all' ? true :
      filter === 'admins' ? isAdmin : !isAdmin
    );
  });

  const openPanel = (user: UserWithRoles) => {
    setSelectedUser(user);
    setPanelTab('info');
    setEditFullName(user.full_name);
    setEditChurchRole(user.church_role ?? '');
    setEditPhone(user.phone ?? '');
    setEditAddress('');
    setEditRoles(user.roles.filter(r => GRANTABLE_ROLES.includes(r)));
    setLogs([]);
  };

  const loadLogs = async (userId: string) => {
    setLoadingLogs(true);
    const data = await getAdminAuditLogs(userId);
    setLogs(data);
    setLoadingLogs(false);
  };

  const handleTabChange = (tab: PanelTab) => {
    setPanelTab(tab);
    if (tab === 'logs' && selectedUser && logs.length === 0) {
      loadLogs(selectedUser.id);
    }
  };

  const mutateUser = (userId: string, patch: Partial<UserWithRoles>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...patch } : u));
    if (selectedUser?.id === userId) setSelectedUser(prev => prev ? { ...prev, ...patch } : null);
  };

  const handleGrant = (userId: string) => {
    startTransition(async () => {
      const id = toast('loading', 'Concedendo cargo...');
      const result = await grantAdminRole(userId, selectedRole);
      dismiss(id);
      if (result.error) { toast('error', result.error); return; }
      toast('success', 'Cargo concedido. Usuário será notificado.');
      mutateUser(userId, { roles: [...(users.find(u => u.id === userId)?.roles ?? []), selectedRole] });
      setGrantingFor(null);
    });
  };

  const handleRevoke = (userId: string, role: AppRole, name: string) => {
    if (!confirm(`Revogar o cargo "${ROLE_BADGE_CONFIG[role]?.label ?? role}" de ${name}?`)) return;
    startTransition(async () => {
      const id = toast('loading', 'Revogando cargo...');
      const result = await revokeAdminRole(userId, role);
      dismiss(id);
      if (result.error) { toast('error', result.error); return; }
      toast('success', 'Cargo revogado.');
      mutateUser(userId, { roles: (users.find(u => u.id === userId)?.roles ?? []).filter(r => r !== role) });
    });
  };

  const handleUnsuspend = (u: UserWithRoles) => {
    if (!confirm(`Reativar o acesso de ${u.full_name}?`)) return;
    startTransition(async () => {
      const id = toast('loading', 'Reativando acesso...');
      const result = await unsuspendAdmin(u.id);
      dismiss(id);
      if (result.error) { toast('error', result.error); return; }
      toast('success', 'Acesso reativado.');
      mutateUser(u.id, { is_suspended: false, suspended_until: null, suspension_reason: null, suspended_by_name: null });
    });
  };

  const handleConfirmSuspend = () => {
    if (!suspendModalFor || !suspendReason.trim()) return;
    const until =
      suspendDuration === '1d'  ? new Date(Date.now() + 86400000) :
      suspendDuration === '7d'  ? new Date(Date.now() + 7 * 86400000) :
      suspendDuration === '30d' ? new Date(Date.now() + 30 * 86400000) :
      null;

    startTransition(async () => {
      const id = toast('loading', 'Suspendendo acesso...');
      const result = await suspendAdmin(suspendModalFor.id, suspendReason, until);
      dismiss(id);
      if (result.error) { toast('error', result.error); return; }
      toast('success', 'Acesso suspenso. O usuário verá a justificativa ao tentar entrar no sistema.');
      mutateUser(suspendModalFor.id, {
        is_suspended:      true,
        suspended_until:   until?.toISOString() ?? null,
        suspension_reason: suspendReason,
        suspended_by_name: 'SysAdmin',
      });
      setSuspendModalFor(null);
      setSuspendReason('');
      setSuspendDuration('indefinido');
    });
  };

  const handleResetPin = (u: UserWithRoles) => {
    if (!confirm(`Redefinir o PIN de ${u.full_name}? O usuário deverá criar um novo PIN.`)) return;
    startTransition(async () => {
      const id = toast('loading', 'Redefinindo PIN...');
      const result = await resetAdminPin(u.id);
      dismiss(id);
      if (result.error) toast('error', result.error);
      else toast('success', 'PIN redefinido. Usuário precisará criar um novo.');
    });
  };

  const handleResetPassword = (u: UserWithRoles) => {
    if (!confirm(`Enviar e-mail de redefinição de senha para ${u.email}?`)) return;
    startTransition(async () => {
      const id = toast('loading', 'Enviando e-mail...');
      const result = await resetAdminPassword(u.id);
      dismiss(id);
      if (result.error) toast('error', result.error);
      else toast('success', `E-mail de redefinição enviado para ${u.email}.`);
    });
  };

  const handleSaveEdit = () => {
    if (!selectedUser) return;
    startTransition(async () => {
      const id = toast('loading', 'Salvando alterações...');
      const result = await updateAdminProfile(selectedUser.id, {
        full_name:   editFullName,
        church_role: editChurchRole,
        phone:       editPhone,
        address:     editAddress || undefined,
        roles:       editRoles,
      });
      dismiss(id);
      if (result.error) { toast('error', result.error); return; }
      toast('success', 'Dados atualizados.');
      mutateUser(selectedUser.id, { full_name: editFullName, church_role: editChurchRole, phone: editPhone, roles: editRoles });
      setPanelTab('info');
    });
  };

  const inputCls = 'w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-all bg-[var(--admin-surface-alt)] border-[var(--admin-border)] text-[var(--admin-text-primary)]';

  return (
    <>
      <div className="flex gap-6 items-start">

        {/* ── Lista ── */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="p-4 rounded-2xl border flex flex-col sm:flex-row gap-3 transition-colors"
               style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
            <div className="relative flex-1">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--admin-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nome ou e-mail..."
                className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-all"
                style={{ background: 'var(--admin-surface-alt)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-primary)' }} />
            </div>
            <div className="flex gap-2">
              {(['all', 'admins', 'members'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                  style={{ 
                    background: filter === f ? 'var(--admin-accent)' : 'var(--admin-surface-alt)',
                    color: filter === f ? '#fff' : 'var(--admin-text-secondary)'
                  }}>
                  {f === 'all' ? 'Todos' : f === 'admins' ? 'Administradores' : 'Membros'}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
            <div className="px-6 py-3 border-b" style={{ borderColor: 'var(--admin-border)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--admin-text-muted)' }}>{filtered.length} usuários</p>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--admin-border)' }}>
              {filtered.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm" style={{ color: 'var(--admin-text-muted)' }}>Nenhum usuário encontrado.</div>
              ) : filtered.map(u => {
                const isAdmin    = u.roles.some(r => ['CHURCH_ADMIN', 'FINANCE_ADMIN', 'LEADER', 'SYSADMIN'].includes(r));
                const isSysAdmin = u.roles.includes('SYSADMIN');
                const onboarding = u.onboarding_step ? ONBOARDING_LABELS[u.onboarding_step] : null;
                const pendingOnboarding = u.onboarding_step && u.onboarding_step !== 'done';
                const isSelected = selectedUser?.id === u.id;

                return (
                  <div key={u.id} onClick={() => openPanel(u)}
                    className="px-6 py-4 flex items-center gap-4 cursor-pointer transition-colors"
                    style={{ background: isSelected ? 'var(--admin-surface-alt)' : 'transparent' }}>
                    <div className="relative shrink-0">
                      <Avatar photoUrl={u.photo_url} name={u.full_name} size="md" />
                      {u.is_suspended && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm" style={{ color: 'var(--admin-text-primary)' }}>{u.full_name}</p>
                        {u.is_suspended && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>Suspenso</span>}
                        {pendingOnboarding && onboarding && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${onboarding.color}`}>{onboarding.label}</span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--admin-text-muted)' }}>{u.email}</p>
                      {u.church_role && <p className="text-xs mt-0.5" style={{ color: 'var(--admin-text-secondary)' }}>{u.church_role}</p>}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {u.roles.length > 0 ? u.roles.map(role => (
                          <RoleBadge key={role} role={role as AppRole} variant="chip" size="sm" className="mr-1.5" />
                        )) : <span className="text-xs italic" style={{ color: 'var(--admin-text-muted)' }}>Sem cargo</span>}
                      </div>
                    </div>
                    <div className="shrink-0" onClick={e => e.stopPropagation()}>
                      {!isSysAdmin && (
                        grantingFor === u.id ? (
                          <div className="flex items-center gap-2">
                            <select value={selectedRole} onChange={e => setSelectedRole(e.target.value as AppRole)}
                              className="text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none">
                              {GRANTABLE_ROLES.map(r => <option key={r} value={r}>{ROLE_BADGE_CONFIG[r]?.label}</option>)}
                            </select>
                            <button onClick={() => handleGrant(u.id)} disabled={isPending}
                              className="text-xs font-semibold bg-blue-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50">OK</button>
                            <button onClick={() => setGrantingFor(null)}
                              className="text-xs text-slate-500 hover:text-slate-700 px-1.5 py-1.5 rounded-lg">✕</button>
                          </div>
                        ) : (
                          !isAdmin && (
                            <button onClick={() => { setGrantingFor(u.id); setSelectedRole('CHURCH_ADMIN'); }}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-xl transition-colors">
                              Conceder cargo
                            </button>
                          )
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Painel lateral ── */}
        {selectedUser && (
          <div className="w-96 shrink-0 rounded-3xl border shadow-sm sticky top-6 max-h-[calc(100vh-6rem)] flex flex-col overflow-hidden"
            style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
            <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--admin-border)' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar photoUrl={selectedUser.photo_url} name={selectedUser.full_name} size="lg" />
                  <div className="min-w-0">
                    <p className="font-bold leading-tight" style={{ color: 'var(--admin-text-primary)' }}>{selectedUser.full_name}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--admin-text-muted)' }}>{selectedUser.email}</p>
                    {selectedUser.church_role && <p className="text-xs mt-0.5" style={{ color: 'var(--admin-text-secondary)' }}>{selectedUser.church_role}</p>}
                    {selectedUser.is_suspended && (
                      <span className="inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>Suspenso</span>
                    )}
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="shrink-0" style={{ color: 'var(--admin-text-muted)' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Info de suspensão */}
              {selectedUser.is_suspended && selectedUser.suspension_reason && (
                <div className="mt-3 border rounded-xl p-3 text-xs space-y-1" style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                  <p className="font-semibold" style={{ color: '#fca5a5' }}>Motivo da suspensão:</p>
                  <p style={{ color: '#f87171' }}>{selectedUser.suspension_reason}</p>
                  <p style={{ color: '#ef4444' }}>
                    Por {selectedUser.suspended_by_name}
                    {selectedUser.suspended_until && ` · até ${new Date(selectedUser.suspended_until).toLocaleDateString('pt-BR')}`}
                    {!selectedUser.suspended_until && ' · indefinido'}
                  </p>
                </div>
              )}

              <div className="flex gap-1 mt-4 rounded-xl p-1" style={{ background: 'var(--admin-surface-alt)' }}>
                {([
                  { id: 'info', label: 'Gestão' },
                  { id: 'edit', label: 'Editar' },
                  { id: 'logs', label: 'Logs' },
                ] as { id: PanelTab; label: string }[]).map(tab => (
                  <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                    className="flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors"
                    style={{ 
                      background: panelTab === tab.id ? 'var(--admin-surface)' : 'transparent',
                      color: panelTab === tab.id ? 'var(--admin-text-primary)' : 'var(--admin-text-secondary)'
                    }}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>

              {/* ── Tab: Gestão ── */}
              {panelTab === 'info' && (
                <div className="p-5 space-y-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--admin-text-muted)' }}>Cargos</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedUser.roles.length > 0 ? selectedUser.roles.map(role => (
                        <div key={role} className="flex items-center gap-1">
                          <RoleBadge role={role as AppRole} variant="chip" size="sm" />
                          {role !== 'SYSADMIN' && (
                            <button onClick={() => handleRevoke(selectedUser.id, role as AppRole, selectedUser.full_name)}
                              disabled={isPending} className="hover:text-red-600 transition-colors disabled:opacity-50 text-slate-400" title="Revogar cargo">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      )) : <span className="text-xs italic" style={{ color: 'var(--admin-text-muted)' }}>Sem cargo administrativo</span>}
                    </div>
                  </div>

                  <div className="h-px w-full" style={{ background: 'var(--admin-border)' }} />

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--admin-text-muted)' }}>Ações</p>
                    <div className="space-y-2">

                      <button onClick={() => handleResetPin(selectedUser)}
                        disabled={isPending || selectedUser.roles.includes('SYSADMIN')}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left hover:bg-white/5"
                        style={{ background: 'var(--admin-surface-alt)', color: 'var(--admin-text-primary)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <svg className="w-4 h-4" style={{ color: 'var(--admin-text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <div>
                          <p>Redefinir PIN</p>
                          <p className="text-xs font-normal" style={{ color: 'var(--admin-text-muted)' }}>Usuário deverá criar novo PIN</p>
                        </div>
                      </button>

                      <button onClick={() => handleResetPassword(selectedUser)} disabled={isPending}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 text-left hover:bg-white/5"
                        style={{ background: 'var(--admin-surface-alt)', color: 'var(--admin-text-primary)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <svg className="w-4 h-4" style={{ color: 'var(--admin-text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p>Redefinir senha</p>
                          <p className="text-xs font-normal" style={{ color: 'var(--admin-text-muted)' }}>Envia e-mail de recuperação</p>
                        </div>
                      </button>

                      {selectedUser.is_suspended ? (
                        <button onClick={() => handleUnsuspend(selectedUser)}
                          disabled={isPending || selectedUser.roles.includes('SYSADMIN')}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left"
                          style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p>Reativar acesso</p>
                            <p className="text-xs font-normal opacity-70">Permite acesso ao sistema novamente</p>
                          </div>
                        </button>
                      ) : (
                        <button onClick={() => { setSuspendModalFor(selectedUser); setSuspendReason(''); setSuspendDuration('indefinido'); }}
                          disabled={isPending || selectedUser.roles.includes('SYSADMIN')}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left"
                          style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(239, 68, 68, 0.2)' }}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </div>
                          <div>
                            <p>Suspender acesso</p>
                            <p className="text-xs font-normal opacity-70">Bloqueia acesso ao sistema, mantém cargo</p>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Tab: Editar ── */}
              {panelTab === 'edit' && (
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Nome completo</label>
                    <input value={editFullName} onChange={e => setEditFullName(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Função na igreja</label>
                    <input value={editChurchRole} onChange={e => setEditChurchRole(e.target.value)} placeholder="Ex: Pastor, Secretária..." className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Telefone</label>
                    <input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="(XX) XXXXX-XXXX" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Endereço</label>
                    <input value={editAddress} onChange={e => setEditAddress(e.target.value)} placeholder="Endereço completo" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Cargos</label>
                    <div className="space-y-2">
                      {GRANTABLE_ROLES.map(role => (
                        <label key={role} className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={editRoles.includes(role)}
                            onChange={() => setEditRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role])}
                            className="w-4 h-4 accent-blue-600" />
                          <RoleBadge role={role as AppRole} variant="chip" size="sm" />
                        </label>
                      ))}
                    </div>
                  </div>
                  <button onClick={handleSaveEdit} disabled={isPending}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {isPending && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>}
                    Salvar alterações
                  </button>
                </div>
              )}

              {/* ── Tab: Logs ── */}
              {panelTab === 'logs' && (
                <div className="p-5">
                  {loadingLogs ? (
                    <div className="flex justify-center py-8">
                      <svg className="w-6 h-6 animate-spin text-slate-300" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    </div>
                  ) : logs.length === 0 ? (
                    <p className="text-center text-sm text-slate-400 py-8">Nenhum log encontrado.</p>
                  ) : (
                    <div className="space-y-2">
                      {logs.map(log => (
                        <div key={log.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-700">
                              {ACTION_LABELS[log.action] ?? log.action}
                            </span>
                            <span className="text-xs text-slate-400 whitespace-nowrap">
                              {new Date(log.created_at).toLocaleString('pt-BR', {
                                day: '2-digit', month: '2-digit', year: '2-digit',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            por <strong>{log.actor_name}</strong> · {log.actor_role}
                          </p>
                          {log.action === 'SUSPEND_ACCESS' && typeof log.new_data?.reason === 'string' && (
                            <p className="text-xs text-red-500 mt-1 italic">&ldquo;{log.new_data.reason}&rdquo;</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Modal de suspensão ── */}
      {suspendModalFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
            <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--admin-border)' }}>
              <h3 className="text-lg font-bold" style={{ color: 'var(--admin-text-primary)' }}>Suspender acesso</h3>
              <p className="text-sm mt-0.5" style={{ color: 'var(--admin-text-secondary)' }}>
                Bloqueando acesso de <strong style={{ color: 'var(--admin-text-primary)' }}>{suspendModalFor.full_name}</strong> ao sistema.
              </p>
            </div>

            <div className="p-6 space-y-5">
              {/* Justificativa */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--admin-text-muted)' }}>
                  Justificativa <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={suspendReason}
                  onChange={e => setSuspendReason(e.target.value)}
                  rows={3}
                  placeholder="Descreva o motivo da suspensão. Esta mensagem será exibida ao usuário."
                  className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-red-500 resize-none transition-all"
                  style={{ background: 'var(--admin-surface-alt)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-primary)' }}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--admin-text-muted)' }}>O usuário verá esta mensagem ao tentar acessar o sistema.</p>
              </div>

              {/* Duração */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--admin-text-muted)' }}>Duração</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: '1d',        label: '1 dia'      },
                    { value: '7d',        label: '7 dias'     },
                    { value: '30d',       label: '30 dias'    },
                    { value: 'indefinido',label: 'Indefinido' },
                  ] as { value: SuspendDuration; label: string }[]).map(opt => (
                    <label key={opt.value}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        suspendDuration === opt.value
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-transparent hover:border-slate-700/50'
                      }`}
                      style={{ background: suspendDuration === opt.value ? '' : 'var(--admin-surface-alt)' }}
                    >
                      <input type="radio" name="duration" value={opt.value}
                        checked={suspendDuration === opt.value}
                        onChange={() => setSuspendDuration(opt.value)}
                        className="accent-red-500" />
                      <span className={`text-sm font-medium ${suspendDuration === opt.value ? 'text-red-400' : 'text-[var(--admin-text-primary)]'}`}>
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setSuspendModalFor(null)}
                className="flex-1 py-3 font-semibold rounded-2xl hover:bg-white/5 transition-colors"
                style={{ border: '1px solid var(--admin-border)', color: 'var(--admin-text-secondary)' }}>
                Cancelar
              </button>
              <button
                onClick={handleConfirmSuspend}
                disabled={isPending || !suspendReason.trim()}
                className="flex-1 py-3 font-bold text-white rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                style={{ background: '#ef4444' }}
              >
                {isPending && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>}
                Confirmar suspensão
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}