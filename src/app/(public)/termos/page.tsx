import Link from 'next/link';

export const metadata = {
  title: 'Termos e Condições — ICRE',
  description: 'Termos e Condições de Uso da plataforma SIGE-Web da Igreja de Cristo Rocha Eterna.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">

        <div className="mb-10">
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
            ← Voltar ao site
          </Link>
        </div>

        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Termos e Condições de Uso</h1>
          <p className="text-slate-500">Igreja de Cristo Rocha Eterna — ICRE</p>
          <p className="text-slate-400 text-sm mt-1">Última atualização: março de 2026</p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Aceitação dos Termos</h2>
            <p>Ao criar uma conta ou utilizar a plataforma SIGE-Web da Igreja de Cristo Rocha Eterna (ICRE), você declara que leu, compreendeu e concorda com estes Termos e Condições de Uso (&quot;Termos&quot;). Se você não concordar com qualquer parte destes Termos, não crie uma conta e não utilize a plataforma.</p>
            <p>Estes Termos constituem um acordo juridicamente vinculante entre você e a ICRE. Ao continuar utilizando a plataforma após alterações nestes Termos, você aceita as versões atualizadas.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Descrição da Plataforma</h2>
            <p>O SIGE-Web é um sistema de gestão eclesiástica desenvolvido para uso exclusivo da comunidade da ICRE. A plataforma permite gerenciar informações de membros, eventos, escalas de ministério, finanças e comunicações internas da igreja. O acesso é destinado a membros, visitantes cadastrados e colaboradores autorizados.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Elegibilidade</h2>
            <p>Para criar uma conta, você deve ter no mínimo 13 anos de idade. Ao se cadastrar, você declara que as informações fornecidas são verdadeiras, precisas e completas. A ICRE reserva-se o direito de recusar ou encerrar contas que violem estes Termos ou que contenham informações falsas.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Coleta e Uso de Dados Pessoais</h2>
            <p>Para criar e manter sua conta, coletamos os seguintes dados: nome completo, endereço de e-mail, número de telefone, endereço residencial e data de nascimento. Estes dados são utilizados exclusivamente para as seguintes finalidades:</p>
            <ul className="list-disc pl-6 space-y-1 mt-3">
              <li>Identificação e autenticação na plataforma;</li>
              <li>Comunicação sobre eventos, avisos e atividades da igreja;</li>
              <li>Gestão pastoral e organizacional interna da ICRE;</li>
              <li>Cumprimento de obrigações legais aplicáveis.</li>
            </ul>
            <p className="mt-3">Não vendemos, alugamos nem comercializamos seus dados pessoais. Dados não são compartilhados com terceiros, exceto quando exigido por determinação judicial ou obrigação legal.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Segurança da Conta</h2>
            <p>Você é responsável pela confidencialidade de suas credenciais de acesso (e-mail, senha e PIN). Não compartilhe sua senha ou PIN com ninguém, inclusive com outros membros da equipe administrativa. Em caso de suspeita de acesso não autorizado à sua conta, notifique imediatamente a administração da ICRE.</p>
            <p className="mt-3">A ICRE implementa medidas técnicas e organizacionais razoáveis para proteger seus dados. Contudo, nenhum sistema de segurança é absolutamente infalível. A ICRE não se responsabiliza por acessos não autorizados decorrentes de negligência do próprio usuário.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Conduta do Usuário</h2>
            <p>Ao utilizar a plataforma, você concorda em não:</p>
            <ul className="list-disc pl-6 space-y-1 mt-3">
              <li>Utilizar a plataforma para fins ilegais, difamatórios ou contrários aos valores cristãos da ICRE;</li>
              <li>Acessar, modificar ou divulgar dados de outros membros sem autorização;</li>
              <li>Tentar comprometer a segurança, integridade ou disponibilidade do sistema;</li>
              <li>Fornecer informações falsas ou enganosas durante o cadastro ou uso;</li>
              <li>Utilizar a plataforma para fins comerciais pessoais não relacionados à ICRE.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">7. Direitos do Titular dos Dados (LGPD)</h2>
            <p>Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem os seguintes direitos em relação aos seus dados pessoais:</p>
            <ul className="list-disc pl-6 space-y-1 mt-3">
              <li>Confirmação da existência de tratamento de seus dados;</li>
              <li>Acesso aos dados que temos sobre você;</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
              <li>Portabilidade dos dados, mediante solicitação;</li>
              <li>Eliminação dos dados tratados com base no seu consentimento;</li>
              <li>Revogação do consentimento a qualquer momento.</li>
            </ul>
            <p className="mt-3">Para exercer qualquer destes direitos, entre em contato com a secretaria da ICRE.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">8. Encerramento e Exclusão de Conta</h2>
            <p>Você pode solicitar o encerramento de sua conta a qualquer momento entrando em contato com a administração. Após o encerramento, seus dados pessoais serão eliminados, exceto aqueles cuja retenção seja exigida por obrigação legal (por exemplo, registros financeiros que devem ser mantidos por prazo determinado pela legislação tributária brasileira).</p>
            <p className="mt-3">A ICRE também pode encerrar ou suspender contas que violem estes Termos, sem aviso prévio e sem obrigação de indenização.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">9. Alterações nestes Termos</h2>
            <p>A ICRE pode revisar estes Termos periodicamente. Quando realizarmos alterações significativas, notificaremos você por e-mail com antecedência razoável. A data de &quot;Última atualização&quot; no topo deste documento indica quando foi feita a revisão mais recente. O uso continuado da plataforma após a data de vigência das alterações constitui aceitação dos novos Termos.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">10. Disposições Gerais</h2>
            <p>Estes Termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa decorrente destes Termos será submetida ao foro da comarca onde a ICRE está sediada, com renúncia a qualquer outro, por mais privilegiado que seja.</p>
            <p className="mt-3">A invalidade ou inexequibilidade de qualquer disposição destes Termos não afetará a validade das demais disposições, que permanecerão em pleno vigor.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">11. Contato</h2>
            <p>Dúvidas, solicitações ou reclamações relacionadas a estes Termos podem ser enviadas à secretaria da ICRE pelos canais disponíveis na página de <Link href="/contato" className="text-blue-600 hover:text-blue-700 underline">Contato</Link>.</p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <p className="text-sm text-slate-400">© {new Date().getFullYear()} Igreja de Cristo Rocha Eterna — ICRE. Todos os direitos reservados.</p>
          <Link href="/privacidade" className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
            Política de Privacidade →
          </Link>
        </div>
      </div>
    </div>
  );
}