import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { QrScanner } from '@/features/events/components/QrScanner';

export default async function CheckinPage({ searchParams }: { searchParams: Promise<{ eventId?: string }> }) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const eventId = params.eventId;
  
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

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        {!eventId ? (
          <div className="text-center p-8 bg-red-50 text-red-600 rounded-2xl">
            <h3 className="font-bold">Atenção!</h3>
            <p className="mt-2 text-sm">Você precisa abrir o check-in através da página do evento.</p>
          </div>
        ) : (
          <QrScanner eventId={eventId} />
        )}
      </div>
    </div>
  );
}
