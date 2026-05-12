import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { flagSlug } = await req.json();

    if (!flagSlug || typeof flagSlug !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid flagSlug' }, { status: 400 });
    }

    await supabase
      .from('user_feature_access')
      .upsert({ user_id: user.id, flag_slug: flagSlug }, { onConflict: 'user_id,flag_slug' });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
