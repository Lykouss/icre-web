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
  asaas_boleto: 'Boleto',
  pix:          'PIX',
  cartao:       'Cartão',
  dinheiro:     'Dinheiro',
  cortesia:     'Cortesia',
};

export function ReceiptClient({ registration }: Props) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    const { default: JsPDF } = await import('jspdf');

    type DocType = InstanceType<typeof JsPDF> & {
      autoTable?: (opts: Record<string, unknown>) => void;
    };

    const doc = new JsPDF() as DocType;
    const event = registration.events;

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Comprovante de Pagamento', 14, 25);

    doc.setDrawColor(200);
    doc.line(14, 30, 196, 30);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(event?.title ?? 'Evento', 14, 42);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(`ID da inscrição: ${registration.id}`, 14, 51);
    if (registration.paid_at) {
      doc.text(`Pago em: ${formatDateTime(registration.paid_at)}`, 14, 58);
    }
    doc.setTextColor(0);

    // Dados do participante
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Participante', 14, 72);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Nome: ${registration.name}`, 14, 80);
    if (registration.email) doc.text(`E-mail: ${registration.email}`, 14, 87);
    if (registration.phone) doc.text(`Telefone: ${registration.phone}`, 14, 94);

    // Dados do evento
    let y = registration.phone ? 108 : 101;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Evento', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    y += 8;
    if (event?.date) { doc.text(`Data: ${formatDate(event.date)}${event.time ? ` · ${event.time.slice(0, 5)}` : ''}`, 14, y); y += 7; }
    if (event?.location) { doc.text(`Local: ${event.location}`, 14, y); y += 7; }

    // Pagamento
    y += 6;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Pagamento', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    y += 8;
    doc.text(`Valor: ${formatCurrency(registration.payment_amount ?? registration.events?.ticket_price ?? null)}`, 14, y);
    y += 7;
    if (registration.payment_method) {
      doc.text(`Método: ${METHOD_LABELS[registration.payment_method] ?? registration.payment_method}`, 14, y);
      y += 7;
    }
    if (registration.asaas_payment_id) {
      doc.text(`ID Asaas: ${registration.asaas_payment_id}`, 14, y);
      y += 7;
    }

    // Status
    y += 6;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 163, 74);
    doc.text('✓ INSENÇÃO/PAGAMENTO CONFIRMADO', 14, y);

    if (registration.ticket_signature) {
       y += 20;
       // Payload: registrationId:signature (2 partes — compatível com parseAndVerifyQrPayload)
       const qrData = `${registration.id}:${registration.ticket_signature}`;
       const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;
       doc.addImage(qrUrl, 'PNG', 14, y, 40, 40);
       doc.setFontSize(10);
       doc.setTextColor(0);
       doc.text('Apresente este QR Code no evento.', 60, y + 20);
       y += 40;
    }

    y += 20;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} — SIGE-Web ICRE`, 14, y);

    doc.save(`comprovante-${registration.id.slice(0, 8)}.pdf`);
  };

  const event = registration.events;

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-600/6 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 pt-28 pb-16">
        <Link
          href="/agenda"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar à agenda
        </Link>

        {/* Card do comprovante */}
        <div ref={receiptRef} className="bg-slate-900/60 backdrop-blur-xl border border-white/8 rounded-3xl overflow-hidden shadow-2xl">

          {/* Header verde */}
          <div className="relative bg-linear-to-br from-emerald-600/20 to-emerald-900/20 border-b border-emerald-500/20 p-8">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 20%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center shrink-0">
                <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-0.5">Comprovante de Pagamento</p>
                <h1 className="text-xl font-black text-white">{event?.title ?? 'Evento'}</h1>
                {registration.paid_at && (
                  <p className="text-sm text-emerald-300/70 mt-0.5">{formatDateTime(registration.paid_at)}</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            
            {/* QR Code */}
            {registration.ticket_signature && (
              <div className="flex flex-col items-center justify-center py-6 bg-white rounded-2xl mb-6">
                {/* Payload: registrationId:signature (2 partes — compatível com parseAndVerifyQrPayload) */}
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${registration.id}:${registration.ticket_signature}`)}`} 
                  alt="QR Code do Ingresso" 
                  className="w-48 h-48 mb-3" 
                />
                <p className="text-xs font-bold text-slate-800 uppercase tracking-widest text-center">Apresente este QR Code no check-in</p>
              </div>
            )}

            {/* Participante */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Participante</p>
              <div className="bg-white/4 border border-white/8 rounded-2xl divide-y divide-white/6 overflow-hidden">
                <InfoRow label="Nome" value={registration.name} />
                {registration.email && <InfoRow label="E-mail" value={registration.email} />}
                {registration.phone && <InfoRow label="Telefone" value={registration.phone} />}
              </div>
            </div>

            {/* Evento */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Evento</p>
              <div className="bg-white/4 border border-white/8 rounded-2xl divide-y divide-white/6 overflow-hidden">
                {event?.date && <InfoRow label="Data" value={`${formatDate(event.date)}${event.time ? ` · ${event.time.slice(0, 5)}` : ''}`} />}
                {event?.location && <InfoRow label="Local" value={event.location} />}
                <InfoRow label="Tipo" value={event?.type === 'culto' ? 'Culto' : 'Evento Especial'} />
              </div>
            </div>

            {/* Pagamento */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Pagamento</p>
              <div className="bg-white/4 border border-white/8 rounded-2xl divide-y divide-white/6 overflow-hidden">
                <InfoRow
                  label="Valor"
                  value={formatCurrency(registration.payment_amount ?? event?.ticket_price ?? null)}
                  highlight
                />
                {registration.payment_method && (
                  <InfoRow label="Método" value={METHOD_LABELS[registration.payment_method] ?? registration.payment_method} />
                )}
                <InfoRow label="Status" value="Pago" status="success" />
                {registration.asaas_payment_id && (
                  <InfoRow label="ID Asaas" value={registration.asaas_payment_id} mono />
                )}
              </div>
            </div>

            {/* ID da inscrição */}
            <div className="bg-slate-800/50 border border-white/6 rounded-2xl px-4 py-3">
              <p className="text-xs text-slate-500 mb-1">ID da inscrição</p>
              <p className="text-xs font-mono text-slate-300 break-all">{registration.id}</p>
            </div>
          </div>

          {/* Footer com ações */}
          <div className="px-8 pb-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDownloadPDF}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-500/20"
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
                className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold py-3.5 rounded-2xl transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Ver no Asaas
              </a>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          ICRE · Sistema de Gestão Eclesiástica · Este comprovante é válido e permanente
        </p>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  highlight,
  status,
  mono,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  status?: 'success';
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-4">
      <span className="text-xs text-slate-500 font-medium shrink-0">{label}</span>
      <span className={`text-sm text-right ${
        highlight ? 'font-black text-white text-base' :
        status === 'success' ? 'font-bold text-emerald-400' :
        mono ? 'font-mono text-slate-400 text-xs' :
        'font-medium text-slate-200'
      }`}>
        {value}
      </span>
    </div>
  );
}