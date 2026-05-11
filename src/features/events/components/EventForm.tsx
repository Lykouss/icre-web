'use client'

import React, { useState, useTransition } from 'react';
import { ChurchEvent, EventType, FormField, FormFieldType, CustomFormSchema } from '../types';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/features/core/components/ToastContext';
import { Loader2, SaveIcon, SendIcon, XIcon, ImageIcon, PlusIcon, Trash2Icon, GripVertical, InfoIcon, ClipboardListIcon, PlusCircleIcon } from 'lucide-react';
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

const inputCls = 'w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-slate-800 placeholder-slate-400 transition-all';
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1.5';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{hint}</p>}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-slate-100" />
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
      className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border-2 transition-all text-left ${
        checked
          ? 'border-blue-400 bg-blue-50'
          : 'border-slate-200 hover:border-slate-300 bg-white'
      }`}
    >
      <div>
        <p className={`text-sm font-semibold ${checked ? 'text-blue-700' : 'text-slate-700'}`}>{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
      <div className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}>
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
    </button>
  );
}

const FIELD_TYPES: { value: FormFieldType; label: string }[] = [
  { value: 'short_text',      label: 'Texto Curto' },
  { value: 'long_text',       label: 'Texto Longo' },
  { value: 'multiple_choice', label: 'Múltipla Escolha' },
  { value: 'checkboxes',      label: 'Caixas de Seleção' },
  { value: 'dropdown',        label: 'Lista Suspensa' },
];

export function EventForm({ initialData, onSaved, onCancel }: EventFormProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const [isLoading, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'info' | 'form'>('info');

  const [formData, setFormData] = useState<Partial<ChurchEvent>>({
    title:                 initialData?.title || '',
    type:                  initialData?.type || 'culto',
    status:                initialData?.status || 'rascunho',
    description:           initialData?.description || '',
    rules:                 initialData?.rules || '',
    date:                  initialData?.date || '',
    time:                  initialData?.time || '',
    location:              initialData?.location || '',
    capacity:              initialData?.capacity || null,
    banner_url:            initialData?.banner_url || '',
    publish_at:            initialData?.publish_at ? initialData.publish_at.split('T')[0] : '',
    expires_at:            initialData?.expires_at ? initialData.expires_at.split('T')[0] : '',
    ticket_price:          initialData?.ticket_price || 0,
    is_public:             initialData ? initialData.is_public : true,
    requires_registration: initialData?.requires_registration ?? false,
    requires_payment:      initialData?.requires_payment ?? false,
    is_recurring:          initialData?.is_recurring ?? false,
    recurrence_rules:      initialData?.recurrence_rules ?? { type: 'weekly', days: [] },
    max_per_account:       initialData?.max_per_account ?? 1,
    max_per_ip:            initialData?.max_per_ip ?? 2,
    max_per_device:        initialData?.max_per_device ?? 2,
    payment_methods:       initialData?.payment_methods ?? ['pix'],
    custom_form_schema:    initialData?.custom_form_schema ?? null,
  });

  // Form builder state
  const [formFields, setFormFields] = useState<FormField[]>(initialData?.custom_form_schema ?? []);

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: 'short_text',
      label: '',
      required: false,
      options: [],
    };
    setFormFields(prev => [...prev, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFormFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setFormFields(prev => prev.filter(f => f.id !== id));
  };

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<StorageFile[]>([]);
  const [isLoadingGallery, setLoadingGal] = useState(false);
  const [isUploading, setIsUploading]     = useState(false);
  const [usedBytes, setUsedBytes]         = useState(0);

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
    // Check if image is used as banner_url in any event
    const publicUrl = supabase.storage.from('site-images').getPublicUrl(name).data.publicUrl;
    const { data: usedInEvent } = await supabase
      .from('events')
      .select('id, title')
      .eq('banner_url', publicUrl)
      .limit(1)
      .maybeSingle();
    if (usedInEvent) {
      toast('error', `Imagem em uso no evento "${usedInEvent.title}". Remova o banner antes de excluí-la.`);
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

  // Recurrence validation: must have at least one day if weekly recurring
  const recurringWithNoDays =
    !!formData.is_recurring &&
    formData.recurrence_rules?.type === 'weekly' &&
    (formData.recurrence_rules?.days?.length ?? 0) === 0;

  const handleSubmit = (targetStatus: 'rascunho' | 'publicado') => {
    if (targetStatus === 'publicado' && recurringWithNoDays) {
      toast('error', 'Selecione pelo menos um dia da semana para o evento recorrente.');
      return;
    }
    startTransition(async () => {
      try {
        const cleanedFormFields: CustomFormSchema = formFields
          .filter(f => f.label.trim().length > 0);
        const payload = {
          ...formData,
          status:               targetStatus,
          capacity:             formData.capacity ? Number(formData.capacity) : null,
          ticket_price:         formData.ticket_price ? Number(formData.ticket_price) : 0,
          publish_at:           formData.publish_at || null,
          expires_at:           formData.expires_at || null,
          date:                 formData.date || null,
          time:                 formData.time || null,
          requires_registration: formData.requires_registration || formData.requires_payment || false,
          is_recurring:         formData.is_recurring,
          recurrence_rules:     formData.is_recurring ? formData.recurrence_rules : null,
          max_per_account:      formData.max_per_account ? Number(formData.max_per_account) : 1,
          max_per_ip:           formData.max_per_ip ? Number(formData.max_per_ip) : 2,
          max_per_device:       formData.max_per_device ? Number(formData.max_per_device) : 2,
          payment_methods:      formData.payment_methods,
          custom_form_schema:   cleanedFormFields.length > 0 ? cleanedFormFields : null,
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

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {(['info', 'form'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex justify-center items-center gap-2 text-xs font-semibold py-2 rounded-lg transition-all ${
              activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'info' ? <><InfoIcon className="w-4 h-4" /> Informações do Evento</> : <><ClipboardListIcon className="w-4 h-4" /> Formulário Personalizado</>}
          </button>
        ))}
      </div>

      {activeTab === 'form' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Adicione campos extras que os inscritos devem preencher.</p>
          {formFields.map((field, idx) => (
            <div key={field.id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-slate-300" />
                <span className="text-xs font-bold text-slate-500">Campo {idx + 1}</span>
                <button type="button" onClick={() => removeField(field.id)} className="ml-auto text-red-400 hover:text-red-600">
                  <Trash2Icon className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Tipo</label>
                  <select className={inputCls} value={field.type}
                    onChange={e => updateField(field.id, { type: e.target.value as FormFieldType, options: [] })}>
                    {FIELD_TYPES.map(ft => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={field.required}
                      onChange={e => updateField(field.id, { required: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300" />
                    Obrigatório
                  </label>
                </div>
              </div>
              <div>
                <label className={labelCls}>Pergunta / Rótulo *</label>
                <input className={inputCls} value={field.label} placeholder="Ex: Qual seu tamanho de camiseta?"
                  onChange={e => updateField(field.id, { label: e.target.value })} />
              </div>
              {['multiple_choice', 'checkboxes', 'dropdown'].includes(field.type) && (
                <div>
                  <label className={labelCls}>Opções</label>
                  <div className="space-y-2 mt-1">
                    {(field.options || []).map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <input
                          className={inputCls}
                          value={opt}
                          placeholder={`Opção ${oIdx + 1}`}
                          onChange={e => {
                            const newOpts = [...(field.options || [])];
                            newOpts[oIdx] = e.target.value;
                            updateField(field.id, { options: newOpts });
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newOpts = (field.options || []).filter((_, i) => i !== oIdx);
                            updateField(field.id, { options: newOpts });
                          }}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <XIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const newOpts = [...(field.options || []), ''];
                        updateField(field.id, { options: newOpts });
                      }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 mt-2"
                    >
                      <PlusCircleIcon className="w-4 h-4" /> Adicionar opção
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          <button type="button" onClick={addField}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 rounded-xl text-sm font-semibold text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-all">
            <PlusIcon className="w-4 h-4" /> Adicionar Campo
          </button>
        </div>
      )}

      {activeTab === 'info' && (
        <div className="space-y-5">

      {/* Banner */}
      <Field label="Banner do evento">
        {formData.banner_url ? (
          <div className="space-y-2">
            <div
              className="relative h-44 w-full rounded-2xl overflow-hidden border border-slate-200 cursor-pointer group"
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
              className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
            >
              <XIcon className="w-3.5 h-3.5" /> Remover imagem
            </button>
          </div>
        ) : (
          <div
            onClick={() => { setIsGalleryOpen(true); loadGallery(); }}
            className="relative h-44 w-full border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 group transition-all"
          >
            <ImageIcon className="w-8 h-8 text-slate-300 group-hover:text-blue-400 mb-2 transition-colors" />
            <span className="text-sm text-slate-400 group-hover:text-blue-600 font-medium transition-colors">Selecionar da galeria</span>
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
                value={formData.date || ''}
                onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
              />
            </Field>
            <Field label="Horário">
              <input
                type="time"
                className={inputCls}
                value={formData.time || ''}
                onChange={e => setFormData(p => ({ ...p, time: e.target.value }))}
              />
            </Field>
          </div>
        ) : (
          <div className="space-y-4 p-4 border border-blue-100 bg-blue-50/50 rounded-xl">
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
                         className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${active ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}
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

      <Field label="Regras do Evento (Termos)">
        <textarea
          className={`${inputCls} min-h-[88px] resize-y`}
          value={formData.rules || ''}
          onChange={e => setFormData(p => ({ ...p, rules: e.target.value }))}
          placeholder="Ex: Não é permitido entrar de bermuda. Ao se inscrever concorda com nossos termos..."
        />
      </Field>

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
                checked={(formData.payment_methods || []).includes('pix')}
                onChange={e => {
                  const methods = formData.payment_methods || [];
                  setFormData(p => ({ 
                    ...p, 
                    payment_methods: e.target.checked ? [...methods, 'pix'] : methods.filter(m => m !== 'pix')
                  }));
                }}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              PIX
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
              <input 
                type="checkbox" 
                checked={(formData.payment_methods || []).includes('boleto')}
                onChange={e => {
                  const methods = formData.payment_methods || [];
                  setFormData(p => ({ 
                    ...p, 
                    payment_methods: e.target.checked ? [...methods, 'boleto'] : methods.filter(m => m !== 'boleto')
                  }));
                }}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              Boleto
            </label>
          </div>
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
      {recurringWithNoDays && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-2 rounded-xl">
          ⚠️ Selecione pelo menos um dia da semana para publicar este evento recorrente.
        </div>
      )}
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
          disabled={isLoading || !formData.title}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-40"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <SaveIcon className="w-4 h-4 text-slate-400" />}
          Rascunho
        </button>
        <button
          type="button"
          onClick={() => handleSubmit('publicado')}
          disabled={isLoading || !formData.title || recurringWithNoDays}
          title={recurringWithNoDays ? 'Selecione os dias da semana primeiro' : undefined}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm disabled:opacity-40"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendIcon className="w-4 h-4" />}
          {formData.publish_at && formData.publish_at > new Date().toISOString().split('T')[0] ? 'Agendar' : 'Publicar'}
        </button>
      </div>

        </div>
      )}

      {/* Modal galeria */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden" showCloseButton={false}>
          <DialogTitle className="sr-only">Galeria de Imagens</DialogTitle>
          <div className="bg-white rounded-2xl shadow-2xl w-full flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-bold text-slate-900">Galeria de imagens</h3>
                <p className="text-xs text-slate-500 mt-0.5">Selecione ou envie uma imagem</p>
              </div>
              <button
                onClick={() => setIsGalleryOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-3 border-b border-slate-100 shrink-0">
              <div className="flex justify-between text-xs font-medium text-slate-500 mb-2">
                <span>Armazenamento utilizado</span>
                <span className={usedPct > 85 ? 'text-red-500 font-semibold' : ''}>{usedMB.toFixed(1)} MB / {QUOTA_MB} MB</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${usedPct > 85 ? 'bg-red-500' : usedPct > 60 ? 'bg-amber-400' : 'bg-blue-500'}`}
                  style={{ width: `${usedPct}%` }}
                />
              </div>
            </div>

            <div className="px-6 py-3 border-b border-slate-100 shrink-0">
              <label className={`flex items-center justify-center gap-2 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isUploading ? 'border-slate-200 text-slate-400' : 'border-slate-300 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 text-slate-500'}`}>
                {isUploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm font-semibold">Enviando...</span></>
                ) : (
                  <><ImageIcon className="w-4 h-4" /><span className="text-sm font-semibold">Enviar imagem</span><span className="text-xs text-slate-400">JPG, PNG, WebP · Máx. 10 MB</span></>
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