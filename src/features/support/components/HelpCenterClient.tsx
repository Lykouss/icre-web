'use client'

import React, { useState, useMemo } from 'react';
import { BookOpen, CreditCard, FileText, CalendarCheck, Search, ChevronDown } from 'lucide-react';

// ─── FAQ Data ─────────────────────────────────────────────────────────────────

interface FaqItem {
  category: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    category: 'Comprovantes',
    question: 'Onde ficam meus comprovantes?',
    answer:
      "Você pode encontrar todos os seus comprovantes na aba 'Minhas Inscrições' no menu do seu perfil. Cada inscrição confirmada possui um comprovante disponível para visualização e download.",
  },
  {
    category: 'Evento',
    question: 'O que fazer na hora de apresentar o comprovante no evento?',
    answer:
      'Basta abrir o comprovante pelo celular ou levá-lo impresso, apresentando o QR Code na portaria de check-in. Nossa equipe realizará a leitura do código e confirmará sua entrada.',
  },
  {
    category: 'Pagamentos',
    question: 'Problemas com pagamento?',
    answer:
      'Seu pagamento pode demorar até 24h para ser processado caso tenha sido via boleto. Para Pix, a aprovação é imediata. Se após esse prazo o status ainda não foi atualizado, abra um chamado de suporte.',
  },
  {
    category: 'Inscrições',
    question: 'Como faço para me inscrever em um evento?',
    answer:
      "Acesse a página inicial, localize o evento desejado na seção de eventos e clique em 'Inscrever-se'. Você precisará estar logado para concluir a inscrição. Após o processamento, receberá um comprovante.",
  },
  {
    category: 'Conta',
    question: 'Esqueci minha senha. Como recupero?',
    answer:
      "Na tela de login, clique em 'Esqueci minha senha' e informe o e-mail cadastrado. Você receberá um link de redefinição de senha no e-mail. O link expira em 1 hora.",
  },
];

// ─── Category Cards ───────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    label: 'Inscrições',
    description: 'Dúvidas sobre como se inscrever em eventos',
    icon: <BookOpen className="w-6 h-6" />,
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.1)',
    border: 'rgba(59,130,246,0.2)',
  },
  {
    label: 'Pagamentos e Reembolsos',
    description: 'Boleto, Pix, confirmação e estornos',
    icon: <CreditCard className="w-6 h-6" />,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
    border: 'rgba(16,185,129,0.2)',
  },
  {
    label: 'Meus Comprovantes',
    description: 'Acesso e download dos seus comprovantes',
    icon: <FileText className="w-6 h-6" />,
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.1)',
    border: 'rgba(139,92,246,0.2)',
  },
  {
    label: 'Dia do Evento',
    description: 'Check-in, acesso e orientações gerais',
    icon: <CalendarCheck className="w-6 h-6" />,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.2)',
  },
];

// ─── Accordion Item ───────────────────────────────────────────────────────────

function AccordionItem({ faq, isOpen, onToggle }: {
  faq: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: isOpen ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isOpen ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd' }}
          >
            {faq.category}
          </span>
          <span className="text-[15px] font-semibold text-slate-100 leading-snug">
            {faq.question}
          </span>
        </div>
        <ChevronDown
          className="w-5 h-5 shrink-0 transition-transform duration-200 text-slate-500"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      <div
        style={{
          maxHeight: isOpen ? '300px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div className="px-6 pb-5">
          <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(148,163,184,0.9)' }}>
            {faq.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function HelpCenterClient() {
  const [search, setSearch]   = useState('');
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const filteredFaqs = useMemo(() => {
    if (!search.trim()) return FAQ_ITEMS;
    const term = search.toLowerCase();
    return FAQ_ITEMS.filter(
      f =>
        f.question.toLowerCase().includes(term) ||
        f.answer.toLowerCase().includes(term) ||
        f.category.toLowerCase().includes(term)
    );
  }, [search]);

  function toggle(idx: number) {
    setOpenIdx(prev => (prev === idx ? null : idx));
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(37,99,235,0.12) 0%, transparent 70%), #060b17',
      }}
    >
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-semibold mb-6"
            style={{ background: 'rgba(37,99,235,0.15)', color: '#93c5fd', border: '1px solid rgba(37,99,235,0.25)' }}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Central de Ajuda
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            Como podemos te{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              ajudar hoje?
            </span>
          </h1>
          <p className="text-slate-400 text-lg mb-10">
            Encontre respostas rápidas ou abra um chamado de suporte.
          </p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
              style={{ color: 'rgba(100,116,139,0.8)' }}
            />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pesquise sua dúvida…"
              className="w-full h-14 pl-12 pr-4 rounded-2xl text-base text-slate-200 placeholder-slate-600 outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)';
                e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(59,130,246,0.1)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.boxShadow   = 'none';
              }}
            />
          </div>
        </div>
      </section>

      {/* ── Categories Grid ────────────────────────────────────────────────── */}
      {!search && (
        <section className="px-4 pb-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-slate-100 mb-6 text-center">Navegar por categoria</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.label}
                  onClick={() => setSearch(cat.label)}
                  className="flex flex-col items-center gap-3 p-5 rounded-2xl text-center transition-all duration-200 group"
                  style={{ background: cat.bg, border: `1px solid ${cat.border}` }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 8px 24px ${cat.color}20`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="p-3 rounded-xl" style={{ background: `${cat.color}20`, color: cat.color }}>
                    {cat.icon}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-100 leading-tight">{cat.label}</p>
                    <p className="text-[11px] mt-1 leading-tight" style={{ color: 'rgba(148,163,184,0.7)' }}>
                      {cat.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ Section ───────────────────────────────────────────────────── */}
      <section className="px-4 pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-100">
              {search ? `Resultados para "${search}"` : 'Perguntas Frequentes'}
            </h2>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-sm font-semibold transition-colors"
                style={{ color: '#3b82f6' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Limpar busca
              </button>
            )}
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="text-center py-16">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Search className="w-7 h-7 text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium">Nenhuma resposta encontrada.</p>
              <p className="text-slate-600 text-sm mt-1">Tente outros termos ou abra um chamado de suporte.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  faq={faq}
                  isOpen={openIdx === i}
                  onToggle={() => toggle(i)}
                />
              ))}
            </div>
          )}

          {/* CTA para suporte */}
          <div
            className="mt-10 p-6 rounded-2xl text-center"
            style={{
              background: 'rgba(37,99,235,0.08)',
              border: '1px solid rgba(37,99,235,0.2)',
            }}
          >
            <p className="text-slate-300 font-medium mb-1">Não encontrou o que procurava?</p>
            <p className="text-slate-500 text-sm mb-4">Nossa equipe está pronta para te ajudar.</p>
            <a
              href="/suporte"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all"
              style={{ background: 'var(--admin-accent, #2563eb)' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Abrir Chamado de Suporte
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
