'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, User, Shield, AlertTriangle, Key, Ban, 
  Calendar, MessageSquare, Ticket, FileText, Activity, LogOut,
  Camera, Upload
} from 'lucide-react';
import { AdminMemberRow } from './types';
import { 
  adminUpdateUserProfile, adminUpdateUserAuth, adminBanUser 
} from '../actions/admin-users';
import { 
  getAdminMemberExtraData, adminAddMemberNote, adminResetPinAndOnboarding 
} from '../actions/admin-member-details';
import { createClient } from '@/lib/supabase/client';
import { adminMassForceLogout } from '../actions/admin-users';

export function AdminMemberPanel({ 
  member, 
  currentUserIsSysAdmin,
  currentUserId 
}: { 
  member: AdminMemberRow; 
  currentUserIsSysAdmin: boolean;
  currentUserId: string;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'crm' | 'communications' | 'support' | 'security' | 'punishments' | 'audit'>('overview');

  const isChurchAdmin = member.roles?.includes('CHURCH_ADMIN');
  const isLeader = member.roles?.includes('LEADER');
  const canEdit = currentUserIsSysAdmin || !isChurchAdmin;
  const isSelf = currentUserId === member.id;

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // extra data
  const [extra, setExtra] = useState<any>(null);
  const [fetchingExtra, setFetchingExtra] = useState(true);

  // overview states
  const [fullName, setFullName] = useState(member.full_name || '');
  const [phone, setPhone] = useState(member.phone || '');
  const [address, setAddress] = useState(member.address || '');
  const [birthDate, setBirthDate] = useState(member.birth_date || '');
  const [gender, setGender] = useState(member.gender || '');
  const [maritalStatus, setMaritalStatus] = useState(member.marital_status || '');
  const [photoUrl, setPhotoUrl] = useState(member.photo_url || '');

  // security states
  const [email, setEmail] = useState(member.email || '');
  const [password, setPassword] = useState('');
  const [forcePasswordChange, setForcePasswordChange] = useState(member.requires_password_change);

  // ban states
  const [banDate, setBanDate] = useState(member.banned_until ? new Date(member.banned_until).toISOString().split('T')[0] : '');
  const [banReason, setBanReason] = useState(member.ban_reason || '');
  const [bannedModules, setBannedModules] = useState<string[]>(member.banned_modules || []);

  // crm states
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    getAdminMemberExtraData(member.id).then(res => {
      if (res.data) setExtra(res.data);
      setFetchingExtra(false);
    });
  }, [member.id]);

  const handleUpdateProfile = async () => {
    setLoading(true);
    setMsg('');
    const res = await adminUpdateUserProfile(member.id, {
      fullName, phone, address, photoUrl, 
      birthDate: birthDate || undefined, 
      gender: gender || undefined, 
      maritalStatus: maritalStatus || undefined
    });
    if (res.error) setMsg(res.error);
    else setMsg('Perfil atualizado com sucesso.');
    setLoading(false);
  };

  const handleUpdateAuth = async () => {
    setLoading(true);
    setMsg('');
    const res = await adminUpdateUserAuth(member.id, {
      email,
      password: password || undefined,
      requiresPasswordChange: forcePasswordChange
    });
    if (res.error) setMsg(res.error);
    else setMsg('Credenciais atualizadas com sucesso.');
    setLoading(false);
  };

  const handleBan = async () => {
    setLoading(true);
    setMsg('');
    const res = await adminBanUser(member.id, {
      bannedUntil: banDate ? new Date(banDate).toISOString() : null,
      reason: banReason,
      bannedModules
    });
    if (res.error) setMsg(res.error);
    else setMsg('Status de banimento atualizado.');
    setLoading(false);
  };

  const handleAddNote = async () => {
    if (!newNote) return;
    setLoading(true);
    const res = await adminAddMemberNote(member.id, newNote);
    if (!res.error) {
      setNewNote('');
      // refetch
      const ex = await getAdminMemberExtraData(member.id);
      if (ex.data) setExtra(ex.data);
    }
    setLoading(false);
  };

  const handleResetPin = async () => {
    if(confirm('Tem certeza que deseja resetar o PIN e o Onboarding deste usuário?')) {
      setLoading(true);
      const res = await adminResetPinAndOnboarding(member.id);
      if (res.error) setMsg(res.error);
      else setMsg('PIN e Onboarding resetados com sucesso.');
      setLoading(false);
    }
  };

  const handleForceLogout = async () => {
    if(confirm('Derrubar todas as sessões deste usuário?')) {
      setLoading(true);
      await adminMassForceLogout([member.id]);
      setMsg('Logout forçado ativado.');
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const supabase = createClient();
    const ext = file.name.split('.').pop();
    const fileName = `${member.id}-${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from('avatars').upload(fileName, file);
    if (!error && data) {
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.path);
      setPhotoUrl(urlData.publicUrl);
    }
    setLoading(false);
  };

  const tabs = [
    { id: 'overview', icon: User, label: 'Visão Geral' },
    { id: 'events', icon: Calendar, label: 'Eventos & Finanças' },
    { id: 'crm', icon: FileText, label: 'Anotações (CRM)' },
    { id: 'communications', icon: MessageSquare, label: 'Comunicações' },
    { id: 'support', icon: Ticket, label: 'Suporte' },
    { id: 'security', icon: Key, label: 'Segurança' },
    { id: 'punishments', icon: Ban, label: 'Punições' },
    { id: 'audit', icon: Activity, label: 'Auditoria' },
  ] as const;

  return (
    <div className="space-y-6">
      <Link href="/membros" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6 relative">
        <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-white/10 overflow-hidden relative group">
          {photoUrl ? (
            <img src={photoUrl} alt={member.full_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-slate-400">{member.full_name.charAt(0)}</span>
          )}
          {canEdit && (
            <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <Camera className="w-6 h-6 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={loading} />
            </label>
          )}
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">{member.full_name}</h1>
          <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
            {isChurchAdmin && <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 text-xs font-bold rounded-md">Admin</span>}
            {isLeader && <span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 text-xs font-bold rounded-md">Líder</span>}
            {!isChurchAdmin && !isLeader && <span className="px-2 py-1 bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300 text-xs font-bold rounded-md">Membro</span>}
            {member.banned_until && <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 text-xs font-bold rounded-md">Banido</span>}
            {member.force_logout && <span className="px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 text-xs font-bold rounded-md">Sessão Interceptada</span>}
          </div>
        </div>

        <div className="flex flex-col gap-2 items-center md:items-end text-sm">
          {extra?.lastSignInAt && (
            <span className="text-slate-500 dark:text-slate-400">
              Último login: <strong className="text-slate-900 dark:text-white">{new Date(extra.lastSignInAt).toLocaleString()}</strong>
            </span>
          )}
          <span className="text-slate-500 dark:text-slate-400">
            Cadastrado em: <strong className="text-slate-900 dark:text-white">{new Date(member.created_at).toLocaleDateString()}</strong>
          </span>
        </div>
      </div>

      {!canEdit && !isSelf && (
        <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl text-amber-800 dark:text-amber-400 text-sm font-medium flex gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          Você não tem permissão para editar os dados deste administrador.
        </div>
      )}

      {msg && (
        <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl text-blue-800 dark:text-blue-400 text-sm font-medium">
          {msg}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Menu */}
        <div className="w-full md:w-64 flex flex-col gap-1 shrink-0 bg-white dark:bg-slate-900 p-3 rounded-3xl border border-slate-200 dark:border-white/10">
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button 
                key={t.id}
                onClick={() => setActiveTab(t.id)} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${isActive ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5'}`}
              >
                <Icon className="w-5 h-5"/> {t.label}
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-white/10 shadow-sm min-h-[500px]">
          
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Dados Biográficos e Contato</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                  <input type="text" value={fullName} onChange={e=>setFullName(e.target.value)} disabled={!canEdit} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone</label>
                  <input type="text" value={phone} onChange={e=>setPhone(e.target.value)} disabled={!canEdit} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Endereço</label>
                  <input type="text" value={address} onChange={e=>setAddress(e.target.value)} disabled={!canEdit} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data de Nascimento</label>
                  <input type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)} disabled={!canEdit} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gênero</label>
                  <select value={gender} onChange={e=>setGender(e.target.value)} disabled={!canEdit} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Não informado</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                    <option value="OTHER">Outro</option>
                    <option value="PREFER_NOT_TO_SAY">Prefiro não dizer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Estado Civil</label>
                  <select value={maritalStatus} onChange={e=>setMaritalStatus(e.target.value)} disabled={!canEdit} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Não informado</option>
                    <option value="SINGLE">Solteiro(a)</option>
                    <option value="MARRIED">Casado(a)</option>
                    <option value="DIVORCED">Divorciado(a)</option>
                    <option value="WIDOWED">Viúvo(a)</option>
                    <option value="OTHER">Outro</option>
                  </select>
                </div>
              </div>

              {canEdit && (
                <button onClick={handleUpdateProfile} disabled={loading} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-md">
                  Salvar Alterações
                </button>
              )}
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Histórico de Inscrições</h3>
              {fetchingExtra ? <p>Carregando...</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400">
                        <th className="pb-3 pr-4 font-semibold">Evento</th>
                        <th className="pb-3 px-4 font-semibold">Data da Inscrição</th>
                        <th className="pb-3 px-4 font-semibold">Status Pagto.</th>
                        <th className="pb-3 pl-4 font-semibold text-right">Recibo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extra?.events?.length === 0 ? (
                        <tr><td colSpan={4} className="py-4 text-center text-slate-500">Nenhuma inscrição encontrada.</td></tr>
                      ) : extra?.events?.map((ev: any) => (
                        <tr key={ev.id} className="border-b border-slate-100 dark:border-white/5">
                          <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-white">{ev.events?.title || 'Evento Excluído'}</td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{new Date(ev.created_at).toLocaleDateString()}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-slate-100 dark:bg-white/10 rounded-md text-xs font-bold uppercase">
                              {ev.payment_status}
                            </span>
                          </td>
                          <td className="py-3 pl-4 text-right">
                            {ev.receipt_url ? (
                              <a href={ev.receipt_url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 font-semibold text-sm hover:underline">
                                Ver Recibo
                              </a>
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'crm' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Anotações Privadas (CRM)</h3>
              <p className="text-sm text-slate-500">Anotações visíveis apenas para Administradores.</p>
              
              {canEdit && (
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newNote} 
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Adicionar nova nota..."
                    className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button onClick={handleAddNote} disabled={loading || !newNote} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all">
                    Adicionar
                  </button>
                </div>
              )}

              <div className="space-y-3 mt-4">
                {fetchingExtra ? <p>Carregando...</p> : extra?.notes?.length === 0 ? (
                  <p className="text-slate-500">Nenhuma anotação.</p>
                ) : extra?.notes?.map((n: any) => (
                  <div key={n.id} className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
                    <p className="text-slate-900 dark:text-white text-sm mb-2">{n.note_text}</p>
                    <p className="text-xs text-slate-500">Por <strong>{n.admin?.full_name || 'Admin'}</strong> em {new Date(n.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'communications' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Caixa de Entrada e Alertas</h3>
              {fetchingExtra ? <p>Carregando...</p> : (
                <div className="space-y-3">
                  {extra?.notifications?.length === 0 ? (
                    <p className="text-slate-500">Nenhuma mensagem recebida.</p>
                  ) : extra?.notifications?.map((notif: any) => (
                    <div key={notif.id} className={`p-4 border rounded-xl ${notif.is_read ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-500/30'}`}>
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-slate-900 dark:text-white">{notif.communications?.title}</h4>
                        <span className="text-xs text-slate-500">
                          {notif.is_read ? `Lido em ${new Date(notif.read_at).toLocaleDateString()}` : 'Não Lido'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{notif.communications?.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'support' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Chamados de Suporte</h3>
              {fetchingExtra ? <p>Carregando...</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400">
                        <th className="pb-3 pr-4 font-semibold">Assunto</th>
                        <th className="pb-3 px-4 font-semibold">Status</th>
                        <th className="pb-3 pl-4 font-semibold text-right">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extra?.tickets?.length === 0 ? (
                        <tr><td colSpan={3} className="py-4 text-center text-slate-500">Nenhum chamado aberto.</td></tr>
                      ) : extra?.tickets?.map((t: any) => (
                        <tr key={t.id} className="border-b border-slate-100 dark:border-white/5">
                          <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-white">{t.subject}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-slate-100 dark:bg-white/10 rounded-md text-xs font-bold uppercase">
                              {t.status}
                            </span>
                          </td>
                          <td className="py-3 pl-4 text-right text-slate-600 dark:text-slate-400">
                            {new Date(t.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8 max-w-2xl">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Credenciais de Acesso</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email (Login)</label>
                    <input type="email" value={email} onChange={e=>setEmail(e.target.value)} disabled={!canEdit} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Forçar Nova Senha Manual</label>
                    <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Deixe em branco para não alterar" disabled={!canEdit} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  
                  <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl cursor-pointer">
                    <input type="checkbox" checked={forcePasswordChange} onChange={e=>setForcePasswordChange(e.target.checked)} disabled={!canEdit} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">Exigir troca de senha no Login</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">O usuário será bloqueado até redefinir a senha.</p>
                    </div>
                  </label>

                  {canEdit && (
                    <button onClick={handleUpdateAuth} disabled={loading} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-md">
                      Atualizar Segurança
                    </button>
                  )}
                </div>
              </div>

              {canEdit && (
                <div className="pt-8 border-t border-slate-200 dark:border-white/10">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Controles Avançados</h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={handleResetPin} disabled={loading} className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-xl transition-all border border-slate-200 dark:border-white/10 text-sm text-center flex-1">
                      Resetar PIN e Onboarding
                    </button>
                    <button onClick={handleForceLogout} disabled={loading} className="px-4 py-3 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-700 dark:text-red-400 font-bold rounded-xl transition-all border border-red-200 dark:border-red-500/30 text-sm flex items-center justify-center gap-2 flex-1">
                      <LogOut className="w-4 h-4" /> Derrubar Sessões
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'punishments' && (
            <div className="space-y-8 max-w-2xl">
              <div>
                <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">Banimento Global</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Ao banir, o usuário não acessará NADA. Deixe a data vazia para remover.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Banido Até (Data Limite)</label>
                    <input type="date" value={banDate} onChange={e=>setBanDate(e.target.value)} disabled={!canEdit} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Motivo</label>
                    <textarea value={banReason} onChange={e=>setBanReason(e.target.value)} disabled={!canEdit} rows={2} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none" />
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-200 dark:border-white/10">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Restrições Modulares</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Impede o acesso apenas a rotas específicas, inclusive públicas.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'financeiro', label: 'Painel Financeiro' },
                    { id: 'midias', label: 'Painel de Mídias' },
                    { id: 'agenda', label: 'Agenda Pública' },
                    { id: 'comprovante', label: 'Comprovantes Públicos' },
                    { id: 'portal', label: 'Portal Básico' },
                  ].map(module => (
                    <label key={module.id} className="flex items-center gap-3 p-3 border border-slate-200 dark:border-white/10 rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-800/50">
                      <input 
                        type="checkbox" 
                        disabled={!canEdit}
                        checked={bannedModules.includes(module.id)} 
                        onChange={e => {
                          if (e.target.checked) setBannedModules([...bannedModules, module.id]);
                          else setBannedModules(bannedModules.filter(m => m !== module.id));
                        }}
                        className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500" 
                      />
                      <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">{module.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {canEdit && (
                <button onClick={handleBan} disabled={loading} className="w-full sm:w-auto px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/20">
                  Salvar Restrições
                </button>
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Logs de Auditoria</h3>
              {fetchingExtra ? <p>Carregando...</p> : (
                <div className="space-y-4 border-l-2 border-slate-200 dark:border-white/10 pl-4 ml-2">
                  {extra?.logs?.length === 0 ? (
                    <p className="text-slate-500">Nenhum log registrado para este usuário.</p>
                  ) : extra?.logs?.map((log: any) => (
                    <div key={log.id} className="relative">
                      <div className="absolute -left-6 top-1.5 w-3 h-3 bg-slate-300 dark:bg-slate-600 rounded-full border-2 border-white dark:border-slate-900" />
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{log.action} <span className="text-slate-500 font-normal">em {log.resource_type}</span></p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
