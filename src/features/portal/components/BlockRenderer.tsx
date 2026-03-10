import Link from 'next/link';
import Image from 'next/image';
import type {
  SiteBlock, BlockLayout, BlockAlignment, BlockWidth, BlockPadding,
  HeroContent, AboutContent, MissionContent,
  EventsContent, YoutubeContent, ContactContent,
  CustomTextContent, BannerContent,
} from '@/features/portal/types';

export interface PublicEvent {
  id: string;
  title: string;
  date: string | null;
  time: string | null;
  location: string | null;
}

interface BlockRendererProps {
  block: SiteBlock;
  publicEvents?: PublicEvent[];
}

const PADDING: Record<BlockPadding, string> = {
  compact:  'py-6',
  normal:   'py-16',
  spacious: 'py-28',
};

const WIDTH: Record<BlockWidth, string> = {
  full:      'w-full',
  container: 'max-w-5xl mx-auto w-full',
  narrow:    'max-w-2xl mx-auto w-full',
};

const TEXT_ALIGN: Record<BlockAlignment, string> = {
  left:   'text-left',
  center: 'text-center',
  right:  'text-right',
};

const FLEX_ALIGN: Record<BlockAlignment, string> = {
  left:   'items-start',
  center: 'items-center',
  right:  'items-end',
};

const DEFAULTS: Record<SiteBlock['type'], Required<BlockLayout>> = {
  hero:        { alignment: 'center', width: 'full',      padding: 'spacious', bg_color: 'transparent' },
  about:       { alignment: 'left',   width: 'container', padding: 'normal',   bg_color: '#ffffff' },
  mission:     { alignment: 'center', width: 'container', padding: 'normal',   bg_color: '#f8fafc' },
  events:      { alignment: 'center', width: 'container', padding: 'normal',   bg_color: '#ffffff' },
  youtube:     { alignment: 'center', width: 'container', padding: 'normal',   bg_color: '#0f172a' },
  contact:     { alignment: 'left',   width: 'container', padding: 'normal',   bg_color: '#f8fafc' },
  custom_text: { alignment: 'center', width: 'narrow',    padding: 'normal',   bg_color: '#ffffff' },
  banner:      { alignment: 'center', width: 'full',      padding: 'compact',  bg_color: 'transparent' },
};

function resolveLayout(content: unknown, type: SiteBlock['type']): Required<BlockLayout> {
  const raw = (content as Record<string, unknown>)?._layout as BlockLayout | undefined;
  const d = DEFAULTS[type];
  return {
    alignment: raw?.alignment ?? d.alignment,
    width:     raw?.width     ?? d.width,
    padding:   raw?.padding   ?? d.padding,
    bg_color:  raw?.bg_color  ?? d.bg_color,
  };
}

