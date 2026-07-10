const fs = require('fs');

async function main() {
  const env = fs.readFileSync('.env.local', 'utf8');
  let url = '';
  let key = '';
  
  for (const line of env.split('\n')) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
  }

  const req = async (table) => {
    const res = await fetch(`${url}/rest/v1/rpc/current_user_has_role`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ required_roles: ['SYSADMIN'] })
    });
    return await res.json();
  };

  console.log('rpc:', await req());
}

main().catch(console.error);
