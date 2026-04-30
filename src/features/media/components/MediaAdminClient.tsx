'use client'

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/features/core/components/ToastContext';
import { updateUploadSettings, deleteMediaAsset, syncOldMediaAssets, type MediaAsset, type UploadSettings, type MediaCategory } from '@/features/media/actions/media-actions';

interface Props {
  initialAssets: MediaAsset[];
  settings: UploadSettings | null;
  isSysAdmin: boolean;
}

export function MediaAdminClient({ initialAssets, settings, isSysAdmin }: Props) {
  const router = useRouter();
  const { toast, dismiss } = useToast();
  const [assets, setAssets] = useState(initialAssets);
  const [activeTab, setActiveTab] = useState<MediaCategory | 'all' | 'settings'>('all');
  const [isPending, startTransition] = useTransition();
  const [isSyncing, setIsSyncing] = useState(false);

  // Handle Delete
  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Excluir definitivamente o arquivo "${name}"? Ele será removido do Storage e quebrará qualquer imagem usando essa URL.`)) return;
    
    startTransition(async () => {
      const toastId = toast('loading', 'Excluindo...');
      const res = await deleteMediaAsset(id);
      dismiss(toastId);
      if (res.error) {
        toast('error', res.error);
        return;
      }
      toast('success', 'Arquivo removido!');
      setAssets(prev => prev.filter(a => a.id !== id));
      router.refresh();
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

  // Handle Settings Save
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

  const filteredAssets = activeTab === 'all' || activeTab === 'settings' 
    ? assets 
    : assets.filter(a => a.category === activeTab);

  const formatSize = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + ' MB';
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' });

  const tabs: { id: MediaCategory | 'all', label: string }[] = [
    { id: 'all', label: 'Todos os Arquivos' },
    { id: 'avatar', label: 'Perfis & Líderes' },
    { id: 'pastor', label: 'Pastores' },
    { id: 'cell', label: 'Células' },
    { id: 'banner', label: 'Banners Gerais' },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Central de Mídias</h1>
        <p className="text-slate-500 mt-1.5 text-sm">
          Audite, organize e controle todos os uploads de imagens do sistema.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div className="flex flex-wrap gap-2">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === t.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        
        {isSysAdmin && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'settings' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-900 hover:text-slate-900'}`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Configurações
          </button>
        )}
      </div>

      {/* Content */}
      {activeTab === 'settings' ? (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-slate-200 p-6 max-w-2xl">
          <div className="mb-6 pb-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">Uploads Globais</h3>
              <p className="text-sm text-slate-500">Chave mestre para permitir ou bloquear envio de arquivos no sistema inteiro.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" name="global_enabled" defaultChecked={settings?.global_enabled} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="space-y-6">
            {[
              { id: 'avatars', title: 'Fotos de Perfil e Líderes', kb: settings?.avatars_max_size_kb, on: settings?.avatars_enabled },
              { id: 'pastors', title: 'Fotos de Pastores', kb: settings?.pastors_max_size_kb, on: settings?.pastors_enabled },
              { id: 'cells', title: 'Células (Banners e Líderes)', kb: settings?.cells_max_size_kb, on: settings?.cells_enabled },
              { id: 'banners', title: 'Banners Gerais do Site', kb: settings?.banners_max_size_kb, on: settings?.banners_enabled },
            ].map(cat => (
              <div key={cat.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-800">{cat.title}</h4>
                  <label className="flex items-center gap-2 mt-2">
                    <input type="checkbox" name={`${cat.id}_enabled`} defaultChecked={cat.on} className="rounded text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-slate-600">Permitir uploads desta categoria</span>
                  </label>
                </div>
                <div className="shrink-0 w-32">
                  <label className="text-xs font-medium text-slate-500 block mb-1">Max Size (KB)</label>
                  <input type="number" name={`${cat.id}_max_size_kb`} defaultValue={cat.kb} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <button 
              type="button" 
              onClick={handleSyncOldMedia} 
              disabled={isSyncing}
              className="text-sm text-slate-500 hover:text-slate-800 underline disabled:opacity-50"
            >
              {isSyncing ? 'Sincronizando...' : 'Sincronizar imagens anteriores'}
            </button>
            <button type="submit" disabled={isPending} className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors disabled:opacity-50">
              {isPending ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredAssets.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Nenhuma imagem encontrada nesta categoria.
            </div>
          ) : (
            filteredAssets.map(asset => (
              <div key={asset.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col hover:border-blue-300 transition-colors group">
                <div className="relative aspect-square bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset.url} alt={asset.file_name} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-[10px] font-bold text-white uppercase">
                    {asset.category}
                  </div>
                  <button 
                    onClick={() => handleDelete(asset.id, asset.file_name)}
                    disabled={isPending}
                    className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    title="Excluir do Storage"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
                <div className="p-3 text-xs">
                  <p className="font-semibold text-slate-800 truncate mb-1" title={asset.file_name}>{asset.file_name}</p>
                  <p className="text-slate-500 flex justify-between"><span>{formatSize(asset.size_bytes)}</span> <span>{asset.mime_type.split('/')[1]?.toUpperCase()}</span></p>
                  <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                    <p className="truncate">Por: {asset.uploader?.full_name || 'Desconhecido'}</p>
                    <p>{formatDate(asset.created_at)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
