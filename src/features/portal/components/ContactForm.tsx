'use client'

import Link from 'next/link';
import { useScrollReveal } from '@/features/core/hooks/use-scroll-reveal';
import type { ContactContent } from '@/features/portal/types';

function InfoRow({
  icon, label, value, href, delay,
}: {
  icon: React.ReactNode; label: string; value: string; href?: string; delay: number;
}) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });

  const inner = (
    <div className="flex items-start gap-4 group">
      <div className="w-11 h-11 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 shrink-0 group-hover:bg-blue-500/20 transition-colors duration-200 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-slate-600 dark:text-slate-200 font-medium leading-snug">{value}</p>
      </div>
    </div>
  );

  return (
    <div
      ref={ref}
      className="transition-all duration-500 ease-out"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(-20px)', transitionDelay: `${delay}ms` }}
    >
      {href ? <a href={href} target="_blank" rel="noopener noreferrer">{inner}</a> : inner}
    </div>
  );
}

interface Props {
  content: ContactContent;
}

export function ContactSection({ content }: Props) {
  const { ref: titleRef, visible: tv } = useScrollReveal({ threshold: 0.1 });
  const { ref: mapRef, visible: mv }   = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });

  const mapsUrl = (content as unknown as Record<string, unknown>).maps_embed_url as string || content.maps_url || '';
  const subtitle = (content as unknown as Record<string, unknown>).subtitle as string || '';

  return (
    <section id="contato" className="relative py-32 px-6 bg-white dark:bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-blue-600/6 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[90px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* TÃ­tulo */}
        <div
          ref={titleRef}
          className="text-center mb-16 transition-all duration-700 ease-out"
          style={{ opacity: tv ? 1 : 0, transform: tv ? 'translateY(0)' : 'translateY(24px)' }}
        >
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
            Fale Conosco
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            {content.title || 'Contato'}
          </h2>
          {subtitle && (
            <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">{subtitle}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Infos */}
          <div className="bg-slate-50 dark:bg-slate-900/60 backdrop-blur-sm border border-black/5 dark:border-white/8 rounded-3xl p-8 space-y-6">
            {content.address && (
              <InfoRow
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                label="EndereÃ§o" value={content.address} delay={0}
              />
            )}
            {content.phone && (
              <InfoRow
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
                label="WhatsApp / Telefone" value={content.phone}
                href={`https://wa.me/${content.phone.replace(/\D/g, '')}`}
                delay={80}
              />
            )}
            {content.email && (
              <InfoRow
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                label="E-mail" value={content.email}
                href={`mailto:${content.email}`}
                delay={160}
              />
            )}
            {content.schedule && (
              <InfoRow
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                label="HorÃ¡rios" value={content.schedule} delay={240}
              />
            )}

            {!content.address && !content.phone && !content.email && (
              <p className="text-sm text-slate-500 italic">Configure as informaÃ§Ãµes de contato no painel.</p>
            )}

            <div className="pt-2">
              <Link
                href="/feedback"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-2xl text-sm transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25"
              >
                Fale conosco
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Mapa */}
          <div
            ref={mapRef}
            className="transition-all duration-700 ease-out"
            style={{ opacity: mv ? 1 : 0, transform: mv ? 'translateX(0)' : 'translateX(32px)', transitionDelay: '100ms' }}
          >
            <div className="relative">
              <div className="absolute -inset-3 bg-blue-500/8 rounded-3xl blur-xl" />
              <div className="relative rounded-3xl overflow-hidden border border-black/5 dark:border-white/8 bg-white/80 backdrop-blur-md dark:backdrop-blur-none border-slate-200/50 dark:border-transparent dark:bg-slate-800/50 aspect-4/3 shadow-2xl">
                {mapsUrl ? (
                  <iframe
                    src={mapsUrl}
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="LocalizaÃ§Ã£o da ICRE"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-600">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <p className="text-sm font-medium">Configure o mapa no painel</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
