'use client'

import Link from 'next/link';
import { useScrollReveal } from '@/features/core/hooks/use-scroll-reveal';
import type { ContactContent } from '@/features/portal/types';

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  iconBg?: string;
  iconColor?: string;
}

function InfoRow({ icon, label, value, href, iconBg = 'bg-blue-50 border-blue-100', iconColor = 'text-blue-600' }: InfoRowProps) {
  const inner = (
    <div className="group flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-colors duration-200 ${iconBg} ${iconColor}`}>
        {icon}
      </div>
      <div className="pt-0.5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-gray-700 font-medium text-sm leading-snug">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block hover:opacity-80 transition-opacity duration-200">
        {inner}
      </a>
    );
  }
  return inner;
}

export function ContactSection({ content }: { content: ContactContent }) {
  const { ref, visible } = useScrollReveal({ threshold: 0.12 });

  return (
    <section id="contato" className="relative py-24 px-6 bg-white overflow-hidden" data-theme="light">
      <div
        ref={ref}
        className={`relative max-w-6xl mx-auto transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-bold text-blue-600 tracking-widest uppercase bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full mb-5">
            Contato
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            {content.title || 'Venha nos Visitar'}
          </h2>
          <div className="mt-4 flex justify-center">
            <div className="h-1 w-12 bg-blue-600 rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* Esquerda — Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8">
            <div className="space-y-6">
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
                  iconBg="bg-emerald-50 border-emerald-100"
                  iconColor="text-emerald-600"
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
                  iconBg="bg-green-50 border-green-100"
                  iconColor="text-green-600"
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
                  iconBg="bg-blue-50 border-blue-100"
                  iconColor="text-blue-600"
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
                  iconBg="bg-violet-50 border-violet-100"
                  iconColor="text-violet-600"
                />
              )}
            </div>
          </div>

          {/* Direita — Mapa */}
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm aspect-video lg:aspect-auto lg:h-80 bg-gray-100 flex items-center justify-center">
            {content.maps_url ? (
              <iframe
                src={content.maps_url}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Localização da ICRE"
              />
            ) : (
              <div className="flex flex-col items-center gap-4 text-gray-400 p-8 text-center">
                <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Mapa não configurado</p>
                  <p className="text-xs text-gray-400 mt-1">Adicione o link do Google Maps no painel</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative max-w-6xl mx-auto mt-16 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Igreja de Cristo Rocha Eterna. Todos os direitos reservados.</p>
        <div className="flex items-center gap-6">
          <Link href="/termos" className="hover:text-gray-700 transition-colors duration-200">Termos de Uso</Link>
          <Link href="/privacidade" className="hover:text-gray-700 transition-colors duration-200">Privacidade</Link>
          <Link href="/login" className="hover:text-gray-700 transition-colors duration-200">Área do Membro</Link>
        </div>
      </div>
    </section>
  );
}