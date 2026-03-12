'use client'

import Link from 'next/link';
import { useScrollReveal } from '@/features/core/hooks/use-scroll-reveal';
import type { ContactContent } from '@/features/portal/types';

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}

function InfoRow({ icon, label, value, href }: InfoRowProps) {
  const content = (
    <div className="flex items-start gap-4 group">
      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-slate-700 font-medium">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className="block">{content}</a>;
  }
  return content;
}

export function ContactSection({ content }: { content: ContactContent }) {
  const { ref, visible } = useScrollReveal({ threshold: 0.15 });

  return (
    <section id="contato" className="py-24 px-6 bg-slate-950">
      <div
        ref={ref}
        className={`max-w-6xl mx-auto transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Esquerda — Info */}
          <div>
            <div className="inline-flex items-center gap-2 text-blue-400 text-xs font-bold tracking-widest uppercase mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Contato
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-10">
              {content.title || 'Venha nos Visitar'}
            </h2>

            <div className="space-y-6">
              {content.address && (
                <InfoRow
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                  label="Endereço"
                  value={content.address}
                  href={content.maps_url || undefined}
                />
              )}
              {content.phone && (
                <InfoRow
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  }
                  label="Telefone"
                  value={content.phone}
                  href={`https://wa.me/${content.phone.replace(/\D/g, '')}`}
                />
              )}
              {content.email && (
                <InfoRow
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                  label="E-mail"
                  value={content.email}
                  href={`mailto:${content.email}`}
                />
              )}
              {content.schedule && (
                <InfoRow
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  label="Cultos"
                  value={content.schedule}
                />
              )}
            </div>
          </div>

          {/* Direita — Mapa ou placeholder */}
          <div className="rounded-3xl overflow-hidden bg-slate-800 aspect-video lg:aspect-auto lg:h-96 flex items-center justify-center">
            {content.maps_url ? (
              <iframe
                src={content.maps_url}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Localização da ICRE"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <p className="text-sm font-medium">Adicione o link do Google Maps no painel</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto mt-20 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
        <p>© {new Date().getFullYear()} Igreja de Cristo Rocha Eterna. Todos os direitos reservados.</p>
        <div className="flex items-center gap-6">
          <Link href="/termos" className="hover:text-slate-300 transition-colors">Termos de Uso</Link>
          <Link href="/privacidade" className="hover:text-slate-300 transition-colors">Privacidade</Link>
          <Link href="/login" className="hover:text-slate-300 transition-colors">Área do Membro</Link>
        </div>
      </div>
    </section>
  );
}