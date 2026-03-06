'use client'

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { closeMonth } from '@/features/finance/actions/close-month';
import { MonthSummary, FinancialTransaction } from '@/features/finance/types';

const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

interface MonthlyClosingPanelProps {
  summaries: MonthSummary[];
  transactions: FinancialTransaction[];
}

export function MonthlyClosingPanel({ summaries, transactions }: MonthlyClosingPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [closingKey, setClosingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  function handleClose(month: number, year: number) {
    const monthName = MONTH_NAMES[month - 1];
    if (!confirm(`Fechar o caixa de ${monthName}/${year}? Esta ação não pode ser desfeita.`)) return;

    const key = `${month}-${year}`;
    setClosingKey(key);
    setError(null);

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

    type DocType = InstanceType<typeof JsPDF> & {
      autoTable: (opts: Record<string, unknown>) => void;
      lastAutoTable: { finalY: number };
    };

    const doc = new JsPDF() as DocType;
    const monthName = MONTH_NAMES[summary.month - 1];

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Fechamento de Caixa', 14, 20);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');
    doc.text(`${monthName} / ${summary.year}`, 14, 30);

    if (summary.closing) {
      const closedAt = new Date(summary.closing.closed_at).toLocaleDateString('pt-BR');
      const closedBy = summary.closing.profiles?.full_name ?? 'Desconhecido';
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`Fechado em ${closedAt} por ${closedBy}`, 14, 37);
      doc.setTextColor(0);
    }

    doc.setDrawColor(200);
    doc.line(14, 41, 196, 41);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo do Período', 14, 50);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(22, 163, 74);
    doc.text(`Entradas:  ${formatCurrency(summary.totalIncome)}`, 14, 59);
    doc.setTextColor(220, 38, 38);
    doc.text(`Saídas:    ${formatCurrency(summary.totalExpense)}`, 14, 67);
    doc.setTextColor(summary.balance >= 0 ? 29 : 220, summary.balance >= 0 ? 78 : 38, summary.balance >= 0 ? 216 : 38);
    doc.setFont('helvetica', 'bold');
    doc.text(`Saldo:     ${formatCurrency(summary.balance)}`, 14, 75);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');

    const monthTx = transactions
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() + 1 === summary.month && d.getFullYear() === summary.year;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (monthTx.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Lançamentos do Mês', 14, 86);

      doc.autoTable({
        startY: 90,
        head: [['Data', 'Tipo', 'Categoria', 'Descrição / Membro', 'Valor']],
        body: monthTx.map(t => [
          new Date(t.date).toLocaleDateString('pt-BR'),
          t.type === 'entrada' ? 'Entrada' : 'Saída',
          t.category,
          [t.description, t.members?.full_name].filter(Boolean).join(' — ') || '—',
          (t.type === 'entrada' ? '+ ' : '- ') + formatCurrency(Number(t.amount)),
        ]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
        columnStyles: { 4: { halign: 'right' } },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });
    }

    const finalY = monthTx.length > 0 ? doc.lastAutoTable.finalY + 8 : 86;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} — SIGE-Web ICRE`, 14, finalY);

    doc.save(`fechamento-${monthName.toLowerCase()}-${summary.year}.pdf`);
  }

  if (summaries.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center text-slate-400">
        <p className="font-medium">Nenhum lançamento encontrado para gerar fechamentos.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="p-5 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-800">Fechamento de Caixa</h2>
        <p className="text-sm text-slate-500 mt-0.5">Feche meses conferidos para impedir novos lançamentos.</p>
      </div>

      {error && (
        <div className="mx-5 mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          {error}
        </div>
      )}

      <div className="divide-y divide-slate-50">
        {summaries.map(summary => {
          const key = `${summary.month}-${summary.year}`;
          const isClosing = isPending && closingKey === key;
          const monthName = MONTH_NAMES[summary.month - 1];

          return (
            <div key={key} className="flex items-center justify-between px-5 py-4 gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">{monthName} / {summary.year}</span>
                  {summary.isClosed ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-xs font-semibold">✓ Fechado</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 text-xs font-semibold">Aberto</span>
                  )}
                </div>
                <div className="flex gap-4 mt-1 text-xs text-slate-500">
                  <span className="text-emerald-600">↑ {formatCurrency(summary.totalIncome)}</span>
                  <span className="text-red-600">↓ {formatCurrency(summary.totalExpense)}</span>
                  <span className={`font-semibold ${summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    = {formatCurrency(summary.balance)}
                  </span>
                </div>
                {summary.isClosed && summary.closing && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Fechado por {summary.closing.profiles?.full_name ?? '—'} em{' '}
                    {new Date(summary.closing.closed_at).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handlePdf(summary)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  PDF
                </button>
                {!summary.isClosed && (
                  <button
                    onClick={() => handleClose(summary.month, summary.year)}
                    disabled={isClosing}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    {isClosing ? 'Fechando...' : 'Fechar Caixa'}
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