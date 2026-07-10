import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  
  const { data: policies, error } = await sb
    .from('pg_policies')
    .select('*')
    .in('tablename', ['pastors', 'events', 'cells']);

  return NextResponse.json({ policies, error })
}
