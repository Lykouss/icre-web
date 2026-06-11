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
    <section id="youtube" className="relative py-24 px-6 bg-gray-50 overflow-hidden" data-theme="light">
      <div className="relative max-w-4xl mx-auto">

        {/* Header */}
        <div
          ref={headerRef}
          className="text-center mb-12 transition-all duration-700 ease-out"
          style={{ opacity: hv ? 1 : 0, transform: hv ? 'translateY(0)' : 'translateY(20px)' }}
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold text-red-600 tracking-widest uppercase bg-red-50 border border-red-200 px-3 py-1.5 rounded-full mb-5">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21.543 6.498C22 8.28 22 12 22 12s0 3.72-.457 5.502c-.254.985-.997 1.76-1.938 2.022C17.896 20 12 20 12 20s-5.893 0-7.605-.476c-.945-.266-1.687-1.04-1.938-2.022C2 15.72 2 12 2 12s0-3.72.457-5.502c.254-.985.997-1.76 1.938-2.022C6.107 4 12 4 12 4s5.896 0 7.605.476c.945.266 1.687 1.04 1.938 2.022zM10 15.5l6-3.5-6-3.5v7z"/>
            </svg>
            YouTube
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            {content.title || 'Ao Vivo'}
          </h2>
        </div>

        {/* Player */}
        <div
          ref={playerRef}
          className="transition-all duration-700 ease-out"
          style={{ opacity: pv ? 1 : 0, transform: pv ? 'translateY(0)' : 'translateY(20px)', transitionDelay: '80ms' }}
        >
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm aspect-video bg-gray-100">
            {videoId ? (
              <iframe
                className="w-full h-full border-0"
                src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={content.title || 'Vídeo ICRE'}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-gray-700 font-semibold">Configure o vídeo no painel</p>
                  <p className="text-gray-400 text-sm mt-1">Adicione um ID de vídeo do YouTube</p>
                </div>
              </div>
            )}
          </div>

          {content.channel_url && (
            <div className="text-center mt-7">
              <a
                href={content.channel_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 bg-red-600 hover:bg-red-500 text-white font-bold px-7 py-3.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-red-500/25 text-sm"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21.543 6.498C22 8.28 22 12 22 12s0 3.72-.457 5.502c-.254.985-.997 1.76-1.938 2.022C17.896 20 12 20 12 20s-5.893 0-7.605-.476c-.945-.266-1.687-1.04-1.938-2.022C2 15.72 2 12 2 12s0-3.72.457-5.502c.254-.985.997-1.76 1.938-2.022C6.107 4 12 4 12 4s5.896 0 7.605.476c.945.266 1.687 1.04 1.938 2.022zM10 15.5l6-3.5-6-3.5v7z"/>
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