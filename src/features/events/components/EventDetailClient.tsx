'use client'

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/features/core/components/ToastContext';
import { upsertScheduleSlot, removeScheduleSlot } from '@/features/events/actions/schedules';
import { checkInAttendance } from '@/features/events/actions/registrations';
import { RegistrationsPanel } from '@/features/events/components/RegistrationsPanel';
import type { ChurchEvent, EventSchedule, EventRegistration, EventAttendance, ScheduleRole } from '@/features/events/types';
import { getNextEventOccurrence } from '@/lib/event-utils';
import { cancelEventOccurrence } from '@/features/events/actions/events';

const ROLES: { id: ScheduleRole; label: string; icon: string }[] = [
  { id: 'louvor',   label: 'Louvor',   icon: '🎵' },
  { id: 'pregador', label: 'Pregador', icon: '📖' },
  { id: 'recepcao', label: 'Recepção', icon: '🤝' },
  { id: 'tecnica',  label: 'Técnica',  icon: '🎛️' },
];

interface Member {
  id: string;
  full_name: string;
}

interface EventDetailClientProps {
  event: ChurchEvent;
  schedules: EventSchedule[];
  registrations: EventRegistration[];
  attendance: EventAttendance[];
  members: Member[];
  canManage: boolean;
  onEdit?: () => void;
  onEventUpdate?: (event: Partial<ChurchEvent>) => void;
}

type Tab = 'escala' | 'inscricoes' | 'presenca' | 'recorrencia';

