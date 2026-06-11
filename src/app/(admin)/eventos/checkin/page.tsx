import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { QrScanner } from '@/features/events/components/QrScanner';

export default async function CheckinPage() {
  const user = await getCurrentUser();
  
  if (!user || (!user.isSysAdmin && !user.roles.includes('CHURCH_ADMIN'))) {
    redirect('/dashboard');
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-800">Check-in de Eventos</h1>
        <p className="text-sm text-slate-500 mt-2">
          Aponte a câmera para o QR Code no ingresso do participante para registrar a presença automaticamente.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100">
        <QrScanner />
      </div>
    </div>
  );
}
