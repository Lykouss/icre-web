'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dispatchCommunication, CommunicationType, AudienceFilter, searchUsers } from '../actions/communications';
import { useRouter } from 'next/navigation';
import { useToast } from './ToastContext';
import { AppRole } from '../api/get-current-user';
import { createClient } from '@/lib/supabase/client';
import { Search, X, Loader2, Globe, Users, Calendar, AlertCircle, Shield, Mail, UserPlus, Info, AlertTriangle, Wrench, ShieldAlert } from 'lucide-react';

const AUDIENCES = [
  { id: 'ALL', icon: Globe, title: 'Todos os Usuários', desc: 'Qualquer usuário com conta no sistema' },
  { id: 'NON_ADMINS', icon: Users, title: 'Apenas Membros', desc: 'Exclui liderança e administradores' },
  { id: 'EVENT_SUBSCRIBERS', icon: Calendar, title: 'Inscritos em Evento', desc: 'Participantes de um evento específico' },
  { id: 'PENDING_PAYMENT', icon: AlertCircle, title: 'Pagamento Pendente', desc: 'Quem iniciou inscrição mas não pagou' },
  { id: 'UNVERIFIED_EMAIL', icon: Mail, title: 'Email Não Verificado', desc: 'Contas aguardando confirmação de email' },
  { id: 'ROLES', icon: Shield, title: 'Cargos Específicos', desc: 'Direcionar a cargos administrativos' },
  { id: 'MANUAL', icon: UserPlus, title: 'Seleção Manual', desc: 'Escolher destinatários individualmente' }
] as const;

