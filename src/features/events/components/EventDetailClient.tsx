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

import { Music, BookOpen, Users, Settings, QrCode, ScanLine } from 'lucide-react';

const ROLES: { id: ScheduleRole; label: string; icon: React.ElementType }[] = [
  { id: 'louvor',   label: 'Louvor',   icon: Music },
  { id: 'pregador', label: 'Pregador', icon: BookOpen },
  { id: 'recepcao', label: 'Recepção', icon: Users },
  { id: 'tecnica',  label: 'Técnica',  icon: Settings },
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
  schedules: initialSchedules,
  registrations: initialRegistrations,
  attendance: initialAttendance,
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

  const [schedules, setSchedules] = useState<EventSchedule[]>(initialSchedules);
  const [registrations, setRegistrations] = useState<EventRegistration[]>(initialRegistrations);
  const [attendance, setAttendance] = useState<EventAttendance[]>(initialAttendance);

  // Sync state if props change from outside (e.g., initial open)
  useEffect(() => {
    setSchedules(initialSchedules);
    setRegistrations(initialRegistrations);
    setAttendance(initialAttendance);
  }, [initialSchedules, initialRegistrations, initialAttendance]);

  useEffect(() => {
    const supabase = createClient();
    
    const fetchSchedules = async () => {
      const { data } = await supabase.from('event_schedules').select('*, members(full_name)').eq('event_id', event.id);
      if (data) setSchedules(data as EventSchedule[]);
    };
    const fetchRegistrations = async () => {
      const { data } = await supabase.from('event_registrations').select('*').eq('event_id', event.id).order('created_at');
      if (data) setRegistrations(data as EventRegistration[]);
    };
    const fetchAttendance = async () => {
      const { data } = await supabase.from('event_attendance').select('*').eq('event_id', event.id).order('checked_in_at');
      if (data) setAttendance(data as EventAttendance[]);
    };

    const channel = supabase
      .channel(`realtime_event_${event.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_schedules' }, () => { fetchSchedules(); router.refresh(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_registrations' }, () => { fetchRegistrations(); router.refresh(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_attendance' }, () => { fetchAttendance(); router.refresh(); })
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

  const inputClass = 'w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-colors bg-[var(--admin-surface-alt)] border-[var(--admin-border)] text-[var(--admin-text-primary)]';
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
    ...(event.requires_registration ? [
      { id: 'inscricoes' as Tab, label: 'Inscrições', count: confirmedCount },
      { id: 'presenca'   as Tab, label: 'Presenças',  count: unifiedAttendances.length },
    ] : []),
    ...(event.is_recurring ? [
      { id: 'recorrencia' as Tab, label: 'Recorrências' }
    ] : []),
  ];

  return (
    <div className="rounded-3xl border shadow-sm overflow-hidden" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
      <div className="flex border-b" style={{ borderColor: 'var(--admin-border)' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-2"
            style={{ 
              borderColor: tab === t.id ? '#3b82f6' : 'transparent',
              color: tab === t.id ? '#60a5fa' : 'var(--admin-text-secondary)',
              background: tab === t.id ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
            }}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--admin-surface-alt)', color: 'var(--admin-text-muted)' }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="p-6 md:p-8 min-h-[400px]">

        {tab === 'recorrencia' && event.is_recurring && (
          <div className="animate-in fade-in duration-300 max-w-2xl border rounded-2xl p-6 shadow-sm" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--admin-text-primary)' }}>Gerenciar Recorrência</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--admin-text-secondary)' }}>Aqui você pode visualizar a próxima ocorrência dinâmica deste evento e cancelar ocorrências específicas.</p>
            
            <div className="border p-4 rounded-xl flex items-center justify-between mb-6" style={{ background: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#60a5fa' }}>Próxima Ocorrência</p>
                {getNextEventOccurrence(event as any).nextDate ? (
                   <p className="text-lg font-black" style={{ color: 'var(--admin-text-primary)' }}>
                     {new Date(getNextEventOccurrence(event as any).nextDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                     {getNextEventOccurrence(event as any).isCancelled && <span className="ml-3 text-sm italic font-semibold" style={{ color: '#f87171' }}>(Cancelado)</span>}
                   </p>
                ) : (
                   <p className="text-sm" style={{ color: 'var(--admin-text-muted)' }}>Nenhuma data prevista nas próximas semanas.</p>
                )}
              </div>
              
              {!getNextEventOccurrence(event as any).isCancelled && getNextEventOccurrence(event as any).nextDate && canManage && (
                <div className="flex gap-2">
                  <button 
                    onClick={handleCancelOccurrence}
                    disabled={isPending}
                    className="px-4 py-2 border font-bold text-sm rounded-xl transition-all disabled:opacity-50"
                    style={{ background: 'var(--admin-surface)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                  >
                    Cancelar este dia
                  </button>
                  {onEdit && (
                    <button 
                      onClick={onEdit}
                      className="px-4 py-2 border font-bold text-sm rounded-xl transition-all"
                      style={{ background: 'var(--admin-surface)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.2)' }}
                    >
                      Editar Regras
                    </button>
                  )}
                </div>
              )}
            </div>

            {event.cancelled_dates && event.cancelled_dates.length > 0 && (
              <div className="mt-8">
                <p className="text-sm font-bold mb-3" style={{ color: '#f87171' }}>Dias Cancelados:</p>
                <div className="flex flex-wrap gap-2">
                  {event.cancelled_dates.map(d => (
                    <span key={d} className="px-3 py-1 border text-sm font-semibold rounded-lg line-through decora"
                      style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
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
                  <div key={role.id} className="rounded-2xl border p-4 shadow-sm" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center border" style={{ background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                          <role.icon className="w-4 h-4" style={{ color: '#60a5fa' }} />
                        </div>
                        <span className="font-bold text-sm" style={{ color: 'var(--admin-text-primary)' }}>{role.label}</span>
                      </div>
                      {canManage && (
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(role.id)} className="text-xs font-semibold" style={{ color: '#60a5fa' }}>
                            {slot ? 'Editar' : 'Escalar'}
                          </button>
                          {slot && (
                            <button onClick={() => handleRemoveSlot(slot.id)} disabled={isPending} className="text-xs font-semibold disabled:opacity-50" style={{ color: '#f87171' }}>
                              Remover
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {slot?.members ? (
                      <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--admin-text-primary)' }}>{slot.members.full_name}</p>
                        {slot.notes && <p className="text-xs mt-0.5" style={{ color: 'var(--admin-text-secondary)' }}>{slot.notes}</p>}
                      </div>
                    ) : (
                      <p className="text-sm italic" style={{ color: 'var(--admin-text-muted)' }}>Não escalado</p>
                    )}
                  </div>
                );
              })}
            </div>

            {editingRole && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
                <div className="rounded-2xl shadow-xl w-full max-w-sm p-6 border" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                  <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--admin-text-primary)' }}>
                    Escalar para {ROLES.find(r => r.id === editingRole)?.label}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--admin-text-secondary)' }}>Membro</label>
                      <select value={selectedMember} onChange={e => setSelectedMember(e.target.value)} className={inputClass}>
                        <option value="">Selecionar...</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--admin-text-secondary)' }}>Observações</label>
                      <input type="text" value={slotNotes} onChange={e => setSlotNotes(e.target.value)} placeholder="Ex: Guitarra base" className={inputClass} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                    <button onClick={() => setEditingRole(null)} className="px-4 py-2 font-medium rounded-xl transition-colors hover:bg-white/5" style={{ color: 'var(--admin-text-secondary)' }}>
                      Cancelar
                    </button>
                    <button onClick={handleSaveSlot} disabled={isPending} className="px-4 py-2 font-semibold text-white rounded-xl disabled:opacity-50 flex items-center gap-2" style={{ background: 'var(--admin-accent)' }}>
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
              <div className="rounded-3xl border p-8 shadow-sm mb-8 text-center" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border" style={{ background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                  <QrCode className="w-8 h-8" style={{ color: '#60a5fa' }} />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--admin-text-primary)' }}>Check-in via QR Code</h3>
                <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: 'var(--admin-text-secondary)' }}>
                  Para garantir a segurança e evitar fraudes, o check-in agora é realizado exclusivamente através do scanner de ingressos.
                </p>
                <button 
                  onClick={() => router.push('/eventos/checkin')}
                  className="inline-flex items-center gap-2 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg"
                  style={{ background: 'var(--admin-accent)' }}
                >
                  <ScanLine className="w-5 h-5" />
                  Abrir Scanner de Ingressos
                </button>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--admin-text-secondary)' }}>Histórico de Check-ins</h4>
                <p className="text-xs font-semibold" style={{ color: 'var(--admin-text-muted)' }}>{unifiedAttendances.length} presenças registradas</p>
              </div>
              {unifiedAttendances.length === 0 ? (
                <div className="rounded-3xl border border-dashed p-12 text-center" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                  <p className="font-semibold" style={{ color: 'var(--admin-text-muted)' }}>Nenhuma presença registrada ainda.</p>
                </div>
              ) : (
                unifiedAttendances.map(a => (
                  <div key={a.id} className="rounded-2xl border px-5 py-4 flex items-center justify-between transition-colors shadow-sm" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${a.type === 'scanner' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {a.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold" style={{ color: 'var(--admin-text-primary)' }}>{a.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border ${a.type === 'scanner' ? 'bg-blue-500/5 text-blue-400 border-blue-500/20' : 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20'}`}>
                            {a.type === 'scanner' ? 'Ingresso (QR)' : 'Manual'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {a.time && (
                        <p className="text-xs font-semibold" style={{ color: 'var(--admin-text-secondary)' }}>
                          {new Date(a.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                      {a.time && (
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--admin-text-muted)' }}>
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