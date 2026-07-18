'use client'

import React, { useState, useTransition } from 'react';
import { acceptAdminTerms } from '@/features/core/actions/auth';

export default function AdminTermsPage() {
  const [accepted, setAccepted] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 40) {
      setScrolledToBottom(true);
    }
  };

  const handleAccept = () => {
    if (!accepted) return;
    startTransition(async () => {
      const result = await acceptAdminTerms();
      if (result?.error) setError(result.error);
    });
  };

  return (
   <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/40 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 text-slate-900 dark:text-white flex items-center justify-center pt-24 pb-8 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#3b1f5e_0%,_transparent_60%)] pointer-events-none" />

      <div className="relative w-full max-w-2xl">
        {/* Badge de notificação */}
        <div className="flex items-center justify-center mb-6">
          <div className="inline-flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold px-5 py-2.5 rounded-full">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Você recebeu um novo cargo de administrador
          </div>
        </div>

        <div className="bg-blue-100 dark:bg-slate-900 border border-blue-300/60 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="p-8 border-b border-blue-300/60 dark:border-slate-800">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-violet-500/10 border border-violet-500/20 rounded-2xl flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Termos de Responsabilidade do Administrador</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Leia com atenção antes de assumir as responsabilidades do cargo.</p>
              </div>
            </div>

            <div className="bg-violet-500/5 border border-violet-500/15 rounded-2xl p-4 text-sm text-violet-300 leading-relaxed">
              A ICRE confiou a você um cargo de administrador no sistema. Isso concede acesso a informações sensíveis de membros, dados financeiros e configurações da plataforma. Com esse poder vem uma responsabilidade proporcional.
            </div>
          </div>

          {/* Conteúdo dos Termos — scroll obrigatório */}
          <div
            onScroll={handleScroll}
            className="h-72 overflow-y-auto p-8 text-sm text-slate-500 dark:text-slate-400 leading-relaxed space-y-4 border-b border-blue-300/60 dark:border-slate-800"
          >
            <AdminTermsContent />

            {!scrolledToBottom && (
              <div className="sticky bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-50 dark:from-slate-900 to-transparent pointer-events-none -mx-8" />
            )}
          </div>

          {/* Rodapé com aceite */}
          <div className="p-8 space-y-5">

            {!scrolledToBottom && (
              <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
                Role até o final para habilitar a confirmação
              </p>
            )}

            <label className={`flex items-start gap-3 cursor-pointer group transition-opacity ${scrolledToBottom ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={e => setAccepted(e.target.checked)}
                  disabled={!scrolledToBottom}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 rounded-md border-2 border-slate-200 dark:border-slate-600 peer-checked:bg-violet-600 peer-checked:border-violet-600 transition-all flex items-center justify-center">
                  {accepted && (
                    <svg className="w-3 h-3 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:hover:text-white transition-colors leading-relaxed">
                Li, compreendi e aceito os Termos de Responsabilidade do Administrador da ICRE. Comprometo-me a exercer este cargo com integridade, ética e alinhamento com os valores da igreja.
              </span>
            </label>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              onClick={handleAccept}
              disabled={!accepted || isPending}
              className="w-full bg-violet-600 hover:bg-violet-500 text-slate-900 dark:text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Salvando...
                </>
              ) : (
                <>
                  Aceitar e continuar
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>

            <p className="text-center text-xs text-slate-600">
              O próximo passo será a criação do seu PIN de segurança pessoal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminTermsContent() {
  return (
    <>
      <p className="font-bold text-slate-600 dark:text-slate-200 text-base">Termos de Responsabilidade do Administrador — ICRE</p>
      <p>Última atualização: março de 2026</p>

      <p className="font-semibold text-slate-600 dark:text-slate-200">1. Natureza do Cargo</p>
      <p>O cargo de administrador no sistema SIGE-Web da ICRE é uma posição de confiança concedida pela liderança da igreja. O acesso administrativo não é um direito, mas um privilégio que pode ser revogado a qualquer momento mediante decisão da liderança.</p>

      <p className="font-semibold text-slate-600 dark:text-slate-200">2. Acesso a Informações Confidenciais</p>
      <p>Como administrador, você terá acesso a dados pessoais de membros (incluindo informações de contato, endereço e histórico pastoral), dados financeiros da igreja e registros internos. Todas essas informações são estritamente confidenciais e não devem ser compartilhadas, divulgadas ou utilizadas fora do contexto ministerial da ICRE.</p>

      <p className="font-semibold text-slate-600 dark:text-slate-200">3. Responsabilidade pelo Uso do Sistema</p>
      <p>Todas as ações realizadas com suas credenciais são registradas em log de auditoria e associadas à sua identidade. Você é pessoalmente responsável por qualquer ação executada no sistema com seu login. Nunca compartilhe seu PIN ou credenciais de acesso com terceiros.</p>

      <p className="font-semibold text-slate-600 dark:text-slate-200">4. PIN de Segurança</p>
      <p>Ao concluir este aceite, você criará um PIN de segurança pessoal de 4 dígitos. Este PIN é exigido sempre que você acessar o sistema em um novo contexto de sessão. Guarde-o com responsabilidade — o PIN não pode ser recuperado, apenas redefinido pela liderança.</p>

      <p className="font-semibold text-slate-600 dark:text-slate-200">5. Conduta Ética</p>
      <p>O administrador compromete-se a exercer suas funções com integridade, imparcialidade e alinhamento com os valores cristãos da ICRE. É vedado o uso do sistema para fins pessoais, comerciais ou contrários aos princípios da igreja. Qualquer abuso será tratado com seriedade pela liderança.</p>

      <p className="font-semibold text-slate-600 dark:text-slate-200">6. Gestão de Membros e Finanças</p>
      <p>Ao editar dados de membros ou registrar transações financeiras, o administrador declara que as informações inseridas são verdadeiras e corretas ao melhor de seu conhecimento. Erros intencionais ou omissões dolosas configuram violação grave destes termos.</p>

      <p className="font-semibold text-slate-600 dark:text-slate-200">7. Proteção de Dados (LGPD)</p>
      <p>Como operador de dados pessoais, o administrador deve seguir as diretrizes da Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Isso inclui coletar apenas dados necessários, tratá-los com finalidade legítima e notificar a liderança sobre qualquer incidente de segurança.</p>

      <p className="font-semibold text-slate-600 dark:text-slate-200">8. Revogação de Acesso</p>
      <p>O cargo administrativo pode ser revogado a qualquer momento pela liderança da ICRE, sem necessidade de justificativa prévia. Ao sair do cargo, o administrador deve cessar imediatamente qualquer uso de credenciais privilegiadas.</p>

      <p className="font-semibold text-slate-600 dark:text-slate-200">9. Vigência</p>
      <p>Estes termos entram em vigor no momento do aceite e permanecem válidos durante todo o período em que o cargo for exercido. A aceitação é registrada com data e hora no sistema para fins de auditoria.</p>
    </>
  );
}