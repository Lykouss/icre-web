'use client'

import Image from 'next/image';
import { useScrollReveal } from '@/features/core/hooks/use-scroll-reveal';
import type { Pastor, PastorsSectionContent } from '@/features/portal/types';

function PastorCard({ pastor, index }: { pastor: Pastor; index: number }) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={`group relative bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="relative w-full aspect-[4/5] bg-slate-100 overflow-hidden">
        {pastor.photo_url ? (
          <Image
            src={pastor.photo_url}
            alt={pastor.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
            <svg className="w-20 h-20 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
      </div>

      <div className="p-6">
        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">{pastor.role}</p>
        <h3 className="text-xl font-bold text-slate-900 mb-2">{pastor.name}</h3>
        {pastor.bio && (
          <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">{pastor.bio}</p>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </div>
  );
}

interface Props {
  content: PastorsSectionContent;
  pastors: Pastor[];
}

export function PastorsSection({ content, pastors }: Props) {
  const { ref, visible } = useScrollReveal();

  if (pastors.length === 0) return null;

  return (
    <section className="py-24 px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div
          ref={ref}
          className={`text-center mb-16 transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          <div className="inline-flex items-center gap-2 text-blue-600 text-xs font-bold tracking-widest uppercase mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Liderança
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            {content.title || 'Nossa Liderança'}
          </h2>
          {content.subtitle && (
            <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">{content.subtitle}</p>
          )}
        </div>

        <div className={`grid gap-6 ${
          pastors.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' :
          pastors.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto' :
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}>
          {pastors.map((pastor, i) => (
            <PastorCard key={pastor.id} pastor={pastor} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}