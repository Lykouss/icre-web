import { createClient } from '@/lib/supabase/server';
//import { ContactForm } from '@/features/portal/components/ContactForm';
import type { ContactContent } from '@/features/portal/types';

export const revalidate = 120;

export default async function PublicContactPage() {
  const supabase = await createClient();

  const { data: block } = await supabase
    .from('site_blocks')
    .select('published_content')
    .eq('type', 'contact')
    .eq('is_active', true)
    .single();

  const contact = (block?.published_content ?? {}) as ContactContent;

  const hasContactInfo = !!(contact.address || contact.phone || contact.email);

  return (
    <main className="py-16 px-6 min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto">

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            {contact.title || 'Entre em Contato'}
          </h1>
          {contact.subtitle && (
            <p className="text-lg text-slate-500">{contact.subtitle}</p>
          )}
        </div>

        <div className={`grid gap-10 items-start ${hasContactInfo ? 'md:grid-cols-2' : 'max-w-xl mx-auto'}`}>

          {hasContactInfo && (
            <div className="space-y-6">
              {contact.address && (
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Endereço</p>
                    <p className="text-slate-500 text-sm mt-0.5">{contact.address}</p>
                  </div>
                </div>
              )}

              {contact.phone && (
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">WhatsApp</p>
                    <a
                      href={`https://wa.me/${contact.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-500 text-sm mt-0.5 hover:text-green-600 transition-colors"
                    >
                      {contact.phone}
                    </a>
                  </div>
                </div>
              )}

              {contact.email && (
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">E-mail</p>
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-slate-500 text-sm mt-0.5 hover:text-purple-600 transition-colors"
                    >
                      {contact.email}
                    </a>
                  </div>
                </div>
              )}

              {contact.maps_embed_url && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 aspect-video mt-2">
                  <iframe src={contact.maps_embed_url} className="w-full h-full" loading="lazy" />
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Deixe uma mensagem</h2>
            <p className="text-sm text-slate-500 mb-6">Nossa equipe responderá em breve.</p>
            
          </div>

        </div>
      </div>
    </main>
  );
}