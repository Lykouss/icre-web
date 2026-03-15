import { createClient } from '@/lib/supabase/server';
import { HeroSection }    from '@/features/portal/components/HeroSection';
import { AboutSection }   from '@/features/portal/components/AboutSection';
import { MissionSection } from '@/features/portal/components/MissionSection';
import { PastorsSection } from '@/features/portal/components/PastorsSection';
import { CellsSection }   from '@/features/portal/components/CellsSection';
import { EventsSection }  from '@/features/portal/components/EventsSection';
import { YoutubeSection } from '@/features/portal/components/YoutubeSection';
import { ContactSection } from '@/features/portal/components/ContactSection';
import type {
  SiteBlock, HeroContent, AboutContent, MissionContent,
  PastorsSectionContent, CellsSectionContent,
  EventsContent, YoutubeContent, ContactContent,
  Pastor, PublicCell,
} from '@/features/portal/types';
import type { PublicEvent } from '@/features/portal/components/EventsSection';

export const revalidate = 60;

type BlockRow = Pick<SiteBlock, 'type' | 'is_active'> & {
  published_content: Record<string, unknown>;
};

async function getSiteData() {
  const supabase = await createClient();

  const [blocksRes, pastorsRes, cellsRes, eventsRes] = await Promise.all([
    supabase.from('site_blocks').select('type, is_active, published_content').order('order_idx'),
    supabase.from('pastors').select('id, name, role, bio, photo_url, sort_order').eq('is_active', true).order('sort_order'),
    supabase.from('cells').select('id, name, leader_name, meeting_days, meeting_time, meeting_type, neighborhood').eq('is_public', true).order('name'),
    supabase.from('events').select('id, title, date, time, location').eq('is_public', true).eq('status', 'publicado').gte('date', new Date().toISOString().split('T')[0]).order('date').limit(6),
  ]);

  return {
    blocks:  (blocksRes.data  ?? []) as BlockRow[],
    pastors: (pastorsRes.data ?? []) as Pastor[],
    cells:   (cellsRes.data   ?? []) as PublicCell[],
    events:  (eventsRes.data  ?? []) as PublicEvent[],
  };
}

function block<T>(blocks: BlockRow[], type: string): { content: T; visible: boolean } {
  const found = blocks.find(b => b.type === type);
  return { content: (found?.published_content ?? {}) as T, visible: found?.is_active ?? false };
}

// data-theme indica à navbar se a seção é dark ou light
// Todas as seções do site são dark por design
export default async function PublicHomePage() {
  const { blocks, pastors, cells, events } = await getSiteData();

  const hero    = block<HeroContent>(blocks, 'hero');
  const about   = block<AboutContent>(blocks, 'about');
  const mission = block<MissionContent>(blocks, 'mission');
  const pastSec = block<PastorsSectionContent>(blocks, 'pastors');
  const cellSec = block<CellsSectionContent>(blocks, 'cells');
  const evSec   = block<EventsContent>(blocks, 'events');
  const ytSec   = block<YoutubeContent>(blocks, 'youtube');
  const contact = block<ContactContent>(blocks, 'contact');

  return (
    <main>
      {/* Hero — sempre visível, data-theme aplicado dentro do HeroSection */}
      <HeroSection content={hero.content} />

      {about.visible && (
        <div data-theme="dark">
          <AboutSection content={about.content} />
        </div>
      )}

      {mission.visible && (
        <div data-theme="dark">
          <MissionSection content={mission.content} />
        </div>
      )}

      {pastSec.visible && (
        <div data-theme="dark">
          <PastorsSection content={pastSec.content} pastors={pastors} />
        </div>
      )}

      <div data-theme="dark">
        <CellsSection content={cellSec.content} cells={cells} />
      </div>

      {evSec.visible && (
        <div data-theme="dark">
          <EventsSection content={evSec.content} events={events} />
        </div>
      )}

      {ytSec.visible && (
        <div data-theme="dark">
          <YoutubeSection content={ytSec.content} />
        </div>
      )}

      {/* Contato — sempre visível (tem rodapé integrado) */}
      <div data-theme="dark">
        <ContactSection content={contact.content} />
      </div>
    </main>
  );
}