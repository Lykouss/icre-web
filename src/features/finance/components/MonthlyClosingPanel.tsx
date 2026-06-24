'use client'

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { closeMonth } from '@/features/finance/actions/close-month';
import { MonthSummary, FinancialTransaction } from '@/features/finance/types';

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface Props { summaries: MonthSummary[]; transactions: FinancialTransaction[] }

export function MonthlyClosingPanel({ summaries, transactions }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [closingKey, setClosingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClose(month: number, year: number) {
    const monthName = MONTH_NAMES[month - 1];
    if (!confirm(`Fechar o caixa de ${monthName}/${year}? Esta ação não pode ser desfeita.`)) return;
    const key = `${month}-${year}`;
    setClosingKey(key); setError(null);
    startTransition(async () => {
      const result = await closeMonth(month, year);
      setClosingKey(null);
      if (result.error) { setError(result.error); return; }
      router.refresh();
    });
  }

  async function handlePdf(summary: MonthSummary) {
    const { default: JsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    type DocType = InstanceType<typeof JsPDF> & { autoTable: (opts: Record<string, unknown>) => void; lastAutoTable: { finalY: number } };
    const doc = new JsPDF() as DocType;
    const monthName = MONTH_NAMES[summary.month - 1];
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Fechamento de Caixa', 14, 20);
    doc.setFontSize(13); doc.setFont('helvetica', 'normal');
    doc.text(`${monthName} / ${summary.year}`, 14, 30);
    if (summary.closing) {
      const closedAt = new Date(summary.closing.closed_at).toLocaleDateString('pt-BR');
      const closedBy = summary.closing.profiles?.full_name ?? 'Desconhecido';
      doc.setFontSize(9); doc.setTextColor(120);
      doc.text(`Fechado em ${closedAt} por ${closedBy}`, 14, 37);
      doc.setTextColor(0);
    }
    doc.setDrawColor(200); doc.line(14, 41, 196, 41);
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('Resumo do Período', 14, 50);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(22, 163, 74); doc.text(`Entradas:  ${fmt(summary.totalIncome)}`, 14, 59);
    doc.setTextColor(220, 38, 38); doc.text(`Saídas:    ${fmt(summary.totalExpense)}`, 14, 67);
    doc.setTextColor(summary.balance >= 0 ? 29 : 220, summary.balance >= 0 ? 78 : 38, summary.balance >= 0 ? 216 : 38);
    doc.setFont('helvetica', 'bold'); doc.text(`Saldo:     ${fmt(summary.balance)}`, 14, 75);
    doc.setTextColor(0); doc.setFont('helvetica', 'normal');
    const monthTx = transactions.filter(t => { const d = new Date(t.date); return d.getMonth() + 1 === summary.month && d.getFullYear() === summary.year; }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (monthTx.length > 0) {
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('Lançamentos do Mês', 14, 86);
      doc.autoTable({ startY: 90, head: [['Data','Tipo','Categoria','Descrição / Membro','Valor']], body: monthTx.map(t => [new Date(t.date).toLocaleDateString('pt-BR'), t.type === 'entrada' ? 'Entrada' : 'Saída', t.category, [t.description, t.members?.full_name].filter(Boolean).join(' — ') || '—', (t.type === 'entrada' ? '+ ' : '- ') + fmt(Number(t.amount))]), styles: { fontSize: 8, cellPadding: 3 }, headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' }, columnStyles: { 4: { halign: 'right' } }, alternateRowStyles: { fillColor: [248, 250, 252] } });
    }
    const finalY = monthTx.length > 0 ? doc.lastAutoTable.finalY + 8 : 86;
    doc.setFontSize(8); doc.setTextColor(150);
    doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} — SIGE-Web ICRE`, 14, finalY);
    doc.save(`fechamento-${monthName.toLowerCase()}-${summary.year}.pdf`);
  }

  if (summaries.length === 0) {
    return (
      <div className="rounded-2xl p-8 text-center text-sm font-medium"
        style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-muted)' }}>
        Nenhum lançamento encontrado para gerar fechamentos.
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
      {/* Header */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--admin-border)' }}>
        <h2 className="text-[15px] font-bold text-slate-100">Fechamento de Caixa</h2>
        <p className="text-[12px] mt-0.5" style={{ color: 'var(--admin-text-secondary)' }}>Feche meses conferidos para impedir novos lançamentos.</p>
      </div>

      {error && (
        <div className="mx-5 mt-4 text-sm px-4 py-2.5 rounded-xl text-red-300" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}

      <div>
        {summaries.map((summary, i) => {
          const key = `${summary.month}-${summary.year}`;
          const isClosing = isPending && closingKey === key;
          const monthName = MONTH_NAMES[summary.month - 1];
          return (
            <div key={key} className="flex items-center justify-between px-5 py-4 gap-4"
              style={i > 0 ? { borderTop: '1px solid var(--admin-border)' } : undefined}>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[13px] font-bold text-slate-200">{monthName} / {summary.year}</span>
                  {summary.isClosed ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold"
                      style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399' }}>
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      Fechado
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold"
                      style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24' }}>
                      Aberto
                    </span>
                  )}
                </div>
                <div className="flex gap-4 text-[12px] mb-0.5">
                  <span style={{ color: '#34d399' }}>↑ {fmt(summary.totalIncome)}</span>
                  <span style={{ color: '#f87171' }}>↓ {fmt(summary.totalExpense)}</span>
                  <span className="font-bold" style={{ color: summary.balance >= 0 ? '#93c5fd' : '#f87171' }}>= {fmt(summary.balance)}</span>
                </div>
                {summary.isClosed && summary.closing && (
                  <p className="text-[11px]" style={{ color: 'var(--admin-text-muted)' }}>
                    Fechado por {summary.closing.profiles?.full_name ?? '—'} em {new Date(summary.closing.closed_at).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>

              <div className="flex gap-2 shrink-0">
                <button onClick={() => handlePdf(summary)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all"
                  style={{ background: 'var(--admin-surface-alt)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-secondary)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--admin-text-primary)'; e.currentTarget.style.borderColor = 'var(--admin-border-strong)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--admin-text-secondary)'; e.currentTarget.style.borderColor = 'var(--admin-border)'; }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  PDF
                </button>
                {!summary.isClosed && (
                  <button onClick={() => handleClose(summary.month, summary.year)} disabled={isClosing}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold text-white transition-all disabled:opacity-50"
                    style={{ background: 'var(--admin-accent)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--admin-accent-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--admin-accent)')}>
                    {isClosing ? (
                      <svg className="w-3.5 h-3.5 animate-spin mr-1" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                    {isClosing ? 'Fechando…' : 'Fechar Caixa'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}