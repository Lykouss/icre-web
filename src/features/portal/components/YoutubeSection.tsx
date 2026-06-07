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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-red-600/5 rounded-full blur-[130px]" />
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Header */}
        <div
          ref={headerRef}
          className="text-center mb-14 transition-all duration-700 ease-out"
          style={{ opacity: hv ? 1 : 0, transform: hv ? 'translateY(0)' : 'translateY(24px)' }}
        >
          <div className="inline-flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
            {/* Ícone YouTube */}
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21.543 6.498C22 8.28 22 12 22 12s0 3.72-.457 5.502c-.254.985-.997 1.76-1.938 2.022C17.896 20 12 20 12 20s-5.893 0-7.605-.476c-.945-.266-1.687-1.04-1.938-2.022C2 15.72 2 12 2 12s0-3.72.457-5.502c.254-.985.997-1.76 1.938-2.022C6.107 4 12 4 12 4s5.896 0 7.605.476c.945.266 1.687 1.04 1.938 2.022zM10 15.5l6-3.5-6-3.5v7z"/>
            </svg>
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
            <div className="absolute -inset-6 bg-red-500/10 rounded-3xl blur-3xl" />
            <div className="absolute -inset-2 bg-slate-950/40 rounded-3xl" />

            <div className="relative rounded-3xl overflow-hidden border border-white/8 shadow-2xl aspect-video bg-slate-950">
              {videoId ? (
                <iframe
                  className="w-full h-full border-0"
                  src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={content.title || 'Vídeo ICRE'}
                />
              ) : (
                /* Placeholder rico */
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-breathe" />
                    <div className="relative w-20 h-20 bg-red-600/90 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors duration-200 cursor-default shadow-2xl shadow-red-500/30">
                      <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-300 font-semibold">Configure o vídeo no painel</p>
                    <p className="text-slate-600 text-sm mt-1">Adicione um ID de vídeo do YouTube</p>
                  </div>
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
                className="group inline-flex items-center gap-2.5 bg-red-600 hover:bg-red-500 text-white font-bold px-7 py-3.5 rounded-2xl transition-all duration-200 hover:scale-[1.03] hover:shadow-xl hover:shadow-red-500/30 text-sm overflow-hidden relative"
              >
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 shimmer-bg" />
                <svg className="relative w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21.543 6.498C22 8.28 22 12 22 12s0 3.72-.457 5.502c-.254.985-.997 1.76-1.938 2.022C17.896 20 12 20 12 20s-5.893 0-7.605-.476c-.945-.266-1.687-1.04-1.938-2.022C2 15.72 2 12 2 12s0-3.72.457-5.502c.254-.985.997-1.76 1.938-2.022C6.107 4 12 4 12 4s5.896 0 7.605.476c.945.266 1.687 1.04 1.938 2.022zM10 15.5l6-3.5-6-3.5v7z"/>
                </svg>
                <span className="relative">Assinar o canal</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}