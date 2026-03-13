'use client'

import React, { useState, useTransition, useRef } from 'react';
import Image from 'next/image';
import { updatePublicProfile, changePublicPassword, deletePublicAccount } from '@/features/core/actions/profile';
import { uploadAvatar, removeAvatar } from '@/features/portal/actions/portal-actions';

type Tab = 'dados' | 'senha' | 'conta';

interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

interface ProfileClientProps {
  email: string;
  fullName: string;
  phone: string;
  address: string;
  birthDate: string;
  photoUrl: string | null;
  isAdmin: boolean;
}

function Alert({ state, onClose }: { state: FeedbackState; onClose: () => void }) {
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm mb-6 ${
      state.type === 'success'
        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        : 'bg-red-500/10 border-red-500/20 text-red-400'
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

function AvatarUpload({
  fullName,
  photoUrl,
  onFeedback,
}: {
  fullName: string;
  photoUrl: string | null;
  onFeedback: (f: FeedbackState) => void;
}) {
  const [preview, setPreview] = useState<string | null>(photoUrl);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = fullName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    const formData = new FormData();
    formData.append('file', file);

    startTransition(async () => {
      const result = await uploadAvatar(formData);
      if ('error' in result && result.error) {
        onFeedback({ type: 'error', message: result.error });
        setPreview(photoUrl);
      } else {
        onFeedback({ type: 'success', message: 'Foto atualizada com sucesso!' });
      }
    });
  };

  const handleRemove = () => {
    startTransition(async () => {
      const result = await removeAvatar();
      if (result.success) {
        setPreview(null);
        onFeedback({ type: 'success', message: 'Foto removida.' });
      }
    });
  };

  return (
    <div className="flex items-center gap-5 mb-8">
      <div className="relative shrink-0">
        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-blue-600 flex items-center justify-center text-white font-bold text-2xl">
          {preview ? (
            <Image src={preview} alt={fullName} width={80} height={80} className="object-cover w-full h-full" />
          ) : (
            initials
          )}
        </div>
        {isPending && (
          <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
            <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
        )}
      </div>

      <div>
        <p className="font-bold text-white text-lg leading-tight">{fullName || 'Minha Conta'}</p>
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={isPending}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
          >
            {preview ? 'Trocar foto' : 'Adicionar foto'}
          </button>
          {preview && (
            <>
              <span className="text-slate-700 text-xs">·</span>
              <button
                onClick={handleRemove}
                disabled={isPending}
                className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
              >
                Remover
              </button>
            </>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">JPG, PNG ou WebP · máx. 2 MB</p>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
}

export function ProfileClient({ email, fullName, phone, address, birthDate, photoUrl, isAdmin }: ProfileClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('dados');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'dados', label: 'Dados Pessoais' },
    { id: 'senha', label: 'Senha'          },
    { id: 'conta', label: 'Minha Conta'    },
  ];

  const inputClass = 'w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-500';
  const labelClass = 'block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-2xl mx-auto px-4 pt-[100px] pb-16">

        <AvatarUpload fullName={fullName} photoUrl={photoUrl} onFeedback={setFeedback} />

        <p className="text-slate-500 text-sm mb-8">{email}</p>

        {feedback && <Alert state={feedback} onClose={() => setFeedback(null)} />}

        <div className="flex border-b border-slate-800 mb-8 gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setFeedback(null); }}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'dados' && (
          <DataTab
            fullName={fullName}
            phone={phone}
            address={address}
            birthDate={birthDate}
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
  );
}

// ── Aba Dados Pessoais ───────────────────────────────────────────

function DataTab({
  fullName, phone, address, birthDate, inputClass, labelClass, onFeedback,
}: {
  fullName: string; phone: string; address: string; birthDate: string;
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
        <input name="birthDate" type="date" defaultValue={birthDate} max={new Date().toISOString().split('T')[0]} className={inputClass} />
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
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await changePublicPassword(formData);
      if (result.success) {
        onFeedback({ type: 'success', message: 'Senha alterada com sucesso!' });
        setNewPass('');
        setConfirmPass('');
      } else {
        onFeedback({ type: 'error', message: result.error ?? 'Erro ao alterar senha.' });
      }
    });
  };

  const eyeBtn = (show: boolean, toggle: () => void) => (
    <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
      {show ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="relative">
        <label className={labelClass}>Nova senha</label>
        <input
          name="newPassword"
          type={showNew ? 'text' : 'password'}
          value={newPass}
          onChange={e => setNewPass(e.target.value)}
          placeholder="Mínimo 8 caracteres"
          className={`${inputClass} pr-10`}
        />
        {eyeBtn(showNew, () => setShowNew(v => !v))}
      </div>

      <div className="relative">
        <label className={labelClass}>Confirmar nova senha</label>
        <input
          name="confirmPassword"
          type={showConfirm ? 'text' : 'password'}
          value={confirmPass}
          onChange={e => setConfirmPass(e.target.value)}
          placeholder="Repita a senha"
          className={`${inputClass} pr-10`}
        />
        {eyeBtn(showConfirm, () => setShowConfirm(v => !v))}
      </div>

      {confirmPass && (
        <p className={`text-xs font-medium ${newPass === confirmPass ? 'text-emerald-400' : 'text-red-400'}`}>
          {newPass === confirmPass ? '✓ Senhas coincidem' : '✗ Senhas não coincidem'}
        </p>
      )}

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-xs text-slate-500 space-y-1">
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
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deletePublicAccount();
      if (result?.error) onFeedback({ type: 'error', message: result.error });
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold text-white text-sm">Informações da conta</h3>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Tipo de conta</span>
          <span className={`font-semibold px-2.5 py-1 rounded-lg text-xs ${
            isAdmin ? 'bg-violet-500/15 text-violet-400' : 'bg-slate-700 text-slate-400'
          }`}>
            {isAdmin ? 'Administrador' : 'Membro / Visitante'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Autenticação</span>
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
          <p className="text-red-500/70 text-xs mt-1">Ações irreversíveis. Prossiga com cuidado.</p>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-white text-sm">Excluir minha conta</p>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                Remove permanentemente sua conta e todos os dados pessoais. Esta ação não pode ser desfeita.
              </p>
            </div>
            {!showConfirm && (
              <button
                onClick={() => setShowConfirm(true)}
                disabled={isAdmin}
                className="shrink-0 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
            <div className="mt-4 space-y-3">
              <p className="text-sm text-red-400">
                Digite <strong>EXCLUIR</strong> para confirmar:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="EXCLUIR"
                className="w-full bg-slate-800 border border-red-500/30 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-slate-600"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDelete}
                  disabled={confirmText !== 'EXCLUIR' || isPending}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isPending && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  )}
                  Confirmar exclusão
                </button>
                <button
                  onClick={() => { setShowConfirm(false); setConfirmText(''); }}
                  className="text-slate-500 hover:text-slate-300 text-sm font-semibold transition-colors"
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