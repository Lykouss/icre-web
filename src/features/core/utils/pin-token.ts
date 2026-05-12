// SECURITY: usa chave dedicada PIN_TOKEN_SECRET, separada da service role key.
// Isso garante que um vazamento da service key não permita forjar tokens de PIN.
// Fallback para SUPABASE_SERVICE_ROLE_KEY só para não quebrar ambientes sem migração imediata.
const PIN_TOKEN_SECRET = process.env.PIN_TOKEN_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!PIN_TOKEN_SECRET) {
  throw new Error('[FATAL] PIN_TOKEN_SECRET não está configurado nas variáveis de ambiente.');
}

export async function createPinToken(userId: string, expiresInMs: number = 2 * 60 * 60 * 1000): Promise<string> {
  const expiration = Date.now() + expiresInMs;
  const payload = `${userId}.${expiration}`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(PIN_TOKEN_SECRET);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );

  const signatureHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return `${payload}.${signatureHex}`;
}

export async function verifyPinToken(token: string, userId: string): Promise<boolean> {
  if (!token) return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [tokenUserId, expirationStr, signatureHex] = parts;

  if (tokenUserId !== userId) return false;

  const expiration = parseInt(expirationStr, 10);
  if (isNaN(expiration) || Date.now() > expiration) return false;

  const payload = `${tokenUserId}.${expirationStr}`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(PIN_TOKEN_SECRET);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signatureBytes = new Uint8Array(
    signatureHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
  );

  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes,
    encoder.encode(payload)
  );

  return isValid;
}
