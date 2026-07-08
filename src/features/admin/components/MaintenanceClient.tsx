'use client'

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Save, AlertTriangle, Power, Lock, UserX, Clock } from 'lucide-react';
import type { SiteMaintenance } from '@/features/core/hooks/use-maintenance';

interface Props {
  initialData: SiteMaintenance | null;
}

export function MaintenanceClient({ initialData }: Props) {
  const router = useRouter();
  const [data, setData] = useState<SiteMaintenance>(initialData || {
    is_portal_maintenance: false,
    is_sige_maintenance: false,
    block_logins: false,
    block_signups: false,
    scheduled_portal: true,
    scheduled_sige: false,
    auto_activate_scheduled: true,
    auto_deactivate_expected: false,
    message: 'O site está em manutenção. Voltaremos em breve.',
    scheduled_at: null,
    expected_end_at: null,
  });
  const [isPending, setIsPending] = useState(false);

  const supabase = createClient();

  // Sincronização automática on mount (se as regras de middleware já ativaram/desativaram)
  useEffect(() => {
    if (!initialData) return;
    const now = new Date();
    let updated = { ...initialData };

    if (updated.scheduled_at && updated.auto_activate_scheduled && new Date(updated.scheduled_at) <= now) {
      if (updated.scheduled_portal) updated.is_portal_maintenance = true;
      if (updated.scheduled_sige) updated.is_sige_maintenance = true;
      updated.scheduled_at = null; // Limpa o agendamento pois já ativou
    }

    if (updated.expected_end_at && updated.auto_deactivate_expected && new Date(updated.expected_end_at) <= now) {
      updated.is_portal_maintenance = false;
      updated.is_sige_maintenance = false;
      updated.expected_end_at = null; // Limpa pois já desativou
    }

    setData(updated);
  }, [initialData]);

  async function handleSave() {
    setIsPending(true);
    try {
      const { error } = await supabase
        .from('site_maintenance')
        .update({
          is_portal_maintenance: data.is_portal_maintenance,
          is_sige_maintenance: data.is_sige_maintenance,
          block_logins: data.block_logins,
          block_signups: data.block_signups,
          scheduled_at: data.scheduled_at || null,
          expected_end_at: data.expected_end_at || null,
          scheduled_portal: data.scheduled_portal,
          scheduled_sige: data.scheduled_sige,
          auto_activate_scheduled: data.auto_activate_scheduled,
          auto_deactivate_expected: data.auto_deactivate_expected,
          message: data.message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1);

      if (error) throw error;
      alert('Configurações atualizadas com sucesso! As mudanças já refletem no portal.');
      router.refresh();
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setIsPending(false);
    }
  }

  const formatDateTimeLocal = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'scheduled_at' | 'expected_end_at') => {
    const val = e.target.value;
    if (!val) {
      setData({ ...data, [field]: null });
      return;
    }
    const d = new Date(val);
    setData({ ...data, [field]: d.toISOString() });
  };
  
  const addMinutesToExpEnd = (minutes: number) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + minutes);
    setData({ ...data, expected_end_at: d.toISOString() });
  };

  return (
    <div className="space-y-6">
      
      {/* Bloco de Manutenção do Portal */}
      <div className={`p-6 rounded-3xl border transition-colors ${data.is_portal_maintenance ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-800/30 border-slate-700'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${data.is_portal_maintenance ? 'bg-red-500/20 text-red-500' : 'bg-slate-800 text-slate-400'}`}>
              <Power className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--admin-text-primary)' }}>Manutenção do Portal</h2>
              <p className="text-sm" style={{ color: 'var(--admin-text-secondary)' }}>Derruba todo o portal público e, consequentemente, o sistema SIGE.</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={data.is_portal_maintenance} onChange={e => setData({ ...data, is_portal_maintenance: e.target.checked })} />
            <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-500"></div>
          </label>
        </div>
      </div>

      {/* Bloco de Manutenção do SIGE */}
      <div className={`p-6 rounded-3xl border transition-colors ${data.is_sige_maintenance ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-800/30 border-slate-700'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${data.is_sige_maintenance ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-800 text-slate-400'}`}>
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--admin-text-primary)' }}>Manutenção Interna (SIGE)</h2>
              <p className="text-sm" style={{ color: 'var(--admin-text-secondary)' }}>Bloqueia apenas o acesso ao sistema administrativo. Portal público continua funcionando.</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={data.is_sige_maintenance} onChange={e => setData({ ...data, is_sige_maintenance: e.target.checked })} />
            <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>
      </div>

      {/* Controles Secundários */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl border border-slate-700 bg-slate-800/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <UserX className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-white">Bloquear Cadastros</h3>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={data.block_signups} onChange={e => setData({ ...data, block_signups: e.target.checked })} />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
          <p className="text-sm text-slate-400 mt-2">Impede a criação de novas contas no site.</p>
        </div>

        <div className="p-6 rounded-3xl border border-slate-700 bg-slate-800/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-white">Bloquear Logins</h3>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={data.block_logins} onChange={e => setData({ ...data, block_logins: e.target.checked })} />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
          <p className="text-sm text-slate-400 mt-2">Derruba o acesso de usuários comuns. Apenas SysAdmins poderão logar.</p>
        </div>
      </div>

      {/* Agendamento e Mensagem */}
      <div className="p-6 rounded-3xl border border-slate-700 bg-slate-800/30 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 font-bold mb-2 text-white">
              <Clock className="w-4 h-4 text-slate-400" />
              Agendar Manutenção Futura
            </label>
            <input 
              type="datetime-local" 
              value={formatDateTimeLocal(data.scheduled_at)}
              onChange={e => handleDateChange(e, 'scheduled_at')}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-slate-400 mt-2">
              Os usuários verão contagem regressiva no topo da tela antes deste horário.
            </p>

            <div className="mt-4 space-y-3 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-slate-300">Aplicar agendamento ao Portal</span>
                <input type="checkbox" className="sr-only peer" checked={data.scheduled_portal} onChange={e => setData({ ...data, scheduled_portal: e.target.checked })} />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-slate-300">Aplicar agendamento ao SIGE</span>
                <input type="checkbox" className="sr-only peer" checked={data.scheduled_sige} onChange={e => setData({ ...data, scheduled_sige: e.target.checked })} />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
              <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-700/50">
                <span className="text-sm text-amber-200 font-semibold">Ativar Automaticamente</span>
                <input type="checkbox" className="sr-only peer" checked={data.auto_activate_scheduled} onChange={e => setData({ ...data, auto_activate_scheduled: e.target.checked })} />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 font-bold mb-2 text-white">
              <Clock className="w-4 h-4 text-slate-400" />
              Previsão de Término
            </label>
            <input 
              type="datetime-local" 
              value={formatDateTimeLocal(data.expected_end_at)}
              onChange={e => handleDateChange(e, 'expected_end_at')}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            />
            <div className="flex gap-2 mt-2">
              <button type="button" onClick={() => addMinutesToExpEnd(30)} className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-white">+ 30m</button>
              <button type="button" onClick={() => addMinutesToExpEnd(60)} className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-white">+ 1h</button>
              <button type="button" onClick={() => addMinutesToExpEnd(120)} className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-white">+ 2h</button>
            </div>
            
            <div className="mt-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-green-400 font-semibold">Desativar Automaticamente</span>
                <input type="checkbox" className="sr-only peer" checked={data.auto_deactivate_expected} onChange={e => setData({ ...data, auto_deactivate_expected: e.target.checked })} />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block font-bold mb-2 text-white">Mensagem da Tela de Manutenção</label>
          <textarea 
            rows={3}
            value={data.message}
            onChange={e => setData({ ...data, message: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

      </div>

      {/* Ações */}
      <div className="flex justify-end pt-4">
        <button 
          onClick={handleSave} 
          disabled={isPending}
          className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50"
        >
          {isPending ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : (
            <Save className="w-5 h-5" />
          )}
          Salvar Configurações
        </button>
      </div>

    </div>
  );
}
