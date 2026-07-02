'use client'

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/features/core/components/ToastContext';
import { AdminEmptyState } from '@/features/core/components/AdminEmptyState';
import { AdminButton } from '@/features/core/components/AdminUI';
import { updateUploadSettings, deleteMediaAsset, updateMediaAsset, syncOldMediaAssets, type MediaAsset, type UploadSettings, type MediaCategory } from '@/features/media/actions/media-actions';

interface Props {
  initialAssets: MediaAsset[];
  settings: UploadSettings | null;
  isSysAdmin: boolean;
}

const CATEGORIES: { id: MediaCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'avatar', label: 'Fotos de Perfil', icon: <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
  { id: 'pastor', label: 'Pastores', icon: <svg className="w-8 h-8 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 19h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg> },
  { id: 'cell', label: 'Células', icon: <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
  { id: 'banner', label: 'Banners Gerais', icon: <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
  { id: 'event', label: 'Eventos', icon: <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
  { id: 'support_archive', label: 'Arquivos Suporte', icon: <svg className="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
  { id: 'support_attachment', label: 'Anexos Suporte', icon: <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg> },
];

export function MediaAdminClient({ initialAssets, settings, isSysAdmin }: Props) {
  const router = useRouter();
  const { toast, dismiss } = useToast();
  const [assets, setAssets] = useState(initialAssets);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'folders' | 'settings'>('folders');
  const [selectedCategory, setSelectedCategory] = useState<MediaCategory | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  
  const [isPending, startTransition] = useTransition();
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Modal State
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Grouping logic
  const filteredByCategory = selectedCategory ? assets.filter(a => a.category === selectedCategory) : [];
  
  // Get unique owners in this category
  const owners = Array.from(new Set(filteredByCategory.map(a => a.owner_name || 'Desconhecido'))).sort();
  
  // Final assets to display if an owner is selected
  const filteredAssets = selectedOwner 
    ? filteredByCategory.filter(a => (a.owner_name || 'Desconhecido') === selectedOwner)
    : [];

  const formatSize = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + ' MB';
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' });

  // Handle Actions
  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Excluir definitivamente o arquivo "${name}"? Ele será removido do Storage permanentemente.`)) return;
    startTransition(async () => {
      const toastId = toast('loading', 'Excluindo...');
      const res = await deleteMediaAsset(id);
      dismiss(toastId);
      if (res.error) { toast('error', res.error); return; }
      toast('success', 'Arquivo removido!');
      setAssets(prev => prev.filter(a => a.id !== id));
      setSelectedAsset(null);
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAsset) return;
    const fd = new FormData(e.currentTarget);
    const newName = fd.get('file_name') as string;
    const newCategory = fd.get('category') as MediaCategory;
    
    startTransition(async () => {
      const toastId = toast('loading', 'Atualizando...');
      const res = await updateMediaAsset(selectedAsset.id, { file_name: newName, category: newCategory });
      dismiss(toastId);
      if (res.error) { toast('error', res.error); return; }
      toast('success', 'Arquivo atualizado!');
      
      setAssets(prev => prev.map(a => a.id === selectedAsset.id ? { ...a, file_name: newName, category: newCategory } : a));
      setIsEditing(false);
      setSelectedAsset(prev => prev ? { ...prev, file_name: newName, category: newCategory } : null);
    });
  };

  const handleSyncOldMedia = () => {
    startTransition(async () => {
      setIsSyncing(true);
      const toastId = toast('loading', 'Sincronizando imagens...');
      const res = await syncOldMediaAssets();
      dismiss(toastId);
      if (res.error) toast('error', res.error);
      else {
        toast('success', 'Mídias antigas sincronizadas!');
        router.refresh();
      }
      setIsSyncing(false);
    });
  };

  const handleSaveSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isSysAdmin) return;
    const fd = new FormData(e.currentTarget);
    const payload = {
      global_enabled: fd.get('global_enabled') === 'on',
      avatars_enabled: fd.get('avatars_enabled') === 'on',
      avatars_max_size_kb: Number(fd.get('avatars_max_size_kb')) || 3072,
      pastors_enabled: fd.get('pastors_enabled') === 'on',
      pastors_max_size_kb: Number(fd.get('pastors_max_size_kb')) || 5120,
      cells_enabled: fd.get('cells_enabled') === 'on',
      cells_max_size_kb: Number(fd.get('cells_max_size_kb')) || 5120,
      banners_enabled: fd.get('banners_enabled') === 'on',
      banners_max_size_kb: Number(fd.get('banners_max_size_kb')) || 10240,
    };
    startTransition(async () => {
      const toastId = toast('loading', 'Salvando configs...');
      const res = await updateUploadSettings(payload);
      dismiss(toastId);
      if (res.error) toast('error', res.error);
      else toast('success', 'Configurações atualizadas!');
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setActiveTab('folders'); setSelectedCategory(null); setSelectedOwner(null); }}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${activeTab === 'folders' ? 'bg-blue-600 text-white' : 'bg-[var(--admin-surface)] text-[var(--admin-text-secondary)] border border-[var(--admin-border)] hover:bg-[var(--admin-surface-alt)]'}`}>
            Gerenciador de Pastas
          </button>
          {isSysAdmin && (
            <button onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'bg-[var(--admin-surface)] text-[var(--admin-text-secondary)] border border-[var(--admin-border)] hover:bg-[var(--admin-surface-alt)]'}`}>
              Configurações
            </button>
          )}
        </div>
      </div>

      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="rounded-2xl border p-6 max-w-2xl" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
          <div className="mb-6 pb-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--admin-border)' }}>
            <div>
              <h3 className="font-bold text-[15px]" style={{ color: 'var(--admin-text-primary)' }}>Uploads Globais</h3>
              <p className="text-sm mt-1" style={{ color: 'var(--admin-text-secondary)' }}>Chave mestre para permitir ou bloquear envio de arquivos no sistema inteiro.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" name="global_enabled" defaultChecked={settings?.global_enabled} className="sr-only peer" />
              <div className="w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" style={{ background: 'var(--admin-surface-alt)' }}></div>
            </label>
          </div>

          <div className="space-y-4">
            {[
              { id: 'avatars', title: 'Fotos de Perfil e Líderes', kb: settings?.avatars_max_size_kb, on: settings?.avatars_enabled },
              { id: 'pastors', title: 'Fotos de Pastores', kb: settings?.pastors_max_size_kb, on: settings?.pastors_enabled },
              { id: 'cells', title: 'Células (Banners e Líderes)', kb: settings?.cells_max_size_kb, on: settings?.cells_enabled },
              { id: 'banners', title: 'Banners Gerais do Site', kb: settings?.banners_max_size_kb, on: settings?.banners_enabled },
            ].map(cat => (
              <div key={cat.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl" style={{ background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)' }}>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm" style={{ color: 'var(--admin-text-primary)' }}>{cat.title}</h4>
                  <label className="flex items-center gap-2 mt-2">
                    <input type="checkbox" name={`${cat.id}_enabled`} defaultChecked={cat.on} className="rounded text-blue-600 focus:ring-blue-500 bg-transparent border-[var(--admin-border)]" />
                    <span className="text-xs" style={{ color: 'var(--admin-text-secondary)' }}>Permitir uploads desta categoria</span>
                  </label>
                </div>
                <div className="shrink-0 w-32">
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--admin-text-muted)' }}>Max Size (KB)</label>
                  <input type="number" name={`${cat.id}_max_size_kb`} defaultValue={cat.kb} className="w-full h-9 px-3 rounded-lg text-sm outline-none" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-primary)' }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4" style={{ borderTop: '1px solid var(--admin-border)' }}>
            <button type="button" onClick={handleSyncOldMedia} disabled={isSyncing} className="text-xs hover:underline disabled:opacity-50" style={{ color: 'var(--admin-text-muted)' }}>
              {isSyncing ? 'Sincronizando...' : 'Sincronizar imagens anteriores'}
            </button>
            <AdminButton type="submit" variant="primary" loading={isPending}>Salvar Configurações</AdminButton>
          </div>
        </form>
      )}

      {activeTab === 'folders' && (
        <div className="space-y-6">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--admin-text-secondary)' }}>
            <button onClick={() => { setSelectedCategory(null); setSelectedOwner(null); }} className="hover:text-blue-400 transition-colors">Categorias</button>
            {selectedCategory && (
              <>
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                <button onClick={() => setSelectedOwner(null)} className="hover:text-blue-400 transition-colors">
                  {CATEGORIES.find(c => c.id === selectedCategory)?.label}
                </button>
              </>
            )}
            {selectedOwner && (
              <>
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                <span style={{ color: 'var(--admin-text-primary)' }}>{selectedOwner}</span>
              </>
            )}
          </div>

          {/* Level 0: Categories */}
          {!selectedCategory && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {CATEGORIES.map(cat => {
                const count = assets.filter(a => a.category === cat.id).length;
                return (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className="flex flex-col items-center justify-center p-6 rounded-2xl transition-all duration-200 hover:-translate-y-1 group" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)' }}>
                      {cat.icon}
                    </div>
                    <h3 className="font-bold text-[13px] mb-1 text-center" style={{ color: 'var(--admin-text-primary)' }}>{cat.label}</h3>
                    <p className="text-[11px]" style={{ color: 'var(--admin-text-secondary)' }}>{count} arquivo(s)</p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Level 1: Owners */}
          {selectedCategory && !selectedOwner && (
            owners.length === 0 ? (
              <AdminEmptyState icon="media" title="Pasta Vazia" description="Nenhum arquivo encontrado nesta categoria." />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {owners.map(owner => {
                  const count = filteredByCategory.filter(a => (a.owner_name || 'Desconhecido') === owner).length;
                  return (
                    <button key={owner} onClick={() => setSelectedOwner(owner)} className="flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 group text-left" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
                      <div className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-blue-400 transition-colors group-hover:text-blue-300" style={{ background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)' }}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[13px] truncate" style={{ color: 'var(--admin-text-primary)' }}>{owner}</h3>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--admin-text-secondary)' }}>{count} arquivo(s)</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          )}

          {/* Level 2: Files */}
          {selectedOwner && (
            filteredAssets.length === 0 ? (
              <AdminEmptyState icon="media" title="Nenhum arquivo" description="Este usuário não possui arquivos nesta categoria." />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {filteredAssets.map(asset => {
                  const isImage = asset.mime_type.startsWith('image/');
                  return (
                    <div key={asset.id} onClick={() => { setSelectedAsset(asset); setIsEditing(false); }} className="bg-[var(--admin-surface)] rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:ring-2 hover:ring-blue-500/50" style={{ border: '1px solid var(--admin-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
                      <div className="relative aspect-square bg-[var(--admin-surface-alt)] flex items-center justify-center">
                        {isImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={asset.url} alt={asset.file_name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-[var(--admin-text-secondary)]">
                            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            <span className="text-[10px] font-bold uppercase tracking-wider">{asset.mime_type.split('/')[1] || 'FILE'}</span>
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>
                      <div className="p-4 flex flex-col justify-between h-24">
                        <p className="font-bold text-[13px] truncate" style={{ color: 'var(--admin-text-primary)' }} title={asset.file_name}>{asset.file_name}</p>
                        <div className="flex items-center justify-between mt-auto text-[11px]" style={{ color: 'var(--admin-text-secondary)' }}>
                          <span>{formatSize(asset.size_bytes)}</span>
                          <span>{formatDate(asset.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}

      {/* Media Details Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedAsset(null)} />
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden rounded-2xl shadow-2xl" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border-strong)' }} onClick={e => e.stopPropagation()}>
            
            {/* Viewer Section */}
            <div className="w-full md:w-3/5 bg-black flex items-center justify-center relative overflow-hidden" style={{ minHeight: '300px' }}>
              {selectedAsset.mime_type.startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedAsset.url} alt={selectedAsset.file_name} className="max-w-full max-h-full object-contain" />
              ) : selectedAsset.mime_type === 'application/pdf' ? (
                <iframe src={selectedAsset.url} className="w-full h-full border-none" title="PDF Viewer" />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  <span className="text-sm">Visualização não disponível para este formato.</span>
                  <a href={selectedAsset.url} target="_blank" rel="noreferrer" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-500 transition-colors">Baixar Arquivo</a>
                </div>
              )}
            </div>

            {/* Details & Edit Section */}
            <div className="w-full md:w-2/5 flex flex-col h-full overflow-y-auto" style={{ borderLeft: '1px solid var(--admin-border)' }}>
              <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--admin-border)' }}>
                <h3 className="font-bold text-[15px]" style={{ color: 'var(--admin-text-primary)' }}>Detalhes do Arquivo</h3>
                <button onClick={() => setSelectedAsset(null)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors" style={{ color: 'var(--admin-text-muted)' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <div className="flex-1 p-5">
                {isEditing ? (
                  <form id="edit-media-form" onSubmit={handleUpdate} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--admin-text-secondary)' }}>Nome do Arquivo</label>
                      <input name="file_name" defaultValue={selectedAsset.file_name} required
                        className="w-full h-9 px-3 rounded-xl text-sm outline-none transition-all"
                        style={{ background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-primary)' }}
                        onFocus={e => { e.target.style.borderColor = 'rgba(37,99,235,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                        onBlur={e => { e.target.style.borderColor = 'var(--admin-border)'; e.target.style.boxShadow = 'none'; }} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--admin-text-secondary)' }}>Categoria</label>
                      <select name="category" defaultValue={selectedAsset.category}
                        className="w-full h-9 px-3 rounded-xl text-sm outline-none transition-all cursor-pointer"
                        style={{ background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-primary)' }}
                        onFocus={e => { e.target.style.borderColor = 'rgba(37,99,235,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                        onBlur={e => { e.target.style.borderColor = 'var(--admin-border)'; e.target.style.boxShadow = 'none'; }}>
                        {CATEGORIES.map(c => <option key={c.id} value={c.id} style={{ background: '#111d35' }}>{c.label}</option>)}
                        <option value="other" style={{ background: '#111d35' }}>Outros</option>
                      </select>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4 text-sm" style={{ color: 'var(--admin-text-secondary)' }}>
                    <div><strong className="block text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--admin-text-muted)' }}>Nome</strong> <span className="text-[var(--admin-text-primary)] break-all">{selectedAsset.file_name}</span></div>
                    <div><strong className="block text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--admin-text-muted)' }}>Proprietário / Ref</strong> <span className="text-[var(--admin-text-primary)]">{selectedAsset.owner_name}</span></div>
                    <div><strong className="block text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--admin-text-muted)' }}>Categoria</strong> {CATEGORIES.find(c => c.id === selectedAsset.category)?.label || 'Outros'}</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><strong className="block text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--admin-text-muted)' }}>Tamanho</strong> {formatSize(selectedAsset.size_bytes)}</div>
                      <div><strong className="block text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--admin-text-muted)' }}>Tipo</strong> {selectedAsset.mime_type}</div>
                    </div>
                    <div><strong className="block text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--admin-text-muted)' }}>Enviado em</strong> {formatDate(selectedAsset.created_at)}</div>
                    <div>
                      <strong className="block text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--admin-text-muted)' }}>URL Pública</strong>
                      <a href={selectedAsset.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline break-all text-xs">{selectedAsset.url}</a>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 flex flex-col gap-2" style={{ borderTop: '1px solid var(--admin-border)' }}>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-2 rounded-xl text-sm font-bold text-[var(--admin-text-secondary)] bg-[var(--admin-surface-alt)] hover:bg-white/10 transition-colors border border-[var(--admin-border)]">Cancelar</button>
                    <button type="submit" form="edit-media-form" disabled={isPending} className="flex-1 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors disabled:opacity-50">Salvar</button>
                  </div>
                ) : (
                  <>
                    <button type="button" onClick={() => setIsEditing(true)} className="w-full py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      Editar Informações
                    </button>
                    {isSysAdmin && (
                      <button type="button" onClick={() => handleDelete(selectedAsset.id, selectedAsset.file_name)} disabled={isPending} className="w-full py-2 rounded-xl text-sm font-bold text-red-400 hover:bg-red-950/30 transition-colors border border-transparent hover:border-red-900/50 flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Excluir do Storage
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
