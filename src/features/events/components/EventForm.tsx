'use client'

import React, { useState, useTransition } from 'react';
import { ChurchEvent, EventType } from '../types';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/features/core/components/ToastContext';
import { Loader2, SaveIcon, SendIcon, XIcon, ImageIcon, PlusIcon, Trash2Icon, PlusCircleIcon, GripVertical } from 'lucide-react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface EventFormProps {
  initialData: ChurchEvent | null;
  onSaved: (event: ChurchEvent) => void;
  onCancel: () => void;
}

interface StorageFile {
  id: string;
  name: string;
  created_at: string;
  metadata: { size: number; mimetype: string } | null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const inputCls = 'w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all bg-[var(--admin-surface-alt)] border-[var(--admin-border)] text-[var(--admin-text-primary)] placeholder-slate-500';
const labelCls = 'block text-xs font-semibold mb-1.5 text-[var(--admin-text-secondary)]';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {hint && <p className="text-[11px] mt-1.5 leading-relaxed text-[var(--admin-text-muted)]">{hint}</p>}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1 mt-6 mb-2">
      <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap text-[var(--admin-text-muted)]">{label}</span>
      <div className="flex-1 h-px bg-[var(--admin-border)]" />
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border-2 transition-all text-left ${checked
          ? 'border-blue-500/50 bg-blue-500/10'
          : 'border-[var(--admin-border)] hover:bg-white/5 bg-[var(--admin-surface)]'
        }`}
    >
      <div>
        <p className={`text-sm font-semibold ${checked ? 'text-blue-400' : 'text-[var(--admin-text-primary)]'}`}>{label}</p>
        <p className="text-xs mt-0.5 text-[var(--admin-text-secondary)]">{description}</p>
      </div>
      <div className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-700'}`}>
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
    </button>
  );
}

