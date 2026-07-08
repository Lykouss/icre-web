'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Copy, RefreshCw } from 'lucide-react';
import { adminCreateUser } from '../actions/admin-users';

export function NewAccountForm({ isSysAdmin }: { isSysAdmin: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('MEMBER');
  
  const [showPassword, setShowPassword] = useState(false);

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
    let pass = '';
    for(let i=0; i<12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  const copyPassword = () => {
    if (password) {
      navigator.clipboard.writeText(password);
      alert('Senha copiada para a área de transferência!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    setLoading(true);
    setError('');

    const res = await adminCreateUser({ fullName, email, password, role });
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push('/membros');
      router.refresh();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo *</label>
          <input 
            type="text" 
            required 
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email de Acesso *</label>
          <input 
            type="email" 
            required 
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha Inicial *</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input 
                type={showPassword ? 'text' : 'password'} 
                required 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
              </button>
            </div>
            <button type="button" onClick={generatePassword} title="Gerar senha aleatória" className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10 transition-colors">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button type="button" onClick={copyPassword} title="Copiar senha" className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10 transition-colors">
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Papel / Nível de Acesso</label>
          <select 
            value={role} 
            onChange={e => setRole(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="MEMBER">Membro (Apenas APP e Portal Básico)</option>
            <option value="LEADER">Líder (Pode gerenciar sua Célula)</option>
            <option value="CHURCH_ADMIN">Church Admin (Acesso Completo ao Painel)</option>
            {isSysAdmin && <option value="SYSADMIN">SysAdmin (Desenvolvedor/Dono)</option>}
          </select>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
        >
          {loading ? 'Criando Conta...' : 'Criar Conta'}
        </button>
      </form>
    </div>
  );
}
