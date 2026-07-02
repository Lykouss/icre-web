'use client'

import React, { useState, useTransition, useId, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  grantAdminRole, revokeAdminRole,
  suspendAdmin, unsuspendAdmin,
  resetAdminPin, adminResetPasswordDirect,
  adminUpdateEmailDirect, adminDeleteUser,
  updateAdminProfile, getAdminAuditLogs,
  adminUpdatePinDirect,
  UserWithRoles, AuditLogEntry,
} from '@/features/core/actions/admin-access';
import { AppRole } from '@/features/core/api/get-current-user';
import { useToast } from '@/features/core/components/ToastContext';
import { RoleBadge, ROLE_BADGE_CONFIG } from '@/features/core/components/RoleBadge';

const ONBOARDING_LABELS: Record<string, { label: string; color: string }> = {
  admin_notification: { label: 'Aguardando notificação', color: 'bg-amber-100 text-amber-700 border border-amber-200' },
  fill_admin_profile: { label: 'Preenchendo perfil',     color: 'bg-blue-100 text-blue-700 border border-blue-200' },
  upload_photo:       { label: 'Enviando foto',          color: 'bg-sky-100 text-sky-700 border border-sky-200' },
  accept_admin_terms: { label: 'Aceitando termos',       color: 'bg-indigo-100 text-indigo-700 border border-indigo-200' },
  create_pin:         { label: 'Criando PIN',            color: 'bg-violet-100 text-violet-700 border border-violet-200' },
  done:               { label: 'Ativo',                  color: 'bg-green-100 text-green-700 border border-green-200' },
};

