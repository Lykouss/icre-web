'use client'

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { BookOpen, CreditCard, FileText, CalendarCheck, Search, ChevronDown } from 'lucide-react';

// ─── FAQ Data ─────────────────────────────────────────────────────────────────

interface FaqItem {
  category: string;
  question: string;
  answer: React.ReactNode;
  answerText: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    category: 'Comprovantes',
    question: 'Onde ficam meus comprovantes?',
    answerText: 'Você pode encontrar todos os seus comprovantes na aba Minhas Inscrições no menu do seu perfil. Cada inscrição confirmada possui um comprovante disponível para visualização e download.',
    answer: (
      <>
        Você pode encontrar todos os seus comprovantes na aba <Link href="/minhas-inscricoes" className="text-blue-400 hover:underline transition-colors font-medium">Minhas Inscrições</Link> no menu do seu perfil. Cada inscrição confirmada possui um comprovante disponível para visualização e download.
      </>
    ),
  },
  {
    category: 'Comprovantes',
    question: 'Como faço para baixar ou imprimir meu comprovante?',
    answerText: 'Acesse a página Minhas Inscrições, clique no comprovante desejado e procure pela opção de imprimir ou salvar como PDF no seu navegador ou celular.',
    answer: (
      <>
        Acesse a página <Link href="/minhas-inscricoes" className="text-blue-400 hover:underline transition-colors font-medium">Minhas Inscrições</Link>, clique no comprovante desejado e procure pela opção de imprimir ou salvar como PDF no seu navegador ou celular.
      </>
    ),
  },
  {
    category: 'Eventos',
    question: 'O que fazer na hora de apresentar o comprovante no evento?',
    answerText: 'Basta abrir o comprovante pelo celular ou levá-lo impresso, apresentando o QR Code na portaria de check-in. Nossa equipe realizará a leitura do código e confirmará sua entrada.',
    answer: (
      <>
        Basta abrir o comprovante pelo celular ou levá-lo impresso, apresentando o QR Code na portaria de check-in. Nossa equipe realizará a leitura do código e confirmará sua entrada.
      </>
    ),
  },
  {
    category: 'Eventos',
    question: 'Onde posso ver a programação dos próximos eventos?',
    answerText: 'Você pode acompanhar a programação completa acessando nossa Agenda de Eventos.',
    answer: (
      <>
        Você pode acompanhar a programação completa acessando nossa <Link href="/agenda" className="text-blue-400 hover:underline transition-colors font-medium">Agenda de Eventos</Link>.
      </>
    ),
  },
  {
    category: 'Pagamentos',
    question: 'Quais são as formas de pagamento aceitas?',
    answerText: 'Aceitamos pagamentos via Pix e Cartão de Crédito. O pagamento via Pix tem aprovação imediata.',
    answer: (
      <>
        Aceitamos pagamentos via Pix e Cartão de Crédito. O pagamento via Pix tem aprovação imediata.
      </>
    ),
  },
  {
    category: 'Pagamentos',
    question: 'Problemas com aprovação do pagamento?',
    answerText: 'Se o seu pagamento via Pix não foi aprovado imediatamente, ou ocorreu algum erro no Cartão de Crédito, recomendamos abrir um chamado em nossa página de Fale Conosco.',
    answer: (
      <>
        Se o seu pagamento via Pix não foi aprovado imediatamente, ou ocorreu algum erro no Cartão de Crédito, recomendamos abrir um chamado em nossa página de <Link href="/suporte" className="text-blue-400 hover:underline transition-colors font-medium">Suporte</Link>.
      </>
    ),
  },
  {
    category: 'Pagamentos',
    question: 'Como solicitar um reembolso?',
    answerText: 'Para solicitar o cancelamento e reembolso de uma inscrição, você deve acessar a página Suporte e enviar uma solicitação. Nossa equipe analisará e fará o estorno de acordo com as políticas do evento.',
    answer: (
      <>
        Para solicitar o cancelamento e reembolso de uma inscrição, você deve acessar a página <Link href="/suporte" className="text-blue-400 hover:underline transition-colors font-medium">Suporte</Link> e enviar uma solicitação. Nossa equipe analisará e fará o estorno de acordo com as políticas do evento.
      </>
    ),
  },
  {
    category: 'Inscrições',
    question: 'Como faço para me inscrever em um evento?',
    answerText: 'Acesse a nossa Agenda de Eventos, localize o evento desejado e clique em inscrever-se. Você precisará estar logado para concluir a inscrição.',
    answer: (
      <>
        Acesse a nossa <Link href="/agenda" className="text-blue-400 hover:underline transition-colors font-medium">Agenda de Eventos</Link>, localize o evento desejado e clique no botão de inscrição. Você precisará estar logado para concluir a inscrição.
      </>
    ),
  },
  {
    category: 'Inscrições',
    question: 'Posso fazer a inscrição para outra pessoa?',
    answerText: 'Sim, durante o processo de inscrição, você poderá preencher os dados do participante. Porém, o comprovante ficará associado à sua conta na aba Minhas Inscrições.',
    answer: (
      <>
        Sim, durante o processo de inscrição, você poderá preencher os dados do participante. Porém, o comprovante ficará associado à sua conta na aba <Link href="/minhas-inscricoes" className="text-blue-400 hover:underline transition-colors font-medium">Minhas Inscrições</Link>.
      </>
    ),
  },
  {
    category: 'Conta',
    question: 'Esqueci minha senha. Como recupero?',
    answerText: 'Na tela de Login, clique na opção de recuperar senha e informe o e-mail cadastrado. Você receberá um link de redefinição no seu e-mail.',
    answer: (
      <>
        Na tela de <Link href="/login" className="text-blue-400 hover:underline transition-colors font-medium">Login</Link>, clique na opção de recuperar senha e informe o e-mail cadastrado. Você receberá um link de redefinição no seu e-mail.
      </>
    ),
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
    label: 'Pagamentos',
    description: 'Boletos, Pix, confirmações e estornos',
    icon: <CreditCard className="w-6 h-6" />,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
    border: 'rgba(16,185,129,0.2)',
  },
  {
    label: 'Comprovantes',
    description: 'Acesso e download dos seus comprovantes',
    icon: <FileText className="w-6 h-6" />,
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.1)',
    border: 'rgba(139,92,246,0.2)',
  },
  {
    label: 'Eventos',
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
      className={`rounded-2xl overflow-hidden transition-all duration-200 ${isOpen ? "bg-blue-100/50 dark:bg-blue-500/10 border border-blue-300 dark:border-blue-500/20" : "bg-white/40 dark:bg-white/5 border border-blue-300/60 dark:border-white/10"}`}
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
          <span className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 leading-snug">
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
          <p className="text-[14px] leading-relaxed text-slate-600 dark:text-slate-400">
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
        f.answerText.toLowerCase().includes(term) ||
        f.category.toLowerCase().includes(term)
    );
  }, [search]);

  function toggle(idx: number) {
    setOpenIdx(prev => (prev === idx ? null : idx));
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/40 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950"
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

          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
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
          <p className="text-slate-500 dark:text-slate-400 text-lg mb-10">
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
              className="w-full h-14 pl-12 pr-4 rounded-2xl text-base text-slate-900 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-600 outline-none transition-all bg-white/60 dark:bg-white/5 border border-blue-300/60 dark:border-white/10 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </div>
      </section>

      {/* ── Categories Grid ────────────────────────────────────────────────── */}
      {!search && (
        <section className="px-4 pb-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 text-center">Navegar por categoria</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.label}
                  onClick={() => setSearch(cat.label)}
                  className="flex flex-col items-center gap-3 p-5 rounded-2xl text-center transition-all duration-200 group bg-white/60 dark:bg-white/5 border border-blue-300/60 dark:border-white/10"
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
                    <p className="text-[13px] font-bold text-slate-900 dark:text-slate-100 leading-tight">{cat.label}</p>
                    <p className="text-[11px] mt-1 leading-tight text-slate-500 dark:text-slate-400">
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
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
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
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-white/40 dark:bg-white/5 border border-blue-300/60 dark:border-white/10"
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
            className="mt-10 p-6 rounded-2xl text-center bg-blue-100/80 dark:bg-blue-500/10 border border-blue-300/80 dark:border-blue-500/20"
          >
            <p className="text-slate-900 dark:text-slate-300 font-medium mb-1">Não encontrou o que procurava?</p>
            <p className="text-slate-500 dark:text-slate-500 text-sm mb-4">Nossa equipe está pronta para te ajudar.</p>
            <Link
              href="/suporte"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all"
              style={{ background: 'var(--admin-accent, #2563eb)' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Abrir Chamado de Suporte
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
