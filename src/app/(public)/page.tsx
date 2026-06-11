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
import { getNextEventOccurrence } from '@/lib/event-utils';

export const revalidate = 60;

type BlockRow = Pick<SiteBlock, 'type' | 'is_active'> & {
  published_content: Record<string, unknown>;
};

async function getSiteData() {
  const supabase = await createClient();

  const [blocksRes, pastorsRes, cellsRes, eventsRes] = await Promise.all([
    supabase.from('site_blocks').select('type, is_active, published_content').order('order_idx'),
    supabase.from('pastors').select('id, name, role, bio, photo_url, sort_order').eq('is_active', true).order('sort_order'),
    supabase.from('cells').select('id, name, meeting_days, meeting_time, meeting_type, neighborhood, address, description, contact_phone, contact_whatsapp, instagram_url, image_url, leader_photo_url, leader1_id, leader2_id, leader1:leaders!leader1_id(id,name,photo_url,instagram_url), leader2:leaders!leader2_id(id,name,photo_url,instagram_url)').eq('is_active', true).order('name'),
    supabase.from('events').select('id, title, date, time, location, is_recurring, recurrence_rules, type, banner_url, cancelled_dates').eq('is_public', true).eq('status', 'publicado'),
  ]);

  const rawEvents = (eventsRes.data ?? []);
  
  // Compute next dates dynamically
  const computedEvents = rawEvents.map(ev => {
    const { nextDate, isCancelled } = getNextEventOccurrence(ev as any);
    return { ...ev, date: nextDate, isCancelled };
  }).filter(ev => ev.date !== null)
    .sort((a, b) => (a.date as string).localeCompare(b.date as string))
    .slice(0, 6);

  return {
    blocks:  (blocksRes.data  ?? []) as BlockRow[],
    pastors: (pastorsRes.data ?? []) as Pastor[],
    cells:   (cellsRes.data ?? []) as unknown as PublicCell[],
    events:  computedEvents as any[],
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
      {/* Hero — data-theme="dark" definido dentro do HeroSection */}
      <HeroSection content={hero.content} />

      {/* As seções abaixo definem data-theme="light" internamente */}
      {about.visible && <AboutSection content={about.content} />}

      {mission.visible && <MissionSection content={mission.content} />}

      {pastSec.visible && <PastorsSection content={pastSec.content} pastors={pastors} />}

      <CellsSection content={cellSec.content} cells={cells} />

      {evSec.visible && <EventsSection content={evSec.content} events={events} />}

      {ytSec.visible && <YoutubeSection content={ytSec.content} />}

      {/* Contato — sempre visível (tem rodapé integrado) */}
      <ContactSection content={contact.content} />
    </main>
  );
}