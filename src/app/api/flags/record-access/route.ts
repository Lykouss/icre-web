import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { flagSlug, userId } = await req.json();

    if (!flagSlug || !userId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const supabase = await createClient();

    await supabase
      .from('user_feature_access')
      .upsert({ user_id: userId, flag_slug: flagSlug }, { onConflict: 'user_id,flag_slug' });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
