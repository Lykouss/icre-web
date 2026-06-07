'use client'

import Link from 'next/link';
import { useScrollReveal } from '@/features/core/hooks/use-scroll-reveal';
import type { ContactContent } from '@/features/portal/types';

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  color?: string;
}

function InfoRow({ icon, label, value, href, color = 'bg-blue-500/10 border-blue-500/20 text-blue-400 group-hover:bg-blue-500/20' }: InfoRowProps) {
  const inner = (
    <div className="group flex items-start gap-4 transition-all duration-200 hover:-translate-x-0.5">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-200 ${color}`}>
        {icon}
      </div>
      <div className="pt-0.5">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-[0.18em] mb-1">{label}</p>
        <p className="text-slate-200 font-medium text-sm leading-snug">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    );
  }
  return inner;
}

export function ContactSection({ content }: { content: ContactContent }) {
  const { ref, visible } = useScrollReveal({ threshold: 0.12 });

  return (
    <section id="contato" className="relative py-32 px-6 bg-slate-950 overflow-hidden">
      {/* Blurs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-600/5 rounded-full blur-[120px]" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/4 rounded-full blur-[90px]" />
      </div>

      <div
        ref={ref}
        className={`relative max-w-6xl mx-auto transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        {/* Badge */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            Contato
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            {content.title || 'Venha nos Visitar'}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Esquerda — Info */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-white/6 rounded-3xl p-8">
            <div className="space-y-7">
              {content.address && (
                <InfoRow
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  }
                  label="Endereço"
                  value={content.address}
                  href={content.maps_url || undefined}
                  color="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/20"
                />
              )}
              {content.phone && (
                <InfoRow
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                  }
                  label="WhatsApp"
                  value={content.phone}
                  href={`https://wa.me/${content.phone.replace(/\D/g, '')}`}
                  color="bg-green-500/10 border-green-500/20 text-green-400 group-hover:bg-green-500/20"
                />
              )}
              {content.email && (
                <InfoRow
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  }
                  label="E-mail"
                  value={content.email}
                  href={`mailto:${content.email}`}
                  color="bg-blue-500/10 border-blue-500/20 text-blue-400 group-hover:bg-blue-500/20"
                />
              )}
              {content.schedule && (
                <InfoRow
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  }
                  label="Cultos"
                  value={content.schedule}
                  color="bg-violet-500/10 border-violet-500/20 text-violet-400 group-hover:bg-violet-500/20"
                />
              )}
            </div>
          </div>

          {/* Direita — Mapa */}
          <div className="relative">
            <div className="absolute -inset-2 bg-blue-500/8 rounded-3xl blur-xl" />
            <div className="relative rounded-3xl overflow-hidden border border-white/8 shadow-2xl aspect-video lg:aspect-auto lg:h-80 flex items-center justify-center bg-slate-900">
              {content.maps_url ? (
                <iframe
                  src={content.maps_url}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Localização da ICRE"
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-slate-500 p-8 text-center">
                  <div className="w-16 h-16 bg-slate-800/80 border border-white/6 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-400">Mapa não configurado</p>
                    <p className="text-xs text-slate-600 mt-1">Adicione o link do Google Maps no painel</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative max-w-6xl mx-auto mt-20 pt-8 border-t border-white/6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
        <p>© {new Date().getFullYear()} Igreja de Cristo Rocha Eterna. Todos os direitos reservados.</p>
        <div className="flex items-center gap-6">
          <Link href="/termos" className="hover:text-slate-300 transition-colors duration-200">Termos de Uso</Link>
          <Link href="/privacidade" className="hover:text-slate-300 transition-colors duration-200">Privacidade</Link>
          <Link href="/login" className="hover:text-slate-300 transition-colors duration-200">Área do Membro</Link>
        </div>
      </div>
    </section>
  );
}