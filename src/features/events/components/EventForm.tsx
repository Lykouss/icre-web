"use client";

import { useState } from "react";
import { ChurchEvent, EventType } from "../types";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/features/core/components/ToastContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, SaveIcon, SendIcon, Image as ImageIcon, CalendarIcon, ClockIcon, MapPinIcon, UsersIcon, BanknoteIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface EventFormProps {
  initialData: ChurchEvent | null;
  onSaved: (event: ChurchEvent) => void;
  onCancel: () => void;
}

interface StorageFile {
  id: string;
  name: string;
  created_at: string;
  metadata: {
    size: number;
    mimetype: string;
  } | null;
}

const SITE_MEDIA_QUOTA_MB = 200;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ── Componentes de Estilo Primitivo (Sysadmin UI) ────────────────

const inputCls = "w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-slate-800 placeholder-slate-400 transition-all";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {hint && <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">{hint}</p>}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-4 pb-2">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

export function EventForm({ initialData, onSaved, onCancel }: EventFormProps) {
  const supabase = createClient();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<ChurchEvent>>({
    title: initialData?.title || "",
    type: initialData?.type || "culto",
    status: initialData?.status || "rascunho",
    description: initialData?.description || "",
    date: initialData?.date || "",
    time: initialData?.time || "",
    location: initialData?.location || "",
    capacity: initialData?.capacity || null,
    banner_url: initialData?.banner_url || "",
    publish_at: initialData?.publish_at ? initialData.publish_at.split('T')[0] : "",
    expires_at: initialData?.expires_at ? initialData.expires_at.split('T')[0] : "",
    ticket_price: initialData?.ticket_price || 0,
  });

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<StorageFile[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [usedBytes, setUsedBytes] = useState(0);

  const loadGallery = async () => {
    setIsLoadingGallery(true);
    const { data, error } = await supabase.storage.from('site-images').list('', { 
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' }
    });
    
    if (error) {
      toast('error', 'Erro ao carregar imagens do Supabase.');
    } else if (data) {
       const files = data.filter(f => f.name !== '.emptyFolderPlaceholder') as unknown as StorageFile[];
       setGalleryImages(files);
       const totalBytes = files.reduce((acc, f) => acc + (f.metadata?.size || 0), 0);
       setUsedBytes(totalBytes);
    }
    setIsLoadingGallery(false);
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    e.target.value = '';
    
    const fileExt = file.name.split('.').pop();
    const fileName = `event-${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage.from('site-images').upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (error) {
      toast('error', 'Erro ao enviar a imagem.');
      setIsUploading(false);
      return;
    }

    toast('success', 'Imagem enviada com sucesso!');
    await loadGallery();
    setIsUploading(false);
  };

  const handleDeleteImage = async (fileName: string) => {
    if (!confirm(`Tem certeza que deseja excluir esta imagem PERMANENTEMENTE?`)) return;
    
    const { error } = await supabase.storage.from('site-images').remove([fileName]);
    if (error) { toast('error', 'Erro ao excluir a imagem.'); return; }

    toast('success', 'Imagem excluída da galeria.');
    if (formData.banner_url && formData.banner_url.includes(fileName)) {
      setFormData(prev => ({ ...prev, banner_url: "" }));
    }
    await loadGallery();
  };

  const handleSelectImage = (imageName: string) => {
    const { data } = supabase.storage.from('site-images').getPublicUrl(imageName);
    setFormData({ ...formData, banner_url: data.publicUrl });
    setIsGalleryOpen(false);
  };

  const handleClearBanner = () => {
    setFormData(prev => ({ ...prev, banner_url: "" }));
  };

  const openGallery = () => {
    setIsGalleryOpen(true);
    loadGallery();
  };

  const handleSubmit = async (targetStatus: 'rascunho' | 'publicado') => {
    try {
      setIsLoading(true);
      const eventPayload = {
        ...formData,
        status: targetStatus,
        capacity: formData.capacity ? Number(formData.capacity) : null,
        ticket_price: formData.ticket_price ? Number(formData.ticket_price) : 0,
        publish_at: formData.publish_at || null,
        expires_at: formData.expires_at || null,
        date: formData.date || null,
        time: formData.time || null,
      };

      let result;
      if (initialData?.id) {
        const { data, error } = await supabase.from('events').update(eventPayload).eq('id', initialData.id).select().single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase.from('events').insert([eventPayload]).select().single();
        if (error) throw error;
        result = data;
      }

      toast('success', `Evento ${targetStatus === 'publicado' ? 'publicado' : 'salvo como rascunho'}!`);
      onSaved(result as ChurchEvent);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao salvar o evento";
      toast('error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const usedMB = usedBytes / 1024 / 1024;
  const usedPct = Math.min(100, (usedMB / SITE_MEDIA_QUOTA_MB) * 100);

  return (
    // Removido o bg-white e border que causavam o bug no Sheet, deixando o fluxo natural.
    <div className="space-y-6 pb-8">
      
      {/* ── Banner Selecionado ── */}
      <Field label="Banner do Evento">
        {formData.banner_url ? (
          <div className="space-y-3">
            <div 
              className="relative h-48 w-full border border-slate-200 rounded-2xl overflow-hidden group transition-all cursor-pointer"
              onClick={openGallery}
            >
              <Image src={formData.banner_url} alt="Banner" fill className="object-cover" />
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                <ImageIcon className="w-8 h-8 text-white mb-2 shadow-sm" />
                <span className="text-white text-sm font-semibold tracking-wide">Trocar imagem</span>
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                type="button" 
                onClick={handleClearBanner} 
                className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg"
              >
                <XIcon className="w-3.5 h-3.5" /> Parar de usar imagem
              </button>
            </div>
          </div>
        ) : (
          <div 
            className="relative h-48 w-full border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-blue-400 group transition-all"
            onClick={openGallery}
          >
            <div className="flex flex-col items-center text-slate-400 group-hover:text-blue-500 transition-colors">
              <ImageIcon className="w-8 h-8 mb-3" />
              <span className="text-sm font-semibold">Selecionar da galeria</span>
              <span className="text-xs mt-1 opacity-70">Clique para abrir</span>
            </div>
          </div>
        )}
      </Field>

      <SectionDivider label="Informações Principais" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Título do Evento *">
          <input 
            className={inputCls}
            value={formData.title} 
            onChange={e => setFormData({ ...formData, title: e.target.value })} 
            placeholder="Ex: Culto de Celebração"
            required
          />
        </Field>
        <Field label="Tipo de Evento">
          <Select value={formData.type} onValueChange={(v: EventType) => setFormData({ ...formData, type: v })}>
            <SelectTrigger className="w-full px-3 py-2.5 h-auto bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-800 shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 rounded-xl shadow-lg">
              <SelectItem value="culto" className="cursor-pointer hover:bg-slate-50 rounded-lg">Culto Padrão</SelectItem>
              <SelectItem value="especial" className="cursor-pointer hover:bg-slate-50 rounded-lg">Evento Especial</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Descrição detalhada">
        <textarea 
          className={`${inputCls} min-h-[100px] resize-y`}
          value={formData.description || ""} 
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          placeholder="Escreva os detalhes, convidados e programação do evento..."
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Field label="Data">
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="date" className={`${inputCls} pl-10`} value={formData.date || ""} onChange={e => setFormData({ ...formData, date: e.target.value })} />
          </div>
        </Field>
        <Field label="Horário">
          <div className="relative">
            <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="time" className={`${inputCls} pl-10`} value={formData.time || ""} onChange={e => setFormData({ ...formData, time: e.target.value })} />
          </div>
        </Field>
        <Field label="Local">
          <div className="relative">
            <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className={`${inputCls} pl-10`} value={formData.location || ""} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Ex: Templo Principal" />
          </div>
        </Field>
      </div>

      <SectionDivider label="Publicação e Controle" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
        <Field label="Agendar Publicação" hint="Deixe vazio para o evento aparecer agora.">
          <input type="date" className={inputCls} value={formData.publish_at || ""} onChange={e => setFormData({ ...formData, publish_at: e.target.value })} />
        </Field>
        <Field label="Data de Expiração" hint="Quando o evento deve sumir do site.">
          <input type="date" className={inputCls} value={formData.expires_at || ""} onChange={e => setFormData({ ...formData, expires_at: e.target.value })} />
        </Field>
      </div>

      <SectionDivider label="Inscrições e Pagamento" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Capacidade / Vagas" hint="Deixe 0 para vagas ilimitadas.">
          <div className="relative">
            <UsersIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="number" className={`${inputCls} pl-10`} value={formData.capacity || ""} onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })} placeholder="0" />
          </div>
        </Field>
        <Field label="Preço do Ingresso (R$)" hint="Será integrado com PIX/Asaas em breve.">
          <div className="relative">
            <BanknoteIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="number" step="0.01" className={`${inputCls} pl-10`} value={formData.ticket_price || ""} onChange={e => setFormData({ ...formData, ticket_price: Number(e.target.value) })} placeholder="0.00" />
          </div>
        </Field>
      </div>

      {/* ── Ações do Formulário ── */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-slate-100">
        <button type="button" onClick={onCancel} disabled={isLoading} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors">
          Cancelar
        </button>
        <button 
          type="button"
          onClick={() => handleSubmit('rascunho')} 
          disabled={isLoading || !formData.title}
          className="flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin text-slate-400" /> : <SaveIcon className="w-4 h-4 mr-2 text-slate-400" />}
          Salvar Rascunho
        </button>
        <button 
          type="button"
          onClick={() => handleSubmit('publicado')} 
          disabled={isLoading || !formData.title}
          className="flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-sm shadow-blue-600/20 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <SendIcon className="w-4 h-4 mr-2" />}
          {formData.publish_at && formData.publish_at > new Date().toISOString().split('T')[0] ? 'Agendar Publicação' : 'Publicar Evento'}
        </button>
      </div>

      {/* ── Modal da Galeria ── */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-transparent border-0 shadow-none" showCloseButton={false}>
          <DialogTitle className="sr-only">Galeria de Imagens</DialogTitle>
          <div className="bg-white rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-bold text-slate-900">Galeria de Imagens</h3>
                <p className="text-xs text-slate-500 mt-0.5">Selecione ou envie uma imagem para o evento</p>
              </div>
              <button onClick={() => setIsGalleryOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-3 border-b border-slate-100 shrink-0 bg-slate-50/50">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                <span>Armazenamento utilizado</span>
                <span className={usedPct > 85 ? 'text-red-500' : 'text-slate-600'}>{usedMB.toFixed(1)} MB de {SITE_MEDIA_QUOTA_MB} MB</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${usedPct > 85 ? 'bg-red-500' : usedPct > 60 ? 'bg-amber-400' : 'bg-blue-500'}`} style={{ width: `${usedPct}%` }} />
              </div>
            </div>

            <div className="px-6 py-4 border-b border-slate-100 shrink-0">
              <label className={`flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${isUploading ? 'border-slate-200 bg-slate-50 text-slate-400' : 'border-blue-200 bg-blue-50/30 hover:bg-blue-50 hover:border-blue-400 text-blue-600'}`}>
                {isUploading ? (
                  <><Loader2 className="w-6 h-6 animate-spin text-slate-400" /><span className="text-sm font-semibold">Enviando imagem...</span></>
                ) : (
                  <><ImageIcon className="w-6 h-6" /><span className="text-sm font-semibold">Clique para fazer upload</span><span className="text-xs text-blue-600/60 font-medium">JPG, PNG, WebP · Máximo de 10 MB</span></>
                )}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={handleUploadImage} disabled={isUploading} />
              </label>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50" style={{ scrollbarWidth: 'thin' }}>
              {isLoadingGallery ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
              ) : galleryImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm font-medium">Nenhuma imagem na galeria</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {galleryImages.map(item => {
                    const url = supabase.storage.from('site-images').getPublicUrl(item.name).data.publicUrl;
                    const isSelected = formData.banner_url === url;
                    return (
                      <div
                        key={item.id}
                        className={`group relative aspect-video rounded-xl overflow-hidden bg-white border-2 cursor-pointer transition-all ${isSelected ? 'border-blue-500 shadow-md ring-4 ring-blue-500/10 scale-[1.02]' : 'border-slate-200 hover:border-blue-300 hover:shadow-md'}`}
                        onClick={() => handleSelectImage(item.name)}
                      >
                        <Image src={url} alt={item.name} fill className="object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-blue-600/10 flex items-center justify-center">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/60 transition-all flex flex-col justify-between p-2.5 opacity-0 group-hover:opacity-100">
                          <div className="flex justify-end">
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteImage(item.name); }} className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm transition-colors" title="Excluir imagem">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                          <span className="text-white text-[11px] font-bold tracking-wider drop-shadow-md bg-black/40 px-2 py-0.5 rounded-md self-start">
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