import { createClient } from '@/lib/supabase/server';
import { PublicHomeClient } from '@/features/portal/components/PublicHomeClient';
import type { SiteBlock } from '@/features/portal/types';

export const revalidate = 60;

interface HomePageProps {
  searchParams: Promise<{ preview?: string }>;
}

export default async function PublicHomePage({ searchParams }: HomePageProps) {
  const { preview } = await searchParams;
  const isPreview = preview === 'true';

  const supabase = await createClient();

  const [{ data: blocks }, { data: events }] = await Promise.all([
    supabase
      .from('site_blocks')
      .select('*')
      .eq('is_active', true)
      .order('order_idx')
      .returns<SiteBlock[]>(),
    supabase
      .from('events')
      .select('id, title, date, time, location')
      .eq('is_public', true)
      .eq('status', 'publicado')
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date')
      .limit(6),
  ]);

  // No modo preview, usa content (rascunho). No modo público, usa published_content.
  const displayBlocks = (blocks ?? []).map(block => ({
    ...block,
    content: isPreview ? block.content : (block.published_content ?? block.content),
  }));

  return (
    <PublicHomeClient
      blocks={displayBlocks}
      publicEvents={events ?? []}
      isPreview={isPreview}
    />
  );
}