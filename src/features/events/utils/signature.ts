import crypto from 'crypto';

// Uses QR_SECRET for HMAC — only registration_id, no dates (avoids timezone bugs)
// SECURITY: no hardcoded fallback — missing env var is a fatal misconfiguration
const _QR_SECRET_RAW = process.env.QR_SECRET ?? process.env.TICKET_SECRET_KEY;
if (!_QR_SECRET_RAW) {
  throw new Error('[FATAL] QR_SECRET (ou TICKET_SECRET_KEY) não está configurado nas variáveis de ambiente. Ingressos não podem ser assinados.');
}
const QR_SECRET: string = _QR_SECRET_RAW;

/**
 * Generates an HMAC-SHA256 signature for a ticket QR Code.
 * Signature = HMAC-SHA256(registration_id, QR_SECRET)
 * Intentionally excludes dates to prevent false-positive failures caused by
 * timezone/millisecond parsing differences between DB, ORM and browser.
 */
export function generateTicketSignature(registrationId: string): string {
  const hmac = crypto.createHmac('sha256', QR_SECRET);
  hmac.update(registrationId);
  return hmac.digest('hex');
}

/**
 * Verifies the ticket signature using constant-time comparison.
 */
export function verifyTicketSignature(registrationId: string, signature: string): boolean {
  const expected = generateTicketSignature(registrationId);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * Builds the full QR Code payload string.
 * Format: "registrationId:signature"
 */
export function buildQrCodePayload(registrationId: string): string {
  const sig = generateTicketSignature(registrationId);
  return `${registrationId}:${sig}`;
}

/**
 * Parses and verifies a QR Code payload string.
 * Returns { valid: true, registrationId } or { valid: false }
 */
export function parseAndVerifyQrPayload(
  payload: string
): { valid: true; registrationId: string } | { valid: false } {
  const parts = payload.split(':');
  if (parts.length !== 2) return { valid: false };
  const [registrationId, signature] = parts;
  if (!registrationId || !signature) return { valid: false };
  if (!verifyTicketSignature(registrationId, signature)) return { valid: false };
  return { valid: true, registrationId };
}