const ACTION_LABELS: Record<string, string> = {
  GRANT_ROLE:            'Cargo concedido',
  REVOKE_ROLE:           'Cargo revogado',
  SUSPEND_ACCESS:        'Acesso suspenso',
  UNSUSPEND_ACCESS:      'Acesso reativado',
  RESET_PIN:             'PIN redefinido',
  RESET_PASSWORD:        'Senha (e-mail)',
  DIRECT_PASSWORD_RESET: 'Senha (direto)',
  DIRECT_EMAIL_UPDATE:   'E-mail alterado',
  DIRECT_PIN_UPDATE:     'PIN redefinido (direto)',
  DELETE_USER:           'Conta excluída',
  UPDATE_ADMIN_PROFILE:  'Perfil atualizado',
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

const ROLE_HIERARCHY: Record<AppRole, { level: string; desc: string }> = {
  SYSADMIN:      { level: 'Root',    desc: 'Controle absoluto' },
  CHURCH_ADMIN:  { level: 'Nível 1', desc: 'Gestão geral da igreja' },
  FINANCE_ADMIN: { level: 'Nível 2', desc: 'Gestão financeira' },
  LEADER:        { level: 'Nível 3', desc: 'Liderança de grupos' },
  SUPPORT_ADMIN: { level: 'Nível 3', desc: 'Atendimento' },
  EVENT_ADMIN:   { level: 'Nível 3', desc: 'Gestão de eventos' },
  MEDIA_ADMIN:   { level: 'Gerência',     desc: 'Gerencia as mídias, vídeos e pregações.' },
  MEMBER_ADMIN:  { level: 'Gerência',     desc: 'Acesso total ao cadastro e gestão de membros.' },
  REPORT_VIEWER: { level: 'Analista',     desc: 'Acesso para ver relatórios e dashboards. Não pode alterar dados.' },
  MEMBER:        { level: 'Comum',        desc: 'Membro comum sem acessos administrativos.' },
};

type SuspendDuration = '1d' | '7d' | '30d' | 'indefinido';
type PanelTab = 'info' | 'edit' | 'logs';

type PinActionPayload =
  | { type: 'GRANT_ROLE'; userId: string; role: AppRole; name: string }
  | { type: 'REVOKE_ROLE'; userId: string; role: AppRole; name: string }
  | { type: 'SUSPEND'; userId: string; reason: string; until: Date | null; name: string }
  | { type: 'UNSUSPEND'; userId: string; name: string }
  | { type: 'RESET_PIN'; userId: string; name: string }
  | { type: 'RESET_PASSWORD'; userId: string; newPassword: string; name: string }
  | { type: 'UPDATE_EMAIL'; userId: string; newEmail: string; name: string }
  | { type: 'UPDATE_PIN_DIRECT'; userId: string; newPin: string; name: string }
  | { type: 'UPDATE_PROFILE'; userId: string; data: any; name: string }
  | { type: 'DELETE_USER'; userId: string; name: string };

function Avatar({ photoUrl, name, size = 'md' }: { photoUrl: string | null; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  const cls = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-10 h-10 text-sm';
  return (
    <div className={`${cls} rounded-full overflow-hidden bg-blue-600 flex items-center justify-center text-white font-bold shrink-0 border-2 border-[var(--admin-surface)] shadow-lg`}>
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

export function AccessManager({ users: initialUsers }: AccessManagerProps) {
  const { toast, dismiss } = useToast();
  const [isPending, startTransition] = useTransition();
  const [users, setUsers] = useState<UserWithRoles[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'admins' | 'members'>('all');
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [panelTab, setPanelTab] = useState<PanelTab>('info');
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const uid = useId();

  // Pin Modal State
  const [pinAction, setPinAction] = useState<PinActionPayload | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Suspend State
  const [suspendModalFor, setSuspendModalFor] = useState<UserWithRoles | null>(null);
  const [suspendDuration, setSuspendDuration] = useState<SuspendDuration>('indefinido');
  const [suspendReason, setSuspendReason] = useState('');

  // Edit State
  const [editFullName, setEditFullName] = useState('');
  const [editChurchRole, setEditChurchRole] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editRoles, setEditRoles] = useState<AppRole[]>([]);
  const [editNewEmail, setEditNewEmail] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editNewPinDirect, setEditNewPinDirect] = useState('');
  
  const [selectedRoleToGrant, setSelectedRoleToGrant] = useState<AppRole>('REPORT_VIEWER');

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
    setEditNewEmail(user.email);
    setEditNewPassword('');
    setEditNewPinDirect('');
    setSelectedRoleToGrant(GRANTABLE_ROLES.filter(r => !user.roles.includes(r)).reverse()[0] || 'REPORT_VIEWER');
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

  const removeUserFromState = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (selectedUser?.id === userId) setSelectedUser(null);
  }

  // --- PIN Action Execution ---
  const executePinAction = () => {
    if (!pinAction) return;
    if (!pinInput || pinInput.length !== 4) {
      setPinError('O PIN deve conter exatamente 4 dígitos.');
      return;
    }
    setPinError('');

    startTransition(async () => {
      const id = toast('loading', 'Autenticando e processando...');
      const p = pinAction;
      let res: { error?: string } = {};

      if (p.type === 'GRANT_ROLE') {
        res = await grantAdminRole(p.userId, p.role, pinInput);
        if (!res.error) mutateUser(p.userId, { roles: [...(users.find(u => u.id === p.userId)?.roles ?? []), p.role] });
      } else if (p.type === 'REVOKE_ROLE') {
        res = await revokeAdminRole(p.userId, p.role, pinInput);
        if (!res.error) mutateUser(p.userId, { roles: (users.find(u => u.id === p.userId)?.roles ?? []).filter(r => r !== p.role) });
      } else if (p.type === 'SUSPEND') {
        res = await suspendAdmin(p.userId, p.reason, p.until, pinInput);
        if (!res.error) {
          mutateUser(p.userId, { is_suspended: true, suspended_until: p.until?.toISOString() ?? null, suspension_reason: p.reason, suspended_by_name: 'SysAdmin' });
          setSuspendModalFor(null);
        }
      } else if (p.type === 'UNSUSPEND') {
        res = await unsuspendAdmin(p.userId, pinInput);
        if (!res.error) mutateUser(p.userId, { is_suspended: false, suspended_until: null, suspension_reason: null, suspended_by_name: null });
      } else if (p.type === 'RESET_PIN') {
        res = await resetAdminPin(p.userId, pinInput);
      } else if (p.type === 'RESET_PASSWORD') {
        res = await adminResetPasswordDirect(p.userId, p.newPassword, pinInput);
        if (!res.error) setEditNewPassword('');
      } else if (p.type === 'UPDATE_EMAIL') {
        res = await adminUpdateEmailDirect(p.userId, p.newEmail, pinInput);
        if (!res.error) mutateUser(p.userId, { email: p.newEmail });
      } else if (p.type === 'UPDATE_PIN_DIRECT') {
        res = await adminUpdatePinDirect(p.userId, p.newPin, pinInput);
        if (!res.error) setEditNewPinDirect('');
      } else if (p.type === 'UPDATE_PROFILE') {
        res = await updateAdminProfile(p.userId, p.data, pinInput);
        if (!res.error) mutateUser(p.userId, { full_name: p.data.full_name, church_role: p.data.church_role, phone: p.data.phone, roles: p.data.roles });
      } else if (p.type === 'DELETE_USER') {
        res = await adminDeleteUser(p.userId, pinInput);
        if (!res.error) removeUserFromState(p.userId);
      }

      dismiss(id);
      if (res.error) {
        setPinError(res.error);
        if (res.error.includes('PIN incorreto')) toast('error', 'PIN incorreto.');
      } else {
        toast('success', 'Ação concluída com sucesso.');
        setPinAction(null);
        setPinInput('');
      }
    });
  };

  const handleConfirmSuspend = () => {
    if (!suspendModalFor || !suspendReason.trim()) return;
    const until =
      suspendDuration === '1d'  ? new Date(Date.now() + 86400000) :
      suspendDuration === '7d'  ? new Date(Date.now() + 7 * 86400000) :
      suspendDuration === '30d' ? new Date(Date.now() + 30 * 86400000) :
      null;
    
    setPinAction({ type: 'SUSPEND', userId: suspendModalFor.id, name: suspendModalFor.full_name, reason: suspendReason, until });
  };

  // Basic styling classes for inputs
  const inputCls = 'w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-all font-medium placeholder-slate-500/50';

  return (
    <>
      <div className="flex gap-6 items-start h-[calc(100vh-140px)]">

        {/* ── Lista Esquerda ── */}
        <div className="flex-1 min-w-0 h-full flex flex-col gap-4">
          <div className="p-2 rounded-2xl flex flex-col sm:flex-row gap-2 transition-colors border"
               style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
            <div className="relative flex-1">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nome ou e-mail..."
                className="w-full pl-9 pr-4 py-3 bg-transparent border-none focus:outline-none text-sm font-medium"
                style={{ color: 'var(--admin-text-primary)' }} />
            </div>
            <div className="h-full w-px mx-1 bg-white/5 hidden sm:block" />
            <div className="flex gap-1 p-1">
              {(['all', 'admins', 'members'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all relative"
                  style={{ color: filter === f ? '#fff' : 'var(--admin-text-secondary)' }}>
                  {filter === f && (
                    <motion.div layoutId="filter-active" className="absolute inset-0 bg-blue-600 rounded-xl" style={{ zIndex: 0 }} />
                  )}
                  <span className="relative z-10">{f === 'all' ? 'Todos' : f === 'admins' ? 'Administradores' : 'Membros'}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 rounded-3xl border overflow-hidden flex flex-col" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
            <div className="px-6 py-4 border-b bg-white/[0.02]" style={{ borderColor: 'var(--admin-border)' }}>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--admin-text-muted)' }}>{filtered.length} Usuários Encontrados</p>
            </div>
            
            <div className="flex-1 overflow-y-auto portal-scroll p-3 space-y-2">
              <AnimatePresence initial={false}>
                {filtered.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center p-12 text-center">
                    <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    <p className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--admin-text-muted)' }}>Nenhum usuário</p>
                  </motion.div>
                ) : (
                  filtered.map((u, i) => {
                    const isSelected = selectedUser?.id === u.id;
                    const onboarding = u.onboarding_step ? ONBOARDING_LABELS[u.onboarding_step] : null;

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: i < 15 ? i * 0.03 : 0 }}
                        key={u.id}
                        onClick={() => openPanel(u)}
                        className={`px-5 py-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-all border
                          ${isSelected ? 'shadow-lg border-blue-500/30' : 'hover:shadow-md hover:border-slate-700/50 border-transparent'}
                        `}
                        style={{ background: isSelected ? 'var(--admin-surface-alt)' : 'rgba(255,255,255,0.01)' }}>
                        
                        <div className="relative shrink-0">
                          <Avatar photoUrl={u.photo_url} name={u.full_name} size="md" />
                          {u.is_suspended && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-[var(--admin-surface)] flex items-center justify-center shadow-lg">
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" /></svg>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-bold text-sm tracking-tight" style={{ color: 'var(--admin-text-primary)' }}>{u.full_name}</p>
                            {u.is_suspended && <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">Suspenso</span>}
                            {onboarding && u.onboarding_step !== 'done' && (
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${onboarding.color}`}>{onboarding.label}</span>
                            )}
                          </div>
                          <p className="text-[12px] truncate" style={{ color: 'var(--admin-text-secondary)' }}>{u.email}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {u.roles.length > 0 ? u.roles.map(role => (
                              <RoleBadge key={role} role={role as AppRole} variant="chip" size="sm" className="mr-1" />
                            )) : <span className="text-[11px] font-medium opacity-50" style={{ color: 'var(--admin-text-muted)' }}>Sem cargo admin</span>}
                          </div>
                        </div>
                        
                        <div className="shrink-0 pl-2">
                          <svg className={`w-5 h-5 transition-transform ${isSelected ? 'translate-x-1 text-blue-500' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── Painel lateral Direito ── */}
        <AnimatePresence mode="wait">
          {selectedUser && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.98 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full max-w-md shrink-0 rounded-[2rem] border shadow-2xl flex flex-col h-full overflow-hidden relative"
              style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
              
              {/* Bg Blur Decor */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />

              {/* Header do Painel */}
              <div className="px-8 pt-8 pb-6 border-b relative z-10" style={{ borderColor: 'var(--admin-border)' }}>
                <div className="flex justify-between items-start mb-4">
                  <Avatar photoUrl={selectedUser.photo_url} name={selectedUser.full_name} size="lg" />
                  <button onClick={() => setSelectedUser(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight mb-1" style={{ color: 'var(--admin-text-primary)' }}>{selectedUser.full_name}</h2>
                  <p className="text-sm font-medium" style={{ color: 'var(--admin-text-secondary)' }}>{selectedUser.email}</p>
                  {selectedUser.church_role && <p className="text-[11px] font-black uppercase tracking-widest mt-2" style={{ color: 'var(--admin-accent)' }}>{selectedUser.church_role}</p>}
                </div>
                
                {/* Abas Segmentadas */}
                <div className="flex mt-6 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--admin-border)' }}>
                  {([
                    { id: 'info', label: 'Gestão' },
                    { id: 'edit', label: 'Conta' },
                    { id: 'logs', label: 'Auditoria' },
                  ] as { id: PanelTab; label: string }[]).map(tab => (
                    <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                      className="flex-1 relative py-2 text-xs font-bold transition-colors z-10 rounded-xl"
                      style={{ color: panelTab === tab.id ? 'var(--admin-text-primary)' : 'var(--admin-text-muted)' }}>
                      {panelTab === tab.id && (
                        <motion.div layoutId="tab-active" className="absolute inset-0 rounded-xl bg-white/10 shadow-sm border border-white/5" style={{ zIndex: -1 }} />
                      )}
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Corpo do Painel */}
              <div className="flex-1 overflow-y-auto portal-scroll relative z-10 p-6">
                
                {/* ABA: GESTÃO */}
                {panelTab === 'info' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    
                    {/* Cargos */}
                    <section>
                      <h4 className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--admin-text-muted)' }}>Cargos Administrativos</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.roles.length > 0 ? selectedUser.roles.map(role => (
                          <div key={role} className="flex items-center gap-2 bg-slate-900/50 pl-1 pr-3 py-1 rounded-full border border-slate-700/50 shadow-inner">
                            <RoleBadge role={role as AppRole} variant="chip" size="sm" />
                            {role !== 'SYSADMIN' && (
                              <button onClick={() => setPinAction({ type: 'REVOKE_ROLE', userId: selectedUser.id, role: role as AppRole, name: selectedUser.full_name })}
                                className="w-5 h-5 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all ml-1" title="Revogar cargo">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            )}
                          </div>
                        )) : <p className="text-xs font-medium italic opacity-50" style={{ color: 'var(--admin-text-secondary)' }}>Nenhum cargo especial atribuído.</p>}
                      </div>
                      
                      {/* Atribuir cargo dropdown (styled) */}
                      {!selectedUser.roles.includes('SYSADMIN') && (
                        <div className="mt-4 p-4 rounded-2xl border" style={{ background: 'var(--admin-surface-alt)', borderColor: 'var(--admin-border)' }}>
                          <h5 className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--admin-text-primary)' }}>Promover cargo</h5>
                          
                          <div className="flex flex-col gap-2 mb-4 max-h-48 overflow-y-auto portal-scroll pr-1">
                            {GRANTABLE_ROLES.filter(r => !selectedUser.roles.includes(r)).map(r => (
                              <button
                                key={r}
                                onClick={() => setSelectedRoleToGrant(r)}
                                className={`flex items-center gap-3 p-2.5 rounded-xl text-left transition-all border-2 ${selectedRoleToGrant === r ? 'border-blue-500 bg-blue-500/10 shadow-sm' : 'border-transparent bg-[var(--admin-surface)] hover:border-slate-700'}`}
                              >
                                <div className="flex-1">
                                  <div className="flex justify-between items-center mb-1">
                                    <RoleBadge role={r} variant="chip" size="sm" />
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${selectedRoleToGrant === r ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                                      {ROLE_HIERARCHY[r]?.level}
                                    </span>
                                  </div>
                                  <p className={`text-[10px] ${selectedRoleToGrant === r ? 'text-blue-200' : 'text-slate-500'}`}>{ROLE_HIERARCHY[r]?.desc}</p>
                                </div>
                              </button>
                            ))}
                          </div>

                          <button onClick={() => {
                            if (selectedRoleToGrant && !selectedUser.roles.includes(selectedRoleToGrant)) {
                              setPinAction({ type: 'GRANT_ROLE', userId: selectedUser.id, role: selectedRoleToGrant, name: selectedUser.full_name });
                            }
                          }} className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl text-xs font-bold transition-colors shadow-lg shadow-blue-500/20">
                            Confirmar Promoção
                          </button>
                        </div>
                      )}
                    </section>

                    {/* Suspensão Notice se suspenso */}
                    {selectedUser.is_suspended && selectedUser.suspension_reason && (
                      <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5 shadow-inner">
                        <div className="flex items-center gap-2 mb-2 text-red-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                          <h4 className="text-xs font-black uppercase tracking-widest">Acesso Suspenso</h4>
                        </div>
                        <p className="text-sm text-red-200/80 mb-2">&ldquo;{selectedUser.suspension_reason}&rdquo;</p>
                        <p className="text-[10px] font-bold text-red-500/60 uppercase tracking-widest">Por {selectedUser.suspended_by_name} {selectedUser.suspended_until ? `até ${new Date(selectedUser.suspended_until).toLocaleDateString()}` : 'indefinidamente'}</p>
                      </div>
                    )}

                    {/* Ações Sensíveis */}
                    <section>
                      <h4 className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--admin-text-muted)' }}>Controle de Acesso</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setPinAction({ type: 'RESET_PIN', userId: selectedUser.id, name: selectedUser.full_name })}
                          className="flex flex-col items-start p-4 rounded-2xl border transition-all hover:bg-white/5 group" style={{ background: 'var(--admin-surface-alt)', borderColor: 'var(--admin-border)' }}>
                          <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div>
                          <span className="text-xs font-bold text-slate-200">Resetar PIN</span>
                          <span className="text-[10px] text-slate-500 mt-1">Exigirá novo PIN</span>
                        </button>
                        
                        {selectedUser.is_suspended ? (
                          <button onClick={() => setPinAction({ type: 'UNSUSPEND', userId: selectedUser.id, name: selectedUser.full_name })}
                            className="flex flex-col items-start p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 transition-all hover:bg-emerald-500/10 group">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                            <span className="text-xs font-bold text-emerald-400">Reativar Acesso</span>
                            <span className="text-[10px] text-emerald-500/60 mt-1">Remover suspensão</span>
                          </button>
                        ) : (
                          <button onClick={() => { setSuspendModalFor(selectedUser); setSuspendReason(''); }} disabled={selectedUser.roles.includes('SYSADMIN')}
                            className="flex flex-col items-start p-4 rounded-2xl border border-red-500/20 bg-red-500/5 transition-all hover:bg-red-500/10 group disabled:opacity-30">
                            <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg></div>
                            <span className="text-xs font-bold text-red-400">Suspender</span>
                            <span className="text-[10px] text-red-500/60 mt-1">Bloquear entrada</span>
                          </button>
                        )}
                      </div>
                    </section>

                    <section className="pt-4 border-t border-red-500/20">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-3">Zona de Perigo</h4>
                       <button onClick={() => setPinAction({ type: 'DELETE_USER', userId: selectedUser.id, name: selectedUser.full_name })} disabled={selectedUser.roles.includes('SYSADMIN')}
                          className="w-full flex items-center justify-between p-4 rounded-2xl border border-red-500/30 bg-red-950/20 hover:bg-red-900/40 transition-colors disabled:opacity-30">
                          <div className="text-left">
                            <p className="text-sm font-bold text-red-400">Excluir Conta Permanentemente</p>
                            <p className="text-[11px] text-red-400/60 mt-1">Remove acesso, perfil e dados vinculados.</p>
                          </div>
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                       </button>
                    </section>

                  </motion.div>
                )}

                {/* ABA: EDIÇÃO (CONTROLE TOTAL) */}
                {panelTab === 'edit' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1.5">Informações Básicas</label>
                        <div className="space-y-3">
                          <input value={editFullName} onChange={e => setEditFullName(e.target.value)} placeholder="Nome completo" className={inputCls} style={{ background: 'var(--admin-surface-alt)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-primary)' }} />
                          <input value={editChurchRole} onChange={e => setEditChurchRole(e.target.value)} placeholder="Função na igreja" className={inputCls} style={{ background: 'var(--admin-surface-alt)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-primary)' }} />
                          <input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="Telefone" className={inputCls} style={{ background: 'var(--admin-surface-alt)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-primary)' }} />
                        </div>
                      </div>

                      <button onClick={() => setPinAction({ type: 'UPDATE_PROFILE', userId: selectedUser.id, name: selectedUser.full_name, data: { full_name: editFullName, church_role: editChurchRole, phone: editPhone, roles: editRoles } })}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-blue-500/20 text-xs uppercase tracking-widest">
                        Salvar Informações Básicas
                      </button>
                    </div>

                    <div className="h-px w-full" style={{ background: 'var(--admin-border)' }} />

                    <div className="space-y-4">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1.5 flex items-center gap-2">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        Informações Sensíveis
                      </label>
                      
                      <div className="flex gap-2">
                        <input value={editNewEmail} onChange={e => setEditNewEmail(e.target.value)} type="email" placeholder="Novo E-mail" className={inputCls} style={{ background: 'var(--admin-surface-alt)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-primary)' }} />
                        <button onClick={() => setPinAction({ type: 'UPDATE_EMAIL', userId: selectedUser.id, newEmail: editNewEmail, name: selectedUser.full_name })} disabled={editNewEmail === selectedUser.email || !editNewEmail}
                          className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-4 rounded-xl text-xs transition-colors disabled:opacity-30 whitespace-nowrap">Alterar Email</button>
                      </div>

                      <div className="flex gap-2">
                        <input value={editNewPassword} onChange={e => setEditNewPassword(e.target.value)} type="password" placeholder="Nova Senha Direta" className={inputCls} style={{ background: 'var(--admin-surface-alt)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-primary)' }} />
                        <button onClick={() => setPinAction({ type: 'RESET_PASSWORD', userId: selectedUser.id, newPassword: editNewPassword, name: selectedUser.full_name })} disabled={editNewPassword.length < 8}
                          className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-4 rounded-xl text-xs transition-colors disabled:opacity-30 whitespace-nowrap">Forçar Senha</button>
                      </div>

                      <div className="flex gap-2">
                        <input value={editNewPinDirect} onChange={e => setEditNewPinDirect(e.target.value.replace(/\D/g, ''))} type="password" maxLength={4} placeholder="Novo PIN (4 dígitos)" className={inputCls} style={{ background: 'var(--admin-surface-alt)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-primary)' }} />
                        <button onClick={() => setPinAction({ type: 'UPDATE_PIN_DIRECT', userId: selectedUser.id, newPin: editNewPinDirect, name: selectedUser.full_name })} disabled={editNewPinDirect.length !== 4}
                          className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-4 rounded-xl text-xs transition-colors disabled:opacity-30 whitespace-nowrap">Forçar PIN</button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ABA: LOGS (TIMELINE) */}
                {panelTab === 'logs' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-8">
                    {loadingLogs ? (
                      <div className="flex justify-center py-12"><svg className="w-8 h-8 animate-spin text-slate-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg></div>
                    ) : logs.length === 0 ? (
                      <div className="text-center py-12 opacity-50"><svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Nenhum log registrado.</p></div>
                    ) : (
                      <div className="relative pl-4 space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                        {logs.map((log, i) => (
                          <div key={log.id} className="relative flex items-start gap-4">
                            <div className="absolute left-[-23px] top-1 w-3 h-3 rounded-full bg-[var(--admin-surface)] border-2 border-blue-500 z-10" />
                            <div className="flex-1 bg-white/[0.02] border border-[var(--admin-border)] p-4 rounded-2xl hover:bg-white/[0.04] transition-colors">
                               <div className="flex justify-between items-start mb-2">
                                 <span className="text-xs font-bold text-blue-400">{ACTION_LABELS[log.action] ?? log.action}</span>
                                 <span className="text-[10px] text-slate-500 font-bold whitespace-nowrap">{new Date(log.created_at).toLocaleDateString('pt-BR')} {new Date(log.created_at).toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'})}</span>
                               </div>
                               <p className="text-[11px] text-slate-400">Realizado por <strong className="text-slate-200">{log.actor_name}</strong></p>
                               {log.action === 'SUSPEND_ACCESS' && typeof log.new_data?.reason === 'string' && (
                                 <p className="text-[11px] text-red-400 mt-2 bg-red-500/10 p-2 rounded-lg border border-red-500/20 italic">&ldquo;{log.new_data.reason}&rdquo;</p>
                               )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Modal de Suspensão ── */}
      <AnimatePresence>
        {suspendModalFor && !pinAction && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
              <div className="px-6 py-5 border-b bg-red-500/5" style={{ borderColor: 'var(--admin-border)' }}>
                <h3 className="text-lg font-bold text-red-400 flex items-center gap-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> Suspender Acesso</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--admin-text-secondary)' }}>Bloqueando acesso de <strong style={{ color: 'var(--admin-text-primary)' }}>{suspendModalFor.full_name}</strong>.</p>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-red-400 mb-2">Justificativa <span className="text-red-500">*</span></label>
                  <textarea value={suspendReason} onChange={e => setSuspendReason(e.target.value)} rows={3} placeholder="Motivo da suspensão exibido ao usuário."
                    className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-red-500 resize-none transition-all" style={{ background: 'var(--admin-surface-alt)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-primary)' }} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-red-400 mb-2">Duração</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([ { value: '1d', label: '1 dia' }, { value: '7d', label: '7 dias' }, { value: '30d', label: '30 dias' }, { value: 'indefinido', label: 'Indefinido' } ] as { value: SuspendDuration; label: string }[]).map(opt => (
                      <label key={opt.value} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${suspendDuration === opt.value ? 'border-red-500 bg-red-500/10' : 'border-transparent hover:border-slate-700/50'}`} style={{ background: suspendDuration === opt.value ? '' : 'var(--admin-surface-alt)' }}>
                        <input type="radio" name="duration" value={opt.value} checked={suspendDuration === opt.value} onChange={() => setSuspendDuration(opt.value)} className="accent-red-500" />
                        <span className={`text-[13px] font-bold ${suspendDuration === opt.value ? 'text-red-400' : 'text-[var(--admin-text-primary)]'}`}>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <button onClick={() => setSuspendModalFor(null)} className="flex-1 py-3 font-bold rounded-xl hover:bg-white/5 transition-colors border text-slate-300" style={{ borderColor: 'var(--admin-border)' }}>Cancelar</button>
                <button onClick={handleConfirmSuspend} disabled={!suspendReason.trim()} className="flex-1 py-3 font-bold text-white rounded-xl disabled:opacity-40 bg-red-600 hover:bg-red-500 transition-colors">Avançar para PIN</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal Universal de Validação de PIN ── */}
      <AnimatePresence>
        {pinAction && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden border flex flex-col items-center p-8 text-center relative" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
              
              <button onClick={() => setPinAction(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mb-6 mt-4 shadow-[0_0_40px_rgba(59,130,246,0.3)]">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              
              <h3 className="text-xl font-black text-white mb-2">Validação de Segurança</h3>
              <p className="text-[13px] text-slate-400 mb-8 leading-relaxed">
                Você está prestes a realizar uma alteração crítica em <strong className="text-blue-400">{pinAction.name}</strong>. Insira seu PIN administrativo para confirmar.
              </p>

              <div className="w-full space-y-4">
                <input 
                  type="password" 
                  maxLength={4} 
                  value={pinInput} 
                  onChange={e => { setPinInput(e.target.value.replace(/\D/g, '')); setPinError(''); }}
                  placeholder="••••" 
                  className="w-full text-center text-4xl tracking-[1em] py-4 bg-slate-900/50 border border-slate-700 rounded-2xl focus:border-blue-500 focus:outline-none text-white font-black"
                  autoFocus
                />
                
                <AnimatePresence>
                  {pinError && (
                    <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-red-400 text-xs font-bold">{pinError}</motion.p>
                  )}
                </AnimatePresence>

                <button onClick={executePinAction} disabled={pinInput.length !== 4 || isPending}
                  className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-40 disabled:scale-100 active:scale-95 text-white shadow-lg"
                  style={{ background: pinAction.type === 'DELETE_USER' || pinAction.type === 'SUSPEND' ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                  {isPending ? 'Autenticando...' : 'Confirmar Execução'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