export function CommunicationsManager() {
  const [activeTab, setActiveTab] = useState<'avisos' | 'inbox'>('avisos');
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<CommunicationType>('INFO');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [lockDuration, setLockDuration] = useState(0);
  const [audienceType, setAudienceType] = useState<AudienceFilter['type']>('ALL');
  const [scheduledFor, setScheduledFor] = useState('');

  // Audience specific states
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [events, setEvents] = useState<{id: string, title: string}[]>([]);

  // Manual Selection states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{id: string, name: string, email: string}[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedManualUsers, setSelectedManualUsers] = useState<{id: string, name: string, email: string}[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    if (audienceType === 'EVENT_SUBSCRIBERS') {
      const fetchEvents = async () => {
        const supabase = createClient();
        const { data } = await supabase.from('events').select('id, title').order('created_at', { ascending: false }).limit(20);
        if (data) setEvents(data);
      };
      fetchEvents();
    }
  }, [audienceType]);

  // Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const doSearch = async () => {
      setSearching(true);
      const res = await searchUsers(debouncedQuery);
      setSearchResults(res);
      setSearching(false);
    };
    doSearch();
  }, [debouncedQuery]);

  const handleSelectManualUser = (user: {id: string, name: string, email: string}) => {
    if (!selectedManualUsers.find(u => u.id === user.id)) {
      setSelectedManualUsers(prev => [...prev, user]);
    }
    setSearchQuery('');
  };

  const handleRemoveManualUser = (id: string) => {
    setSelectedManualUsers(prev => prev.filter(u => u.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (audienceType === 'MANUAL' && selectedManualUsers.length === 0) {
      toast('error', 'Selecione ao menos um usuário para o envio manual.');
      return;
    }

    setLoading(true);
    
    const audience: AudienceFilter = { 
      type: audienceType,
      userIds: audienceType === 'MANUAL' ? selectedManualUsers.map(u => u.id) : undefined,
      roles: audienceType === 'ROLES' ? selectedRoles : undefined,
      eventId: audienceType === 'EVENT_SUBSCRIBERS' ? selectedEventId : undefined,
    };
    
    const payload = {
      type: activeTab === 'inbox' ? 'DIRECT_MESSAGE' : type,
      title,
      message,
      lockDurationSeconds: activeTab === 'inbox' ? 0 : lockDuration,
      audience,
      scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null,
    };

    const res = await dispatchCommunication(payload as any);
    
    if (res.success) {
      toast('success', 'Comunicação disparada com sucesso!');
      setTitle('');
      setMessage('');
      setLockDuration(0);
      setScheduledFor('');
      setSelectedManualUsers([]);
      setSearchQuery('');
    } else {
      toast('error', res.error || 'Erro ao disparar comunicação.');
    }
    setLoading(false);
  };

  const toggleRole = (r: AppRole) => {
    setSelectedRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const router = useRouter();

  const inputClass = "w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";

  return (
    <div className="max-w-4xl mx-auto py-8">
      <header className="mb-8">
        <div className="mb-6">
          <button onClick={() => router.push('/sysadmin')} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors text-sm font-bold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Voltar para SysAdmin
          </button>
        </div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100">Central de Comunicações</h1>
        <p className="text-slate-500 mt-2">Dispare avisos globais em tempo real, defina agendamentos ou envie mensagens para a caixa de entrada.</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('avisos')}
          className={`pb-2 px-1 font-bold text-sm transition-colors border-b-2 ${activeTab === 'avisos' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
        >
          Avisos Globais
        </button>
        <button
          onClick={() => setActiveTab('inbox')}
          className={`pb-2 px-1 font-bold text-sm transition-colors border-b-2 ${activeTab === 'inbox' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
        >
          Mensagens Diretas
        </button>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          {activeTab === 'avisos' && (
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Tipo de Aviso</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { id: 'INFO', icon: Info, label: 'Informação' },
                  { id: 'WARNING', icon: AlertTriangle, label: 'Aviso' },
                  { id: 'MAINTENANCE', icon: Wrench, label: 'Manutenção' },
                  { id: 'ALERT', icon: ShieldAlert, label: 'Alerta Crítico' }
                ].map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id as any)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${type === t.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${type === t.id ? 'text-blue-500' : 'text-slate-400'}`} />
                      <span className={`block text-xs font-bold ${type === t.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Título da Mensagem</label>
              <input
                required
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className={inputClass}
                placeholder="Ex: Culto Cancelado"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Agendamento</label>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={e => setScheduledFor(e.target.value)}
                className={inputClass}
              />
              <p className="text-xs text-slate-500 mt-2">Deixe em branco para disparar imediatamente.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Conteúdo</label>
            <textarea
              required
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              className={`${inputClass} resize-none`}
              placeholder="Digite a mensagem que aparecerá para os usuários..."
            />
          </div>

          {activeTab === 'avisos' && (
            <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/50">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tempo de Bloqueio de Tela: {lockDuration}s</label>
              <input
                type="range"
                min="0"
                max="15"
                value={lockDuration}
                onChange={e => setLockDuration(Number(e.target.value))}
                className="w-full mt-3 accent-blue-600"
              />
              <p className="text-xs text-slate-500 mt-2">Obriga o usuário a ler o aviso por este tempo antes de poder fechar a janela.</p>
            </div>
          )}

          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Audiência Alvo</label>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
              {AUDIENCES.map(aud => {
                const Icon = aud.icon;
                const isSelected = audienceType === aud.id;
                return (
                  <button
                    key={aud.id}
                    type="button"
                    onClick={() => setAudienceType(aud.id as any)}
                    className={`relative p-3 rounded-xl border-2 text-left transition-all group ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-500 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-blue-500' : 'text-slate-400 group-hover:text-blue-400'}`} />
                    <span className={`block text-xs font-bold leading-tight ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300'}`}>
                      {aud.title}
                    </span>
                    <span className="block text-[10px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-snug">
                      {aud.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Configurações Dinâmicas da Audiência */}
            <AnimatePresence mode="wait">
              {audienceType === 'MANUAL' && (
                <motion.div key="manual-search" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="overflow-visible">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Buscar Destinatários</label>
                  <p className="text-xs text-slate-500 mb-3">Pesquise por nome, email ou UID do usuário.</p>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      {searching ? <Loader2 className="w-5 h-5 animate-spin text-slate-600 dark:text-slate-400" /> : <Search className="w-5 h-5 text-slate-600 dark:text-slate-400" />}
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                      className={`${inputClass} pl-11`}
                      placeholder="Comece a digitar..."
                    />
                    
                    {/* Resultados da Busca */}
                    <AnimatePresence>
                      {searchFocused && searchQuery.length >= 2 && (
                        <motion.div
                          key="search-results"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-64 overflow-y-auto"
                        >
                          {searchResults.length === 0 && !searching ? (
                            <div className="p-4 text-sm text-slate-500 text-center">Nenhum usuário encontrado.</div>
                          ) : (
                            searchResults.map(user => (
                              <button
                                key={user.id}
                                type="button"
                                onMouseDown={(e) => { e.preventDefault(); handleSelectManualUser(user); }}
                                className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700/50 last:border-0 flex flex-col transition-colors"
                              >
                                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{user.name}</span>
                                <span className="text-xs text-slate-500">{user.email}</span>
                              </button>
                            ))
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Usuários Selecionados */}
                  {selectedManualUsers.length > 0 && (
                    <div className="mt-4 p-4 border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl">
                      <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wider">{selectedManualUsers.length} Selecionados</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedManualUsers.map(user => (
                          <div key={user.id} className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-sm shadow-sm group">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-700 dark:text-slate-200 leading-none">{user.name.split(' ')[0]}</span>
                              <span className="text-[10px] text-slate-600 dark:text-slate-400">{user.email}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveManualUser(user.id)}
                              className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 rounded-md transition-colors text-slate-600 dark:text-slate-400"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
              
              {audienceType === 'EVENT_SUBSCRIBERS' && (
                <motion.div key="event-sub" initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="overflow-hidden">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Selecione o Evento</label>
                  <select
                    required
                    value={selectedEventId}
                    onChange={e => setSelectedEventId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Selecione...</option>
                    {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                  </select>
                </motion.div>
              )}

              {audienceType === 'ROLES' && (
                <motion.div key="roles-sub" initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="overflow-hidden">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Cargos</label>
                  <div className="flex flex-wrap gap-2">
                    {(['SYSADMIN', 'CHURCH_ADMIN', 'FINANCE_ADMIN', 'LEADER', 'EVENT_ADMIN'] as AppRole[]).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => toggleRole(r)}
                        className={`px-4 py-2 text-sm font-bold rounded-xl border-2 transition-all ${selectedRoles.includes(r) ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' : 'bg-transparent text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="pt-6 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {loading ? 'Disparando...' : (scheduledFor ? 'Agendar Disparo' : 'Disparar Agora')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
