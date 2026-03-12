import { createClient } from '@/lib/supabase/server';
import { HeroSection }    from '@/features/portal/components/HeroSection';
import { AboutSection }   from '@/features/portal/components/AboutSection';
import { PastorsSection } from '@/features/portal/components/PastorsSection';
import { CellsSection }   from '@/features/portal/components/CellsSection';
import { ContactSection } from '@/features/portal/components/ContactSection';
import type {
  SiteBlock, HeroContent, AboutContent,
  PastorsSectionContent, CellsSectionContent,
  ContactContent, Pastor, PublicCell,
} from '@/features/portal/types';

async function getSiteData() {
  const supabase = await createClient();

  const [blocksRes, pastorsRes, cellsRes] = await Promise.all([
    supabase.from('site_blocks').select('*').eq('is_active', true).order('order_idx'),
    supabase.from('pastors').select('id,name,role,bio,photo_url,sort_order').eq('is_active', true).order('sort_order'),
    supabase.from('cells').select('id,name,leader_name,meeting_days,meeting_time,meeting_type,neighborhood').eq('is_public', true).order('name'),
  ]);

  return {
    blocks:  (blocksRes.data  ?? []) as SiteBlock[],
    pastors: (pastorsRes.data ?? []) as Pastor[],
    cells:   (cellsRes.data   ?? []) as PublicCell[],
  };
}

function block<T>(blocks: SiteBlock[], type: string): T {
  const found = blocks.find(b => b.type === type);
  return (found?.content ?? {}) as T;
}

export default async function PublicHomePage() {
  const { blocks, pastors, cells } = await getSiteData();

  const hero    = block<HeroContent>(blocks, 'hero');
  const about   = block<AboutContent>(blocks, 'about');
  const pastSec = block<PastorsSectionContent>(blocks, 'pastors');
  const cellSec = block<CellsSectionContent>(blocks, 'cells');
  const contact = block<ContactContent>(blocks, 'contact');

  return (
    <main>
      <HeroSection content={hero} />
      <AboutSection content={about} />
      {pastors.length > 0 && <PastorsSection content={pastSec} pastors={pastors} />}
      {cells.length > 0   && <CellsSection   content={cellSec}  cells={cells}    />}
      <ContactSection content={contact} />
    </main>
  );
}