const fs = require('fs');

async function main() {
  const env = fs.readFileSync('.env.local', 'utf8');
  let url = '';
  let sRoleKey = '';
  
  for (const line of env.split('\n')) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) sRoleKey = line.split('=')[1].trim();
  }

  const req = async (table) => {
    const res = await fetch(`${url}/rest/v1/${table}?select=*`, {
      headers: {
        'apikey': sRoleKey,
        'Authorization': `Bearer ${sRoleKey}`
      }
    });
    return await res.json();
  };

  // We can't query pg_policies via REST, but we can query `site_blocks`, `pastors`, etc to see if service_role works.
  console.log('pastors:', await req('pastors'));
}

main().catch(console.error);
