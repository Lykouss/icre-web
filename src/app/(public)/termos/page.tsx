import Link from 'next/link';

export const metadata = {
  title: 'Termos e Condições — ICRE',
  description: 'Termos e Condições de Uso da plataforma SIGE-Web da Igreja de Cristo Rocha Eterna.',
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
        <span className="shrink-0 w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 text-xs font-black flex items-center justify-center mt-0.5">
          {number}
        </span>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>
      <div className="ml-12 text-gray-600 leading-relaxed space-y-3">
        {children}
      </div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative bg-white border-b border-gray-100 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-50 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto px-6 pt-32 pb-16">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-bold transition-colors mb-10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar ao início
          </Link>

          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Documento legal
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-4">
            Termos e<br />Condições de Uso
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Última atualização: março de 2026
          </p>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-3xl mx-auto px-6 pb-24">
        <div className="w-full h-px bg-gray-200 mb-16" />

        <div className="space-y-12">
          <Section number="1" title="Aceitação dos Termos">
            <p>
              Ao criar uma conta ou utilizar a plataforma SIGE-Web da Igreja de Cristo Rocha Eterna (ICRE),
              você declara que leu, compreendeu e concorda com estes Termos e Condições de Uso. Se não
              concordar com qualquer parte, não crie uma conta e não utilize a plataforma.
            </p>
            <p>
              Estes Termos constituem um acordo juridicamente vinculante entre você e a ICRE. Ao continuar
              utilizando a plataforma após alterações nestes Termos, você aceita as versões atualizadas.
            </p>
          </Section>

          <Section number="2" title="Descrição da Plataforma">
            <p>
              O SIGE-Web é um sistema de gestão eclesiástica desenvolvido para uso exclusivo da comunidade
              da ICRE. A plataforma permite gerenciar informações de membros, eventos, escalas de ministério,
              finanças e comunicações internas. O acesso é destinado a membros, visitantes cadastrados e
              colaboradores autorizados.
            </p>
          </Section>

          <Section number="3" title="Elegibilidade">
            <p>
              Para criar uma conta, você deve ter no mínimo 13 anos de idade. Ao se cadastrar, você declara
              que as informações fornecidas são verdadeiras, precisas e completas. A ICRE reserva-se o
              direito de recusar ou encerrar contas que violem estes Termos ou que contenham informações falsas.
            </p>
          </Section>

          <Section number="4" title="Coleta e Uso de Dados Pessoais">
            <p>Para criar e manter sua conta, coletamos os seguintes dados:</p>
            <ul className="space-y-2 mt-2">
              {[
                'Nome completo',
                'Endereço de e-mail',
                'Número de telefone',
                'Endereço residencial',
                'Data de nascimento',
                'Foto de perfil (opcional)',
              ].map(item => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p>
              Estes dados são utilizados exclusivamente para identificação e autenticação na plataforma,
              comunicação de eventos e avisos, e gestão pastoral interna da ICRE. Não vendemos, alugamos
              nem comercializamos seus dados pessoais.
            </p>
          </Section>

          <Section number="5" title="Segurança da Conta">
            <p>
              Você é responsável pela confidencialidade de suas credenciais de acesso (e-mail, senha e PIN).
              Não compartilhe sua senha ou PIN com ninguém. Em caso de suspeita de acesso não autorizado,
              notifique imediatamente a administração da ICRE.
            </p>
            <p>
              A ICRE implementa medidas técnicas e organizacionais razoáveis para proteger seus dados.
              Contudo, nenhum sistema de segurança é absolutamente infalível. A ICRE não se responsabiliza
              por acessos não autorizados decorrentes de negligência do próprio usuário.
            </p>
          </Section>

          <Section number="6" title="Conduta do Usuário">
            <p>Ao utilizar a plataforma, você concorda em não:</p>
            <ul className="space-y-2 mt-2">
              {[
                'Utilizar a plataforma para fins ilegais ou contrários aos valores cristãos da ICRE',
                'Acessar, modificar ou divulgar dados de outros membros sem autorização',
                'Tentar comprometer a segurança ou integridade do sistema',
                'Fornecer informações falsas ou enganosas durante o cadastro ou uso',
                'Utilizar a plataforma para fins comerciais pessoais não relacionados à ICRE',
              ].map(item => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </Section>

          <Section number="7" title="Conteúdo e Propriedade Intelectual">
            <p>
              Todo o conteúdo disponibilizado na plataforma, incluindo textos, imagens, logotipos e código,
              é de propriedade da ICRE ou de seus respectivos criadores, protegido por leis de direitos
              autorais. É vedada a reprodução ou distribuição sem autorização prévia.
            </p>
          </Section>

          <Section number="8" title="Limitação de Responsabilidade">
            <p>
              A ICRE não se responsabiliza por danos diretos, indiretos ou consequentes decorrentes do uso
              ou impossibilidade de uso da plataforma, incluindo interrupções de serviço, perda de dados ou
              falhas técnicas.
            </p>
          </Section>

          <Section number="9" title="Alterações nos Termos">
            <p>
              A ICRE reserva-se o direito de atualizar estes Termos a qualquer momento. Alterações
              significativas serão comunicadas por e-mail ou aviso na plataforma com antecedência mínima de
              7 dias. O uso contínuo após o prazo de aviso implica aceitação da nova versão.
            </p>
          </Section>

          <Section number="10" title="Encerramento de Conta">
            <p>
              Você pode solicitar a exclusão de sua conta a qualquer momento em{' '}
              <Link href="/minha-conta" className="text-blue-600 hover:text-blue-700 underline transition-colors">
                Minha Conta
              </Link>.
              Dados necessários para cumprimento de obrigações legais poderão ser mantidos pelo período
              exigido pela legislação brasileira.
            </p>
          </Section>

          <Section number="11" title="Disposições Gerais">
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa
              decorrente destes Termos será submetida ao foro da comarca onde a ICRE está sediada.
            </p>
            <p>
              A invalidade ou inexequibilidade de qualquer disposição não afetará a validade das demais,
              que permanecerão em pleno vigor.
            </p>
          </Section>

          <Section number="12" title="Contato">
            <p>
              Dúvidas, solicitações ou reclamações relacionadas a estes Termos podem ser enviadas à
              secretaria da ICRE pelos canais disponíveis na página de{' '}
              <Link href="/#contato" className="text-blue-600 hover:text-blue-700 underline transition-colors">
                Contato
              </Link>.
            </p>
          </Section>
        </div>

        <div className="mt-20 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-gray-500 text-sm font-medium">
            © {new Date().getFullYear()} Igreja de Cristo Rocha Eterna
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/privacidade" className="text-gray-500 hover:text-gray-800 font-medium transition-colors">
              Política de Privacidade
            </Link>
            <Link href="/" className="text-gray-500 hover:text-gray-800 font-medium transition-colors">
              Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}