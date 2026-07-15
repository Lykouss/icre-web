'use server'

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/features/core/api/get-current-user';
import { sendSystemNotificationToUser } from '@/features/core/actions/communications';
import { isValidUuid, isValidPhone, isValidEmail } from '@/lib/action-validators';
import {
  createOrFindAsaasCustomer,
  createAsaasPixPayment,
  createAsaasBoletoPayment,
  getAsaasPixQrCode,
  getAsaasPaymentStatus,
  getAsaasBoletoDetails,
} from '@/lib/asaas-server';
import { createAdminClient } from '@/lib/supabase/admin';
import type {
  PaymentStatus,
  PaymentMethod,
  AsaasPaymentInfo,
  CheckinResult,
  CustomFormResponses,
} from '@/features/events/types';
import {
  generateTicketSignature,
  verifyTicketSignature,
  parseAndVerifyQrPayload,
} from '../utils/signature';
import { verifyTurnstileToken } from '@/lib/turnstile';

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Health check do Asaas antes de processar pagamento Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

async function checkAsaasHealth(): Promise<boolean> {
  const apiKey = process.env.ASAAS_API_KEY;
  const apiUrl = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
  if (!apiKey) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${apiUrl}/finance/balance`, {
      signal: controller.signal,
      headers: { 'access_token': apiKey, 'Content-Type': 'application/json' },
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Rollback seguro com retry Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

async function safeRollbackRegistration(
  supabaseAdmin: Awaited<ReturnType<typeof createAdminClient>>,
  registrationId: string,
  reason: string
): Promise<void> {
  // Tentativa 1: deletar
  const { error } = await supabaseAdmin
    .from('event_registrations')
    .delete()
    .eq('id', registrationId);

  if (error) {
    // Falha no delete: marcar como cancelado para evitar inscriÃƒÂ§ÃƒÂ£o zumbi
    console.error(`[rollback] delete failed (${reason}), marking as cancelled:`, error.message);
    await supabaseAdmin
      .from('event_registrations')
      .update({ status: 'cancelado', payment_status: 'expirado' })
      .eq('id', registrationId)
      .eq('status', 'pendente_pagamento'); // garantia extra
  }
}

const VALID_PAYMENT_STATUSES: PaymentStatus[] = ['gratuito', 'pendente', 'pago', 'reembolsado', 'expirado', 'cortesia'];
const VALID_PAYMENT_METHODS: PaymentMethod[] = ['pix', 'cartao', 'dinheiro', 'cortesia', 'gift', 'asaas_pix', 'asaas_boleto'];

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ CPF validation (MÃƒÂ³dulo 11) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function isValidCpf(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(clean[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(clean[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(clean[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(clean[10]);
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Helper: log event history Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

async function logEventHistory(
  eventId: string,
  actionType: string,
  actorId?: string | null,
  targetUserId?: string | null,
  details?: Record<string, unknown>
) {
  const supabase = await createClient();
  await supabase.from('event_history').insert({
    event_id: eventId,
    action_type: actionType,
    actor_id: actorId,
    target_user_id: targetUserId,
    details: details,
  });
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Helper: get client IP from headers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

async function getClientIp(): Promise<string> {
  try {
    const hdrs = await headers();
    return (
      hdrs.get('x-forwarded-for')?.split(',')[0].trim() ||
      hdrs.get('x-real-ip') ||
      'unknown'
    );
  } catch {
    return 'unknown';
  }
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// PUBLIC REGISTRATION
// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export async function createPublicRegistration(
  eventId: string,
  formData: FormData,
  _ipAddressUnused?: string, // kept for back-compat but we now read from headers
  deviceId?: string
): Promise<{ error?: string; registrationId?: string; paymentInfo?: AsaasPaymentInfo }> {
  if (!isValidUuid(eventId)) return { error: 'Evento invÃƒÂ¡lido.' };

  const turnstileToken = (formData.get('turnstile_token') as string)?.trim();
  
  // Validate Turnstile
  const isHuman = await verifyTurnstileToken(turnstileToken);
  if (!isHuman) {
    return { error: 'VerificaÃƒÂ§ÃƒÂ£o de seguranÃƒÂ§a falhou. Por favor, tente novamente.' };
  }

  const name      = (formData.get('name')     as string)?.trim();
  const email     = (formData.get('email')    as string)?.trim();
  const phone     = (formData.get('phone')    as string)?.trim();
  const cpf       = (formData.get('cpf')      as string)?.trim().replace(/\D/g, '');
  const payMethod = (formData.get('payment_method') as string)?.trim() as 'pix' | 'boleto' | null;

  // Parse custom form responses
  let customFormResponses: CustomFormResponses | null = null;
  const responsesRaw = formData.get('custom_form_responses') as string | null;
  if (responsesRaw) {
    try { customFormResponses = JSON.parse(responsesRaw); } catch { /* ignore */ }
  }

  if (!name || name.length < 3) return { error: 'Nome precisa ter ao menos 3 caracteres.' };
  if (!email || !isValidEmail(email)) return { error: 'E-mail invÃƒÂ¡lido.' };
  if (phone && !isValidPhone(phone)) return { error: 'Telefone invÃƒÂ¡lido.' };

  const supabase = await createClient();
  const user = await getCurrentUser();

  // Get IP from server headers (not from client Ã¢â‚¬â€ prevents manipulation)
  const ipAddress = await getClientIp();

  const { data: event } = await supabase
    .from('events')
    .select('id, title, capacity, ticket_price, requires_payment, requires_registration, status, is_public, max_per_account, max_per_ip, max_per_device, publish_at')
    .eq('id', eventId)
    .single();

  if (!event) return { error: 'Evento nÃƒÂ£o encontrado.' };

  // Access control
  if (event.status !== 'publicado' && !user?.isSysAdmin) {
    return { error: 'Evento nÃƒÂ£o estÃƒÂ¡ disponÃƒÂ­vel para inscriÃƒÂ§ÃƒÂµes.' };
  }
  if (!event.requires_registration) {
    return { error: 'Este evento nÃƒÂ£o requer inscriÃƒÂ§ÃƒÂ£o prÃƒÂ©via.' };
  }
  if (event.publish_at && new Date(event.publish_at) > new Date() && !user?.isSysAdmin) {
    return { error: 'As inscriÃƒÂ§ÃƒÂµes para este evento ainda nÃƒÂ£o estÃƒÂ£o abertas.' };
  }

  const needsPayment = event.requires_payment && (event.ticket_price ?? 0) > 0;

  // CPF required for paid events
  if (needsPayment) {
    if (!cpf) return { error: 'CPF ÃƒÂ© obrigatÃƒÂ³rio para eventos pagos.' };
    if (!isValidCpf(cpf)) return { error: 'CPF invÃƒÂ¡lido. Verifique os dÃƒÂ­gitos.' };
  }

  // Capacity check (additional protection Ã¢â‚¬â€ RPC lock handles race condition)
  if (event.capacity) {
    const { count } = await supabase
      .from('event_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .in('status', ['confirmado', 'pendente_pagamento']);
    if ((count ?? 0) >= event.capacity) return { error: 'Evento lotado. NÃƒÂ£o hÃƒÂ¡ vagas disponÃƒÂ­veis.' };
  }

  // IP limit check
  if (ipAddress !== 'unknown' && event.max_per_ip) {
    const { count } = await supabase
      .from('event_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('ip_address', ipAddress)
      .in('status', ['confirmado', 'pendente_pagamento']);
    if ((count ?? 0) >= event.max_per_ip) return { error: 'Limite de inscriÃƒÂ§ÃƒÂµes por IP atingido.' };
  }

  // Device limit check
  if (deviceId && event.max_per_device) {
    const { count } = await supabase
      .from('event_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('device_id', deviceId)
      .in('status', ['confirmado', 'pendente_pagamento']);
    if ((count ?? 0) >= event.max_per_device) return { error: 'Limite de inscriÃƒÂ§ÃƒÂµes por dispositivo atingido.' };
  }

  // Duplicate email check
  const { data: duplicate } = await supabase
    .from('event_registrations')
    .select('id')
    .eq('event_id', eventId)
    .eq('email', email)
    .in('status', ['confirmado', 'pendente_pagamento'])
    .maybeSingle();
  if (duplicate) return { error: 'Este e-mail jÃƒÂ¡ estÃƒÂ¡ inscrito neste evento.' };

  const initialStatus = needsPayment ? 'pendente_pagamento' : 'confirmado';
  const initialPaymentStatus: PaymentStatus = needsPayment ? 'pendente' : 'gratuito';

  // Log IP for authenticated user
  let memberId: string | null = null;
  if (user) {
    if (ipAddress !== 'unknown') {
      await supabase.from('user_known_ips').upsert(
        { user_id: user.id, ip_address: ipAddress, last_seen_at: new Date().toISOString() },
        { onConflict: 'user_id, ip_address' }
      );
    }
    const { data: memberData } = await supabase
      .from('members')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    memberId = memberData?.id || null;
  }

  // Insert with row-level lock via RPC using Admin Client to bypass RLS execution permission (revoked for anon/auth)
  const supabaseAdmin = await createAdminClient();
  const { data: rpcResult, error: rpcError } = await supabaseAdmin
    .rpc('insert_registration_with_lock', {
      p_event_id: eventId,
      p_name: name,
      p_email: email,
      p_phone: phone || null,
      p_cpf: cpf || null,
      p_status: initialStatus,
      p_payment_status: initialPaymentStatus,
      p_ip_address: ipAddress,
      p_device_id: deviceId || null,
      p_member_id: memberId,
      p_custom_form_responses: customFormResponses,
    })
    .single();

  if (rpcError || !rpcResult) {
    console.error('[createPublicRegistration] RPC error:', rpcError?.message);
    return { error: 'Falha ao registrar a inscriÃƒÂ§ÃƒÂ£o.' };
  }

  const { registration_id, error_message } = rpcResult as { registration_id: string | null; error_message: string | null };

  if (error_message || !registration_id) {
    return { error: error_message || 'Falha ao registrar a inscriÃƒÂ§ÃƒÂ£o.' };
  }

  // Free registration Ã¢â‚¬â€ generate ticket signature and done
  if (!needsPayment) {
    const signature = generateTicketSignature(registration_id);
    await supabaseAdmin.from('event_registrations').update({ ticket_signature: signature }).eq('id', registration_id);
    await logEventHistory(eventId, 'inscriÃƒÂ§ÃƒÂ£o_gratuita', user?.id, null, { registration_id });
    revalidatePath(`/agenda/${eventId}`);
    return { registrationId: registration_id };
  }

  // Paid registration Ã¢â‚¬â€ health check + create Asaas payment
  // 1. Verificar disponibilidade do Asaas ANTES de criar a inscriÃƒÂ§ÃƒÂ£o
  const asaasOk = await checkAsaasHealth();
  if (!asaasOk) {
    // Rollback imediato: nÃƒÂ£o vale deixar inscriÃƒÂ§ÃƒÂ£o pendente sem pagamento
    await safeRollbackRegistration(supabaseAdmin, registration_id, 'asaas_health_check_failed');
    return {
      error: 'O sistema de pagamentos estÃƒÂ¡ temporÃƒÂ¡riamente indisponÃƒÂ­vel. Sua inscriÃƒÂ§ÃƒÂ£o nÃƒÂ£o foi cobrada. Por favor, tente novamente em alguns minutos.',
    };
  }

  try {
    const customerId = await createOrFindAsaasCustomer(name, email, phone, cpf);
    const description = `Ingresso: ${event.title}`;
    
    // Calcula a taxa do Asaas para somar ao valor final
    let asaasFee = 0;
    if (payMethod === 'boleto') {
      asaasFee = 2.99;
    } else if (payMethod === 'pix') {
      asaasFee = 1.99;
    }
    
    const value = Number(event.ticket_price) + asaasFee;

    let payment;
    let pixInfo: { qrCode?: string; copyPaste?: string; expirationDate?: string } = {};

    if (payMethod === 'boleto') {
      payment = await createAsaasBoletoPayment(customerId, value, description, registration_id);
      
      // Retry para bankSlipUrl caso a API demore a gerar o boleto
      let retries = 3;
      while (!payment.bankSlipUrl && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
          const details = await getAsaasBoletoDetails(payment.id);
          if (details.bankSlipUrl) {
            payment.bankSlipUrl = details.bankSlipUrl;
            break;
          }
        } catch (e) {}
        retries--;
      }
    } else {
      payment = await createAsaasPixPayment(customerId, value, description, registration_id);
      
      // Retry para QR Code do PIX, pois Asaas pode demorar uns instantes para gerar
      let retries = 3;
      while (retries > 0) {
        try {
          const pix = await getAsaasPixQrCode(payment.id);
          if (pix && pix.encodedImage && pix.payload) {
            pixInfo = { qrCode: pix.encodedImage, copyPaste: pix.payload, expirationDate: pix.expirationDate };
            break;
          }
        } catch (qrErr) {
          // Ignora erro no retry
        }
        if (retries > 1) await new Promise(resolve => setTimeout(resolve, 1000));
        retries--;
      }
      
      if (!pixInfo.qrCode) {
        console.warn('[createPublicRegistration] PIX QR Code falhou apÃƒÂ³s retries (usando invoiceUrl como fallback)');
      }
    }

    // UPDATE atÃƒÂ´mico: sÃƒÂ³ avanÃƒÂ§a o status apÃƒÂ³s ter o payment.id
    const { error: updateErr } = await supabaseAdmin
      .from('event_registrations')
      .update({
        asaas_payment_id: payment.id,
        asaas_invoice_url: payment.invoiceUrl,
        payment_method: payMethod === 'boleto' ? 'asaas_boleto' : 'asaas_pix',
      })
      .eq('id', registration_id);

    if (updateErr) {
      // O pagamento foi criado no Asaas mas nÃƒÂ£o associamos Ã¢â‚¬â€ log crÃƒÂ­tico
      console.error('[createPublicRegistration] CRITICAL: Asaas payment created but DB update failed:', updateErr.message, { registration_id, payment_id: payment.id });
      // NÃƒÂ£o deletar: o usuÃƒÂ¡rio pode ter sido cobrado. Marcar para reconciliaÃƒÂ§ÃƒÂ£o manual.
      return {
        error: 'Houve um problema ao registrar seu pagamento. NÃƒÂ£o serÃƒÂ¡ cobrado novamente. Entre em contato com a ICRE informando o cÃƒÂ³digo: ' + registration_id.slice(0, 8).toUpperCase(),
      };
    }

    await logEventHistory(eventId, 'inscriÃƒÂ§ÃƒÂ£o_aguardando_pagamento', user?.id, null, { registration_id, payment_id: payment.id });
    
    if (user?.id) {
      // Notification of pending payment to the inbox
      await sendSystemNotificationToUser(
        user.id,
        'WARNING',
        'Pagamento Pendente',
        `VocÃƒÂª tem um pagamento pendente para o evento "${event.title}". Acesse sua aba de inscriÃƒÂ§ÃƒÂµes para concluir o pagamento e garantir sua vaga.`
      );
    }

    revalidatePath(`/agenda/${eventId}`);

    return {
      registrationId: registration_id,
      paymentInfo: {
        paymentId: payment.id,
        invoiceUrl: payment.invoiceUrl,
        pixQrCode: pixInfo.qrCode,
        pixCopyPaste: pixInfo.copyPaste,
        pixExpirationDate: pixInfo.expirationDate,
        boletoUrl: payment.bankSlipUrl,
        status: payment.status,
        value: payment.value,
        dueDate: payment.dueDate,
      },
    };
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error('[createPublicRegistration] Asaas error:', errMsg);

    // Rollback seguro com retry e fallback para cancelamento
    await safeRollbackRegistration(supabaseAdmin, registration_id, errMsg);

    // Diferenciar tipos de erro para mensagem mais ÃƒÂºtil
    if (errMsg.includes('timeout') || errMsg.includes('abort')) {
      return { error: 'O sistema de pagamentos demorou muito para responder. Sua inscriÃƒÂ§ÃƒÂ£o foi cancelada e vocÃƒÂª nÃƒÂ£o serÃƒÂ¡ cobrado. Tente novamente.' };
    }
    if (errMsg.includes('401') || errMsg.includes('403')) {
      return { error: 'Erro de configuraÃƒÂ§ÃƒÂ£o no sistema de pagamentos. Contate a ICRE.' };
    }
    return { error: 'Falha ao gerar o pagamento. Sua inscriÃƒÂ§ÃƒÂ£o foi cancelada e vocÃƒÂª nÃƒÂ£o serÃƒÂ¡ cobrado. Tente novamente em instantes.' };
  }
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// GIFT REGISTRATION
// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export async function giftRegistration(
  eventId: string,
  targetName: string,
  targetEmail: string,
  targetPhone: string,
  targetCpf: string
) {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) return { error: 'Acesso negado.' };

  const supabase = await createClient();
  const supabaseAdmin = await createAdminClient();
  const { data: event } = await supabase
    .from('events')
    .select('id, title')
    .eq('id', eventId)
    .single();
  if (!event) return { error: 'Evento nÃƒÂ£o encontrado.' };

  const { data: registration, error } = await supabaseAdmin
    .from('event_registrations')
    .insert({
      event_id: eventId,
      name: targetName,
      email: targetEmail || null,
      phone: targetPhone || null,
      cpf: targetCpf?.replace(/\D/g, '') || null,
      status: 'confirmado',
      payment_status: 'cortesia',
      payment_method: 'gift',
      payment_amount: 0,
      is_gift: true,
      gifted_by: user.id,
    })
    .select()
    .single();

  if (error || !registration) {
    console.error('[giftRegistration] Insert failed:', error);
    return { error: 'Falha ao criar cortesia.' };
  }

  const signature = generateTicketSignature(registration.id);
  await supabaseAdmin
    .from('event_registrations')
    .update({ ticket_signature: signature })
    .eq('id', registration.id);

  await logEventHistory(eventId, 'inscriÃƒÂ§ÃƒÂ£o_presenteada', user.id, null, {
    registration_id: registration.id,
    target_email: targetEmail,
    gifted_by_name: user.fullName,
  });
  revalidatePath(`/eventos/${eventId}`);
  return { success: true, registrationId: registration.id };
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// PROCESS CHECKIN (QR Scanner)
// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export async function processCheckin(eventId: string, qrCodeData: string): Promise<CheckinResult> {
  const user = await getCurrentUser();
  if (!user || !user.isSysAdmin) return { success: false, error: 'Acesso negado.' };

  const parsed = parseAndVerifyQrPayload(qrCodeData);
  if (!parsed.valid) {
    return { success: false, error: 'QR Code invÃƒÂ¡lido ou forjado.' };
  }

  const { registrationId } = parsed;
  if (!isValidUuid(registrationId)) {
    return { success: false, error: 'Formato de QR Code invÃƒÂ¡lido.' };
  }

  const supabase = await createClient();
  const { data: reg, error } = await supabase
    .from('event_registrations')
    .select('id, event_id, status, checkin_status, checkin_time, checkin_by, name, email, payment_status, is_gift')
    .eq('id', registrationId)
    .single();

  if (error || !reg) return { success: false, error: 'InscriÃƒÂ§ÃƒÂ£o nÃƒÂ£o encontrada.' };
  if (reg.status !== 'confirmado') return { success: false, error: 'InscriÃƒÂ§ÃƒÂ£o nÃƒÂ£o estÃƒÂ¡ confirmada.' };
  if (reg.event_id !== eventId) return { success: false, error: 'O ingresso pertence a outro evento.' };

  // Validar se o evento permite check-in (nÃƒÂ£o encerrado e ÃƒÂ© o dia certo)
  const { data: eventData } = await supabase.from('events').select('status, date').eq('id', eventId).single();
  if (eventData) {
    if (eventData.status === 'encerrado') {
      return { success: false, error: 'Este evento jÃƒÂ¡ foi encerrado.' };
    }
    // Validar a data do evento com a data de hoje local
    if (eventData.date) {
      const today = new Date().toLocaleDateString('en-CA'); // yyyy-mm-dd local format commonly matching db
      // Actually better to use JS local string mapping or simple ISO split
      // JS `new Date()` might give different timezone. Let's use a simple timezone offset or just compare string dates.
      // A better way: `new Date().toISOString().split('T')[0]` if server is UTC and we expect UTC, but in Brazil we should adjust.
      // Since `eventData.date` is YYYY-MM-DD, let's use `new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })`
      const todayBR = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }); // DD/MM/YYYY
      const [year, month, day] = eventData.date.split('-');
      const eventDateBR = `${day}/${month}/${year}`;
      if (todayBR !== eventDateBR) {
        return { success: false, error: 'Check-in nÃƒÂ£o permitido. O evento nÃƒÂ£o ÃƒÂ© hoje.' };
      }
    }
  }

  // Already checked in
  if (reg.checkin_status) {
    let firstCheckinByName: string | undefined;
    if (reg.checkin_by) {
      const { data: adminData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', reg.checkin_by)
        .single();
      firstCheckinByName = adminData?.full_name ?? undefined;
    }
    return {
      success: false,
      alreadyCheckedIn: true,
      error: 'Este ingresso jÃƒÂ¡ foi utilizado.',
      firstCheckinAt: reg.checkin_time ?? undefined,
      firstCheckinBy: firstCheckinByName,
      registrant: {
        name: reg.name,
        email: reg.email,
        payment_status: reg.payment_status,
        is_gift: reg.is_gift,
      },
    };
  }

  // Perform check-in
  const { error: updError } = await supabase
    .from('event_registrations')
    .update({
      checkin_status: true,
      checkin_time: new Date().toISOString(),
      checkin_by: user.id,
    })
    .eq('id', registrationId);

  if (updError) return { success: false, error: 'Falha ao salvar check-in.' };

  await logEventHistory(reg.event_id, 'checkin_realizado', user.id, null, { registration_id: registrationId });
  revalidatePath(`/eventos/${reg.event_id}`);

  return {
    success: true,
    registrant: {
      name: reg.name,
      email: reg.email,
      payment_status: reg.payment_status,
      is_gift: reg.is_gift,
    },
  };
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// CHECK & UPDATE PAYMENT STATUS
// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export async function checkAndUpdatePaymentStatus(registrationId: string) {
  if (!isValidUuid(registrationId)) return { error: 'InscriÃƒÂ§ÃƒÂ£o invÃƒÂ¡lida.' };

  const supabase = await createClient();
  const { data: reg } = await supabase
    .from('event_registrations')
    .select('asaas_payment_id, event_id, name, email, ticket_signature, status')
    .eq('id', registrationId)
    .single();

  if (!reg?.asaas_payment_id) return { error: 'Nenhum pagamento associado.' };

  const asaasStatus = await getAsaasPaymentStatus(reg.asaas_payment_id);
  const PAID_STATUSES = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'];
  const paid = PAID_STATUSES.includes(asaasStatus);

  if (paid && reg.status !== 'confirmado') {
    const signature = reg.ticket_signature || generateTicketSignature(registrationId);
    const receiptUrl = `/comprovante/${registrationId}`;

    const supabaseAdmin = await createAdminClient();
    await supabaseAdmin
      .from('event_registrations')
      .update({
        status: 'confirmado',
        payment_status: 'pago',
        paid_at: new Date().toISOString(),
        receipt_url: receiptUrl,
        ticket_signature: signature,
      })
      .eq('id', registrationId);

    await logEventHistory(reg.event_id, 'pagamento_confirmado', null, null, { registration_id: registrationId });
    revalidatePath(`/agenda/${reg.event_id}`);
    revalidatePath(`/comprovante/${registrationId}`);
  }

  return { status: asaasStatus, paid };
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// ADMIN ACTIONS
// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export async function createRegistration(eventId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: 'NÃƒÂ£o autorizado.' };
  if (!user.isSysAdmin && !user.roles.some(r => ['CHURCH_ADMIN'].includes(r))) return { error: 'Acesso negado.' };
  if (!isValidUuid(eventId)) return { error: 'Evento invÃƒÂ¡lido.' };

  const name     = (formData.get('name')      as string)?.trim();
  const phone    = (formData.get('phone')     as string)?.trim();
  const memberId = (formData.get('member_id') as string)?.trim();

  if (!name || name.length < 3) return { error: 'Nome precisa ter ao menos 3 caracteres.' };
  if (phone && !isValidPhone(phone)) return { error: 'Telefone invÃƒÂ¡lido.' };
  if (memberId && !isValidUuid(memberId)) return { error: 'Membro invÃƒÂ¡lido.' };

  const supabase = await createClient();

  if (memberId) {
    const { data: duplicate } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('member_id', memberId)
      .eq('status', 'confirmado')
      .maybeSingle();
    if (duplicate) return { error: 'Este membro jÃƒÂ¡ estÃƒÂ¡ inscrito neste evento.' };
  }

  const { data: event } = await supabase.from('events').select('capacity').eq('id', eventId).single();
  if (event?.capacity) {
    const { count } = await supabase
      .from('event_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'confirmado');
    if ((count ?? 0) >= event.capacity) return { error: 'Evento lotado.' };
  }

  const { error } = await supabase.from('event_registrations').insert({
    event_id: eventId,
    name,
    phone: phone || null,
    member_id: memberId || null,
    status: 'confirmado',
    payment_status: 'gratuito',
  });

  if (error) {
    console.error('[createRegistration]', error.message);
    return { error: 'Falha ao registrar a inscriÃƒÂ§ÃƒÂ£o.' };
  }

  revalidatePath(`/eventos/${eventId}`);
  return { success: true };
}

export async function updateRegistrationPayment(
  registrationId: string,
  eventId: string,
  paymentStatus: PaymentStatus,
  paymentMethod: PaymentMethod | null,
  paymentAmount: number | null,
  paymentRef: string
) {
  const user = await getCurrentUser();
  if (!user) return { error: 'NÃƒÂ£o autorizado.' };
  if (!user.roles.some(r => ['SYSADMIN', 'CHURCH_ADMIN'].includes(r))) return { error: 'Acesso negado.' };
  if (!isValidUuid(registrationId)) return { error: 'InscriÃƒÂ§ÃƒÂ£o invÃƒÂ¡lida.' };
  if (!VALID_PAYMENT_STATUSES.includes(paymentStatus)) return { error: 'Status invÃƒÂ¡lido.' };
  if (paymentMethod && !VALID_PAYMENT_METHODS.includes(paymentMethod)) return { error: 'MÃƒÂ©todo invÃƒÂ¡lido.' };
  if (paymentAmount !== null && (isNaN(paymentAmount) || paymentAmount < 0)) return { error: 'Valor invÃƒÂ¡lido.' };

  const supabase = await createClient();
  const isPaid = paymentStatus === 'pago';
  const receiptUrl = isPaid ? `/comprovante/${registrationId}` : null;

  const { error } = await supabase
    .from('event_registrations')
    .update({
      payment_status: paymentStatus,
      payment_method: paymentMethod || null,
      payment_amount: paymentAmount ?? null,
      payment_ref: paymentRef.trim() || null,
      paid_at: isPaid ? new Date().toISOString() : null,
      status: isPaid ? 'confirmado' : undefined,
      receipt_url: receiptUrl,
    })
    .eq('id', registrationId);

  if (error) {
    console.error('[updateRegistrationPayment]', error.message);
    return { error: 'Falha ao atualizar o pagamento.' };
  }

  revalidatePath(`/eventos/${eventId}`);
  revalidatePath(`/comprovante/${registrationId}`);
  return { success: true };
}

export async function cancelRegistration(registrationId: string, eventId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'NÃƒÂ£o autorizado.' };
  if (!user.isSysAdmin && !user.roles.some(r => ['CHURCH_ADMIN'].includes(r))) return { error: 'Acesso negado.' };
  if (!isValidUuid(registrationId)) return { error: 'InscriÃƒÂ§ÃƒÂ£o invÃƒÂ¡lida.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('event_registrations')
    .update({ status: 'cancelado' })
    .eq('id', registrationId);

  if (error) {
    console.error('[cancelRegistration]', error.message);
    return { error: 'Falha ao cancelar a inscriÃƒÂ§ÃƒÂ£o.' };
  }

  revalidatePath(`/eventos/${eventId}`);
  return { success: true };
}

export async function checkInAttendance(eventId: string, name: string, memberId?: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'NÃƒÂ£o autorizado.' };
  if (!user.isSysAdmin && !user.roles.some(r => ['CHURCH_ADMIN'].includes(r))) return { error: 'Acesso negado.' };
  if (!isValidUuid(eventId)) return { error: 'Evento invÃƒÂ¡lido.' };

  const trimmedName = name?.trim();
  if (!trimmedName || trimmedName.length < 2) return { error: 'Nome invÃƒÂ¡lido.' };
  if (memberId && !isValidUuid(memberId)) return { error: 'Membro invÃƒÂ¡lido.' };

  const supabase = await createClient();

  // Validar se o evento permite check-in
  const { data: eventData } = await supabase.from('events').select('status, date').eq('id', eventId).single();
  if (eventData) {
    if (eventData.status === 'encerrado') {
      return { error: 'Este evento jÃƒÂ¡ foi encerrado.' };
    }
    if (eventData.date) {
      const todayBR = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const [year, month, day] = eventData.date.split('-');
      const eventDateBR = `${day}/${month}/${year}`;
      if (todayBR !== eventDateBR) {
        return { error: 'Check-in manual nÃƒÂ£o permitido. O evento nÃƒÂ£o ÃƒÂ© hoje.' };
      }
    }
  }

  if (memberId) {
    const { data: existing } = await supabase
      .from('event_attendance')
      .select('id')
      .eq('event_id', eventId)
      .eq('member_id', memberId)
      .maybeSingle();
    if (existing) return { error: 'Este membro jÃƒÂ¡ fez check-in.' };
  }

  const { error } = await supabase.from('event_attendance').insert({
    event_id: eventId,
    name: trimmedName,
    member_id: memberId || null,
  });

  if (error) {
    console.error('[checkInAttendance]', error.message);
    return { error: 'Falha ao registrar a presenÃƒÂ§a.' };
  }

  revalidatePath(`/eventos/${eventId}`);
  return { success: true };
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// SYNC PAYMENT DETAILS & GIFT NOTIFICATION
// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export async function syncPaymentDetails(registrationId: string) {
  const supabaseAdmin = await createAdminClient();
  const { data: reg, error } = await supabaseAdmin
    .from('event_registrations')
    .select('asaas_payment_id, payment_method, asaas_invoice_url')
    .eq('id', registrationId)
    .single();

  if (error || !reg?.asaas_payment_id) {
    return { error: 'InscriÃƒÂ§ÃƒÂ£o ou pagamento nÃƒÂ£o encontrado' };
  }

  try {
    if (reg.payment_method === 'asaas_pix' || reg.payment_method === 'pix') {
      const pixData = await getAsaasPixQrCode(reg.asaas_payment_id);
      return {
        pixQrCode: pixData.encodedImage ?? null,
        pixCopyPaste: pixData.payload ?? null,
        pixExpirationDate: pixData.expirationDate ?? null,
      };
    } else if (reg.payment_method === 'asaas_boleto' || reg.payment_method === 'boleto') {
      const boletoData = await getAsaasBoletoDetails(reg.asaas_payment_id);
      
      // Salvar a bankSlipUrl no banco de dados para evitar re-fetches
      if (boletoData.bankSlipUrl && boletoData.bankSlipUrl !== reg.asaas_invoice_url) {
        await supabaseAdmin
          .from('event_registrations')
          .update({ asaas_invoice_url: boletoData.bankSlipUrl })
          .eq('id', registrationId);
      }
      
      return {
        boletoUrl: boletoData.bankSlipUrl ?? reg.asaas_invoice_url ?? null,
        boletoBarCode: boletoData.identificationField ?? null,
        value: boletoData.value ?? null,
        dueDate: boletoData.dueDate ?? null,
      };
    }
    return { error: 'MÃƒÂ©todo de pagamento invÃƒÂ¡lido' };
  } catch (e) {
    console.error('[syncPaymentDetails] Asaas fetch error:', e);
    return { error: 'Falha ao buscar detalhes no Asaas' };
  }
}

export async function markGiftAsNotified(registrationId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'NÃƒÂ£o autorizado' };
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('event_registrations')
    .update({ gift_notified_at: new Date().toISOString() })
    .eq('id', registrationId)
    .is('gift_notified_at', null);

  if (error) {
    return { error: 'Falha ao atualizar a inscriÃƒÂ§ÃƒÂ£o' };
  }
  return { success: true };
}

export async function acceptRegistrationTerms(registrationId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado' };
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('event_registrations')
    .update({ terms_accepted_at: new Date().toISOString() })
    .eq('id', registrationId)
    .is('terms_accepted_at', null);

  if (error) {
    console.error('[acceptRegistrationTerms] Error:', error);
    return { error: 'Falha ao aceitar os termos' };
  }

  revalidatePath('/comprovante/' + registrationId);
  return { success: true };
}
