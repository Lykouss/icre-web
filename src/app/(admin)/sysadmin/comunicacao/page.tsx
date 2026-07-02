import { CommunicationsManager } from '@/features/core/components/CommunicationsManager';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Comunicações e Avisos | SIGE',
};

export default function ComunicacaoPage() {
  return (
    <main className="p-6 md:p-12 w-full">
      <CommunicationsManager />
    </main>
  );
}
