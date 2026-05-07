import crypto from 'crypto';

const SECRET_KEY = process.env.TICKET_SECRET_KEY || 'default_secret_key_for_development_only_123';

export function generateTicketSignature(registrationId: string, eventId: string): string {
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(`${registrationId}:${eventId}`);
  return hmac.digest('hex');
}

export function verifyTicketSignature(registrationId: string, eventId: string, signature: string): boolean {
  const expectedSignature = generateTicketSignature(registrationId, eventId);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}
