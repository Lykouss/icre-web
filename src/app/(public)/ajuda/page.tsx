import type { Metadata } from 'next';
import { HelpCenterClient } from '@/features/support/components/HelpCenterClient';

export const metadata: Metadata = {
  title: 'Central de Ajuda — ICRE',
  description: 'Encontre respostas para suas dúvidas sobre inscrições, pagamentos e comprovantes.',
};

export default function AjudaPage() {
  return <HelpCenterClient />;
}