export function EventDetailClient({
  event,
  schedules,
  registrations,
  attendance,
  members,
  canManage,
  onEdit,
  onEventUpdate,
}: EventDetailClientProps) {
  const router = useRouter();
  const { toast, dismiss } = useToast();

  const [tab, setTab] = useState<Tab>('escala');
  const [isPending, startTransition] = useTransition();

  const [editingRole, setEditingRole] = useState<ScheduleRole | null>(null);
  const [selectedMember, setSelectedMember] = useState('');
  const [slotNotes, setSlotNotes] = useState('');

  const [checkInName, setCheckInName] = useState('');
  const [checkInMemberId, setCheckInMemberId] = useState('');

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`realtime_event_${event.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_schedules' }, () => router.refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_registrations' }, () => router.refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_attendance' }, () => router.refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [router, event.id]);

  const getSlot = (role: ScheduleRole) => schedules.find(s => s.role === role);

  const openEdit = (role: ScheduleRole) => {
    const slot = getSlot(role);
    setEditingRole(role);
    setSelectedMember(slot?.member_id ?? '');
    setSlotNotes(slot?.notes ?? '');
  };

  const handleSaveSlot = () => {
    if (!editingRole) return;
    startTransition(async () => {
      const loadingId = toast('loading', 'Salvando escala...');
      const result = await upsertScheduleSlot(event.id, editingRole, selectedMember, slotNotes);
      dismiss(loadingId);
      if (result.error) toast('error', result.error);
      else {
        toast('success', 'Escala atualizada!');
        setEditingRole(null);
      }
    });
  };

  const handleRemoveSlot = (scheduleId: string) => {
    startTransition(async () => {
      const loadingId = toast('loading', 'Removendo...');
      const result = await removeScheduleSlot(scheduleId, event.id);
      dismiss(loadingId);
      if (result.error) toast('error', result.error);
      else toast('success', 'Slot removido.');
    });
  };

  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const loadingId = toast('loading', 'Registrando presença...');
      const result = await checkInAttendance(event.id, checkInName, checkInMemberId || undefined);
      dismiss(loadingId);
      if (result.error) toast('error', result.error);
      else {
        toast('success', 'Presença confirmada!');
        setCheckInName('');
        setCheckInMemberId('');
      }
    });
  };

  const handleCancelOccurrence = () => {
    const { nextDate } = getNextEventOccurrence(event as any);
    if (!nextDate) return;
    if (!confirm(`Tem certeza que deseja cancelar a próxima ocorrência em ${nextDate}?`)) return;
    
    startTransition(async () => {
      const result = await cancelEventOccurrence(event.id, nextDate);
      if (result.error) toast('error', result.error);
      else {
        toast('success', `Ocorrência de ${nextDate} cancelada com sucesso!`);
        if (onEventUpdate && result.cancelled_dates) {
          onEventUpdate({ ...event, cancelled_dates: result.cancelled_dates });
        }
      }
    });
  };

  const inputClass = 'w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm';
  const confirmedCount = registrations.filter(r => r.status === 'confirmado').length;

  const scannerCheckins = registrations.filter(r => r.checkin_status).map(r => ({
    id: r.id,
    name: r.name,
    time: r.checkin_time,
    type: 'scanner' as const,
  }));
  const manualCheckins = attendance.map(a => ({
    id: a.id,
    name: a.name,
    time: (a as any).checked_in_at || (a as any).created_at,
    type: 'manual' as const,
  }));
  const unifiedAttendances = [...scannerCheckins, ...manualCheckins].sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime());

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'escala', label: 'Escala' },
    ...(event.type === 'especial' ? [
      { id: 'inscricoes' as Tab, label: 'Inscrições', count: confirmedCount },
      { id: 'presenca'   as Tab, label: 'Presenças',  count: unifiedAttendances.length },
    ] : []),
    ...(event.is_recurring ? [
      { id: 'recorrencia' as Tab, label: 'Recorrências' }
    ] : []),
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex border-b border-slate-200">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
              tab === t.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="p-6 md:p-8 bg-slate-50 min-h-[400px]">

        {tab === 'recorrencia' && event.is_recurring && (
          <div className="animate-in fade-in duration-300 max-w-2xl bg-white dark:bg-slate-800 border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Gerenciar Recorrência</h3>
            <p className="text-sm text-slate-500 mb-6">Aqui você pode visualizar a próxima ocorrência dinâmica deste evento e cancelar ocorrências específicas.</p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 p-4 rounded-xl flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Próxima Ocorrência</p>
                {getNextEventOccurrence(event as any).nextDate ? (
                   <p className="text-lg font-black text-slate-800">
                     {new Date(getNextEventOccurrence(event as any).nextDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                     {getNextEventOccurrence(event as any).isCancelled && <span className="ml-3 text-red-500 text-sm italic font-semibold">(Cancelado)</span>}
                   </p>
                ) : (
                   <p className="text-sm text-slate-500">Nenhuma data prevista nas próximas semanas.</p>
                )}
              </div>
              
              {!getNextEventOccurrence(event as any).isCancelled && getNextEventOccurrence(event as any).nextDate && canManage && (
                <div className="flex gap-2">
                  <button 
                    onClick={handleCancelOccurrence}
                    disabled={isPending}
                    className="px-4 py-2 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 font-bold text-sm rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 transition-all disabled:opacity-50"
                  >
                    Cancelar este dia
                  </button>
                  {onEdit && (
                    <button 
                      onClick={onEdit}
                      className="px-4 py-2 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40 font-bold text-sm rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 transition-all"
                    >
                      Editar Regras
                    </button>
                  )}
                </div>
              )}
            </div>

            {event.cancelled_dates && event.cancelled_dates.length > 0 && (
              <div className="mt-8">
                <p className="text-sm font-bold text-slate-700 mb-3 text-red-600 dark:text-red-400">Dias Cancelados:</p>
                <div className="flex flex-wrap gap-2">
                  {event.cancelled_dates.map(d => (
                    <span key={d} className="px-3 py-1 bg-red-50 dark:bg-red-900/20 border border-red-100 text-red-600 dark:text-red-400 text-sm font-semibold rounded-lg line-through decora">
                      {new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'escala' && (
          <div className="animate-in fade-in duration-300 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ROLES.map(role => {
                const slot = getSlot(role.id);
                return (
                  <div key={role.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{role.icon}</span>
                        <span className="font-bold text-slate-700 text-sm">{role.label}</span>
                      </div>
                      {canManage && (
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(role.id)} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 font-semibold">
                            {slot ? 'Editar' : 'Escalar'}
                          </button>
                          {slot && (
                            <button onClick={() => handleRemoveSlot(slot.id)} disabled={isPending} className="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-400 font-semibold disabled:opacity-50">
                              Remover
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {slot?.members ? (
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{slot.members.full_name}</p>
                        {slot.notes && <p className="text-xs text-slate-400 mt-0.5">{slot.notes}</p>}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">Não escalado</p>
                    )}
                  </div>
                );
              })}
            </div>

            {editingRole && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">
                    Escalar para {ROLES.find(r => r.id === editingRole)?.label}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Membro</label>
                      <select value={selectedMember} onChange={e => setSelectedMember(e.target.value)} className={inputClass}>
                        <option value="">Selecionar...</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Observações</label>
                      <input type="text" value={slotNotes} onChange={e => setSlotNotes(e.target.value)} placeholder="Ex: Guitarra base" className={inputClass} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                    <button onClick={() => setEditingRole(null)} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl">
                      Cancelar
                    </button>
                    <button onClick={handleSaveSlot} disabled={isPending} className="px-4 py-2 font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                      {isPending && (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                      )}
                      Salvar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'inscricoes' && (
          <RegistrationsPanel
            eventId={event.id}
            registrations={registrations}
            members={members}
            capacity={event.capacity}
            canManage={canManage}
          />
        )}

        {tab === 'presenca' && (
          <div className="animate-in fade-in duration-300 max-w-3xl">
            {canManage && (
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 p-8 shadow-sm mb-8 text-center">
                <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m0 11v1m5-4h-1m-10 0h-1m8-7a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Check-in via QR Code</h3>
                <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
                  Para garantir a segurança e evitar fraudes, o check-in agora é realizado exclusivamente através do scanner de ingressos.
                </p>
                <button 
                  onClick={() => router.push('/eventos/checkin')}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m0 11v1m5-4h-1m-10 0h-1m8-7a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Abrir Scanner de Ingressos
                </button>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Histórico de Check-ins</h4>
                <p className="text-xs font-semibold text-slate-400">{unifiedAttendances.length} presenças registradas</p>
              </div>
              {unifiedAttendances.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 border-dashed p-12 text-center">
                  <p className="text-slate-400 font-semibold">Nenhuma presença registrada ainda.</p>
                </div>
              ) : (
                unifiedAttendances.map(a => (
                  <div key={a.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 px-5 py-4 flex items-center justify-between hover:border-slate-300 transition-colors shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${a.type === 'scanner' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-emerald-100 text-emerald-700 dark:text-emerald-300'}`}>
                        {a.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{a.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${a.type === 'scanner' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'}`}>
                            {a.type === 'scanner' ? 'Ingresso (QR)' : 'Manual'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {a.time && (
                        <p className="text-xs font-semibold text-slate-400">
                          {new Date(a.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                      {a.time && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(a.time).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}