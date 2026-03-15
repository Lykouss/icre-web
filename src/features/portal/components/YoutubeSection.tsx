'use client'

import { useScrollReveal } from '@/features/core/hooks/use-scroll-reveal';
import type { YoutubeContent } from '@/features/portal/types';

interface Props {
  content: YoutubeContent;
}

export function YoutubeSection({ content }: Props) {
  const { ref: headerRef, visible: hv } = useScrollReveal({ threshold: 0.1 });
  const { ref: playerRef, visible: pv } = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });

  const videoId = content.video_id;

  return (
    <section id="youtube" className="relative py-32 px-6 bg-slate-900 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-transparent to-slate-950/50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-600/6 rounded-full blur-[130px]" />
      </div>

      <div className="relative max-w-4xl mx-auto">
        <div
          ref={headerRef}
          className="text-center mb-12 transition-all duration-700 ease-out"
          style={{ opacity: hv ? 1 : 0, transform: hv ? 'translateY(0)' : 'translateY(24px)' }}
        >
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            YouTube
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            {content.title || 'Ao Vivo'}
          </h2>
        </div>

        {/* Player */}
        <div
          ref={playerRef}
          className="transition-all duration-700 ease-out"
          style={{ opacity: pv ? 1 : 0, transform: pv ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.97)', transitionDelay: '100ms' }}
        >
          <div className="relative">
            {/* Glow atrás do player */}
            <div className="absolute -inset-4 bg-blue-500/10 rounded-3xl blur-2xl" />
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl aspect-video bg-slate-950">
              {videoId ? (
                <iframe
                  className="w-full h-full border-0"
                  src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={content.title || 'Vídeo ICRE'}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-600">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium">Configure o vídeo no painel</p>
                </div>
              )}
            </div>
          </div>

          {content.channel_url && (
            <div className="text-center mt-8">
              <a
                href={content.channel_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-red-600/90 hover:bg-red-500 text-white font-bold px-6 py-3 rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-red-500/25 text-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-2.71 4.83 4.83 0 00-3.77-2.71C9.92 1.27 7.71 2.5 6.3 4.56A4.82 4.82 0 012 9.18c0 2.64 2.1 4.82 4.72 4.82.29 0 .57-.03.84-.08a4.83 4.83 0 003.77 2.71 4.83 4.83 0 003.77 2.71c2.64 0 4.72-2.18 4.72-4.82a4.82 4.82 0 00-1.18-3.18 4.81 4.81 0 00.85-2.65z"/>
                </svg>
                Assinar o canal
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}