interface SectionProps {
  layout: Required<BlockLayout>;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

function Section({ layout, children, className = '', style }: SectionProps) {
  const bg = layout.bg_color !== 'transparent' ? layout.bg_color : undefined;
  return (
    <section
      className={`px-6 ${PADDING[layout.padding]} ${className}`}
      style={{ backgroundColor: bg, ...style }}
    >
      <div className={`${WIDTH[layout.width]} flex flex-col ${FLEX_ALIGN[layout.alignment]} ${TEXT_ALIGN[layout.alignment]}`}>
        {children}
      </div>
    </section>
  );
}

export function BlockRenderer({ block, publicEvents = [] }: BlockRendererProps) {
  const layout = resolveLayout(block.content, block.type);
  const c = block.content;

  switch (block.type) {
    case 'hero':        return <HeroBlock        content={c as unknown as HeroContent}       layout={layout} />;
    case 'about':       return <AboutBlock       content={c as unknown as AboutContent}      layout={layout} />;
    case 'mission':     return <MissionBlock     content={c as unknown as MissionContent}    layout={layout} />;
    case 'events':      return <EventsBlock      content={c as unknown as EventsContent}     layout={layout} events={publicEvents} />;
    case 'youtube':     return <YoutubeBlock     content={c as unknown as YoutubeContent}    layout={layout} />;
    case 'contact':     return <ContactBlock     content={c as unknown as ContactContent}    layout={layout} />;
    case 'custom_text': return <CustomTextBlock  content={c as unknown as CustomTextContent} layout={layout} />;
    case 'banner':      return <BannerBlock      content={c as unknown as BannerContent}     layout={layout} />;
    default:            return null;
  }
}

function HeroBlock({ content, layout }: { content: HeroContent; layout: Required<BlockLayout> }) {
  const justifyMap: Record<BlockAlignment, string> = { left: 'flex-start', center: 'center', right: 'flex-end' };
  return (
    <section
      className={`relative min-h-[80vh] flex items-center px-6 ${PADDING[layout.padding]}`}
      style={{
        backgroundColor: content.bg_color || '#1e3a5f',
        backgroundImage: content.image_url ? `url(${content.image_url})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        justifyContent: justifyMap[layout.alignment],
      }}
    >
      {content.image_url && <div className="absolute inset-0 bg-black/50" />}
      <div className={`relative z-10 ${WIDTH[layout.width]} flex flex-col ${FLEX_ALIGN[layout.alignment]} ${TEXT_ALIGN[layout.alignment]}`}>
        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6" style={{ color: content.text_color || '#ffffff' }}>
          {content.title}
        </h1>
        {content.subtitle && (
          <p className="text-xl md:text-2xl mb-8 opacity-90" style={{ color: content.text_color || '#ffffff' }}>
            {content.subtitle}
          </p>
        )}
        {content.button_text && (
          <Link
            href={content.button_link || '/contato'}
            className="inline-flex items-center px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:scale-105 shadow-lg"
            style={{ backgroundColor: content.text_color || '#ffffff', color: content.bg_color || '#1e3a5f' }}
          >
            {content.button_text}
          </Link>
        )}
      </div>
    </section>
  );
}

function AboutBlock({ content, layout }: { content: AboutContent; layout: Required<BlockLayout> }) {
  return (
    <Section layout={layout}>
      <div className={`grid ${content.image_url ? 'md:grid-cols-2' : 'grid-cols-1'} gap-12 items-center w-full`}>
        <div className={`flex flex-col ${FLEX_ALIGN[layout.alignment]} ${TEXT_ALIGN[layout.alignment]}`}>
          <h2 className="text-4xl font-bold text-slate-900 mb-6">{content.title}</h2>
          <p className="text-lg text-slate-600 leading-relaxed whitespace-pre-wrap">{content.text}</p>
        </div>
        {content.image_url && (
          <div className="rounded-3xl overflow-hidden shadow-xl aspect-video relative">
            <Image src={content.image_url} alt={content.title ?? ''} fill className="object-cover" />
          </div>
        )}
      </div>
    </Section>
  );
}

function MissionBlock({ content, layout }: { content: MissionContent; layout: Required<BlockLayout> }) {
  return (
    <Section layout={layout}>
      <h2 className="text-4xl font-bold text-slate-900 mb-12">{content.title}</h2>
      <div className="grid md:grid-cols-3 gap-8 w-full">
        {(content.items ?? []).map((item, i) => (
          <div key={i} className={`bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col ${FLEX_ALIGN[layout.alignment]} ${TEXT_ALIGN[layout.alignment]}`}>
            <div className="text-5xl mb-4">{item.icon}</div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
            <p className="text-slate-600 leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function EventsBlock({ content, layout, events }: { content: EventsContent; layout: Required<BlockLayout>; events: PublicEvent[] }) {
  return (
    <Section layout={layout}>
      <div className={`mb-12 flex flex-col ${FLEX_ALIGN[layout.alignment]} ${TEXT_ALIGN[layout.alignment]} w-full`}>
        <h2 className="text-4xl font-bold text-slate-900 mb-3">{content.title}</h2>
        {content.subtitle && <p className="text-lg text-slate-500">{content.subtitle}</p>}
      </div>
      {events.length === 0 ? (
        <p className="text-slate-400">Nenhum evento disponível no momento.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {events.map(event => (
            <Link key={event.id} href={`/agenda/${event.id}`} className="group bg-slate-50 rounded-3xl p-6 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all">
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">
                {event.date
                  ? new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
                  : 'Em breve'}
                {event.time && ` · ${event.time.slice(0, 5)}`}
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-blue-700 transition-colors">{event.title}</h3>
              {event.location && <p className="text-sm text-slate-500">{event.location}</p>}
              <div className="mt-4 text-sm font-semibold text-blue-600 flex items-center gap-1">
                Ver detalhes
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Section>
  );
}

function YoutubeBlock({ content, layout }: { content: YoutubeContent; layout: Required<BlockLayout> }) {
  if (!content.video_id) return null;
  const bg = layout.bg_color !== 'transparent' ? layout.bg_color : '#0f172a';
  return (
    <Section layout={layout} style={{ backgroundColor: bg }}>
      <h2 className="text-4xl font-bold text-white mb-10">{content.title}</h2>
      <div className={`rounded-3xl overflow-hidden shadow-2xl aspect-video w-full`}>
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${content.video_id}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      {content.channel_url && (
        <a href={content.channel_url} target="_blank" rel="noopener noreferrer" className="mt-6 text-white/70 hover:text-white font-medium transition-colors">
          Ver canal completo →
        </a>
      )}
    </Section>
  );
}

function ContactBlock({ content, layout }: { content: ContactContent; layout: Required<BlockLayout> }) {
  return (
    <Section layout={layout}>
      <div className={`mb-12 flex flex-col ${FLEX_ALIGN[layout.alignment]} ${TEXT_ALIGN[layout.alignment]} w-full`}>
        <h2 className="text-4xl font-bold text-slate-900 mb-3">{content.title}</h2>
        {content.subtitle && <p className="text-lg text-slate-500">{content.subtitle}</p>}
      </div>
      <div className="grid md:grid-cols-2 gap-8 items-start w-full">
        <div className="space-y-6">
          {content.address && (
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-800">Endereço</p>
                <p className="text-slate-500 text-sm mt-0.5">{content.address}</p>
              </div>
            </div>
          )}
          {content.phone && (
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-800">Telefone</p>
                <a href={`https://wa.me/${content.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-slate-500 text-sm mt-0.5 hover:text-green-600 transition-colors">
                  {content.phone}
                </a>
              </div>
            </div>
          )}
          {content.email && (
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-800">E-mail</p>
                <a href={`mailto:${content.email}`} className="text-slate-500 text-sm mt-0.5 hover:text-purple-600 transition-colors">{content.email}</a>
              </div>
            </div>
          )}
          {!content.address && !content.phone && !content.email && (
            <p className="text-sm text-slate-400 italic">Preencha as informações de contato no editor.</p>
          )}
          <Link href="/contato" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-blue-700 transition-colors">
            Fale conosco
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        {content.maps_embed_url && (
          <div className="rounded-3xl overflow-hidden shadow-lg aspect-video border border-slate-200">
            <iframe src={content.maps_embed_url} className="w-full h-full" loading="lazy" />
          </div>
        )}
      </div>
    </Section>
  );
}

function CustomTextBlock({ content, layout }: { content: CustomTextContent; layout: Required<BlockLayout> }) {
  const bg = content.bg_color || (layout.bg_color !== 'transparent' ? layout.bg_color : undefined);
  return (
    <Section layout={layout} style={{ backgroundColor: bg }}>
      {content.title && (
        <h2 className="text-4xl font-bold mb-6" style={{ color: content.text_color || '#1e293b' }}>{content.title}</h2>
      )}
      <p className="text-lg leading-relaxed whitespace-pre-wrap" style={{ color: content.text_color || '#1e293b' }}>{content.text}</p>
    </Section>
  );
}

function BannerBlock({ content }: { content: BannerContent; layout: Required<BlockLayout> }) {
  if (!content.image_url) return null;
  const inner = (
    <div className="relative w-full" style={{ height: '256px' }}>
      <Image src={content.image_url} alt={content.alt ?? ''} fill className="object-cover" />
    </div>
  );
  return content.link ? <a href={content.link}>{inner}</a> : inner;
}