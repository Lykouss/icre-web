import Link from 'next/link';

export const metadata = {
  title: 'Política de Privacidade — ICRE',
};

interface SectionProps {
  number: string;
  title: string;
  children: React.ReactNode;
}

function Section({ number, title, children }: SectionProps) {
  return (
    <div>
      <div className="flex items-start gap-4 mb-3">
        <span className="shrink-0 w-8 h-8 rounded-lg bg-blue-600/10 text-blue-400 text-xs font-black flex items-center justify-center mt-0.5">
          {number}
        </span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
      </div>
      <div className="ml-12 text-slate-500 dark:text-slate-400 leading-relaxed space-y-3">
        {children}
      </div>
    </div>
  );
}

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-blue-950/60 to-white dark:to-slate-950 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-6 pt-32 pb-16">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-600 dark:text-slate-300 text-sm font-medium transition-colors mb-10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar ao início
          </Link>

          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Documento legal
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
            Política de<br />Privacidade
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Última atualização: março de 2026
          </p>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-3xl mx-auto px-6 pb-24">
        <div className="w-full h-px bg-black/5 dark:bg-white/5 mb-16" />

        <div className="space-y-12">
          <Section number="1" title="Quem somos">
            <p>
              A Igreja de Cristo Rocha Eterna (ICRE) é responsável pelo tratamento dos dados
              pessoais coletados por meio da plataforma SIGE-Web e do site institucional.
            </p>
            <p>
              Para dúvidas sobre esta política ou sobre o tratamento dos seus dados, entre em
              contato através do e-mail disponível na seção de Contato do site.
            </p>
          </Section>

          <Section number="2" title="Dados que coletamos">
            <p>Coletamos apenas os dados necessários para o funcionamento da plataforma:</p>
            <ul className="space-y-2 mt-2">
              {[
                'Nome completo',
                'Endereço de e-mail',
                'Número de telefone',
                'Data de nascimento',
                'Endereço residencial',
                'Foto de perfil (opcional)',
                'Dados de participação em células e eventos',
              ].map(item => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </Section>

          <Section number="3" title="Como usamos seus dados">
            <p>Utilizamos seus dados exclusivamente para:</p>
            <ul className="space-y-2 mt-2">
              {[
                'Identificação e autenticação na plataforma',
                'Comunicação de eventos e avisos da igreja',
                'Organização interna de membros, células e escalas',
                'Controle de participação e trilha espiritual',
                'Cumprimento de obrigações legais aplicáveis',
              ].map(item => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              Não utilizamos seus dados para fins comerciais, publicidade ou venda a terceiros.
            </p>
          </Section>

          <Section number="4" title="Compartilhamento de dados">
            <p>Seus dados não são compartilhados com terceiros, exceto quando:</p>
            <ul className="space-y-2 mt-2">
              {[
                'Exigido por lei ou ordem judicial',
                'Necessário para operação da infraestrutura (ex: serviços de hospedagem)',
                'Você tenha dado consentimento expresso',
              ].map(item => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              Utilizamos o Supabase como infraestrutura de banco de dados e autenticação,
              cujos servidores estão sujeitos às políticas de privacidade da Supabase Inc.
            </p>
          </Section>

          <Section number="5" title="Armazenamento e segurança">
            <p>
              Todos os dados são armazenados em servidores seguros com criptografia em trânsito
              (TLS) e em repouso. O acesso é restrito por autenticação e controle de permissões
              por cargo (RBAC).
            </p>
            <p>
              Senhas nunca são armazenadas em texto simples. PINs de segurança são protegidos
              contra força bruta via rate limiting.
            </p>
          </Section>

          <Section number="6" title="Seus direitos (LGPD)">
            <p>
              Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:
            </p>
            <ul className="space-y-2 mt-2">
              {[
                'Acessar seus dados pessoais',
                'Corrigir dados incompletos ou desatualizados',
                'Solicitar a exclusão dos seus dados',
                'Revogar consentimento a qualquer momento',
                'Solicitar portabilidade dos dados',
              ].map(item => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              Para exercer qualquer desses direitos, acesse{' '}
              <Link href="/minha-conta" className="text-blue-400 hover:text-blue-300 underline transition-colors">
                Minha Conta
              </Link>{' '}
              ou entre em contato conosco.
            </p>
          </Section>

          <Section number="7" title="Cookies e rastreamento">
            <p>
              Utilizamos apenas cookies estritamente necessários para autenticação e segurança
              da sessão. Não utilizamos cookies de rastreamento, analytics de terceiros ou
              publicidade.
            </p>
          </Section>

          <Section number="8" title="Retenção de dados">
            <p>
              Seus dados são mantidos enquanto sua conta estiver ativa. Após a exclusão, os dados
              são removidos em até 30 dias, exceto quando a retenção for exigida por lei.
            </p>
          </Section>

          <Section number="9" title="Alterações nesta política">
            <p>
              Podemos atualizar esta política periodicamente. Alterações significativas serão
              comunicadas por e-mail ou aviso na plataforma com antecedência mínima de 7 dias.
            </p>
            <p>
              O uso contínuo após o prazo de aviso implica aceitação da nova versão.
            </p>
          </Section>
        </div>

        <div className="mt-20 pt-8 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Igreja de Cristo Rocha Eterna
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/termos" className="text-slate-500 hover:text-slate-600 dark:text-slate-300 transition-colors">
              Termos de Uso
            </Link>
            <Link href="/" className="text-slate-500 hover:text-slate-600 dark:text-slate-300 transition-colors">
              Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}