export function EventForm({ initialData, onSaved, onCancel }: EventFormProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const [isLoading, startTransition] = useTransition();

  const [formData, setFormData] = useState<Partial<ChurchEvent> & { custom_form_schema?: any[] }>({
    title: initialData?.title || '',
    type: initialData?.type || 'culto',
    status: initialData?.status || 'rascunho',
    description: initialData?.description || '',
    date: initialData?.date || '',
    time: initialData?.time || '',
    location: initialData?.location || '',
    capacity: initialData?.capacity || null,
    banner_url: initialData?.banner_url || '',
    publish_at: initialData?.publish_at ? initialData.publish_at.split('T')[0] : '',
    expires_at: initialData?.expires_at ? initialData.expires_at.split('T')[0] : '',
    ticket_price: initialData?.ticket_price || 0,
    is_public: initialData ? initialData.is_public : true,
    requires_registration: initialData?.requires_registration ?? false,
    requires_payment: initialData?.requires_payment ?? false,
    is_recurring: initialData?.is_recurring ?? false,
    recurrence_rules: initialData?.recurrence_rules ?? { type: 'weekly', days: [] },
    max_per_account: initialData?.max_per_account ?? 1,
    max_per_ip: initialData?.max_per_ip ?? 2,
    max_per_device: initialData?.max_per_device ?? 2,
    accepts_pix: initialData?.accepts_pix ?? true,
    accepts_boleto: initialData?.accepts_boleto ?? true,
    terms_text: initialData?.terms_text || '',
    custom_form_schema: (initialData as any)?.custom_form_schema || [],
  });

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<StorageFile[]>([]);
  const [isLoadingGallery, setLoadingGal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [usedBytes, setUsedBytes] = useState(0);

  const QUOTA_MB = 200;

  const loadGallery = async () => {
    setLoadingGal(true);
    const { data, error } = await supabase.storage.from('site-images').list('', {
      limit: 1000,
      sortBy: { column: 'created_at', order: 'desc' },
    });
    if (error) { toast('error', 'Erro ao carregar galeria.'); }
    else if (data) {
      const files = data.filter(f => f.name !== '.emptyFolderPlaceholder') as unknown as StorageFile[];
      setGalleryImages(files);
      setUsedBytes(files.reduce((acc, f) => acc + (f.metadata?.size || 0), 0));
    }
    setLoadingGal(false);
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    e.target.value = '';
    const ext = file.name.split('.').pop();
    const { error } = await supabase.storage.from('site-images').upload(`event-${Date.now()}.${ext}`, file, { cacheControl: '3600', upsert: false });
    if (error) toast('error', 'Erro ao enviar imagem.');
    else { toast('success', 'Imagem enviada!'); await loadGallery(); }
    setIsUploading(false);
  };

  const handleDeleteImage = async (name: string) => {
    if (!confirm('Excluir esta imagem permanentemente?')) return;

    // Verificação estrita de integridade para não deletar banner em uso
    const imageUrl = supabase.storage.from('site-images').getPublicUrl(name).data.publicUrl;
    const { data: linkedEvents, error: checkError } = await supabase
      .from('events')
      .select('id, title')
      .eq('banner_url', imageUrl)
      .limit(1);

    if (checkError) {
      toast('error', 'Erro ao verificar integridade da imagem.');
      return;
    }

    if (linkedEvents && linkedEvents.length > 0) {
      toast('error', `Ação negada: Esta imagem está em uso no evento "${linkedEvents[0].title}". Remova do evento primeiro.`);
      return;
    }

    const { error } = await supabase.storage.from('site-images').remove([name]);
    if (error) { toast('error', 'Erro ao excluir.'); return; }
    if (formData.banner_url?.includes(name)) setFormData(p => ({ ...p, banner_url: '' }));
    await loadGallery();
  };

  const handleSelectImage = (name: string) => {
    const { data } = supabase.storage.from('site-images').getPublicUrl(name);
    setFormData(p => ({ ...p, banner_url: data.publicUrl }));
    setIsGalleryOpen(false);
  };

  const usedMB = usedBytes / 1024 / 1024;
  const usedPct = Math.min(100, (usedMB / QUOTA_MB) * 100);

  // Lógica de Formulários Personalizados
  const customFields = formData.custom_form_schema || [];

  const addCustomField = () => {
    setFormData(p => ({
      ...p,
      custom_form_schema: [
        ...(p.custom_form_schema || []),
        { id: Date.now().toString(), type: 'short_text', label: '', required: false, options: [] }
      ]
    }));
  };

  const updateCustomField = (index: number, updates: any) => {
    const newFields = [...customFields];
    newFields[index] = { ...newFields[index], ...updates };
    setFormData(p => ({ ...p, custom_form_schema: newFields }));
  };

  const removeCustomField = (index: number) => {
    const newFields = customFields.filter((_, i) => i !== index);
    setFormData(p => ({ ...p, custom_form_schema: newFields }));
  };

  // Validação estrita
  const isRecurrenceInvalid = !!formData.is_recurring && (!formData.recurrence_rules?.days || formData.recurrence_rules.days.length === 0);
  const isSubmitDisabled = isLoading || !formData.title || isRecurrenceInvalid;

  const handleSubmit = (targetStatus: 'rascunho' | 'publicado') => {
    startTransition(async () => {
      try {
        const finalSchema = formData.custom_form_schema?.length ? formData.custom_form_schema : null;

        const payload = {
          ...formData,
          status: targetStatus,
          capacity: formData.capacity ? Number(formData.capacity) : null,
          ticket_price: formData.ticket_price ? Number(formData.ticket_price) : 0,
          publish_at: formData.publish_at || null,
          expires_at: formData.expires_at || null,
          date: formData.date || null,
          time: formData.time || null,
          requires_registration: formData.requires_registration || formData.requires_payment || false,
          is_recurring: formData.is_recurring,
          recurrence_rules: formData.is_recurring ? formData.recurrence_rules : null,
          max_per_account: formData.max_per_account ? Number(formData.max_per_account) : 1,
          max_per_ip: formData.max_per_ip ? Number(formData.max_per_ip) : 2,
          max_per_device: formData.max_per_device ? Number(formData.max_per_device) : 2,
          accepts_pix: formData.accepts_pix,
          accepts_boleto: formData.accepts_boleto,
          terms_text: formData.terms_text,
          custom_form_schema: finalSchema,
        };

        let result;
        if (initialData?.id) {
          const { data, error } = await supabase.from('events').update(payload).eq('id', initialData.id).select().single();
          if (error) throw error;
          result = data;
        } else {
          const { data, error } = await supabase.from('events').insert([payload]).select().single();
          if (error) throw error;
          result = data;
        }

        toast('success', `Evento ${targetStatus === 'publicado' ? 'publicado' : 'salvo como rascunho'}!`);
        onSaved(result as ChurchEvent);
      } catch (e) {
        toast('error', e instanceof Error ? e.message : 'Erro ao salvar o evento.');
      }
    });
  };

  return (
    <div className="space-y-5 pb-8">

      {/* Banner */}
      <Field label="Banner do evento">
        {formData.banner_url ? (
          <div className="space-y-2">
            <div
              className="relative h-44 w-full rounded-2xl overflow-hidden border cursor-pointer group border-[var(--admin-border)]"
              onClick={() => { setIsGalleryOpen(true); loadGallery(); }}
            >
              <Image src={formData.banner_url} alt="Banner" fill className="object-cover" />
              <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                <span className="text-white text-sm font-semibold flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Trocar imagem
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFormData(p => ({ ...p, banner_url: '' }))}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
            >
              <XIcon className="w-3.5 h-3.5" /> Remover imagem
            </button>
          </div>
        ) : (
          <div
            onClick={() => { setIsGalleryOpen(true); loadGallery(); }}
            className="relative h-44 w-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-500/10 group transition-all border-[var(--admin-border)] bg-[var(--admin-surface-alt)]"
          >
            <ImageIcon className="w-8 h-8 group-hover:text-blue-400 mb-2 transition-colors text-slate-500" />
            <span className="text-sm font-medium transition-colors text-[var(--admin-text-muted)] group-hover:text-blue-400">Selecionar da galeria</span>
          </div>
        )}
      </Field>

      <SectionDivider label="Informações" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Field label="Título *">
            <input
              className={inputCls}
              value={formData.title}
              onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
              placeholder="Ex: Culto de Celebração"
              required
            />
          </Field>
        </div>
        <Field label="Tipo">
          <select
            className={inputCls}
            value={formData.type}
            onChange={e => setFormData(p => ({ ...p, type: e.target.value as EventType }))}
          >
            <option value="culto">Culto</option>
            <option value="especial">Evento Especial</option>
          </select>
        </Field>
      </div>

      <SectionDivider label="Data e Localização" />
      <div className="space-y-4">
        <Toggle
          checked={!!formData.is_recurring}
          onChange={v => setFormData(p => ({ ...p, is_recurring: v }))}
          label="Evento Recorrente"
          description="Acontece repetidamente em dias específicos em vez de uma data única"
        />

        {!formData.is_recurring ? (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Data exata">
              <input
                type="date"
                className={inputCls}
                style={{ colorScheme: 'dark' }}
                value={formData.date || ''}
                onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
              />
            </Field>
            <Field label="Horário">
              <input
                type="time"
                className={inputCls}
                style={{ colorScheme: 'dark' }}
                value={formData.time || ''}
                onChange={e => setFormData(p => ({ ...p, time: e.target.value }))}
              />
            </Field>
          </div>
        ) : (
          <div className="space-y-4 p-4 border rounded-xl border-blue-500/30 bg-blue-500/5">
            <div className="flex gap-4">
              <Field label="Tipo de Recorrência">
                <select
                  className={inputCls}
                  value={formData.recurrence_rules?.type || 'weekly'}
                  onChange={e => setFormData(p => ({
                    ...p,
                    recurrence_rules: { type: e.target.value as 'weekly' | 'monthly', days: p.recurrence_rules?.days || [] }
                  }))}
                >
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                </select>
              </Field>
              <Field label="Horário Fixo">
                <input
                  type="time"
                  className={inputCls}
                  style={{ colorScheme: 'dark' }}
                  value={formData.time || ''}
                  onChange={e => setFormData(p => ({ ...p, time: e.target.value }))}
                />
              </Field>
            </div>

            {formData.recurrence_rules?.type === 'weekly' && (
              <Field label="Dias da Semana">
                <div className="flex flex-wrap gap-2">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, idx) => {
                    const active = formData.recurrence_rules?.days?.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const daysList = formData.recurrence_rules?.days || [];
                          const newDays = active ? daysList.filter((d: number) => d !== idx) : [...daysList, idx];
                          setFormData(p => ({ ...p, recurrence_rules: { ...p.recurrence_rules, type: 'weekly', days: newDays } }));
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${active ? 'bg-blue-600 text-white' : 'border hover:bg-white/5 bg-[var(--admin-surface)] border-[var(--admin-border)] text-[var(--admin-text-secondary)]'}`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </Field>
            )}

            {formData.recurrence_rules?.type === 'monthly' && (
              <Field label="Dias do Mês (1-31 separados por vírgula)">
                <input
                  className={inputCls}
                  value={formData.recurrence_rules?.days?.join(', ') || ''}
                  placeholder="Ex: 5, 10, 20"
                  onChange={e => {
                    const days = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n >= 1 && n <= 31);
                    setFormData(p => ({ ...p, recurrence_rules: { ...p.recurrence_rules, type: 'monthly', days } }));
                  }}
                />
              </Field>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <Field label="Local">
            <input
              className={inputCls}
              value={formData.location || ''}
              onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
              placeholder="Ex: Templo Principal"
            />
          </Field>
        </div>
      </div>

      <Field label="Descrição">
        <textarea
          className={`${inputCls} min-h-[88px] resize-y`}
          value={formData.description || ''}
          onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
          placeholder="Detalhes, convidados, programação..."
        />
      </Field>

      <SectionDivider label="Formulário Personalizado" />

      <div className="space-y-4">
        <p className="text-sm text-slate-500 mb-2">Adicione perguntas ou campos extras que o usuário deverá preencher no momento da inscrição.</p>

        {customFields.map((field, index) => (
          <div key={field.id} className="p-4 rounded-xl space-y-3 relative border" style={{ background: 'var(--admin-surface-alt)', borderColor: 'var(--admin-border)' }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Pergunta / Nome do Campo">
                    <input
                      className={inputCls}
                      value={field.label}
                      onChange={e => updateCustomField(index, { label: e.target.value })}
                      placeholder="Ex: Qual o tamanho da sua camisa?"
                    />
                  </Field>
                  <Field label="Tipo de Resposta">
                    <select
                      className={inputCls}
                      value={field.type}
                      onChange={e => updateCustomField(index, { type: e.target.value })}
                    >
                      <option value="short_text">Texto Curto</option>
                      <option value="long_text">Texto Longo</option>
                      <option value="multiple_choice">Múltipla Escolha (Apenas uma)</option>
                      <option value="checkboxes">Caixa de Seleção (Múltiplas)</option>
                      <option value="dropdown">Lista Suspensa</option>
                    </select>
                  </Field>
                </div>

                {['multiple_choice', 'checkboxes', 'dropdown'].includes(field.type) && (
                  <div className="space-y-2 mt-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Opções de Resposta</label>
                    <div className="space-y-2">
                      {(field.options || []).map((opt: string, oIdx: number) => (
                        <div key={oIdx} className="flex items-center gap-2 group animate-in fade-in slide-in-from-top-1">
                          <div className="p-2 text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-400">
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <input
                            className={`${inputCls} flex-1`}
                            value={opt}
                            placeholder={`Opção ${oIdx + 1}`}
                            onChange={e => {
                              const newOpts = [...(field.options || [])];
                              newOpts[oIdx] = e.target.value;
                              updateCustomField(index, { options: newOpts });
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newOpts = (field.options || []).filter((_: any, i: number) => i !== oIdx);
                              updateCustomField(index, { options: newOpts });
                            }}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Remover Opção"
                          >
                            <XIcon className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newOpts = [...(field.options || []), ''];
                        updateCustomField(index, { options: newOpts });
                      }}
                      className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors mt-3"
                    >
                      <PlusCircleIcon className="w-4 h-4" /> Adicionar nova opção
                    </button>
                  </div>
                )}

                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={e => updateCustomField(index, { required: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  Resposta Obrigatória
                </label>
              </div>

              <button
                type="button"
                onClick={() => removeCustomField(index)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Remover campo"
              >
                <Trash2Icon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addCustomField}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 rounded-xl text-sm font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
        >
          <PlusIcon className="w-4 h-4" />
          Adicionar Campo Extra
        </button>
      </div>

      <SectionDivider label="Visibilidade e Inscrição" />

      <div className="space-y-2.5">
        <Toggle
          checked={!!formData.is_public}
          onChange={v => setFormData(p => ({ ...p, is_public: v }))}
          label="Evento público"
          description="Aparece no portal público e na agenda"
        />
        <Toggle
          checked={!!formData.requires_registration}
          onChange={v => setFormData(p => ({
            ...p,
            requires_registration: v,
            requires_payment: v ? p.requires_payment : false,
          }))}
          label="Exige inscrição"
          description="Participantes devem se inscrever para confirmar presença"
        />
        {formData.requires_registration && (
          <Toggle
            checked={!!formData.requires_payment}
            onChange={v => setFormData(p => ({ ...p, requires_payment: v }))}
            label="Evento pago"
            description="Participantes pagam para garantir a vaga (via Asaas/PIX)"
          />
        )}
      </div>

      <SectionDivider label="Capacidade e Valor" />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Vagas" hint="0 = ilimitado">
          <input
            type="number"
            className={inputCls}
            value={formData.capacity || ''}
            onChange={e => setFormData(p => ({ ...p, capacity: Number(e.target.value) || null }))}
            placeholder="0"
            min="0"
          />
        </Field>
        <Field label="Preço (R$)" hint="Apenas se evento pago">
          <input
            type="number"
            step="0.01"
            className={inputCls}
            value={formData.ticket_price || ''}
            onChange={e => setFormData(p => ({ ...p, ticket_price: Number(e.target.value) }))}
            placeholder="0,00"
            min="0"
            disabled={!formData.requires_payment}
          />
        </Field>
      </div>

      {formData.requires_registration && (
        <>
          <SectionDivider label="Limites e Segurança Antifraude" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Máx. por Conta" hint="Vagas máximas para uma única conta">
              <input
                type="number"
                className={inputCls}
                value={formData.max_per_account || 1}
                onChange={e => setFormData(p => ({ ...p, max_per_account: Number(e.target.value) || 1 }))}
                min="1"
              />
            </Field>
            <Field label="Máx. por IP" hint="Inscrições por endereço IP">
              <input
                type="number"
                className={inputCls}
                value={formData.max_per_ip || 2}
                onChange={e => setFormData(p => ({ ...p, max_per_ip: Number(e.target.value) || 1 }))}
                min="1"
              />
            </Field>
            <Field label="Máx. por Dispositivo" hint="Inscrições por aparelho (Fingerprint)">
              <input
                type="number"
                className={inputCls}
                value={formData.max_per_device || 2}
                onChange={e => setFormData(p => ({ ...p, max_per_device: Number(e.target.value) || 1 }))}
                min="1"
              />
            </Field>
          </div>
        </>
      )}

      {formData.requires_payment && (
        <div className="space-y-3 mt-4">
          <SectionDivider label="Métodos de Pagamento (Asaas)" />
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={!!formData.accepts_pix}
                onChange={e => setFormData(p => ({ ...p, accepts_pix: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              PIX
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={!!formData.accepts_boleto}
                onChange={e => setFormData(p => ({ ...p, accepts_boleto: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              Boleto
            </label>
          </div>
        </div>
      )}

      {formData.requires_registration && (
        <div className="space-y-3 mt-4">
          <SectionDivider label="Termos do Evento" />
          <Field label="Texto dos termos de inscrição" hint="Os participantes precisarão rolar até o fim para aceitar.">
            <textarea
              className={`${inputCls} min-h-[120px] resize-y`}
              value={formData.terms_text || ''}
              onChange={e => setFormData(p => ({ ...p, terms_text: e.target.value }))}
              placeholder="Digite os termos de responsabilidade e regras do evento..."
            />
          </Field>
        </div>
      )}

      <SectionDivider label="Publicação" />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Publicar em" hint="Vazio = publicar agora">
          <input
            type="date"
            className={inputCls}
            value={formData.publish_at || ''}
            onChange={e => setFormData(p => ({ ...p, publish_at: e.target.value }))}
          />
        </Field>
        <Field label="Expirar em">
          <input
            type="date"
            className={inputCls}
            value={formData.expires_at || ''}
            onChange={e => setFormData(p => ({ ...p, expires_at: e.target.value }))}
          />
        </Field>
      </div>

      {/* Ações */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => handleSubmit('rascunho')}
          disabled={isSubmitDisabled}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm disabled:opacity-40 border hover:bg-white/5"
          style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-primary)' }}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <SaveIcon className="w-4 h-4" style={{ color: 'var(--admin-text-muted)' }} />}
          Rascunho
        </button>
        <button
          type="button"
          onClick={() => handleSubmit('publicado')}
          disabled={isSubmitDisabled}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm disabled:opacity-40"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendIcon className="w-4 h-4" />}
          {formData.publish_at && formData.publish_at > new Date().toISOString().split('T')[0] ? 'Agendar' : 'Publicar'}
        </button>
      </div>

      {/* Modal galeria */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden" showCloseButton={false} data-admin="true">
          <DialogTitle className="sr-only">Galeria de Imagens</DialogTitle>
          <div className="rounded-2xl shadow-2xl w-full flex flex-col max-h-[85vh] border" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: 'var(--admin-border)' }}>
              <div>
                <h3 className="font-bold" style={{ color: 'var(--admin-text-primary)' }}>Galeria de imagens</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--admin-text-secondary)' }}>Selecione ou envie uma imagem</p>
              </div>
              <button
                onClick={() => setIsGalleryOpen(false)}
                className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
                style={{ color: 'var(--admin-text-muted)' }}
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-3 border-b shrink-0" style={{ borderColor: 'var(--admin-border)' }}>
              <div className="flex justify-between text-xs font-medium mb-2" style={{ color: 'var(--admin-text-secondary)' }}>
                <span>Armazenamento utilizado</span>
                <span className={usedPct > 85 ? 'text-red-400 font-semibold' : ''}>{usedMB.toFixed(1)} MB / {QUOTA_MB} MB</span>
              </div>
              <div className="w-full rounded-full h-1.5" style={{ background: 'var(--admin-surface-alt)' }}>
                <div
                  className={`h-1.5 rounded-full transition-all ${usedPct > 85 ? 'bg-red-500' : usedPct > 60 ? 'bg-amber-400' : 'bg-blue-500'}`}
                  style={{ width: `${usedPct}%` }}
                />
              </div>
            </div>

            <div className="px-6 py-3 border-b shrink-0" style={{ borderColor: 'var(--admin-border)' }}>
              <label className={`flex items-center justify-center gap-2 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isUploading ? 'border-[var(--admin-border)] text-slate-500' : 'border-[var(--admin-border)] hover:border-blue-400 hover:text-blue-400 hover:bg-blue-500/10 text-[var(--admin-text-secondary)]'}`}>
                {isUploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm font-semibold">Enviando...</span></>
                ) : (
                  <><ImageIcon className="w-4 h-4" /><span className="text-sm font-semibold">Enviar imagem</span><span className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>JPG, PNG, WebP · Máx. 10 MB</span></>
                )}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={handleUploadImage} disabled={isUploading} />
              </label>
            </div>

            <div className="flex-1 overflow-y-auto p-5" style={{ scrollbarWidth: 'thin' }}>
              {isLoadingGallery ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
              ) : galleryImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <ImageIcon className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm font-medium">Galeria vazia</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {galleryImages.map(item => {
                    const url = supabase.storage.from('site-images').getPublicUrl(item.name).data.publicUrl;
                    const isSelected = formData.banner_url === url;
                    return (
                      <div
                        key={item.id}
                        className={`group relative aspect-video rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${isSelected ? 'border-blue-500 shadow-md' : 'border-slate-200 hover:border-blue-300 hover:shadow-md'}`}
                        onClick={() => handleSelectImage(item.name)}
                      >
                        <Image src={url} alt={item.name} fill className="object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex flex-col justify-between p-2 opacity-0 group-hover:opacity-100">
                          <div className="flex justify-end">
                            <button
                              onClick={e => { e.stopPropagation(); handleDeleteImage(item.name); }}
                              className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                          <span className="text-white text-[11px] font-semibold bg-black/40 px-2 py-0.5 rounded-md self-start">
                            {formatBytes(item.metadata?.size || 0)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}