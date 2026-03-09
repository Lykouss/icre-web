'use client'

import React, { useState, useTransition } from 'react';
import { useToast } from '@/features/core/components/ToastContext';
import { createEvent, updateEvent } from '@/features/events/actions/events';
import type { ChurchEvent } from '@/features/events/types';

const WEEK_DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

interface EventFormProps {
  event?: ChurchEvent;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EventForm({ event, onSuccess, onCancel }: EventFormProps) {
  const { toast, dismiss } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isRecurring, setIsRecurring] = useState(event?.is_recurring ?? false);

  const isEdit = !!event;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const loadingId = toast('loading', isEdit ? 'Salvando alterações...' : 'Criando evento...');
      const result = isEdit
        ? await updateEvent(event.id, formData)
        : await createEvent(formData);
      dismiss(loadingId);

      if (result.error) toast('error', result.error);
      else {
        toast('success', isEdit ? 'Evento atualizado!' : 'Evento criado com sucesso!');
        onSuccess();
      }
    });
  };

  const inputClass = 'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm';
  const labelClass = 'block text-sm font-semibold text-slate-700 mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>Título *</label>
        <input type="text" name="title" required defaultValue={event?.title} placeholder="Ex: Culto de Domingo" className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Tipo *</label>
          <select name="type" required defaultValue={event?.type ?? 'culto'} className={inputClass}>
            <option value="culto">Culto</option>
            <option value="especial">Evento Especial</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Capacidade</label>
          <input type="number" name="capacity" min="1" defaultValue={event?.capacity ?? ''} placeholder="Ilimitada" className={inputClass} />
        </div>
      </div>

      <div className="flex items-center gap-3 py-1">
        <input
          type="checkbox"
          name="is_recurring"
          id="is_recurring"
          checked={isRecurring}
          onChange={e => setIsRecurring(e.target.checked)}
          className="w-4 h-4 accent-blue-600"
        />
        <label htmlFor="is_recurring" className="text-sm font-semibold text-slate-700">Culto recorrente (template)</label>
      </div>

      {isRecurring ? (
        <div>
          <label className={labelClass}>Dia da semana</label>
          <select name="recurrence_day" defaultValue={event?.recurrence_day ?? 0} className={inputClass}>
            {WEEK_DAYS.map((d, i) => (
              <option key={i} value={i}>{d}</option>
            ))}
          </select>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Data *</label>
            <input type="date" name="date" required defaultValue={event?.date ?? ''} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Horário</label>
            <input type="time" name="time" defaultValue={event?.time?.slice(0, 5) ?? ''} className={inputClass} />
          </div>
        </div>
      )}

      <div>
        <label className={labelClass}>Local</label>
        <input type="text" name="location" defaultValue={event?.location ?? ''} placeholder="Ex: Templo principal" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Descrição</label>
        <textarea name="description" rows={2} defaultValue={event?.description ?? ''} placeholder="Detalhes do evento..." className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>URL do Banner</label>
        <input type="url" name="banner_url" defaultValue={event?.banner_url ?? ''} placeholder="https://..." className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Agendar publicação</label>
        <input
          type="datetime-local"
          name="publish_at"
          defaultValue={event?.publish_at ? event.publish_at.slice(0, 16) : ''}
          className={inputClass}
        />
        <p className="text-xs text-slate-400 mt-1">Deixe em branco para publicar manualmente.</p>
      </div>

      <div className="flex items-center gap-3">
        <input type="checkbox" name="is_public" id="is_public" defaultChecked={event?.is_public} className="w-4 h-4 accent-blue-600" />
        <label htmlFor="is_public" className="text-sm font-semibold text-slate-700">Visível no site público</label>
      </div>

      <div className="pt-2 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={isPending} className="px-4 py-2 font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
          {isPending && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          {isPending ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Evento'}
        </button>
      </div>
    </form>
  );
}