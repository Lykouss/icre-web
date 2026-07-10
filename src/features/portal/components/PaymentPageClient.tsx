'use client'

import React, { useState, useTransition, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { checkAndUpdatePaymentStatus, syncPaymentDetails } from '@/features/events/actions/registrations';

interface PaymentData {
  registrationId: string;
  eventId: string;
  eventTitle: string;
  paymentMethod: string | null;
  asaasPaymentId: string | null;
  asaasInvoiceUrl: string | null;
  pixQrCode: string | null;
  pixCopyPaste: string | null;
  pixExpirationDate: string | null;
  boletoUrl: string | null;
  boletoBarCode: string | null;
  value: number;
  dueDate: string | null;
  status: string;
  acceptsPix?: boolean;
  acceptsBoleto?: boolean;
}

interface Props {
  payment: PaymentData;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR');
}

type Tab = 'pix' | 'boleto' | 'cartao';

export function PaymentPageClient({ payment }: Props) {
  const router = useRouter();
  const isBoleto = payment.paymentMethod === 'asaas_boleto' || payment.paymentMethod === 'boleto';
  const defaultTab = isBoleto ? 'boleto' : (payment.acceptsPix !== false ? 'pix' : 'boleto');
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
  const [pixCopied, setPixCopied] = useState(false);
  const [barCodeCopied, setBarCodeCopied] = useState(false);
  const [isChecking, startChecking] = useTransition();
  const [checkError, setCheckError] = useState('');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  const [livePixQrCode, setLivePixQrCode] = useState(payment.pixQrCode);
  const [livePixCopyPaste, setLivePixCopyPaste] = useState(payment.pixCopyPaste);
  const [liveBoletoUrl, setLiveBoletoUrl] = useState(payment.boletoUrl);
  const [liveBoletoBarCode, setLiveBoletoBarCode] = useState(payment.boletoBarCode);
  const [isSyncing, setIsSyncing] = useState(false);

  // Poll para gerar PIX ou Boleto caso falhe na geração inicial
  useEffect(() => {
    if (paymentConfirmed) return;
    const missingPix = !isBoleto && !livePixQrCode;
    const missingBoleto = isBoleto && !liveBoletoUrl;
    
    if (missingPix || missingBoleto) {
      setIsSyncing(true);
      const syncInterval = setInterval(async () => {
        const details = await syncPaymentDetails(payment.registrationId);
        if (details && !details.error) {
          if (!isBoleto && details.pixQrCode) {
            setLivePixQrCode(details.pixQrCode);
            setLivePixCopyPaste(details.pixCopyPaste ?? null);
            setIsSyncing(false);
            clearInterval(syncInterval);
          } else if (isBoleto && details.boletoUrl) {
            setLiveBoletoUrl(details.boletoUrl);
            setLiveBoletoBarCode(details.boletoBarCode ?? null);
            setIsSyncing(false);
            clearInterval(syncInterval);
          }
        }
      }, 3000);
      return () => clearInterval(syncInterval);
    }
  }, [paymentConfirmed, isBoleto, livePixQrCode, liveBoletoUrl, payment.registrationId]);

  // Countdown do PIX
  useEffect(() => {
    if (!payment.pixExpirationDate) return;
    const target = new Date(payment.pixExpirationDate).getTime();

    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setTimeLeft('Expirado'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h > 0 ? `${h}h ` : ''}${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [payment.pixExpirationDate]);

  // Auto-polling a cada 10s
  const checkPayment = useCallback(() => {
    startChecking(async () => {
      const result = await checkAndUpdatePaymentStatus(payment.registrationId);
      if (result.paid) {
        setPaymentConfirmed(true);
        setTimeout(() => router.push('/minhas-inscricoes'), 1500);
      }
    });
  }, [payment.registrationId, router]);

  useEffect(() => {
    if (paymentConfirmed) return;
    const interval = setInterval(checkPayment, 10_000);
    return () => clearInterval(interval);
  }, [checkPayment, paymentConfirmed]);

  const handleManualCheck = () => {
    setCheckError('');
    startChecking(async () => {
      const result = await checkAndUpdatePaymentStatus(payment.registrationId);
      if (result.paid) {
        setPaymentConfirmed(true);
        setTimeout(() => router.push('/minhas-inscricoes'), 1500);
      } else {
        setCheckError('Pagamento ainda não confirmado. Aguarde alguns instantes.');
      }
    });
  };

  const copyPix = async () => {
    if (!livePixCopyPaste) return;
    await navigator.clipboard.writeText(livePixCopyPaste);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 3000);
  };

  const copyBarCode = async () => {
    if (!liveBoletoBarCode) return;
    await navigator.clipboard.writeText(liveBoletoBarCode);
    setBarCodeCopied(true);
    setTimeout(() => setBarCodeCopied(false), 3000);
  };

  if (paymentConfirmed) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute w-24 h-24 rounded-full bg-emerald-500/10 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-20 h-20 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Pagamento confirmado!</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Redirecionando para o seu comprovante...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-600/6 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-lg mx-auto px-4 pt-28 pb-16">
        {/* Back */}
        <Link
          href={`/agenda/${payment.eventId}`}
          className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white text-sm font-medium transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar ao evento
        </Link>

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">Pagamento pendente</p>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-1">{payment.eventTitle}</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-2xl font-black text-emerald-400">{formatCurrency(payment.value)}</span>
            {payment.dueDate && (
              <span className="text-sm text-slate-500 dark:text-slate-400">· Vence em {formatDate(payment.dueDate)}</span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-50 dark:bg-slate-900/60 border border-black/5 dark:border-white/8 rounded-2xl p-1.5 mb-6">
          {(['pix', 'boleto', 'cartao'] as Tab[])
            .filter(tab => {
              if (tab === 'pix') return payment.acceptsPix !== false;
              if (tab === 'boleto') return payment.acceptsBoleto !== false;
              return true; // cartao é mostrado como em breve
            })
            .map(tab => (
            <button
              key={tab}
              onClick={() => tab !== 'cartao' && setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab
                  ? 'bg-black/5 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                  : tab === 'cartao'
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'pix' && (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.9999 2L3 7v10l9 5 9-5V7l-9-5zM12 4.236L18.764 8 12 11.764 5.236 8 12 4.236zM4 9.236l7 3.888V19.764L4 15.888V9.236zm9 10.528V13.124l7-3.888v6.652L13 19.764z"/>
                </svg>
              )}
              {tab === 'boleto' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {tab === 'cartao' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              )}
              <span className="capitalize">{tab === 'cartao' ? 'Cartão' : tab.toUpperCase()}</span>
              {tab === 'cartao' && (
                <span className="bg-slate-700 text-slate-500 dark:text-slate-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full">Em breve</span>
              )}
            </button>
          ))}
        </div>

        {/* PIX Tab */}
        {activeTab === 'pix' && (
          <div className="bg-slate-50 dark:bg-slate-900/60 backdrop-blur-xl border border-black/5 dark:border-white/8 rounded-3xl p-8 space-y-6 shadow-2xl">
            {timeLeft && (
              <div className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold ${
                timeLeft === 'Expirado' ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
              }`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {timeLeft === 'Expirado' ? 'QR Code expirado' : `Expira em ${timeLeft}`}
              </div>
            )}

            {livePixQrCode ? (
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-2xl shadow-xl mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:image/png;base64,${livePixQrCode}`}
                    alt="QR Code PIX"
                    className="w-52 h-52"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">Escaneie com o aplicativo do seu banco</p>
              </div>
            ) : isSyncing ? (
              <div className="flex flex-col items-center py-8">
                <svg className="w-8 h-8 text-blue-500 animate-spin mb-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Gerando QR Code do PIX...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center py-8">
                <div className="w-16 h-16 bg-white shadow-xl shadow-slate-200/50 border border-slate-200 dark:border-transparent dark:shadow-none dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-slate-500 text-sm text-center">QR Code não disponível.<br />Use o código copia e cola abaixo.</p>
                {payment.asaasInvoiceUrl && (
                  <a
                    href={payment.asaasInvoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center gap-2 bg-white shadow-xl shadow-slate-200/50 border border-slate-200 dark:border-transparent dark:shadow-none dark:bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white font-semibold py-3 px-6 rounded-xl transition-all border-black/10 dark:border-white/10"
                  >
                    Acessar Fatura
                  </a>
                )}
              </div>
            )}

            {livePixCopyPaste && (
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-3">Ou use o PIX Copia e Cola:</p>
                <button
                  onClick={copyPix}
                  className="w-full flex items-center gap-3 bg-white/80 backdrop-blur-md dark:backdrop-blur-none border border-slate-200/50 dark:border-transparent dark:bg-slate-800/60 border-black/10 dark:border-white/10 hover:border-blue-500/40 px-4 py-3.5 rounded-xl transition-all group"
                >
                  <code className="text-xs text-slate-600 dark:text-slate-300 flex-1 text-left truncate">
                    {livePixCopyPaste}
                  </code>
                  <div className={`shrink-0 flex items-center gap-1.5 text-xs font-bold transition-colors ${pixCopied ? 'text-emerald-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-blue-400'}`}>
                    {pixCopied ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Copiado!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copiar
                      </>
                    )}
                  </div>
                </button>
              </div>
            )}

            {checkError && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm px-4 py-3 rounded-xl">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {checkError}
              </div>
            )}

            <button
              onClick={handleManualCheck}
              disabled={isChecking}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              {isChecking ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Verificando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Já paguei — confirmar
                </>
              )}
            </button>
            <p className="text-xs text-slate-600 text-center">Verificação automática a cada 10 segundos</p>
          </div>
        )}

        {/* Boleto Tab */}
        {activeTab === 'boleto' && (
          <div className="bg-slate-50 dark:bg-slate-900/60 backdrop-blur-xl border border-black/5 dark:border-white/8 rounded-3xl p-8 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
              <svg className="w-5 h-5 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-300">
                O boleto vence em <strong>{payment.dueDate ? formatDate(payment.dueDate) : '3 dias'}</strong>. Após o vencimento, o boleto não pode ser pago.
              </p>
            </div>

            {/* Código de barras */}
            {liveBoletoBarCode && (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Código de barras</p>
                <button
                  onClick={copyBarCode}
                  className="w-full flex items-center gap-3 bg-white/80 backdrop-blur-md dark:backdrop-blur-none border border-slate-200/50 dark:border-transparent dark:bg-slate-800/60 border-black/10 dark:border-white/10 hover:border-blue-500/40 px-4 py-3.5 rounded-xl transition-all group"
                >
                  <code className="text-xs text-slate-600 dark:text-slate-300 flex-1 text-left break-all">
                    {liveBoletoBarCode}
                  </code>
                  <div className={`shrink-0 flex items-center gap-1.5 text-xs font-bold transition-colors ${barCodeCopied ? 'text-emerald-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-blue-400'}`}>
                    {barCodeCopied ? 'Copiado!' : 'Copiar'}
                  </div>
                </button>
              </div>
            )}

            {/* Botão de download do boleto */}
            {liveBoletoUrl ? (
              <a
                href={liveBoletoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Baixar ou Imprimir Boleto
              </a>
            ) : isSyncing ? (
              <div className="flex flex-col items-center py-4 bg-white/80 backdrop-blur-md dark:backdrop-blur-none border border-slate-200/50 dark:border-transparent dark:bg-slate-800/50 rounded-2xl">
                <svg className="w-6 h-6 text-blue-500 animate-spin mb-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Gerando Boleto...</p>
              </div>
            ) : null}

            {/* Fallback caso falhe o PDF do boleto */}
            {!payment.boletoUrl && payment.asaasInvoiceUrl && (
              <a
                href={payment.asaasInvoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-white shadow-xl shadow-slate-200/50 border border-slate-200 dark:border-transparent dark:shadow-none dark:bg-slate-800 hover:bg-slate-700 border-black/10 dark:border-white/10 text-slate-900 dark:text-white font-semibold py-4 rounded-2xl transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Acessar Fatura do Asaas
              </a>
            )}

            {checkError && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm px-4 py-3 rounded-xl">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {checkError}
              </div>
            )}

            <button
              onClick={handleManualCheck}
              disabled={isChecking}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isChecking ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Verificando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Já paguei — confirmar
                </>
              )}
            </button>
          </div>
        )}

        {/* Cartão Tab (Em breve) */}
        {activeTab === 'cartao' && (
          <div className="bg-slate-50 dark:bg-slate-900/60 backdrop-blur-xl border border-black/5 dark:border-white/8 rounded-3xl p-8 shadow-2xl">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-white/80 backdrop-blur-md dark:backdrop-blur-none border border-slate-200/50 dark:border-transparent dark:bg-slate-800/80 border-black/5 dark:border-white/8 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-500 dark:text-slate-400 mb-2">Pagamento por cartão</h3>
              <p className="text-sm text-slate-500 max-w-xs mx-auto mb-6">
                O pagamento por cartão de crédito está em desenvolvimento e estará disponível em breve.
              </p>
              <span className="inline-block bg-white shadow-xl shadow-slate-200/50 border border-slate-200 dark:border-transparent dark:shadow-none dark:bg-slate-800 border-black/5 dark:border-white/8 text-slate-500 text-xs font-bold px-4 py-2 rounded-full">
                Em breve
              </span>
            </div>

            {/* Formulário visual desabilitado */}
            <div className="space-y-3 opacity-40 pointer-events-none mt-6 border-t border-black/6 dark:border-white/6 pt-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Número do cartão</label>
                <div className="w-full px-4 py-3 bg-white/80 backdrop-blur-md dark:backdrop-blur-none border border-slate-200/50 dark:border-transparent dark:bg-slate-800/60 border-black/10 dark:border-white/10 rounded-2xl text-slate-600 text-sm">•••• •••• •••• ••••</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Validade</label>
                  <div className="w-full px-4 py-3 bg-white/80 backdrop-blur-md dark:backdrop-blur-none border border-slate-200/50 dark:border-transparent dark:bg-slate-800/60 border-black/10 dark:border-white/10 rounded-2xl text-slate-600 text-sm">MM/AA</div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">CVV</label>
                  <div className="w-full px-4 py-3 bg-white/80 backdrop-blur-md dark:backdrop-blur-none border border-slate-200/50 dark:border-transparent dark:bg-slate-800/60 border-black/10 dark:border-white/10 rounded-2xl text-slate-600 text-sm">•••</div>
                </div>
              </div>
              <div className="w-full bg-blue-600/40 text-slate-900 dark:text-white font-bold py-4 rounded-2xl text-center text-sm">
                Pagar {formatCurrency(payment.value)}
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-slate-700 text-center mt-6">
          ID da inscrição: <span className="font-mono">{payment.registrationId.slice(0, 8)}...</span>
        </p>
      </div>
    </div>
  );
}
