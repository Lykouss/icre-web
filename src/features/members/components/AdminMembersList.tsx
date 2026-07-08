'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, MoreVertical, ShieldAlert, Ban, ShieldCheck, Mail, ShieldHalf, CheckSquare, LogOut, KeyRound } from 'lucide-react';
import { AdminMemberRow } from './types';
import { adminMassForceLogout, adminMassRequirePassword, adminMassBan } from '../actions/admin-users';

export function AdminMembersList({ initialMembers }: { initialMembers: AdminMemberRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const filtered = initialMembers.filter(m => {
    if (search) {
      const q = search.toLowerCase();
      if (!m.full_name?.toLowerCase().includes(q) && !m.email?.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (filterRole !== 'ALL') {
      if (filterRole === 'BANNED' && !m.banned_until) return false;
      if (filterRole === 'LEADER' && !m.roles?.includes('LEADER')) return false;
      if (filterRole === 'CHURCH_ADMIN' && !m.roles?.includes('CHURCH_ADMIN')) return false;
      if (filterRole === 'MEMBER' && m.roles?.length > 0) return false; 
    }
    return true;
  });

  const allSelected = filtered.length > 0 && selected.length === filtered.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected([]);
    } else {
      setSelected(filtered.map(m => m.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleMassAction = async (action: 'logout' | 'password' | 'ban') => {
    if (!selected.length) return;
    setLoading(true);
    let res;
    if (action === 'logout') {
      if(confirm(`Tem certeza que deseja forçar a desconexão de ${selected.length} usuário(s)?`)) {
        res = await adminMassForceLogout(selected);
      }
    } else if (action === 'password') {
      if(confirm(`Exigir troca de senha para ${selected.length} usuário(s)?`)) {
        res = await adminMassRequirePassword(selected);
      }
    } else if (action === 'ban') {
      const reason = prompt('Motivo do banimento em massa (ou deixe em branco):');
      if (reason !== null) {
        // Ban for 100 years basically
        const until = new Date();
        until.setFullYear(until.getFullYear() + 100);
        res = await adminMassBan(selected, until.toISOString(), reason);
      }
    }
    
    setLoading(false);
    if (res && res.error) {
      alert(res.error);
    } else if (res) {
      setSelected([]);
      router.refresh();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-white/10 overflow-hidden relative">
      
      {/* Dashboard Analytics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-white/10">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total de Contas</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{initialMembers.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-white/10">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Church Admins</p>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {initialMembers.filter(m => m.roles?.includes('CHURCH_ADMIN')).length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-white/10">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Líderes de Célula</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {initialMembers.filter(m => m.roles?.includes('LEADER')).length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-white/10">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Contas Banidas</p>
          <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
            {initialMembers.filter(m => !!m.banned_until).length}
          </p>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="absolute top-6 right-6 left-6 z-10 bg-blue-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-xl animate-in slide-in-from-top-4">
          <div className="flex items-center gap-2 font-bold">
            <CheckSquare className="w-5 h-5" />
            {selected.length} selecionado(s)
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleMassAction('password')} disabled={loading} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors">
              <KeyRound className="w-4 h-4" /> Exigir Senha
            </button>
            <button onClick={() => handleMassAction('logout')} disabled={loading} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors">
              <LogOut className="w-4 h-4" /> Desconectar
            </button>
            <button onClick={() => handleMassAction('ban')} disabled={loading} className="px-3 py-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors">
              <Ban className="w-4 h-4" /> Banir
            </button>
            <button onClick={() => setSelected([])} className="px-3 py-1.5 border border-white/20 hover:bg-white/10 rounded-lg text-sm font-semibold transition-colors ml-2">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            />
          </div>
          <select 
            value={filterRole} 
            onChange={e => setFilterRole(e.target.value)}
            className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="ALL">Todos</option>
            <option value="MEMBER">Membros (Apenas)</option>
            <option value="LEADER">Líderes</option>
            <option value="CHURCH_ADMIN">Church Admins</option>
            <option value="BANNED">Banidos</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10">
                <th className="pb-3 px-4 w-12">
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                </th>
                <th className="pb-3 text-sm font-semibold text-slate-500 dark:text-slate-400 px-4">Membro</th>
                <th className="pb-3 text-sm font-semibold text-slate-500 dark:text-slate-400 px-4">Permissão</th>
                <th className="pb-3 text-sm font-semibold text-slate-500 dark:text-slate-400 px-4">Status</th>
                <th className="pb-3 text-sm font-semibold text-slate-500 dark:text-slate-400 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const isBanned = !!m.banned_until;
                const isChurchAdmin = m.roles?.includes('CHURCH_ADMIN');
                const isLeader = m.roles?.includes('LEADER');
                const isSelected = selected.includes(m.id);

                return (
                  <tr key={m.id} className={`border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                    <td className="py-4 px-4">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleSelect(m.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 dark:border-white/10">
                          {m.photo_url ? (
                            <img src={m.photo_url} alt={m.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-slate-500 font-bold text-sm">{m.full_name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{m.full_name}</p>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <Mail className="w-3 h-3" />
                            <span className="line-clamp-1">{m.email || 'Sem email'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {isChurchAdmin ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                          <ShieldCheck className="w-3 h-3" /> Admin
                        </span>
                      ) : isLeader ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                          <ShieldHalf className="w-3 h-3" /> Líder
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                          Membro
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {isBanned ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400">
                          <Ban className="w-4 h-4" /> Banido
                        </span>
                      ) : m.requires_password_change ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                          <ShieldAlert className="w-4 h-4" /> Senha Exp.
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Ativo
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link 
                        href={`/membros/${m.id}`}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/20 transition-all text-slate-700 dark:text-slate-200 shadow-sm"
                      >
                        Gerenciar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhum membro encontrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
