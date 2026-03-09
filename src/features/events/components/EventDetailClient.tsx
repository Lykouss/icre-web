'use client'

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/features/core/components/ToastContext';
import { upsertScheduleSlot, removeScheduleSlot } from '@/features/events/actions/schedules';
import { checkInAttendance } from '@/features/events/actions/registrations';
import { RegistrationsPanel } from '@/features/events/components/RegistrationsPanel';
import type { ChurchEvent, EventSchedule, EventRegistration, EventAttendance, ScheduleRole } from '@/features/events/types';

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
}

type Tab = 'escala' | 'inscricoes' | 'presenca';

export function EventDetailClient({
  event,
  schedules,
  registrations,
  attendance,
  members,
  canManage,
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

  const inputClass = 'w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm';
  const confirmedCount = registrations.filter(r => r.status === 'confirmado').length;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'escala', label: 'Escala' },
    ...(event.type === 'especial' ? [
      { id: 'inscricoes' as Tab, label: 'Inscrições', count: confirmedCount },
      { id: 'presenca'   as Tab, label: 'Presenças',  count: attendance.length },
    ] : []),
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex border-b border-slate-200">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
              tab === t.id
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
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

        {tab === 'escala' && (
          <div className="animate-in fade-in duration-300 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ROLES.map(role => {
                const slot = getSlot(role.id);
                return (
                  <div key={role.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{role.icon}</span>
                        <span className="font-bold text-slate-700 text-sm">{role.label}</span>
                      </div>
                      {canManage && (
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(role.id)} className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
                            {slot ? 'Editar' : 'Escalar'}
                          </button>
                          {slot && (
                            <button onClick={() => handleRemoveSlot(slot.id)} disabled={isPending} className="text-xs text-red-400 hover:text-red-600 font-semibold disabled:opacity-50">
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
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
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
              <form onSubmit={handleCheckIn} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-6">
                <p className="text-sm font-bold text-slate-700 mb-3">Registrar presença</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="text" value={checkInName} onChange={e => setCheckInName(e.target.value)} placeholder="Nome *" required className={inputClass} />
                  <select value={checkInMemberId} onChange={e => setCheckInMemberId(e.target.value)} className={inputClass}>
                    <option value="">Visitante / externo</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                  </select>
                </div>
                <div className="flex justify-end mt-3">
                  <button type="submit" disabled={isPending} className="px-4 py-2 font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 text-sm flex items-center gap-2">
                    {isPending && (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    )}
                    Check-in
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {attendance.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Nenhuma presença registrada ainda.</p>
              ) : (
                attendance.map(a => (
                  <div key={a.id} className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                        {a.name.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-semibold text-slate-800 text-sm">{a.name}</p>
                    </div>
                    <p className="text-xs text-slate-400">
                      {new Date(a.checked_in_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
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