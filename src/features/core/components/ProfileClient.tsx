'use client'

import React, { useState, useTransition, useEffect } from 'react';
import { updatePublicProfile, changePublicPassword, deletePublicAccount } from '@/features/core/actions/profile';
import { markGiftAsNotified } from '@/features/events/actions/registrations';
import { AvatarUpload } from '@/features/core/components/AvatarUpload';
import { RoleBadge } from '@/features/core/components/RoleBadge';
import type { AppRole } from '@/features/core/api/get-current-user';
import Link from 'next/link';

interface ProfileClientProps {
  email: string;
  fullName: string;
  phone: string;
  address: string;
  birthDate: string;
  photoUrl: string | null;
  isAdmin: boolean;
  primaryRole?: AppRole;
  uploadsRemaining: number;
  unnotifiedGifts?: { id: string; event: { title: string } }[];
}

type Tab = 'dados' | 'senha' | 'conta';

interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

function Alert({ state, onClose }: { state: FeedbackState; onClose: () => void }) {
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm mb-6 ${
      state.type === 'success'
        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        : 'bg-red-500/10 border-red-500/30 text-red-400'
    }`}>
      <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {state.type === 'success'
          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        }
      </svg>
      <span className="flex-1">{state.message}</span>
      <button onClick={onClose} className="text-current opacity-60 hover:opacity-100 transition-opacity">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ProfileClient({
  email, fullName, phone, address, birthDate, photoUrl, isAdmin, primaryRole, uploadsRemaining, unnotifiedGifts = []
}: ProfileClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('dados');
  const [feedback, setFeedback]   = useState<FeedbackState | null>(null);
  
  const [currentGift, setCurrentGift] = useState<{ id: string; event: { title: string } } | null>(null);
  const [isDismissingGift, startDismissingGift] = useTransition();

  useEffect(() => {
    if (unnotifiedGifts.length > 0 && !currentGift) {
      setCurrentGift(unnotifiedGifts[0]);
    }
  }, [unnotifiedGifts, currentGift]);

  const handleDismissGift = () => {
    if (!currentGift) return;
    startDismissingGift(async () => {
      await markGiftAsNotified(currentGift.id);
      setCurrentGift(null);
    });
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'dados', label: 'Dados Pessoais' },
    { id: 'senha', label: 'Senha' },
    { id: 'conta', label: 'Minha Conta' },
  ];

  const inputClass = 'w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-500';
  const labelClass = 'block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5';
  const initials   = fullName.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-slate-950">
      {currentGift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />
            
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-black text-white mb-2">Você ganhou um presente!</h2>
              <p className="text-slate-300 text-sm mb-8 leading-relaxed">
                Você recebeu uma inscrição de cortesia para o evento <strong className="text-white">{currentGift.event.title}</strong>.
              </p>

              <div className="flex flex-col gap-3">
                <Link
                  href={`/comprovante/${currentGift.id}`}
                  onClick={handleDismissGift}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                >
                  Ver meu ingresso
                </Link>
                <button
                  onClick={handleDismissGift}
                  disabled={isDismissingGift}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50"
                >
                  {isDismissingGift ? 'Fechando...' : 'Fechar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blurs decorativos */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-indigo-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 pt-32 pb-16">
        {/* Header do perfil */}
        <div className="flex items-center gap-5 mb-10">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-300 font-bold text-2xl shrink-0">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt={fullName || 'Avatar'} className="object-cover w-full h-full" />
            ) : (
              initials
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{fullName || 'Minha Conta'}</h1>
            <p className="text-slate-400 text-sm mt-0.5">{email}</p>
            {primaryRole && (
              <div className="mt-2">
                <RoleBadge role={primaryRole} />
              </div>
            )}
          </div>
        </div>

        {/* Card com glass */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl">
          {/* Tabs */}
          <div className="flex border-b border-slate-700/50">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setFeedback(null); }}
                className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6 md:p-8">
            {feedback && <Alert state={feedback} onClose={() => setFeedback(null)} />}

            {activeTab === 'dados' && (
              <DataTab
                fullName={fullName}
                phone={phone}
                address={address}
                birthDate={birthDate}
                photoUrl={photoUrl}
                uploadsRemaining={uploadsRemaining}
                inputClass={inputClass}
                labelClass={labelClass}
                onFeedback={setFeedback}
              />
            )}
            {activeTab === 'senha' && (
              <PasswordTab inputClass={inputClass} labelClass={labelClass} onFeedback={setFeedback} />
            )}
            {activeTab === 'conta' && (
              <AccountTab isAdmin={isAdmin} onFeedback={setFeedback} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Aba Dados Pessoais ───────────────────────────────────────────

function DataTab({
  fullName, phone, address, birthDate, photoUrl, uploadsRemaining, inputClass, labelClass, onFeedback,
}: {
  fullName: string; phone: string; address: string; birthDate: string;
  photoUrl: string | null; uploadsRemaining: number;
  inputClass: string; labelClass: string;
  onFeedback: (f: FeedbackState) => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updatePublicProfile(formData);
      if (result.success) onFeedback({ type: 'success', message: 'Dados atualizados com sucesso!' });
      else onFeedback({ type: 'error', message: result.error ?? 'Erro ao salvar.' });
    });
  };

  return (
    <div className="space-y-8">
      <AvatarUpload
        currentPhotoUrl={photoUrl}
        fullName={fullName}
        uploadsRemaining={uploadsRemaining}
      />

      <div className="border-t border-slate-700/50 pt-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelClass}>Nome completo *</label>
            <input name="fullName" type="text" defaultValue={fullName} maxLength={100} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Telefone</label>
            <input name="phone" type="tel" defaultValue={phone} maxLength={20} placeholder="(XX) XXXXX-XXXX" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Data de nascimento</label>
            <input name="birthDate" type="date" defaultValue={birthDate} max={new Date().toISOString().split('T')[0]} className={`${inputClass} [color-scheme:dark]`} />
          </div>
          <div>
            <label className={labelClass}>Endereço</label>
            <textarea name="address" defaultValue={address} maxLength={300} rows={3} placeholder="Rua, número, bairro, cidade..." className={`${inputClass} resize-none`} />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {isPending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Salvando...
                </>
              ) : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Aba Senha ────────────────────────────────────────────────────

function PasswordTab({
  inputClass, labelClass, onFeedback,
}: {
  inputClass: string; labelClass: string;
  onFeedback: (f: FeedbackState) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newPass, setNewPass]         = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [currentPass, setCurrentPass] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await changePublicPassword(formData);
      if (result.success) {
        onFeedback({ type: 'success', message: 'Senha alterada com sucesso!' });
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
      } else {
        onFeedback({ type: 'error', message: result.error ?? 'Erro ao alterar senha.' });
      }
    });
  };

  const eyeIcon = (visible: boolean) => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {visible
        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
      }
    </svg>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="relative">
        <label className={labelClass}>Senha atual</label>
        <input
          name="currentPassword"
          type={showCurrent ? 'text' : 'password'}
          value={currentPass}
          onChange={e => setCurrentPass(e.target.value)}
          required
          className={inputClass}
        />
        <button type="button" onClick={() => setShowCurrent(v => !v)}
          className="absolute right-3 top-[34px] text-slate-500 hover:text-slate-300">
          {eyeIcon(showCurrent)}
        </button>
      </div>

      <div className="relative">
        <label className={labelClass}>Nova senha</label>
        <input
          name="newPassword"
          type={showNew ? 'text' : 'password'}
          value={newPass}
          onChange={e => setNewPass(e.target.value)}
          minLength={8}
          maxLength={72}
          required
          className={inputClass}
        />
        <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-[34px] text-slate-500 hover:text-slate-300">
          {eyeIcon(showNew)}
        </button>
      </div>

      <div className="relative">
        <label className={labelClass}>Confirmar nova senha</label>
        <input
          name="confirmPassword"
          type={showConfirm ? 'text' : 'password'}
          value={confirmPass}
          onChange={e => setConfirmPass(e.target.value)}
          minLength={8}
          maxLength={72}
          required
          className={inputClass}
        />
        <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-[34px] text-slate-500 hover:text-slate-300">
          {eyeIcon(showConfirm)}
        </button>
      </div>

      {confirmPass && (
        <p className={`text-xs font-semibold ${newPass === confirmPass ? 'text-emerald-400' : 'text-red-400'}`}>
          {newPass === confirmPass ? '✓ Senhas coincidem' : '✗ Senhas não coincidem'}
        </p>
      )}

      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 text-xs text-slate-500 space-y-1">
        <p className={newPass.length >= 8 ? 'text-emerald-400' : ''}>• Mínimo 8 caracteres</p>
        <p className={/[A-Z]/.test(newPass) ? 'text-emerald-400' : ''}>• Pelo menos 1 letra maiúscula</p>
        <p className={/[0-9]/.test(newPass) ? 'text-emerald-400' : ''}>• Pelo menos 1 número</p>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
        >
          {isPending ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Alterando...
            </>
          ) : 'Alterar senha'}
        </button>
      </div>
    </form>
  );
}

// ── Aba Minha Conta ──────────────────────────────────────────────

function AccountTab({ isAdmin, onFeedback }: { isAdmin: boolean; onFeedback: (f: FeedbackState) => void }) {
  const [showConfirm, setShowConfirm]       = useState(false);
  const [confirmText, setConfirmText]       = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePass, setShowDeletePass] = useState(false);
  const [isPending, startTransition]        = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deletePublicAccount(deletePassword);
      if (result?.error) onFeedback({ type: 'error', message: result.error });
    });
  };

  const resetConfirm = () => {
    setShowConfirm(false);
    setConfirmText('');
    setDeletePassword('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold text-slate-200 text-sm">Informações da conta</h3>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Tipo de conta</span>
          <span className={`font-semibold px-2.5 py-1 rounded-lg text-xs ${
            isAdmin
              ? 'bg-violet-500/15 border border-violet-500/30 text-violet-300'
              : 'bg-slate-700/50 border border-slate-600/50 text-slate-300'
          }`}>
            {isAdmin ? 'Administrador' : 'Membro / Visitante'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Autenticação</span>
          <span className="font-medium text-slate-300">E-mail e senha</span>
        </div>
      </div>

      <div className="border border-red-500/20 rounded-2xl overflow-hidden">
        <div className="bg-red-500/5 px-5 py-4 border-b border-red-500/20">
          <h3 className="font-bold text-red-400 text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Zona de Perigo
          </h3>
          <p className="text-red-400/70 text-xs mt-1">Ações irreversíveis. Prossiga com cuidado.</p>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-slate-200 text-sm">Excluir minha conta</p>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                Remove permanentemente sua conta e todos os dados pessoais. Esta ação não pode ser desfeita.
              </p>
            </div>
            {!showConfirm && (
              <button
                onClick={() => setShowConfirm(true)}
                disabled={isAdmin}
                className="shrink-0 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Excluir
              </button>
            )}
          </div>

          {isAdmin && (
            <p className="mt-3 text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg">
              Administradores não podem excluir a própria conta por aqui. Entre em contato com a liderança.
            </p>
          )}

          {showConfirm && !isAdmin && (
            <div className="mt-4 space-y-3 border-t border-red-500/20 pt-4">
              <p className="text-xs text-slate-400">
                Digite <strong className="text-slate-200">EXCLUIR</strong> para confirmar:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="EXCLUIR"
                className="w-full bg-slate-800/50 border border-red-500/30 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-slate-600"
              />

              <p className="text-xs text-slate-400">Confirme sua senha:</p>
              <div className="relative">
                <input
                  type={showDeletePass ? 'text' : 'password'}
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  placeholder="Sua senha atual"
                  className="w-full bg-slate-800/50 border border-red-500/30 text-white rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowDeletePass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showDeletePass ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </>
                    )}
                  </svg>
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={confirmText !== 'EXCLUIR' || !deletePassword || isPending}
                  className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isPending && (
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  )}
                  Confirmar exclusão
                </button>
                <button
                  onClick={resetConfirm}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-200 px-4 py-2.5 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}