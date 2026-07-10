'use client'

import React, { useRef } from 'react';
import Link from 'next/link';

interface EventData {
  id: string;
  title: string;
  date: string | null;
  time: string | null;
  location: string | null;
  type: string;
  ticket_price: number | null;
}

interface RegistrationData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  payment_status: string;
  payment_method: string | null;
  payment_amount: number | null;
  paid_at: string | null;
  asaas_payment_id: string | null;
  asaas_invoice_url: string | null;
  ticket_signature?: string | null;
  events: EventData | null;
}

interface Props {
  registration: RegistrationData;
}

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatCurrency(value: number | null): string {
  if (value === null) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const METHOD_LABELS: Record<string, string> = {
  asaas_pix:    'PIX',
  asaas_boleto: 'Boleto Bancário',
  pix:          'PIX',
  cartao:       'Cartão de Crédito',
  dinheiro:     'Dinheiro',
  cortesia:     'Cortesia',
  gift:         'Cortesia (Gift)',
};

const STATUS_LABELS: Record<string, string> = {
  gratuito:  'Gratuito',
  pago:      'Pago',
  pendente:  'Pendente',
  cortesia:  'Cortesia',
};

export function ReceiptClient({ registration }: Props) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const event = registration.events;

  // Protocolo (últimos 8 chars do UUID em maiúsculo)
  const protocol = registration.id.replace(/-/g, '').slice(-8).toUpperCase();

  const handleDownloadPDF = async () => {
    const { default: JsPDF } = await import('jspdf');
    type DocType = InstanceType<typeof JsPDF> & {
      autoTable?: (opts: Record<string, unknown>) => void;
    };
    const doc = new JsPDF() as DocType;

    // ── Header ──
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('ICRE — Igreja Cristã Reformada Evangélica', 14, 18);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('Sistema de Gestão Eclesiástica — Comprovante de Inscrição', 14, 28);
    doc.setFontSize(9);
    doc.setTextColor(52, 211, 153);
    doc.text(`✓ CONFIRMADO  |  Protocolo: #${protocol}`, 14, 36);

    // ── Linha separadora ──
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(0.5);
    doc.line(14, 44, 196, 44);

    // ── Evento ──
    let y = 54;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(23, 37, 84);
    doc.rect(14, y - 6, 182, 12, 'F');
    doc.text(event?.title ?? 'Evento', 18, y + 1);
    y += 16;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 100, 130);
    if (event?.date) { doc.text(`Data: ${formatDate(event.date)}${event.time ? ` às ${event.time.slice(0,5)}` : ''}`, 14, y); y += 7; }
    if (event?.location) { doc.text(`Local: ${event.location}`, 14, y); y += 7; }

    // ── Participante ──
    y += 6;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text('PARTICIPANTE', 14, y);
    doc.setLineWidth(0.3);
    doc.setDrawColor(30, 58, 138);
    doc.line(14, y + 2, 60, y + 2);
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text(`Nome: ${registration.name}`, 14, y); y += 7;
    if (registration.email) { doc.text(`E-mail: ${registration.email}`, 14, y); y += 7; }
    if (registration.phone) { doc.text(`Telefone: ${registration.phone}`, 14, y); y += 7; }

    // ── Pagamento ──
    y += 6;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text('PAGAMENTO', 14, y);
    doc.line(14, y + 2, 56, y + 2);
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text(`Valor: ${formatCurrency(registration.payment_amount ?? event?.ticket_price ?? null)}`, 14, y); y += 7;
    if (registration.payment_method) { doc.text(`Método: ${METHOD_LABELS[registration.payment_method] ?? registration.payment_method}`, 14, y); y += 7; }
    if (registration.paid_at) { doc.text(`Pago em: ${formatDateTime(registration.paid_at)}`, 14, y); y += 7; }
    if (registration.asaas_payment_id) { doc.text(`Ref. Asaas: ${registration.asaas_payment_id}`, 14, y); y += 7; }

    // ── Status ──
    y += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 163, 74);
    doc.text('✓ PAGAMENTO/ISENÇÃO CONFIRMADO', 14, y);

    // ── QR Code ──
    if (registration.ticket_signature) {
      y += 18;
      const qrData = `${registration.id}:${registration.ticket_signature}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;
      doc.addImage(qrUrl, 'PNG', 14, y, 42, 42);
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.setFont('helvetica', 'normal');
      doc.text('Apresente este QR Code no check-in do evento.', 62, y + 20);
      y += 50;
    }

    // ── Protocolo ──
    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Protocolo: #${protocol}  |  ID: ${registration.id}`, 14, y);
    y += 5;
    doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} — SIGE-Web ICRE`, 14, y);

    doc.save(`comprovante-icre-${protocol}.pdf`);
  };

  const isPaid = registration.payment_status === 'pago';
  const isGratuito = registration.payment_status === 'gratuito';
  const isCortesia = registration.payment_status === 'cortesia';
  const paymentValue = registration.payment_amount ?? event?.ticket_price ?? null;
  const isZeroValue = isGratuito || isCortesia || paymentValue === 0;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Fundo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-emerald-700/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[200px] bg-blue-700/4 rounded-full blur-[80px]" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 pt-24 pb-16">

        {/* Breadcrumb / navegação */}
        <Link
          href="/minhas-inscricoes"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-200 text-sm font-medium transition-colors mb-8 group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Minhas Inscrições
        </Link>

        {/* Card principal */}
        <div ref={receiptRef} className="bg-slate-50 dark:bg-slate-900/70 backdrop-blur-xl border border-black/5 dark:border-white/8 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">

          {/* ── Header Institucional ── */}
          <div className="relative overflow-hidden">
            {/* Fundo gradiente */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-emerald-950/40" />
            {/* Pattern decorativo */}
            <div className="absolute inset-0 opacity-[0.04]" style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '28px 28px'
            }} />
            {/* Linha de destaque superior */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />

            <div className="relative px-7 py-6">
              {/* Linha 1: organização */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/15 border border-emerald-500/25 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">Igreja Cristã Reformada Evangélica</p>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sistema de Gestão · Comprovante Oficial</p>
                  </div>
                </div>
                {/* Badge confirmado */}
                <div className="bg-emerald-500/12 border border-emerald-500/25 rounded-xl px-3 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-wide">Confirmado</span>
                  </div>
                </div>
              </div>

              {/* Linha 2: evento */}
              <div className="border-t border-white/6 pt-5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Evento</p>
                <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{event?.title ?? 'Evento'}</h1>
                <div className="flex flex-wrap gap-4 mt-3">
                  {event?.date && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(event.date)}{event.time ? ` · ${event.time.slice(0,5)}` : ''}
                    </div>
                  )}
                  {event?.location && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {event.location}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── QR Code (destaque) ── */}
          {registration.ticket_signature && (
            <div className="border-t border-white/6 bg-white mx-7 my-6 rounded-xl overflow-hidden">
              <div className="flex flex-col items-center py-6">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`${registration.id}:${registration.ticket_signature}`)}`}
                  alt="QR Code do Ingresso"
                  className="w-52 h-52 mb-3"
                />
                <div className="flex items-center gap-2 text-slate-600">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.24M16.24 12l1.76 1.76M16.24 12l-1.76-1.76M7.76 10.24L6 12m1.76-1.76L9.52 12M7.76 10.24V8" />
                  </svg>
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Apresente no Check-in</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Seções de dados ── */}
          <div className="px-7 pb-7 space-y-5">

            {/* Participante */}
            <section>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-5 h-5 bg-blue-500/15 border border-blue-500/20 rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.12em]">Participante</p>
              </div>
              <div className="bg-slate-800/50 border border-white/6 rounded-xl divide-y divide-white/5 overflow-hidden">
                <DataRow label="Nome" value={registration.name} />
                {registration.email && <DataRow label="E-mail" value={registration.email} />}
                {registration.phone && <DataRow label="Telefone" value={registration.phone} />}
              </div>
            </section>

            {/* Pagamento */}
            <section>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-5 h-5 bg-emerald-500/15 border border-emerald-500/20 rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.12em]">Pagamento</p>
              </div>
              <div className="bg-slate-800/50 border border-white/6 rounded-xl divide-y divide-white/5 overflow-hidden">
                <DataRow
                  label="Valor"
                  value={isZeroValue ? 'Gratuito / Cortesia' : formatCurrency(paymentValue)}
                  valueClass={isZeroValue ? 'text-emerald-400 font-black text-base' : 'text-slate-900 dark:text-white font-black text-base'}
                />
                {registration.payment_method && (
                  <DataRow label="Método" value={METHOD_LABELS[registration.payment_method] ?? registration.payment_method} />
                )}
                <DataRow
                  label="Status"
                  value={STATUS_LABELS[registration.payment_status] ?? registration.payment_status}
                  valueClass="text-emerald-400 font-bold"
                />
                {registration.paid_at && (
                  <DataRow label="Confirmado em" value={formatDateTime(registration.paid_at)} />
                )}
                {registration.asaas_payment_id && (
                  <DataRow label="Ref. Pagamento" value={registration.asaas_payment_id} mono />
                )}
              </div>
            </section>

            {/* Protocolo */}
            <div className="bg-slate-800/30 border border-black/5 dark:border-white/5 rounded-xl px-4 py-3.5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">Protocolo de Inscrição</p>
                <p className="text-sm font-black text-slate-600 dark:text-slate-300 tracking-wider">#{protocol}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-600 mb-0.5">ID Completo</p>
                <p className="text-[10px] font-mono text-slate-500 break-all max-w-[200px]">{registration.id}</p>
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                onClick={handleDownloadPDF}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/15"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Baixar PDF
              </button>
              {registration.asaas_invoice_url && (
                <a
                  href={registration.asaas_invoice_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-black/5 dark:border-white/8 text-slate-600 dark:text-slate-300 font-semibold py-3.5 rounded-xl transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Ver Fatura
                </a>
              )}
            </div>
          </div>

          {/* ── Rodapé institucional ── */}
          <div className="border-t border-black/5 dark:border-white/5 bg-slate-50 dark:bg-slate-900/40 px-7 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-1">
              <p className="text-[10px] text-slate-600 font-medium">
                ICRE · Sistema de Gestão Eclesiástica · SIGE-Web
              </p>
              <p className="text-[10px] text-slate-700">
                Este comprovante é válido e permanente
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Componente de linha de dado ──
function DataRow({
  label,
  value,
  valueClass,
  mono,
}: {
  label: string;
  value: string;
  valueClass?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-4">
      <span className="text-xs text-slate-500 font-medium shrink-0">{label}</span>
      <span className={`text-sm text-right ${
        mono ? 'font-mono text-slate-500 dark:text-slate-400 text-xs' :
        valueClass ?? 'font-medium text-slate-200'
      }`}>
        {value}
      </span>
    </div>
  );
}